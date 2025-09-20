import { useState, useEffect, useCallback } from 'react';

const UserLocationTracker = ({ map, zIndex = 1000, markerSize = { width: 48, height: 48 }, followUser = false }) => {
  const [userMarker, setUserMarker] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [error, setError] = useState(null);

  const updateUserMarker = useCallback((position) => {
    if (!map) return;

    const newPosition = {
      lat: position.lat,
      lng: position.lng
    };

    setUserPosition(newPosition);

    if (userMarker) {
      userMarker.setPosition(newPosition);
    } else {
      const marker = new window.google.maps.Marker({
        position: newPosition,
        map: map,
        title: "Your Position",
        icon: {
          url: 'https://527flexshare.s3.us-east-1.amazonaws.com/position-fill.png',
          scaledSize: new window.google.maps.Size(markerSize.width, markerSize.height),
        },
        zIndex: zIndex
      });
      setUserMarker(marker);
    }

    if (followUser) {
      map.setCenter(newPosition);
    }
  }, [map, userMarker, markerSize, zIndex, followUser]);

  useEffect(() => {
    if (!map || !window.google) return;

    if (!navigator.geolocation) {
      setError("cannot support geolocation");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateUserMarker({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (err) => {
        setError(`error: ${err.message}`);
        console.error("error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    const id = navigator.geolocation.watchPosition(
      (position) => {
        updateUserMarker({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (err) => {
        setError(`error: ${err.message}`);
        console.error("error:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );

    setWatchId(id);

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (userMarker) {
        userMarker.setMap(null);
        setUserMarker(null);
      }
    };
  }, [map, updateUserMarker]);

  return null;
};

export default UserLocationTracker;
