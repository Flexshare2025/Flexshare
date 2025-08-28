import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import AddressSearch from '@/components/search-location';
import { getCurrentPosition } from '@/utils/position';
import { Button, NoticeBar, Space } from 'antd-mobile';

import './index.scss';

const GoogleMapsNavigation = () => {
  const mapRef = useRef(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  const [routeSummary, setRouteSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const START_PONIT = 'start_point';
  const END_POINT = 'end_point';
  const [start, setStartPoint] = useState(null);
  const [end, setEndPoint] = useState(null);

  console.log('start', start, 'loading', loading, 'end', end);

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
      setStartPoint({
        lat: res.latitude,
        lng: res.longitude,
        address: 'Current Location' // todo
      });
      loader.load().then(() => {
        const newMap = new window.google.maps.Map(mapRef.current, {
          zoom: 15,
          center: initialLocation,
          mapTypeId: 'roadmap',
          gestureHandling: 'greedy',
          options: {
            fullscreenControl: false,
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            scaleControl: false,
            rotateControl: false,
            clickableIcons: false,
          }
        });


        const service = new window.google.maps.DirectionsService();
        const renderer = new window.google.maps.DirectionsRenderer({
          map: newMap,
          // panel: document.getElementById('directions-panel')
        });

        setDirectionsService(service);
        setDirectionsRenderer(renderer);

      });
    }).catch(error => {
      console.error('Error getting current position:', error);
    });


  }, [apiKey]);

  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          console.log('Updated position:', pos);
          const latLng = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: 'Current Location'
          };
          setStartPoint(latLng);
          // if (end) {
          //   calculateRoute(latLng, end);
          // }
        },
        (err) => setError('error: ' + err.message),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [end, directionsService]);

  const calculateRoute = () => {
    console.log('Calculating route with start:', start, 'end:', end);
    if (!start || !end || !directionsService) {
      setError('Please enter both start and end locations');
      return;
    }

    setLoading(true);
    setError(null);
    setRouteSummary(null);

    const request = {
      origin: start,
      destination: end,
      travelMode: 'DRIVING',
      unitSystem: window.google.maps.UnitSystem.METRIC,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: 'bestguess'
      }
    };

    console.log('Calculating route with request:', request);


    directionsService.route(request, (response, status) => {
      setLoading(false);

      if (status === 'OK') {
        directionsRenderer.setDirections(response);
        const route = response.routes[0];
        if (route && route.legs && route.legs.length > 0) {
          setRouteSummary({
            distance: route.legs[0].distance.text,
            duration: route.legs[0].duration.text,
            summary: route.summary
          });
        }
      } else {
        setError(`Could not retrieve directions: ${status}`);
      }
    });
  };

  return (
    <div className='driver-rode-container'>
      <NoticeBar
        content={<div className='notice-order-content'>
          <p className='notice-order-line'>Do you want to accept the order?</p>
          <p className='notice-order-line'>Order detail...</p>
          <div className='notice-order-action'>
            <Space style={{ '--gap': '12px' }}>
              <span>Accept</span>
              <span>Close</span>
            </Space>
          </div>
        </div>}
        wrap
        color='alert'
      />
      <div className='driver-rode-search-container'>
        <AddressSearch
          onPlaceSelect={v => handlePlaceSelect(START_PONIT, v)}
          placeholder="Pickup location"
          defaultValue={start ? start.address : ''}
        />
        <AddressSearch
          onPlaceSelect={v => handlePlaceSelect(END_POINT, v)}
          placeholder='Drop location'
        />
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
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </div>
        </div>
      </div>
      <div ref={mapRef} className='rode-map-container' />
      <div id="directions-panel" style={{ maxHeight: 200, overflowY: 'auto' }} />
      <div className='order-info'>
        <p>
          TODO Order List
        </p>
      </div>
    </div>
  );
};

export default GoogleMapsNavigation;