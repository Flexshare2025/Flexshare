import { createContext, useState, useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Dialog } from 'antd-mobile';

export const DirectionsContext = createContext(null);

export default function DirectionsProvider({ children }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    const renderer = new routesLibrary.DirectionsRenderer({ map });
    setDirectionsRenderer(renderer);
  }, [routesLibrary, map]);

  const handleBook = (item) => {
    console.log("🚀 --- item:", item)
    if (!directionsService || !directionsRenderer) return;

    const origin = {
      lat: item.startPoint.latitude,
      lng: item.startPoint.longitude
    };

    const destination = {
      lat: item.endPoint.latitude,
      lng: item.endPoint.longitude
    };

    const waypoints = item.stops.map(stop => ({
      location: { lat: stop.latitude, lng: stop.longitude },
      stopover: true
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        console.log("🚀 --- result:", result)
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);

          const route = result.routes[0].legs;
          let totalDistance = 0;
          let totalDuration = 0;

          route.forEach(leg => {
            totalDistance += leg.distance.value;
            totalDuration += leg.duration.value;
          });

          const km = (totalDistance / 1000).toFixed(2);
          const minutes = Math.round(totalDuration / 60);
          const eta = new Date(Date.now() + totalDuration * 1000);

          Dialog.confirm({
            content: (
              <div style={{ lineHeight: '1.6', fontSize: 16 }}>
                <p>🗺️ <strong>Total distance:</strong> {km} km</p>
                <p>⏱️ <strong>Estimated trip:</strong> {minutes} mins</p>
                <p>🚗 <strong>ETA:</strong> {eta.toLocaleTimeString()}</p>
              </div>
            ),
            confirmText: 'Book Now',
            cancelText: 'Cancel',
            onConfirm: () => {
              Dialog.alert({
                content: 'ride booked successfully'
              });
            },
            onCancel: () => { }
          });
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  };

  const calculateRouteBetween = async (origin, destination, waypoints = []) => {
    if (!directionsService || !directionsRenderer) {
      throw new Error('Directions service not ready');
    }

    const request = {
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING
    };

    return new Promise((resolve, reject) => {
      directionsService.route(request, (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);

          const legs = result.routes[0].legs || [];
          let totalDistanceMeters = 0;
          let totalDurationSeconds = 0;
          legs.forEach(leg => {
            totalDistanceMeters += leg.distance?.value || 0;
            totalDurationSeconds += leg.duration?.value || 0;
          });

          const etaDate = new Date(Date.now() + totalDurationSeconds * 1000);

          resolve({
            result,
            legs,
            totalDistanceMeters,
            totalDurationSeconds,
            etaDate
          });
        } else {
          reject(new Error(`Directions failed: ${status}`));
        }
      });
    });
  };

  return (
    <DirectionsContext.Provider value={{ handleBook, calculateRouteBetween }}>
      {children}
    </DirectionsContext.Provider>
  );
}