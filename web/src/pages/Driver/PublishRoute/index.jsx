import { useEffect, useState, useRef } from 'react';
import { Loader } from "@googlemaps/js-api-loader";
import { generateRoutePoints } from './utils';
import { getCurrentPosition } from '@/utils/position';
import AddressSearch from '@/components/search-location';
import { DatePicker, Stepper, Button, Popup, Toast } from 'antd-mobile'
import { ClockCircleOutline, TeamOutline } from 'antd-mobile-icons';
import { formatDateTime } from '@/utils/common';
import RouteList from './components/RouteList';
import OrderIcon from '@/assets/order_icon.png';
import { publishSchedule } from '@/api/index.js';

import './index.scss';

export default function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const START_PONIT = 'start_point';
  const END_POINT = 'end_point';
  const [visible, setVisible] = useState(false)
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [passengerCount, setPassengerCount] = useState(4);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [visibleCloseRight, setVisibleCloseRight] = useState(false)
  const [routeSummary, setRouteSummary] = useState(null);
  const mapRef = useRef(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [points, setPoints] = useState([])

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
        });

        setDirectionsService(service);
        setDirectionsRenderer(renderer);

      });
    }).catch(error => {
      console.error('Error getting current position:', error);
    });
  }, [apiKey]);

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

  const GenerateRoute = () => {
    if (!startPoint || !endPoint || !date || !passengerCount) {
      console.error('Please fill in all required fields.');
      return;
    }
    console.log('Start Point:', startPoint);
    console.log('End Point:', endPoint);
    console.log('Leave Time:', date);
    console.log('Passenger Count:', passengerCount);

    console.log('Calculating route with start:', startPoint, 'end:', endPoint);
    if (!startPoint || !endPoint || !directionsService) {
      return;
    }

    setLoading(true);
    setRouteSummary(null);

    const request = {
      origin: startPoint,
      destination: endPoint,
      travelMode: window.google.maps.TravelMode.DRIVING,
    };

    console.log('Calculating route with request:', request);


    directionsService.route(request, (response, status) => {
      setLoading(false);

      if (status === 'OK') {
        const route = response.routes[0];
        if (route && route.legs && route.legs.length > 0) {
          setRouteSummary({
            distance: route.legs[0].distance.text,
            duration: route.legs[0].duration.text,
            summary: route.summary,
            overview_polyline: route.overview_polyline
          });


          const currentPoints = generateRoutePoints(route.overview_polyline, route.legs[0].distance.text);
          console.log('currentPoints', currentPoints);

          setPoints(currentPoints)
          // Convert route points to waypoints
          const waypoints = currentPoints.length > 2
            ? currentPoints.slice(1, -1).map(point => ({
              location: { lat: point.lat, lng: point.lng },
              stopover: true
            }))
            : [];

          console.log('currentPoints', currentPoints, 'waypoints', waypoints)
          directionsService.route({
            origin: startPoint,
            destination: endPoint,
            travelMode: window.google.maps.TravelMode.DRIVING,
            waypoints: waypoints?.length > 0 ? waypoints : undefined,
          }, (res, sta) => {
            if (sta === 'OK') {
              directionsRenderer.setDirections(res);
            }
          });
        }
      } else {
        setLoading(false);
      }

    });
  }

  const publishRoute = () => {
    if (!startPoint || !endPoint || !date || !passengerCount) {
      console.error('Please fill in all required fields.');
      return;
    }
    console.log('Start Point:', startPoint);
    console.log('End Point:', endPoint);
    console.log('Leave Time:', date);
    console.log('Passenger Count:', passengerCount);

    setLoading(true);
    publishSchedule({
      data: {
        "start_point": startPoint,
        "end_point": endPoint,
        "route_points": points,
        "stops": [],
        "departure_time": date + ':00',
        "available_seats": passengerCount,
      },
      success: res => {
        console.log('res', res);
        setLoading(false);
        if (res.code === '200') {
          Toast.show({
            icon: 'success',
            content: 'Success',
          })
          // clear form data
          setDate('');
        } else {
          Toast.show({
            icon: 'fail',
            content: res.msg,
          })
        }
      },
      fail: err => {
        setLoading(false);
        Toast.show({
          icon: 'fail',
          content: err?.msg,
        })
      }
    })



  }

  return (
    <>
      <div className='driver-map-container'>
        <div ref={mapRef} className='publish-map-container' />
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
              value={passengerCount}
              min={1}
              max={30}
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
            <div className='generate-wrap'>
              <Button className='submit-btn bottom-btn' type='submit' color='primary' size='large' onClick={GenerateRoute}>
                Generate Route
              </Button>
              <div className='driver-route-summary'>
                {routeSummary && (
                  <div>
                    <div>Distance: {routeSummary.distance}</div>
                    <div>Time: {routeSummary.duration}</div>
                    <div>Path: {routeSummary.summary}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          {routeSummary && startPoint && endPoint && date && (
            <Button loading={loading} className='submit-btn bottom-btn' block type='submit' color='primary' size='large' onClick={publishRoute}>
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
        destroyOnClose
        onClose={() => {
          setVisibleCloseRight(false)
        }}
      >
        <div className='driver-list-popup-content' style={{ height: '100vh', overflowY: 'scroll' }}
        >
          <RouteList />
        </div>
      </Popup>
    </>
  )
}