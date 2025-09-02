import { useState, useEffect } from 'react'
import { Map, AdvancedMarker, useMapsLibrary } from '@vis.gl/react-google-maps'

export default function MapView({ position }) {
  const routesLibrary = useMapsLibrary('places') // 或者 'routes'，取决你需要的功能
  const [ready, setReady] = useState(false)

  // 等地图库加载完成再显示地图
  useEffect(() => {
    if (routesLibrary) {
      setReady(true)
    }
  }, [routesLibrary])

  if (!ready) {
    return <div style={{ height: '400px', width: '100%', background: '#eee' }}>Loading Map...</div>
  }

  return (
    <Map
      center={position}
      defaultZoom={13}
      mapId="1"
      style={{ height: '400px', width: '100%' }}
      options={{
        gestureHandling: 'greedy',
        draggable: true,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false
      }}
    >
      <AdvancedMarker position={position} />
    </Map>
  )
}