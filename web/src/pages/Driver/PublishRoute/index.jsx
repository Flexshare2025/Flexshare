import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { getCurrentPosition } from '@/utils/position';
import AddressSearch from '@/components/search-location';
import { DatePicker, Stepper, Button } from 'antd-mobile'
import { ClockCircleOutline, TeamOutline } from 'antd-mobile-icons';
import { formatDateTime } from '@/utils/common';

import './index.scss';

export default function App() {
  const START_PONIT = 'start_point';
  const END_POINT = 'end_point';
  const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [visible, setVisible] = useState(false)
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [date, setDate] = useState('');
  const [position, setPosition] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    getCurrentPosition().then(res => {
      console.log('Current position:', res);
      setPosition({
        lat: res.latitude,
        lng: res.longitude
      });
    }).catch(error => {
      console.error('Error getting current position:', error);
    });
  }, []);

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

  const publishRoute = () => {
    if (!startPoint || !endPoint || !date) {
      console.error('Please fill in all required fields.');
      return;
    }
    console.log('Start Point:', startPoint);
    console.log('End Point:', endPoint);
    console.log('Leave Time:', date);
    console.log('Passenger Count:', passengerCount);
  }

  return (
    <div className='driver-map-container'>
      <APIProvider apiKey={KEY}>
        <Map
          center={position}
          defaultZoom={15}
          mapId="1"
          options={{
            fullscreenControl: false,
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            scaleControl: false,
            panControl: false,
            rotateControl: false
          }}
        // onCameraChanged={(ev) =>
        //   console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
        // }
        >
          <AdvancedMarker position={position} />
        </Map>
      </APIProvider>
      <div className='driver-map-search'>
        <div className='item-flex'>
          <span className='item-icon green' />
          <AddressSearch
            onPlaceSelect={v => handlePlaceSelect(START_PONIT, v)}
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
          <Stepper
            defaultValue={1}
            min={1}
            max={4}
            style={{
              '--border': '1px solid #f5f5f5',
              '--border-inner': 'none',
              '--height': '36px',
              '--input-width': '40px',
              '--input-background-color': 'var(--adm-color-background)',
              '--active-border': '1px solid #1677ff',
              '--input-font-size': '18px',
            }}
            onChange={value => setPassengerCount(value)}
          />
        </div>
        {startPoint && endPoint && date && (
          <Button className='submit-btn bottom-btn' block type='submit' color='primary' size='large' onClick={publishRoute}>
            Submit
          </Button>
        )
        }
      </div>

    </div>
  )
}
