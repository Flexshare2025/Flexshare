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
          componentRestrictions: { country: 'nz' } // Restrict to New Zealand
        });
      }

      autocompleteInstance?.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (place.geometry) {
          onPlaceSelect(place);
        } else {
          console.log("This location was not found");
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
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '16px 0' }}>
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
    </div>
  );
};

export default AddressSearch;