import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Loader } from "@googlemaps/js-api-loader";
import { generateRoutePoints } from './utils';
import { getCurrentPosition } from '@/utils/position';
import AddressSearch from '@/components/search-location';
import { DatePicker, Stepper, Button, Popup, Tabs } from 'antd-mobile'
import { ClockCircleOutline, TeamOutline } from 'antd-mobile-icons';
import { formatDateTime } from '@/utils/common';
import RouteList from './components/RouteList';
import UserOrderList from './components/UserOrderList';
import OrderIcon from '@/assets/order_icon.png';
import { publishSchedule } from '@/api/index.js';

import './index.scss';

export default function App() {
  const START_PONIT = 'start_point';
  const END_POINT = 'end_point';
  const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [visible, setVisible] = useState(false)
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [passengerCount, setPassengerCount] = useState(4);
  const [date, setDate] = useState('');
  const [position, setPosition] = useState({ lat: 0, lng: 0 });
  const [visibleCloseRight, setVisibleCloseRight] = useState(false)

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

    // todo 
    const loader = new Loader({
      apiKey: KEY,
      version: "weekly",
      libraries: ["places"],
    });

    loader.load().then(async () => {
      const google = window.google;


      const directionsService = new google.maps.DirectionsService();

      const result = await directionsService.route({
        origin: startPoint,
        destination: endPoint,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      if (result.routes.length > 0) {
        const route = result.routes[0];
        const polylineStr = route.overview_polyline;
        const points = generateRoutePoints(polylineStr, 500);
        console.log('Generated Route Points:', points);

        publishSchedule({
          data: {
            "start_point": startPoint,
            "end_point": endPoint,
            "route_points": points,
            "stops": [],
            "departure_time": date,
            "available_seats": passengerCount,
          },
          success: res => {
            console.log('res', res);
          }
        })
      } else {
        console.error('No routes found');
      }
    }).catch(e => {
      console.error('Error loading Google Maps:', e);
    });

  }

  return (
    <>
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
              defaultValue={4}
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
          )}
        </div>
        <img
          onClick={() => {
            setVisibleCloseRight(true)
          }}
          className='driver-float-icon' src={OrderIcon} alt="" />
      </div>
      <Popup
        position='right'
        visible={visibleCloseRight}
        showCloseButton
        onClose={() => {
          setVisibleCloseRight(false)
        }}
      >
        <div className='driver-list-popup-content'>
          <Tabs defaultActiveKey={'routes'}>
            <Tabs.Tab title='Publish Routes' key='routes'>
              <RouteList />
            </Tabs.Tab>
            <Tabs.Tab title='User Orders' key='user'>
              <UserOrderList />
            </Tabs.Tab>
          </Tabs>
        </div>
      </Popup>
    </>
  )
}