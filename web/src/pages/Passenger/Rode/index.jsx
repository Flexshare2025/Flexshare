import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { getCurrentPosition } from '@/utils/position';
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
  const [markers, setMarkers] = useState([]);

  const [routeSummary, setRouteSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const token = getLocalData(FLEXSHARE_ACCESS_TOKEN);
  const [map, setMap] = useState(null);

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
    "role": "passenger",
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

  console.log('currentOrder', currentOrder, start, end)

  console.log('start', start, 'loading', loading, 'end', end);

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
      console.log('Error getting current position:', error);
    });


  }, [apiKey]);

  useEffect(() => {
    if (gpsData && map) {
      drawPosition();
    }
  }, [gpsData, map]);

  const drawPosition = () => {
    markers.forEach(marker => marker.setMap(null));
    const othersGPS = gpsData?.othersGPS;
    console.log('othersGPS', othersGPS)
    if (!othersGPS || othersGPS.length === 0) {
      setMarkers([]);
      return;
    }
    const newMarkers = [];

    othersGPS?.forEach((i) => {
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
    });
    setMarkers(newMarkers);

  }

  useEffect(() => {
    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, []);

  useEffect(() => {
    if (start && end && directionsService) {
      calculateRoute();
    }
  }, [directionsService])


  const calculateStops = () => {
    const v = Object.values(currentOrder?.passengerSchedules || {});
    return v?.[0]?.stops
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

    const stops = calculateStops();

    const request = {
      origin: stops[0],
      destination: stops[1],
      travelMode: window.google.maps.TravelMode.DRIVING,
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
      <div className='passenger-rode-container'>
        <div className='order-info'>
          <p className='route-item-detail'>
            <span className='address'> {removeCountryInAddress(currentOrder.start_point.address)}</span>
            <img className='rode-icon' src={RightArrow} alt="" />
            <span className='address'>{removeCountryInAddress(currentOrder.end_point.address)}</span>
          </p>
        </div>
        <div ref={mapRef} className='passenger-rode-map-container' />
        <UserLocationTracker
          map={map}
          followUser={true}
        />
      </div>
    </>
  );
};

export default GoogleMapsNavigation;