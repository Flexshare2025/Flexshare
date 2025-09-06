import { useContext, useState, useEffect } from 'react';
import { Button, DatePicker } from 'antd-mobile';
import { ClockCircleOutline, TeamOutline } from 'antd-mobile-icons';
import AddressSearch from '@/components/search-location';
import { DirectionsContext } from './DirectionsProvider';
import { matchSchedule } from '@/api/index';
import './ControlPanel.scss';

export default function ControlPanel({
  onPlaceSelect,
  start,
  end,
  loading,
  routeSummary,
  error,
  onSetLoading,
  onSetRouteSummary,
  onSetError,
  onSetMatchedSchedules,
  onPassengerCountChange
}) {
  const START_POINT = 'start_point';
  const END_POINT = 'end_point';
  const { calculateRouteBetween, displayRouteOnMap } = useContext(DirectionsContext);

  const [visible, setVisible] = useState(false);
  const [date, setDate] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);

  // when passengerCount changes, notify the parent component 
  useEffect(() => {
    onPassengerCountChange && onPassengerCountChange(passengerCount);
  }, [passengerCount, onPassengerCountChange]);

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const handlePlaceSelect = (type, place) => {
    const { formatted_address, geometry } = place;
    const address = formatted_address;
    const lat = geometry.location.lat();
    const lng = geometry.location.lng();

    if (type === START_POINT) {
      onPlaceSelect({ address, lat, lng }, 'start');
    } else if (type === END_POINT) {
      onPlaceSelect({ address, lat, lng }, 'end');
    }
  };

  const calculateRoute = async () => {
    if (!start || !end || !calculateRouteBetween) return;

    if (!date) {
      onSetError && onSetError('Please select departure time');
      return;
    }

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

      const getAddressForAPI = (point) => {
        // if realAddress is a coordinate format, try to use a more friendly address name
        if (point.realAddress && point.realAddress.includes(',')) {
          // check if it is a coordinate format (contains comma and is a number)
          const parts = point.realAddress.split(',');
          if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
            // this is a coordinate format, return a friendly address name
            return `Location at ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
          }
        }
        // otherwise use realAddress or address
        return point.realAddress || point.address;
      };

      const matchData = {
        start_point: {
          lat: start.lat,
          lng: start.lng,
          address: getAddressForAPI(start)
        },
        end_point: {
          lat: end.lat,
          lng: end.lng,
          address: getAddressForAPI(end)
        },
        departure_time: date + ':00',
        num_passengers: passengerCount
      };

      matchSchedule({
        data: matchData,
        success: (result) => {
          // according to the data structure returned by the interface, extract the data field
          if (result && result.data) {
            console.log('Setting matched schedules:', result.data);
            onSetMatchedSchedules && onSetMatchedSchedules(result.data);
            // Display route on map if we have matched schedules
            if (result.data.length > 0 && displayRouteOnMap) {
              const firstSchedule = result.data[0];
              if (firstSchedule.start_point && firstSchedule.end_point) {
                displayRouteOnMap(
                  firstSchedule.start_point,
                  firstSchedule.end_point,
                  firstSchedule.route_points || []
                );
              }
            }
          } else {
            console.log('No data in result, setting empty array');
            onSetMatchedSchedules && onSetMatchedSchedules([]);
          }
        },
        fail: (error) => {
          console.error('Match schedule failed:', error);
          onSetError && onSetError('Failed to match schedule: ' + error.message);
        },
      });

    } catch (e) {
      onSetError && onSetError(e.message || 'Route calculation failed');
    } finally {
      onSetLoading && onSetLoading(false);
    }
  };

  return (
    <div className="passenger-control-panel">
      <div className='item-flex'>
        <span className='item-icon green' />
        <AddressSearch
          onPlaceSelect={v => handlePlaceSelect(START_POINT, v)}
          placeholder="Pickup location"
          defaultValue={start ? start.address : ''}
        />
      </div>
      <div className='item-flex'>
        <span className='item-icon blue' />
        <AddressSearch
          onPlaceSelect={v => handlePlaceSelect(END_POINT, v)}
          placeholder='Drop location'
          defaultValue={end ? end.address : ''}
        />
      </div>
      <div className='item-flex item-large'>
        <ClockCircleOutline
          className='item-large-icon'
          color='#722ed1'
        />
        <span className={`item-large-label ${!date ? 'item-large-label-placeholder' : ''}`}
          onClick={() => {
            setVisible(true)
          }}
        >
          {date || 'Leave time'}
        </span>
        <DatePicker
          min={new Date()}
          max={new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) /* 7 days later */}
          visible={visible}
          onClose={() => {
            setVisible(false)
          }}
          precision='minute'
          onConfirm={val => {
            setDate(formatDateTime(val));
          }}
        />
      </div>
      <div className='item-flex item-large flex-start'>
        <TeamOutline
          className='item-large-icon'
          color='#531dab'
        />
        <div className="passenger-count-container">
          <span className="passenger-label">Passengers</span>
          <div className="stepper-wrapper">
            <button
              className="stepper-btn minus"
              onClick={() => {
                const newCount = Math.max(1, passengerCount - 1);
                setPassengerCount(newCount);
                onPassengerCountChange && onPassengerCountChange(newCount);
              }}
              disabled={passengerCount <= 1}
            >
              −
            </button>
            <span className="stepper-value">{passengerCount}</span>
            <button
              className="stepper-btn plus"
              onClick={() => {
                const newCount = Math.min(20, passengerCount + 1);
                setPassengerCount(newCount);
                onPassengerCountChange && onPassengerCountChange(newCount);
              }}
              disabled={passengerCount >= 20}
            >
              +
            </button>
          </div>
        </div>
      </div>
      <div>
        <Button
          onClick={calculateRoute}
          color='primary'
          fill='solid'
          loading={loading}
          disabled={loading || !start || !end || !date}
          className='submit-btn bottom-btn'
          size='large'
        >
          {loading ? 'Matching Routes...' : 'Match Route'}
        </Button>
        {(routeSummary || error) && (
          <div className='driver-route-summary'>
            {routeSummary && (
              <div>
                <div key="distance">Distance: {routeSummary.distance}</div>
                <div key="duration">Time: {routeSummary.duration}</div>
                {routeSummary.eta && <div key="eta">ETA: {routeSummary.eta}</div>}
              </div>
            )}
            {error && <div key="error" style={{ color: 'red' }}>{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}