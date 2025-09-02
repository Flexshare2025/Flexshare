import { useContext } from 'react';
import { Button } from 'antd-mobile';
import AddressSearch from '@/components/search-location';
import { DirectionsContext } from './DirectionsProvider';

export default function ControlPanel({
  onPlaceSelect,
  start,
  end,
  loading,
  routeSummary,
  error,
  onSetLoading,
  onSetRouteSummary,
  onSetError
}) {
  const START_PONIT = 'start_point';
  const END_POINT = 'end_point';
  const { calculateRouteBetween } = useContext(DirectionsContext);

  const handlePlaceSelect = (type, place) => {
    console.log('Selected location information:', place);
    const { formatted_address, geometry } = place;

    const address = formatted_address;
    const lat = geometry.location.lat();
    const lng = geometry.location.lng();

    console.log('Address:', address, 'Latitude:', lat, 'Longitude:', lng);

    if (type === START_PONIT) {
      onPlaceSelect({ address, lat, lng }, 'start');
    } else if (type === END_POINT) {
      onPlaceSelect({ address, lat, lng }, 'end');
    }
  };
  //calculate route between start and end
  const calculateRoute = async () => {
    if (!start || !end || !calculateRouteBetween) return;
    try {
      onSetLoading && onSetLoading(true);
      onSetError && onSetError(null);
      onSetRouteSummary && onSetRouteSummary(null);

      const origin = { lat: start.lat, lng: start.lng };
      const destination = { lat: end.lat, lng: end.lng };
      const { totalDistanceMeters, totalDurationSeconds, etaDate } = await calculateRouteBetween(origin, destination);

      const distanceKm = (totalDistanceMeters / 1000).toFixed(2) + ' km';
      const durationMin = Math.round(totalDurationSeconds / 60) + ' mins';
      const eta = etaDate.toLocaleTimeString();

      onSetRouteSummary && onSetRouteSummary({
        distance: distanceKm,
        duration: durationMin,
        eta,
      });
    } catch (e) {
      onSetError && onSetError(e.message || 'Route calculation failed');
    } finally {
      onSetLoading && onSetLoading(false);
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      <AddressSearch
        onPlaceSelect={v => handlePlaceSelect(START_PONIT, v)}
        placeholder="Pickup location"
        defaultValue={start ? start.address : ''}
      />
      <AddressSearch
        onPlaceSelect={v => handlePlaceSelect(END_POINT, v)}
        placeholder='Drop location'
        defaultValue={end ? end.address : ''}
      />
      <div>
        <Button
          onClick={calculateRoute}
          color='primary'
          fill='solid'
          loading={loading}
          disabled={loading || !start || !end}
        >
          Match Route
        </Button>
        <div className='driver-route-summary'>
          {routeSummary && (
            <div>
              <div>Distance: {routeSummary.distance}</div>
              <div>Time: {routeSummary.duration}</div>
              {routeSummary.eta && <div>ETA: {routeSummary.eta}</div>}
            </div>
          )}
          {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}