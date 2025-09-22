import { useState, useEffect, useCallback } from 'react';
import { getCurrentPosition } from '@/utils/position';

const UserLocationTracker = ({
  map,
  zIndex = 1000,
  markerSize = { width: 36, height: 36 },
  followUser = false,
  useSharedLocation = false,
  sharedLocation = null
}) => {
  const [userMarker, setUserMarker] = useState(null);
  const [_watchId, setWatchId] = useState(null);
  const [_error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  const updateUserMarker = useCallback((position) => {
    if (!map || !window.google) {
      console.log('UserLocationTracker: Map or Google Maps not ready');
      return;
    }

    const newPosition = {
      lat: position.lat,
      lng: position.lng
    };

    console.log('UserLocationTracker: Updating marker position:', newPosition);

    if (userMarker) {
      userMarker.setPosition(newPosition);
      console.log('UserLocationTracker: Updated existing marker');
    } else {
      console.log('UserLocationTracker: Creating new marker');
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
      console.log('UserLocationTracker: Marker created successfully');
    }

    if (followUser) {
      map.setCenter(newPosition);
      console.log('UserLocationTracker: Map center updated');
    }
  }, [map, userMarker, markerSize.width, markerSize.height, zIndex, followUser]);

  useEffect(() => {
    console.log('UserLocationTracker: Shared location effect triggered', {
      useSharedLocation,
      sharedLocation,
      map: !!map,
      lastUpdateTime
    });

    if (useSharedLocation && sharedLocation && map) {
      const now = Date.now();
      if (now - lastUpdateTime > 2000) {
        console.log('UserLocationTracker: Updating marker with shared location');
        updateUserMarker(sharedLocation);
        setLastUpdateTime(now);
      } else {
        console.log('UserLocationTracker: Skipping update due to debounce');
      }
    }
  }, [useSharedLocation, sharedLocation, map, updateUserMarker, lastUpdateTime]);

  useEffect(() => {
    if (useSharedLocation || !map || !window.google) return;

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
        enableHighAccuracy: false,
        maximumAge: 10000,
        timeout: 10000
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
  }, [map, updateUserMarker, useSharedLocation, userMarker]);

  return null;
};

export default UserLocationTracker;
