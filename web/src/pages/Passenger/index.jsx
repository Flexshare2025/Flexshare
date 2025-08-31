import { useState, useEffect, useRef } from 'react';
import { Image, List, Button, Dialog } from 'antd-mobile'
import { getCurrentPosition } from '@/utils/position';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
export default function App() {
  const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  // Get current location
  const [position, setPosition] = useState({ lat: 0, lng: 0 });
  useEffect(() => {
    getCurrentPosition().then(res => {
      setPosition({
        lat: res.latitude,
        lng: res.longitude
      });
    }).catch(error => {
      console.error('Error getting current position:', error);
    });
  }, []);
  const [orderLists, setOrderLists] = useState([{
    id: '1',
    avatar:
      'https://images.unsplash.com/photo-1548532928-b34e3be62fc6?ixlib=rb-1.2.1&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&ixid=eyJhcHBfaWQiOjE3Nzg0fQ',
    time: '2025-01-01 12:00',
    description: 'form home to city center',
    address: 'Waikato Hospital, Hamilton 3204, New Zealand',
    latitude: -37.8051742,
    longitude: 175.2810262,
    price: '5$'
  },
  {
    id: '2',
    avatar:
      'https://images.unsplash.com/photo-1493666438817-866a91353ca9?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9',
    time: '2025-01-01 2:00',
    description: 'form home to city center',
    address: '53 Boundary Road, Claudelands, Hamilton 3214, New Zealand',
    latitude: -37.774754,
    longitude: 175.2320289,
    price: '10$'
  },]
  )
  const handleBook = (item) => {
    Dialog.confirm({
      content: `Are you sure to book this order?`,
      confirmText: 'Book',
      cancelText: 'Cancel',
      onConfirm: () => {
        console.log('Order booked:', item);
      },
      onCancel: () => {
        console.log('Order booking cancelled');
      },
    });
  };
  return (
    <div style={{ width: '100%', height: '300px' }}>
      <APIProvider apiKey={KEY}>
        <Map
          center={position}
          defaultZoom={15}
          mapId="1"
        >
          <AdvancedMarker position={position} />
        </Map>
      </APIProvider>
      <List header='Order list'>
        {orderLists.map(list => (
          <List.Item
            key={list.id}
            prefix={
              <Image
                src={list.avatar}
                style={{ borderRadius: 20 }}
                fit='cover'
                width={40}
                height={40}
              />
            }
            description={list.description}
            extra={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                <Button color='primary' onClick={() => handleBook(list)}>
                  {list.price}
                </Button>
              </div>
            }
          >
            {list.time}
          </List.Item>
        ))}
      </List>
    </div>
  );
}
