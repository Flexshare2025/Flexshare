import { useState, useEffect } from 'react'
import { Map, AdvancedMarker, useMapsLibrary } from '@vis.gl/react-google-maps'

export default function MapView({ position, start, end }) {
  const routesLibrary = useMapsLibrary('places')
  const [ready, setReady] = useState(false)
  // wait for the map library to load
  useEffect(() => {
    if (routesLibrary) {
      setReady(true)
    }
  }, [routesLibrary])
  // Calculate map center based on available data
  const getMapCenter = () => {
    // Priority use current position
    if (position && typeof position.lat === 'number' && typeof position.lng === 'number' && position.lat !== 0 && position.lng !== 0) {
      return position
    }
    // If there is no current position, but there is a start point, use the start point
    if (start && typeof start.lat === 'number' && typeof start.lng === 'number') {
      return { lat: start.lat, lng: start.lng }
    }
    // no valid center available yet
    return null
  }
  const center = getMapCenter()
  if (!ready || !center) {
    // not show map, until get valid coordinates
    return null
  }
  return (
    <Map
      defaultCenter={center}
      defaultZoom={13}
      mapId="1"
      style={{ height: '300px', width: '100%' }}
      gestureHandling="greedy"
      zoomControl={false}
      streetViewControl={false}
      mapTypeControl={false}
      scaleControl={false}
      rotateControl={false}
      clickableIcons={false}
    >
      {/* Current location marker */}
      {position && typeof position.lat === 'number' && typeof position.lng === 'number' && position.lat !== 0 && position.lng !== 0 && (
        <AdvancedMarker
          position={position}
          title="Current Location"
        >
          <div style={{
            width: '20px',
            height: '20px',
            backgroundColor: '#4285F4', // Google blue
            border: '2px solid #FFFFFF', // white border
            borderRadius: '50%',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)', // shadow effect
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              backgroundColor: '#FFFFFF',
              borderRadius: '50%'
            }} />
          </div>
        </AdvancedMarker>
      )}
      {/* Start point marker (green) */}
      {start && (
        <AdvancedMarker
          position={{ lat: start.lat, lng: start.lng }}
          title="Start Point"
        >
          <div style={{
            width: '24px',
            height: '24px',
            backgroundColor: '#34A853', // Green
            border: '3px solid #FFFFFF', // white border
            borderRadius: '50%',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)', // shadow effect
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#FFFFFF'
          }}>
            S
          </div>
        </AdvancedMarker>
      )}
      {/* End point marker (blue) */}
      {end && (
        <AdvancedMarker
          position={{ lat: end.lat, lng: end.lng }}
          title="End Point"
        >
          <div style={{
            width: '24px',
            height: '24px',
            backgroundColor: '#1A73E8', // Blue
            border: '3px solid #FFFFFF', // white border
            borderRadius: '50%',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)', // shadow effect
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#FFFFFF'
          }}>
            E
          </div>
        </AdvancedMarker>
      )}
    </Map>
  )
}