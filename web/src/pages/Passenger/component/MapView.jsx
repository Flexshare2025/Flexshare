import { useState, useEffect } from 'react'
import { Map, AdvancedMarker, useMapsLibrary } from '@vis.gl/react-google-maps'

export default function MapView({ position }) {
  const routesLibrary = useMapsLibrary('places')
  const [ready, setReady] = useState(false)

  // wait for the map library to load
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
      defaultCenter={position}
      defaultZoom={13}
      mapId="1"
      style={{ height: '400px', width: '100%' }}
      gestureHandling="greedy"
      zoomControl={false}
      streetViewControl={false}
      mapTypeControl={false}
      scaleControl={false}
      rotateControl={false}
      clickableIcons={false}
    >
      <AdvancedMarker position={position} />
    </Map>
  )
}