import { useState, useEffect, useContext } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { getCurrentPosition } from '@/utils/position'
import DirectionsProvider, { DirectionsContext } from './component/DirectionsProvider';
import MapView from './component/MapView';
import ControlPanel from './component/ControlPanel';
import OrderList from './component/OrderList';

export default function App() {
  const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [position, setPosition] = useState({ lat: 0, lng: 0 });
  const [start, setStartPoint] = useState(null);
  const [end, setEndPoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeSummary, setRouteSummary] = useState(null);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const directions = useContext(DirectionsContext);

  useEffect(() => {
    getCurrentPosition()
      .then(res => {
        setPosition({
          lat: res.latitude,
          lng: res.longitude
        });
        setStartPoint({
          lat: res.latitude,
          lng: res.longitude,
          address: 'Current Location'
        });
      })
      .catch(error => {
        console.error('Error getting current position:', error);
      });
  }, []);

  const handlePlaceSelect = (place, type) => {
    if (type === 'start') {
      setStartPoint(place);
    } else if (type === 'end') {
      setEndPoint(place);
    }
  };

  const calculateRoute = async () => {
    if (!start || !end) return;
    if (!directions || !directions.calculateRouteBetween) return;

    try {
      setLoading(true);
      setError(null);
      setRouteSummary(null);

      const origin = { lat: start.lat, lng: start.lng };
      const destination = { lat: end.lat, lng: end.lng };

      const { totalDistanceMeters, totalDurationSeconds, etaDate } = await directions.calculateRouteBetween(origin, destination);

      const distanceKm = (totalDistanceMeters / 1000).toFixed(2) + ' km';
      const durationMin = Math.round(totalDurationSeconds / 60) + ' mins';
      const eta = etaDate.toLocaleTimeString();

      setRouteSummary({
        distance: distanceKm,
        duration: durationMin,
        eta,
      });
    } catch (e) {
      setError(e.message || 'Route calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const requestFullScreen = () => {
    setIsFullscreen(true);
    // 这里调用全屏逻辑
  };

  const [orderLists] = useState([
    //mock data
    {
      id: '1',
      avatar:
        'https://images.unsplash.com/photo-1548532928-b34e3be62fc6?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
      time: '2025-01-01 12:00',
      start: '53 boundary road',
      startPoint: { latitude: -37.775033246987796, longitude: 175.28347354539358, address: '53 boundary road' },
      endPoint: { latitude: -37.7473964, longitude: 175.2320289, address: 'the base shopping center' },
      end: 'the base shopping center',
      // routPoints: [
      //   { latitude: -37.775033246987796, longitude: 175.28347354539358 },
      //   { latitude: -37.7473964, longitude: 175.2320289 }
      // ],
      stops: [{ latitude: -37.7798687, longitude: 175.2728966 }],
      price: '5$'
    }
  ]);

  return (
    <div style={{ width: '100%', height: '100vh', }}>
      <APIProvider apiKey={KEY}>
        <DirectionsProvider>
          <MapView position={position} />
          <ControlPanel
            onPlaceSelect={handlePlaceSelect}
            start={start}
            end={end}
            loading={loading}
            routeSummary={routeSummary}
            error={error}
            onFullscreen={requestFullScreen}
            onSetLoading={setLoading}
            onSetRouteSummary={setRouteSummary}
            onSetError={setError}
          />
          <OrderList orderLists={orderLists} />
        </DirectionsProvider>
      </APIProvider>
    </div>
  );
}