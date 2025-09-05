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
    if (start && end) {
      return {
        lat: (start.lat + end.lat) / 2,
        lng: (start.lng + end.lng) / 2
      }
    }
    return position
  }

  if (!ready) {
    return <div style={{ height: '400px', width: '100%', background: '#eee' }}>Loading Map...</div>
  }

  return (
    <Map
      defaultCenter={getMapCenter()}
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
      {/* Current Location Marker */}
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

      {/* Start Point Marker (Green) */}
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

      {/* End Point Marker (Blue) */}
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