import { useState, useEffect, createContext, useContext } from 'react';
import { Image, List, Button, Dialog } from 'antd-mobile';
import { getCurrentPosition } from '@/utils/position';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const DirectionsContext = createContext(null);

export default function App() {
  const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const [position, setPosition] = useState({ lat: 0, lng: 0 });
  useEffect(() => {
    getCurrentPosition()
      .then(res => {
        setPosition({
          lat: res.latitude,
          lng: res.longitude
        });
      })
      .catch(error => {
        console.error('Error getting current position:', error);
      });
  }, []);

  const [orderLists] = useState([
    //mock data
    {
      id: '1',
      avatar:
        'https://images.unsplash.com/photo-1548532928-b34e3be62fc6?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
      time: '2025-01-01 12:00',
      start: '53 boundary road',
      end: 'the base shopping center',
      routPoints: [
        { latitude: -37.775033246987796, longitude: 175.28347354539358 },
        { latitude: -37.7473964, longitude: 175.2320289 }
      ],
      stops: [{ latitude: -37.7798687, longitude: 175.2728966 }],
      price: '5$'
    }
  ]);

  return (
    <div style={{ width: '100%', height: '100vh', }}>
      <APIProvider apiKey={KEY}>
        <DirectionsHandler>
          <Map center={position}
            defaultZoom={13}
            mapId="1"
            style={{ height: '400px', width: '100%', }}
            options={{
              gestureHandling: 'greedy', // ✅ Allows one-finger dragging and two-finger zooming
              draggable: true, // Explicitly enable dragging
              zoomControl: true,          // Show Zoom Controls
              streetViewControl: false,   // Hide Street View Control
              mapTypeControl: false,      // Hide Map Type Control
              fullscreenControl: false    // Hide Fullscreen Control
            }}
          >
            <AdvancedMarker position={position} />
          </Map>
          {/* UserList */}
          <OrderList orderLists={orderLists} />
        </DirectionsHandler>
      </APIProvider>
    </div>
  );
}

// DirectionsHandler is responsible for initializing the Directions API and exposing handleBook via Context
function DirectionsHandler({ children }) {
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

  // Methods of calculating routes
  const handleBook = (item) => {
    if (!directionsService || !directionsRenderer) return;
    // Define origin, destination, and waypoints
    const origin = {
      lat: item.routPoints[0].latitude,
      lng: item.routPoints[0].longitude
    };
    // destination is the last point in routPoints
    const destination = {
      lat: item.routPoints[item.routPoints.length - 1].latitude,
      lng: item.routPoints[item.routPoints.length - 1].longitude
    };
    // waypoints are the stops in between
    const waypoints = item.stops.map(stop => ({
      location: { lat: stop.latitude, lng: stop.longitude },
      stopover: true
    }));
    // Request directions
    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        //get result, in the  rotes array of the legs array, each leg has distance and duration
        console.log("🚀 --- result:", result)
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          // Calculate total distance and duration
          const route = result.routes[0].legs;
          let totalDistance = 0;
          let totalDuration = 0;
          route.forEach(leg => {
            totalDistance += leg.distance.value; // meter (classifier)
            totalDuration += leg.duration.value; // seconds
          });
          //calculate km, minutes, and eta
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
                content: '✅ Ride booked successfully!\nHave a safe trip!'
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

  return (
    <DirectionsContext.Provider value={{ handleBook }}>
      {children}
    </DirectionsContext.Provider>
  );
}

// OrderList component to display list of orders
function OrderList({ orderLists }) {
  const { handleBook } = useContext(DirectionsContext);
  return (
    <List header="Order list">
      {orderLists.map(list => (
        <List.Item
          key={list.id}
          prefix={
            <Image
              src={list.avatar}
              style={{ borderRadius: 20 }}
              fit="cover"
              width={40}
              height={40}
            />
          }
          description={`${list.start} -> ${list.end}`}
          extra={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Button color="primary" onClick={() => handleBook(list)}>
                {list.price}-Book
              </Button>
            </div>
          }
        >
          {list.time}
        </List.Item>
      ))}
    </List>
  );
}