import { useState, useContext, useEffect } from 'react';
import { Button } from 'antd-mobile';
import AddressSearch from '@/components/search-location';
import { DirectionsContext } from './DirectionsProvider';
import FullscreenIcon from '@/assets/fullscreen.png';

export default function ControlPanel({
  onPlaceSelect,
  onCalculateRoute,
  start,
  end,
  loading,
  routeSummary,
  error,
  onFullscreen
}) {
  const START_PONIT = 'start_point';
  const END_POINT = 'end_point';
  const { handleBook } = useContext(DirectionsContext);

  const handlePlaceSelect = (type, place) => {
    console.log('Selected location information:', place);
    const { formatted_address, geometry } = place;

    const address = formatted_address;
    const lat = geometry.location.lat();
    const lng = geometry.location.lng();

    console.log('Address:', address, 'Latitude:', lat, 'Longitude:', lng);

    if (type === START_PONIT) {
      onPlaceSelect({ address, lat, lng }, 'start');
    } else if (type === END_POINT) {
      onPlaceSelect({ address, lat, lng }, 'end');
    }
  };

  const calculateRoute = () => {
    onCalculateRoute();
  };

  return (
    <div className='driver-rode-search-container'>
      <AddressSearch
        onPlaceSelect={v => handlePlaceSelect(START_PONIT, v)}
        placeholder="Pickup location"
        defaultValue={start ? start.address : ''}
      />
      <AddressSearch
        onPlaceSelect={v => handlePlaceSelect(END_POINT, v)}
        placeholder='Drop location'
        defaultValue={end ? end.address : ''}
      />
      <div className='driver-rode-action-bar'>
        <Button
          onClick={calculateRoute}
          color='primary'
          fill='solid'
          loading={loading}
          disabled={loading || !start || !end}
          className='driver-rode-navigate-button'
        >
          Navigate
        </Button>
        <div className='driver-route-summary'>
          {routeSummary && (
            <div>
              <div>Distance: {routeSummary.distance}</div>
              <div>Time: {routeSummary.duration}</div>
              <div>Path: {routeSummary.summary}</div>
            </div>
          )}
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {routeSummary && <img
            className='fullscreen-icon'
            src={FullscreenIcon}
            alt=""
            onClick={onFullscreen}
          />}
        </div>
      </div>
    </div>
  );
}