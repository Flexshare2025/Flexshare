import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import AddressSearch from '@/components/search-location';
import { getCurrentPosition } from '@/utils/position';
import { Button, List } from 'antd-mobile';
import { removeCountryInAddress, convertMinutesToHoursAndMinutes, isWithin10Minutes } from '@/utils/common';
import RightArrow from '@/assets/right_arrow.png';
import { getSearchParam } from '@/utils/url';
import { useRequest } from 'ahooks';
import { pushGPS, getGPS } from '@/utils/gps';
import { getLocalData } from '@/utils/storage';
import { FLEXSHARE_ACCESS_TOKEN } from '@/constant';
import UserLocationTracker from '@/components/UserLocationTracker';

import Nav from '@/components/Nav';

import './index.scss';

const GoogleMapsNavigation = () => {
  const mapRef = useRef(null);
  const urlParams = getSearchParam('current');
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [map, setMap] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const token = getLocalData(FLEXSHARE_ACCESS_TOKEN);
  const [markers, setMarkers] = useState([]);

  const START_PONIT = 'start_point';
  const END_POINT = 'end_point';
  const [start, setStartPoint] = useState(null);
  const [end, setEndPoint] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(urlParams ? JSON.parse(urlParams) : null);

  // https://alibaba.github.io/hooks/use-request/polling
  const { run: runPush, cancel: cancelPush } = useRequest(pushGPS, {
    pollingInterval: 5000,
    manual: true,
  });

  const { data: gpsData, run: runGet, cancel: cancelGet } = useRequest(getGPS, {
    pollingInterval: 5000,
    manual: true,
    onError: (err) => {
      console.error('gpsData-err:', err);
    }
  });

  const requestData = {
    "userID": currentOrder?.user_id,
    "auth": token,
    "role": "driver",
    "scheduleId": currentOrder?.schedule_id,
  }

  useEffect(() => {
    if (urlParams && isWithin10Minutes(currentOrder?.departure_time)) {
      runPush(requestData);
      runGet(requestData);
    }
  }, [urlParams, currentOrder])


  useEffect(() => {
    const data = urlParams ? JSON.parse(urlParams) : null;
    if (data.start_point) {
      setStartPoint(data.start_point)
    }
    if (data.end_point) {
      setEndPoint(data.end_point)
    }
    setCurrentOrder(data)

  }, [urlParams]);


  const handlePlaceSelect = (type, place) => {
    console.log('Selected location information:', place);
    const { formatted_address, geometry } = place;

    const address = formatted_address;
    const lat = geometry.location.lat();
    const lng = geometry.location.lng();
    console.log('Address:', address, 'Latitude:', lat, 'Longitude:', lng);
    if (type === START_PONIT) {
      setStartPoint({ address, lat, lng });
    } else if (type === END_POINT) {
      setEndPoint({ address, lat, lng });
    }

  }

  useEffect(() => {
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"]
    });

    getCurrentPosition().then(res => {
      console.log('Current position:', res);
      const initialLocation = {
        lat: res.latitude,
        lng: res.longitude
      };

      loader.load().then(() => {
        const newMap = new window.google.maps.Map(mapRef.current, {
          zoom: 15,
          center: initialLocation,
          mapTypeId: 'roadmap',
          gestureHandling: 'greedy',
          options: {
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            scaleControl: false,
            rotateControl: false,
            clickableIcons: false,
          }
        });

        setMap(newMap)

        const service = new window.google.maps.DirectionsService();
        const renderer = new window.google.maps.DirectionsRenderer({
          map: newMap,
        });

        setDirectionsService(service);
        setDirectionsRenderer(renderer);

      });
    }).catch(error => {
      console.error('Error getting current position:', error);
    });


  }, [apiKey]);

  useEffect(() => {
    if (start && end && directionsService) {
      calculateRoute();
    }
  }, [directionsService])

  const drawPosition = () => {
    const othersGPS = gpsData?.othersGPS;
    console.log('othersGPS', othersGPS)
    if (!othersGPS || othersGPS.length === 0) {
      setMarkers([]);
      return;
    }
    const newMarkers = [];


    othersGPS?.forEach((i, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: Number(i.lat), lng: Number(i.lon) },
        map,
        title: i.userId,
        icon: {
          url: 'https://527flexshare.s3.us-east-1.amazonaws.com/position0.gif',
          scaledSize: new window.google.maps.Size(48, 48),
        }
      });
      newMarkers.push(marker);
      const infoWindow = new window.google.maps.InfoWindow({
        content: `Passager ${index + 1}`
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });
    setMarkers(newMarkers);
  }

  useEffect(() => {
    console.log('gpsData-1', gpsData)
    if (gpsData && map) {
      drawPosition();
    }
  }, [gpsData, map]);

  useEffect(() => {
    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, []);


  const calculateWayponits = () => {
    const waypoints = []
    const v = Object.values(currentOrder?.passengerSchedules || {});
    v.map((item) => {
      waypoints.push({
        location: { lat: item.stops?.[0]?.lat, lng: item.stops?.[0]?.lng },
        stopover: true
      })
      waypoints.push({
        location: { lat: item.stops?.[1]?.lat, lng: item.stops?.[1]?.lng },
        stopover: true
      })
    })
    return waypoints
  };

  const calculateRoute = () => {
    console.log('Calculating route with start:', start, 'end:', end);
    if (!start || !end || !directionsService) {
      setError('Please enter both start and end locations');
      return;
    }

    setLoading(true);
    setError(null);
    setRouteSummary(null);
    const waypoints = calculateWayponits();
    console.log('waypoints22', waypoints)

    const request = {
      origin: start,
      destination: end,
      travelMode: window.google.maps.TravelMode.DRIVING,
      waypoints: waypoints?.length > 0 ? waypoints : undefined,
    };

    console.log('Calculating route with request:', request);


    directionsService.route(request, (response, status) => {
      setLoading(false);

      if (status === 'OK') {
        directionsRenderer.setDirections(response);
        const route = response.routes[0];
        console.log('route ', route)
        if (route && route.legs && route.legs.length > 0) {
          let totalDistanceMeters = 0;
          let totalDurationSeconds = 0;
          route.legs.forEach(leg => {
            totalDistanceMeters += leg.distance?.value || 0;
            totalDurationSeconds += leg.duration?.value || 0;
          });
          const km = (totalDistanceMeters / 1000).toFixed(1);
          let minutes = Math.round(totalDurationSeconds / 60);
          setRouteSummary({
            distance: km + 'km',
            duration: convertMinutesToHoursAndMinutes(minutes),
            summary: route.summary
          });
        }
      } else {
        setError(`Could not retrieve directions: ${status}`);
      }
    });
  };

  return (
    <>
      <Nav title='Current Order' />
      <div className='driver-rode-container'>
        <div className='order-info'>
          <List header=''>
            <p className='route-item-detail'>
              <span className='address'> {removeCountryInAddress(currentOrder.start_point.address)}</span>
              <img className='rode-icon' src={RightArrow} alt="" />
              <span className='address'>{removeCountryInAddress(currentOrder.end_point.address)}</span>
            </p>
            {Object.values(currentOrder?.passengerSchedules || {})?.map((order, index) => (
              <List.Item
                key={order.schedule_id}
              >
                <p className="route-item">
                  {/* <span className='seat-item'>Order{index + 1}: </span> */}
                  <span>{order.departure_time}</span>
                  <span className='seat-item'>({order.num_passenger} people)</span>
                </p>
              </List.Item>
            ))}
          </List>
        </div>
        <div className='driver-rode-search-container'>
          <AddressSearch
            onPlaceSelect={v => handlePlaceSelect(START_PONIT, v)}
            placeholder="Pickup location"
            defaultValue={start ? start.address : ''}
          />
          <div className='driver-rode-search-item'>
            <AddressSearch
              onPlaceSelect={v => handlePlaceSelect(END_POINT, v)}
              placeholder='Drop location'
              defaultValue={end ? end.address : ''}
            />
          </div>
          <div className='driver-rode-action-bar'>
            <Button
              onClick={calculateRoute}
              color='primary'
              fill='solid'
              loading={loading}
              disabled={loading || !start || !end}
              className='driver-rode-navigate-button'
            >
              Navigate
            </Button>
            <div className='driver-route-summary'>
              {routeSummary && (
                <div>
                  <div>Distance: {routeSummary.distance}</div>
                  <div>Time: {routeSummary.duration}</div>
                  <div>Path: {routeSummary.summary}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div ref={mapRef} className='rode-map-container' />
        <UserLocationTracker
          map={map}
          followUser={true}
        />
      </div>
    </>
  );
};

export default GoogleMapsNavigation;