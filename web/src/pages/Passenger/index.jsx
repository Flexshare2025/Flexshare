import { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Popup } from 'antd-mobile';
import { getCurrentPosition } from '@/utils/position'
import DirectionsProvider from './component/DirectionsProvider';
import MapView from './component/MapView';
import ControlPanel from './component/ControlPanel';
import OrderList from './component/OrderList';
import PassengerOrderList from './component/PassengerOrderList';
import OrderIcon from '@/assets/order_icon.png';
import './index.scss';

export default function App() {
  const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [position, setPosition] = useState({ lat: 0, lng: 0 });
  const [start, setStartPoint] = useState(null);
  const [end, setEndPoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeSummary, setRouteSummary] = useState(null);
  const [error, setError] = useState(null);
  const [matchedSchedules, setMatchedSchedules] = useState([]); // store matched schedules data
  const [passengerCount, setPassengerCount] = useState(1); // store passenger count
  const [visibleOrderList, setVisibleOrderList] = useState(false); // control order list popup
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
          address: 'Current Location',
          realAddress: `${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}` // use coordinates as initial realAddress
        });
      })
      .catch(error => {
        // no default position
        setError('get current position failed, please check your location permission or network');
      });
  }, []);

  useEffect(() => {
    const updateAddress = () => {
      if (window.google && window.google.maps && window.google.maps.Geocoder && start && start.lat && start.lng) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: start.lat, lng: start.lng } },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                const realAddress = results[0].formatted_address;
                setStartPoint(prev => ({
                  ...prev,
                  realAddress: realAddress
                }));
              } else {
                // if Geocoding fails, try to use a more precise coordinate format as an address
                const coordinateAddress = `${start.lat.toFixed(8)}, ${start.lng.toFixed(8)}`;
                setStartPoint(prev => ({
                  ...prev,
                  realAddress: coordinateAddress
                }));
              }
            }
          );
        } catch (error) {
          // if there is an error, use a more precise coordinate format as an address
          const coordinateAddress = `${start.lat.toFixed(8)}, ${start.lng.toFixed(8)}`;
          setStartPoint(prev => ({
            ...prev,
            realAddress: coordinateAddress
          }));
        }
      }
    };
    // ensure Google Maps API is fully loaded before calling
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      updateAddress();
    } else {
      // if the API is not loaded, wait for a longer time and try again
      const timer = setTimeout(updateAddress, 2000);
      return () => clearTimeout(timer);
    }
  }, [start?.lat, start?.lng]);
  const handlePlaceSelect = (place, type) => {
    if (type === 'start') {
      setStartPoint({
        ...place,
        realAddress: place.address
      });
    } else if (type === 'end') {
      setEndPoint({
        ...place,
        realAddress: place.address
      });
    }
  };
  // Function to update schedule data directly after booking
  const handleUpdateSchedule = (scheduleId, newAvailableSeats) => {
    setMatchedSchedules(prevSchedules =>
      prevSchedules.map(schedule =>
        schedule.schedule_id === scheduleId
          ? { ...schedule, available_seats: newAvailableSeats }
          : schedule
      )
    );
  };
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <APIProvider apiKey={KEY}>
        <DirectionsProvider>
          <MapView position={position} start={start} end={end} />
          <ControlPanel
            onPlaceSelect={handlePlaceSelect}
            start={start}
            end={end}
            loading={loading}
            routeSummary={routeSummary}
            error={error}
            onSetLoading={setLoading}
            onSetRouteSummary={setRouteSummary}
            onSetError={setError}
            onSetMatchedSchedules={setMatchedSchedules}
            onPassengerCountChange={setPassengerCount}
          />
          <OrderList
            orderLists={matchedSchedules}
            passengerCount={passengerCount}
            onUpdateSchedule={handleUpdateSchedule}
            userDestination={end}
          />
          {/* order list float icon */}
          <img
            onClick={() => {
              setVisibleOrderList(true)
            }}
            className='passenger-float-icon'
            src={OrderIcon}
            alt="order list"
          />
        </DirectionsProvider>
      </APIProvider>

      {/* order list popup */}
      <Popup
        position='right'
        visible={visibleOrderList}
        destroyOnClose
        onClose={() => {
          setVisibleOrderList(false)
        }}
      >
        <div className='passenger-order-popup-content' style={{ height: '100vh', overflowY: 'scroll' }}>
          <PassengerOrderList onClose={() => setVisibleOrderList(false)} />
        </div>
      </Popup>
    </div>
  );
}