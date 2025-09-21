import { useState, useEffect, useCallback } from 'react';
import { getCurrentPosition } from '@/utils/position';

const UserLocationTracker = ({
  map,
  zIndex = 1000,
  markerSize = { width: 36, height: 36 },
  followUser = false
}) => {
  const [userMarker, setUserMarker] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [error, setError] = useState(null);

  const updateUserMarker = useCallback((position) => {
    if (!map || !window.google) return;

    const newPosition = {
      lat: position.lat,
      lng: position.lng
    };

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
  }, [map, userMarker, markerSize.width, markerSize.height, zIndex, followUser]);

  useEffect(() => {
    if (!map || !window.google) return;

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    let currentWatchId = null;

    const fetchInitialPosition = async () => {
      try {
        const res = await getCurrentPosition();
        const initialLocation = {
          lat: res.latitude,
          lng: res.longitude
        };
        updateUserMarker(initialLocation);
      } catch (err) {
        setError(`Error getting initial position: ${err.message}`);
        console.error("Initial position error:", err);
      }
    };

    fetchInitialPosition();

    currentWatchId = navigator.geolocation.watchPosition(
      (position) => {
        updateUserMarker({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (err) => {
        setError(`Error tracking position: ${err.message}`);
        console.error("Position tracking error:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );

    setWatchId(currentWatchId);

    return () => {
      if (currentWatchId) {
        navigator.geolocation.clearWatch(currentWatchId);
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
