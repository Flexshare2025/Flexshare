import { useEffect, useState, useRef } from 'react';
import { Loader } from "@googlemaps/js-api-loader";
import { generateRoutePoints } from './utils';
import { getCurrentPosition } from '@/utils/position';
import AddressSearch from '@/components/search-location';
import { DatePicker, Stepper, Button, Popup, Toast } from 'antd-mobile'
import { ClockCircleOutline, TeamOutline } from 'antd-mobile-icons';
import { formatDateTime } from '@/utils/common';
import RouteList from './components/RouteList';
import OrderIcon from '@/assets/order_icon.png';
import { publishSchedule } from '@/api/index.js';

import './index.scss';

export default function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const START_POINT = 'start_point';
  const END_POINT = 'end_point';

  const [visible, setVisible] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [passengerCount, setPassengerCount] = useState(4);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [visibleCloseRight, setVisibleCloseRight] = useState(false);
  const [routeSummary, setRouteSummary] = useState(null);
  const [points, setPoints] = useState([]);

  const mapRef = useRef(null);
  const mapRefInstance = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"]
    });

    const initMap = async () => {
      try {
        const res = await getCurrentPosition();
        const initialLocation = { lat: res.latitude, lng: res.longitude };
        setStartPoint({
          lat: res.latitude,
          lng: res.longitude,
          address: 'Current Location'
        });

        await loader.load();
        if (!mapRef.current) return;

        const newMap = new window.google.maps.Map(mapRef.current, {
          zoom: 15,
          center: initialLocation,
          mapTypeId: 'roadmap',
          gestureHandling: 'greedy',
          disableDefaultUI: true
        });

        mapRefInstance.current = newMap;
        directionsServiceRef.current = new window.google.maps.DirectionsService();
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: newMap,
        });
      } catch (error) {
        console.log('Error getting current position:', error);
      }
    };

    initMap();

    return () => {
      if (mapRefInstance.current) {
        mapRefInstance.current = null;
      }
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [apiKey]);

  const handlePlaceSelect = (type, place) => {
    const { formatted_address, geometry } = place;
    const address = formatted_address;
    const lat = geometry.location.lat();
    const lng = geometry.location.lng();

    if (type === START_POINT) {
      setStartPoint({ address, lat, lng });
    } else if (type === END_POINT) {
      setEndPoint({ address, lat, lng });
    }
  };

  const GenerateRoute = () => {
    if (!startPoint || !endPoint || !date || !passengerCount) {
      Toast.show({ icon: 'fail', content: 'Please fill in all required fields.' });
      return;
    }

    if (!directionsServiceRef.current) return;

    setLoading(true);
    setRouteSummary(null);

    const request = {
      origin: startPoint,
      destination: endPoint,
      travelMode: window.google.maps.TravelMode.DRIVING,
    };

    directionsServiceRef.current.route(request, (response, status) => {
      setLoading(false);

      if (status === 'OK') {
        const route = response.routes[0];
        if (route?.legs?.length > 0) {
          setRouteSummary({
            distance: route.legs[0].distance.text,
            duration: route.legs[0].duration.text,
            summary: route.summary,
            overview_polyline: route.overview_polyline
          });

          const currentPoints = generateRoutePoints(route.overview_polyline, route.legs[0].distance.text);
          setPoints(currentPoints);

          const waypoints = currentPoints.length > 2
            ? currentPoints.slice(1, -1).map(point => ({
              location: { lat: point.lat, lng: point.lng },
              stopover: true
            }))
            : [];

          directionsServiceRef.current.route({
            origin: startPoint,
            destination: endPoint,
            travelMode: window.google.maps.TravelMode.DRIVING,
            waypoints: waypoints.length > 0 ? waypoints : undefined,
          }, (res, sta) => {
            if (sta === 'OK' && directionsRendererRef.current) {
              directionsRendererRef.current.setDirections(res);
            }
          });
        }
      }
    });
  };

  const publishRoute = () => {
    if (!startPoint || !endPoint || !date || !passengerCount) {
      Toast.show({ icon: 'fail', content: 'Please fill in all required fields.' });
      return;
    }

    setLoading(true);
    publishSchedule({
      data: {
        "start_point": startPoint,
        "end_point": endPoint,
        "route_points": points,
        "stops": [],
        "departure_time": date + ':00',
        "available_seats": passengerCount,
      },
      success: res => {
        setLoading(false);
        if (res.code === '200') {
          Toast.show({ icon: 'success', content: 'Success' });
          setDate('');
        } else {
          Toast.show({ icon: 'fail', content: res.msg });
        }
      },
      fail: err => {
        setLoading(false);
        Toast.show({ icon: 'fail', content: err?.msg });
      }
    });
  };

  return (
    <>
      <div className='driver-map-container'>
        <div ref={mapRef} className='publish-map-container' />
        <div className='driver-map-search'>
          <div className='item-flex'>
            <span className='item-icon green' />
            <AddressSearch
              onPlaceSelect={v => handlePlaceSelect(START_POINT, v)}
              placeholder="Pickup location"
            />
          </div>
          <div className='item-flex'>
            <span className='item-icon blue' />
            <AddressSearch
              onPlaceSelect={v => handlePlaceSelect(END_POINT, v)}
              placeholder="Where to?"
            />
          </div>
          <div className='item-flex item-large'>
            <ClockCircleOutline className='item-large-icon' color='#722ed1' />
            <span
              className={`item-large-label ${!date ? 'item-large-label-placeholder' : ''}`}
              onClick={() => setVisible(true)}
            >
              {date || 'Leave time'}
            </span>
            <DatePicker
              min={new Date()}
              max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
              visible={visible}
              onClose={() => setVisible(false)}
              precision='minute'
              onConfirm={val => setDate(formatDateTime(val))}
            />
          </div>
          <div className='item-flex item-large flex-start'>
            <TeamOutline className='item-large-icon' color='#531dab' />
            <Stepper
              defaultValue={4}
              value={passengerCount}
              min={1}
              max={30}
              onChange={value => setPassengerCount(value)}
            />
          </div>
          {startPoint && endPoint && date && (
            <div className='generate-wrap'>
              <Button
                className='submit-btn bottom-btn'
                color='primary'
                size='large'
                onClick={GenerateRoute}
              >
                Generate Route
              </Button>
              {routeSummary && (
                <div className='driver-route-summary'>
                  <div>Distance: {routeSummary.distance}</div>
                  <div>Time: {routeSummary.duration}</div>
                  <div>Path: {routeSummary.summary}</div>
                </div>
              )}
            </div>
          )}
          {routeSummary && startPoint && endPoint && date && (
            <Button
              loading={loading}
              className='submit-btn bottom-btn'
              block
              color='primary'
              size='large'
              onClick={publishRoute}
            >
              Submit
            </Button>
          )}
        </div>
        <img
          onClick={() => setVisibleCloseRight(true)}
          className='driver-float-icon'
          src={OrderIcon}
          alt=""
        />
      </div>
      <Popup
        position='right'
        visible={visibleCloseRight}
        destroyOnClose
        onClose={() => setVisibleCloseRight(false)}
      >
        <div className='driver-list-popup-content' style={{ height: '100vh', overflowY: 'scroll' }}>
          <RouteList onClose={() => setVisibleCloseRight(false)} />
        </div>
      </Popup>
    </>
  );
}
