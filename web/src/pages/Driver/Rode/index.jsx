import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import AddressSearch from '@/components/search-location';
import { getCurrentPosition } from '@/utils/position';

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

  console.log('start', start);

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
          panel: document.getElementById('directions-panel')
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
          const latLng = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setStartPoint(latLng);
          if (end) {
            calculateRoute(latLng, end);
          }
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
    <div>
      <div>
        <AddressSearch
          onPlaceSelect={v => handlePlaceSelect(START_PONIT, v)}
          placeholder="Pickup location"
        />
        <AddressSearch
          onPlaceSelect={v => handlePlaceSelect(END_POINT, v)}
          placeholder="Drop location"
        />
        <button onClick={calculateRoute}
        // disabled={loading || !start || !end}
        >
          {loading ? '...' : 'navigate'}
        </button>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: '400px', margin: '16px 0' }} />
      <div id="directions-panel" style={{ maxHeight: 200, overflowY: 'auto' }} />
      {routeSummary && (
        <div>
          <div>distance: {routeSummary.distance}</div>
          <div>time: {routeSummary.duration}</div>
          <div>path: {routeSummary.summary}</div>
        </div>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
};

export default GoogleMapsNavigation;