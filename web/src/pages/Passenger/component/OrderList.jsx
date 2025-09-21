import { useContext, useState } from 'react';
import { Image, List, Button, Modal } from 'antd-mobile';
import { DirectionsContext } from './DirectionsProvider';
import { bookSchedule } from '@/api/index';

export default function OrderList({ orderLists, passengerCount, onUpdateSchedule, userDestination, userPosition }) {
  const { calculateRouteBetween } = useContext(DirectionsContext);
  // ensure orderLists is an array
  const schedules = Array.isArray(orderLists) ? orderLists : [];
  // State to track loading status for each schedule
  const [loadingStates, setLoadingStates] = useState({});
  // handle show route
  const handleShowRoute = async (schedule) => {
    try {
      // use calculateRouteBetween function in DirectionsContext
      const origin = {
        lat: schedule.start_point.lat,
        lng: schedule.start_point.lng
      };
      const destination = {
        lat: schedule.end_point.lat,
        lng: schedule.end_point.lng
      };
      // if there are route points, can be used as waypoints
      const waypoints = schedule.route_points && schedule.route_points.length > 2
        ? schedule.route_points.slice(1, -1).map(point => ({
          location: { lat: point.lat, lng: point.lng },
          stopover: true
        }))
        : [];
      const routeResult = await calculateRouteBetween(origin, destination, waypoints);
      // Scroll to top immediately after route is calculated and displayed
      setTimeout(() => {
        // Try multiple methods to ensure scrolling works
        if (window.scrollTo) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Fallback for older browsers
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
      }, 100);

      // show route information
      const km = (routeResult.totalDistanceMeters / 1000).toFixed(2);
      const minutes = Math.round(routeResult.totalDurationSeconds / 60);
      const eta = routeResult.etaDate.toLocaleTimeString();
      // show user friendly prompt
      Modal.alert({
        title: 'Route shown',
        content: `Distance: ${km} km\nExpected time: ${minutes} minutes\nExpected arrival time: ${eta}`,
        confirmText: 'Confirm',
        onConfirm: () => {
          // Route shown prompt confirmed
        },
      });
    } catch (error) {
    }
  };
  const renderAvatar = (avatar) => {
    // if avatar is a color, show a div with the color
    if (avatar && avatar.startsWith('#')) {
      return (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: avatar,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold'
          }}
        >
          D
        </div>
      );
    }
    // else show image
    return (
      <Image
        src={avatar}
        style={{ borderRadius: 20 }}
        fit="cover"
        width={40}
        height={40}
      />
    );
  };
  // calculate distance between two points (using Haversine formula)
  const calculateDistanceBetweenPoints = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  // find the nearest point on the route to the user's current location
  const findNearestPoint = (userLat, userLng, routePoints) => {
    if (!routePoints || routePoints.length === 0) {
      return null;
    }
    // try to get latitude and longitude, support multiple data structures
    let getLatLng = (point) => {
      // try lat/lng format
      if (point.lat !== undefined && point.lng !== undefined) {
        return { lat: point.lat, lng: point.lng };
      }
      // try latitude/longitude format
      if (point.latitude !== undefined && point.longitude !== undefined) {
        return { lat: point.latitude, lng: point.longitude };
      }
      // try other possible formats
      if (point.x !== undefined && point.y !== undefined) {
        return { lat: point.x, lng: point.y };
      }
      return null;
    };
    let nearestPoint = null;
    let minDistance = Infinity;
    let nearestPointIndex = -1;
    for (let i = 0; i < routePoints.length; i++) {
      const point = routePoints[i];
      const coordinates = getLatLng(point);
      if (!coordinates) {
        continue;
      }
      const distance = calculateDistanceBetweenPoints(userLat, userLng, coordinates.lat, coordinates.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
        nearestPointIndex = i;
      }
    }
    if (!nearestPoint) {
      return null;
    }
    // Generate point identifier (A, B, C, D, etc.)
    const getPointIdentifier = (index) => {
      return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
    };
    // Add point information
    const pointInfo = {
      ...nearestPoint,
      identifier: getPointIdentifier(nearestPointIndex),
      position: nearestPointIndex + 1,
      totalPoints: routePoints.length
    };
    return {
      point: pointInfo,
      distance: minDistance
    };
  };
  // handle booking
  const handleBookClick = async (schedule) => {
    try {
      // Set loading state for this schedule
      setLoadingStates(prev => ({
        ...prev,
        [schedule.schedule_id]: true
      }));
      // use user position from props (already calculated in parent component)
      if (!userPosition || !userPosition.lat || !userPosition.lng) {
        throw new Error('User position not available');
      }

      // find the nearest pickup point on the route to the user's current location
      const nearestPickupPointInfo = findNearestPoint(
        userPosition.lat,
        userPosition.lng,
        schedule.route_points || []
      );

      // find the nearest dropoff point on the route to the user's destination
      const destinationCoords = userDestination || schedule.end_point;
      const nearestDropoffPointInfo = findNearestPoint(
        destinationCoords.lat,
        destinationCoords.lng,
        schedule.route_points || []
      );

      // prepare stops array with both pickup and dropoff points
      const stops = [];
      if (nearestPickupPointInfo) {
        stops.push({
          ...nearestPickupPointInfo.point,
          type: 'pickup'
        });
      }
      if (nearestDropoffPointInfo) {
        stops.push({
          ...nearestDropoffPointInfo.point,
          type: 'dropoff'
        });
      }

      // prepare data to pass to the backend
      const bookingData = {
        schedule_id: schedule.schedule_id,
        stops: stops,
        departure_time: schedule.departure_time,
        num_passenger: passengerCount || 1, // default 1 seat
        user_location: {
          lat: userPosition.lat,
          lng: userPosition.lng
        },
        pickup_point_distance: nearestPickupPointInfo ? nearestPickupPointInfo.distance.toFixed(2) : null,
        dropoff_point_distance: nearestDropoffPointInfo ? nearestDropoffPointInfo.distance.toFixed(2) : null
      };
      // call bookSchedule API
      const result = await bookSchedule({
        data: bookingData,
        success: (result) => {
          if (result.code == '200') {
            // Update the schedule with new available seats from backend response
            if (result.data && onUpdateSchedule) {
              onUpdateSchedule(schedule.schedule_id, result.data.available_seats);
            }
            Modal.alert({
              title: '🎉 Booking Successful!',
              content: (
                <div style={{
                  lineHeight: '1.8',
                  fontSize: 14,
                  padding: '10px 0',
                  textAlign: 'left'
                }}>
                  <div style={{
                    backgroundColor: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', color: '#52c41a', fontWeight: 'bold' }}>
                      ✅ Your trip has been successfully booked
                    </p>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#666', marginRight: '8px' }}>🚗</span>
                    <strong>Route:</strong>
                    <div style={{ marginLeft: '20px', fontSize: '13px', color: '#333' }}>
                      {schedule.start_point?.address || 'N/A'} → {schedule.end_point?.address || 'N/A'}
                    </div>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#666', marginRight: '8px' }}>⏰</span>
                    <strong>Departure Time:</strong>
                    <span style={{ marginLeft: '8px', color: '#1890ff' }}>
                      {formatTime(schedule.departure_time)}
                    </span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#666', marginRight: '8px' }}>👥</span>
                    <strong>Passengers:</strong>
                    <span style={{ marginLeft: '8px', color: '#1890ff' }}>
                      {passengerCount || 1}
                    </span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#666', marginRight: '8px' }}>📍</span>
                    <strong>Pickup Point: Point {nearestPickupPointInfo?.point.identifier || 'N/A'}</strong>
                    <span style={{ marginLeft: '8px', color: '#fa8c16', fontWeight: 'bold' }}>
                      ({nearestPickupPointInfo ? `${nearestPickupPointInfo.distance.toFixed(2)} km` : 'N/A'} away)
                    </span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#666', marginRight: '8px' }}>🏁</span>
                    <strong>Dropoff Point: Point {nearestDropoffPointInfo?.point.identifier || 'N/A'}</strong>
                    <span style={{ marginLeft: '8px', color: '#fa8c16', fontWeight: 'bold' }}>
                      ({nearestDropoffPointInfo ? `${nearestDropoffPointInfo.distance.toFixed(2)} km` : 'N/A'} away)
                    </span>
                  </div>
                  <div style={{
                    backgroundColor: '#fff7e6',
                    border: '1px solid #ffd591',
                    borderRadius: '6px',
                    padding: '8px',
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#d46b08'
                  }}>
                    💡 Please arrive at the pickup point on time. Have a great trip!
                  </div>
                </div>
              ),
              confirmText: 'OK',
              onConfirm: () => {
                // user confirmed the booking success message
                // data has already been updated above
                // Clear loading state
                setLoadingStates(prev => ({
                  ...prev,
                  [schedule.schedule_id]: false
                }));
              }
            });
          }
          else {
            // Clear loading state
            setLoadingStates(prev => ({
              ...prev,
              [schedule.schedule_id]: false
            }));
            Modal.alert({
              title: 'Booking Failed',
              content: `Booking failed: ${result.msg}`,
              confirmText: 'OK'
            });
          }
        },
        fail: (error) => {
          // Clear loading state
          setLoadingStates(prev => ({
            ...prev,
            [schedule.schedule_id]: false
          }));
          Modal.alert({
            title: 'Booking Failed',
            content: `Booking failed: ${error}`,
            confirmText: 'OK'
          });
        },
      });

    } catch (error) {
      // Clear loading state
      setLoadingStates(prev => ({
        ...prev,
        [schedule.schedule_id]: false
      }));
      Modal.alert({
        title: 'Booking Error',
        content: `Booking failed: ${error.message}`,
        confirmText: 'OK'
      });
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const date = new Date(timeString);
    return date.toLocaleString('en-NZ', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const calculateDistance = (routePoints) => {
    if (!routePoints || routePoints.length < 2) return 'N/A';
    let totalDistance = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
      const lat1 = routePoints[i].lat;
      const lng1 = routePoints[i].lng;
      const lat2 = routePoints[i + 1].lat;
      const lng2 = routePoints[i + 1].lng;
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    // Only show distance, no route points information
    return `${totalDistance.toFixed(1)} km`;
  };
  return (
    <List header="Available Routes">
      {schedules && schedules.length > 0 ? (
        schedules.map(schedule => (
          <List.Item
            key={schedule.schedule_id}
            prefix={renderAvatar('#1677ff')}
            description={
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                  <strong>From:</strong> {schedule.start_point?.address || 'N/A'}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                  <strong>To:</strong> {schedule.end_point?.address || 'N/A'}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                  <strong>Route:</strong> {calculateDistance(schedule.route_points)}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                  <strong>Available Seats:</strong> {schedule.available_seats || 0}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button
                    size="mini"
                    color="primary"
                    onClick={() => handleShowRoute(schedule)}
                  >
                    Show Route
                  </Button>
                  <Button
                    size="mini"
                    color="success"
                    loading={loadingStates[schedule.schedule_id] || false}
                    onClick={() => handleBookClick(schedule)}
                  >
                    Book
                  </Button>
                </div>
              </div>
            }
          >
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
              {formatTime(schedule.departure_time)}
            </div>
          </List.Item>
        ))
      ) : (
        <List.Item>
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
            No available routes found
          </div>
        </List.Item>
      )}
    </List>
  );
}