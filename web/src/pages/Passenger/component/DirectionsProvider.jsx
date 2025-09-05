import { createContext, useState, useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

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

  const displayRouteOnMap = (start, end, routePoints = []) => {
    if (!directionsService || !directionsRenderer) return;

    const origin = { lat: start.lat, lng: start.lng };
    const destination = { lat: end.lat, lng: end.lng };

    // Convert route points to waypoints
    const waypoints = routePoints.length > 2
      ? routePoints.slice(1, -1).map(point => ({
        location: { lat: point.lat, lng: point.lng },
        stopover: true
      }))
      : [];

    directionsService.route(
      {
        origin,
        destination,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  };

  return (
    <DirectionsContext.Provider value={{ calculateRouteBetween, displayRouteOnMap }}>
      {children}
    </DirectionsContext.Provider>
  );
}