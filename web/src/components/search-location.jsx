import { useRef, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const AddressSearch = ({ onPlaceSelect, placeholder = '', defaultValue = '' }) => {
  const searchInputRef = useRef(null);
  const [autocomplete, setAutocomplete] = useState(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"]
    });

    loader.load().then(() => {
      let autocompleteInstance = null;
      if (searchInputRef.current) {
        autocompleteInstance = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          types: ['geocode'],
          componentRestrictions: { country: 'nz' }, // Restrict to New Zealand
          fields: ['formatted_address', 'geometry', 'name'], // Specify fields to return
          strictBounds: false, // Allow some flexibility in search
          bounds: new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(-47.0, 166.0), // Southwest corner of NZ
            new window.google.maps.LatLng(-34.0, 179.0)  // Northeast corner of NZ
          )
        });
      }

      autocompleteInstance?.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        console.log('[AddressSearch] Place selected:', place);

        if (place.geometry && place.geometry.location) {
          // Transform the data to match the expected format
          const placeData = {
            formatted_address: place.formatted_address || place.name || '',
            geometry: {
              location: {
                lat: () => place.geometry.location.lat(),
                lng: () => place.geometry.location.lng(),
              }
            }
          };

          console.log('[AddressSearch] Transformed place data:', placeData);
          onPlaceSelect(placeData);

          // Set the input value to keep the selected address visible
          if (searchInputRef.current) {
            searchInputRef.current.value = placeData.formatted_address;
          }
        } else {
          console.log("[AddressSearch] This location was not found or has no geometry");
        }
      });

      setAutocomplete(autocompleteInstance);
    });

    return () => {
      if (autocomplete) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [onPlaceSelect]);

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <input
        ref={searchInputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder || "input address"}
        style={{
          width: '100%',
          maxWidth: 1000,
          padding: '12px 16px',
          borderRadius: 8,
          border: '1px solid #ccc',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          fontSize: 18,
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = '#646cff')}
        onBlur={e => (e.currentTarget.style.borderColor = '#ccc')}
      />
      {/*  CSS for Google Places Autocomplete dropdown */}
      <style>
        {`
          .pac-container {
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
            border: 1px solid rgba(0, 0, 0, 0.08) !important;
            margin-top: 4px !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
          .pac-item {
            padding: 12px 16px !important;
            border: none !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            font-size: 16px !important;
            line-height: 1.4 !important;
          }
          .pac-item:last-child {
            border-bottom: none !important;
            border-radius: 0 0 12px 12px !important;
          }
          .pac-item:hover {
            background-color: #f8f9ff !important;
            transform: translateX(4px) !important;
          }
          .pac-item-query {
            font-weight: 600 !important;
            color: #2c3e50 !important;
            margin-bottom: 4px !important;
          }
          .pac-item-query:hover {
            color: #646cff !important;
          }
          .pac-matched {
            font-weight: 600 !important;
            color: #646cff !important;
            background-color: rgba(100, 108, 255, 0.1) !important;
            padding: 2px 4px !important;
            border-radius: 4px !important;
          }
          .pac-icon {
            margin-right: 12px !important;
            color: #646cff !important;
            font-size: 18px !important;
          }
          .pac-container::-webkit-scrollbar {
            width: 8px !important;
          }
          .pac-container::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05) !important;
            border-radius: 4px !important;
          }
          .pac-container::-webkit-scrollbar-thumb {
            background: rgba(100, 108, 255, 0.3) !important;
            border-radius: 4px !important;
          }
          .pac-container::-webkit-scrollbar-thumb:hover {
            background: rgba(100, 108, 255, 0.5) !important;
          }
          .pac-container {
            animation: slideDown 0.2s ease-out !important;
          }
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          input:focus + .pac-container {
            border-color: #646cff !important;
            box-shadow: 0 8px 32px rgba(100, 108, 255, 0.15) !important;
          }
        `}
      </style>
    </div>
  );
};

export default AddressSearch;