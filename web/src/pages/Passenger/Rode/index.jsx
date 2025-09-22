import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { getCurrentPosition } from '@/utils/position';
import { removeCountryInAddress, convertMinutesToHoursAndMinutes, isWithin10Minutes } from '@/utils/common';
import RightArrow from '@/assets/right_arrow.png';
import { useRequest } from 'ahooks';
import { pushGPS, getGPS } from '@/utils/gps';
import { getLocalData } from '@/utils/storage';
import { FLEXSHARE_ACCESS_TOKEN } from '@/constant';
import UserLocationTracker from '@/components/UserLocationTracker';

import Header from '@/components/Header';

import './index.scss';

const GoogleMapsNavigation = (props) => {
  const mapRef = useRef(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [markers, setMarkers] = useState([]);

  const [_routeSummary, setRouteSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const token = getLocalData(FLEXSHARE_ACCESS_TOKEN);
  const [map, setMap] = useState(null);

  const [start, setStartPoint] = useState(null);
  const [end, setEndPoint] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(props.currentOrder || {});
  const [sharedLocation, setSharedLocation] = useState(null);

  useEffect(() => {
    if (map && !sharedLocation) {
      console.log('Getting initial position for user marker...');
      getCurrentPosition().then(res => {
        console.log('Got initial position:', res);
        setSharedLocation({
          lat: res.latitude,
          lng: res.longitude
        });
      }).catch(err => {
        console.error('Failed to get initial position:', err);
      });
    }
  }, [map, sharedLocation]);

  // https://alibaba.github.io/hooks/use-request/polling
  const { run: runPush, cancel: cancelPush } = useRequest(pushGPS, {
    pollingInterval: 5000,
    manual: true,
    ready: isWithin10Minutes(currentOrder?.departure_time),
  });

  const { data: gpsData, run: runGet, cancel: cancelGet } = useRequest(getGPS, {
    pollingInterval: 5000,
    manual: true,
    ready: isWithin10Minutes(currentOrder?.departure_time),
    onError: (err) => {
      console.error('gpsData-err:', err);
    }
  });

  // 启动GPS轮询的独立effect
  useEffect(() => {
    const requestData = {
      "userID": currentOrder?.user_id,
      "auth": token,
      "role": "passenger",
      "scheduleId": currentOrder?.schedule_id,
    };

    if (isWithin10Minutes(currentOrder?.departure_time) && map && token) {
      console.log('Starting polling after map initialization...');
      const timer = setTimeout(() => {
        runPush(requestData);
        runGet(requestData);
      }, 500);

      return () => clearTimeout(timer);
    } else if (!isWithin10Minutes(currentOrder?.departure_time)) {
      console.log('Not within 10 minutes, canceling polling...');
      cancelPush();
      cancelGet();
    }
  }, [currentOrder, map, token, runPush, runGet, cancelPush, cancelGet])

  useEffect(() => {
    if (gpsData && gpsData.othersGPS) {
      console.log('GPS data received:', gpsData);
      console.log('Current user ID:', currentOrder?.user_id);

      const currentUserGPS = gpsData.othersGPS.find(gps => gps.userId === currentOrder?.user_id);
      if (currentUserGPS) {
        console.log('Found current user GPS:', currentUserGPS);
        setSharedLocation({
          lat: Number(currentUserGPS.lat),
          lng: Number(currentUserGPS.lon)
        });
      } else {
        console.log('Current user GPS not found in othersGPS, trying to get current position...');
        getCurrentPosition().then(res => {
          console.log('Got current position as fallback:', res);
          setSharedLocation({
            lat: res.latitude,
            lng: res.longitude
          });
        }).catch(err => {
          console.error('Failed to get current position:', err);
        });
      }
    }
  }, [gpsData, currentOrder?.user_id])


  useEffect(() => {
    const data = props.currentOrder || {};
    if (props.currentOrder) {
      setCurrentOrder(data)
      if (data.start_point) {
        setStartPoint(data.start_point)
      }
      if (data.end_point) {
        setEndPoint(data.end_point)
      }
    }

  }, [props.currentOrder]);

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

  const drawPosition = useCallback(() => {
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

  }, [markers, gpsData, map])

  useEffect(() => {
    if (gpsData && map) {
      drawPosition();
    }
  }, [gpsData, map, drawPosition]);

  const calculateStops = useCallback(() => {
    const v = Object.values(currentOrder?.passengerSchedules || {});
    return v?.[0]?.stops || [];
  }, [currentOrder]);

  const calculateRoute = useCallback(() => {
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
  }, [start, end, directionsService, directionsRenderer, calculateStops]);

  useEffect(() => {
    return () => {
      markers.forEach(marker => marker.setMap(null));
      // 清理GPS轮询
      cancelPush();
      cancelGet();
    };
  }, [markers, cancelPush, cancelGet]);

  useEffect(() => {
    if (start && end && directionsService) {
      calculateRoute();
    }
  }, [start, end, directionsService, props.currentOrder, calculateRoute])

  return (
    <>
      <Header title='Current Order' onBack={props.onClose} />
      <div className='passenger-rode-container'>
        <div className='order-info'>
          <p className='route-item-detail'>
            <span className='address'> {removeCountryInAddress(currentOrder?.start_point?.address)}</span>
            <img className='rode-icon' src={RightArrow} alt="" />
            <span className='address'>{removeCountryInAddress(currentOrder?.end_point?.address)}</span>
          </p>
        </div>
        <div ref={mapRef} className='passenger-rode-map-container' />
        <UserLocationTracker
          map={map}
          followUser={true}
          useSharedLocation={true}
          sharedLocation={sharedLocation}
        />
      </div>
    </>
  );
};

export default GoogleMapsNavigation;