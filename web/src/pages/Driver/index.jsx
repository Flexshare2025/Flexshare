import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { getCurrentPosition } from '@/utils/position';

import './index.css';

export default function App() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [position, setPosition] = useState({lat: 0, lng: 0 });

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


  return (
    <div className='driver-map-container'>
      <APIProvider apiKey={key}>
        <Map
          defaultCenter={position}
          defaultZoom={10}
          mapId="1"
          onCameraChanged={(ev) =>
            console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
          }
        >
          <AdvancedMarker position={position} />
        </Map>
      </APIProvider>
    </div>
  )
}
