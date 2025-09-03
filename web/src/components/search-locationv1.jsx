import { useRef, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const AddressSearch = ({ onPlaceSelect, placeholder = '', defaultValue = '' }) => {
  const containerRef = useRef(null);
  const initializedRef = useRef(false);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const placeholderRef = useRef(placeholder);
  const defaultValueRef = useRef(defaultValue);

  // Update refs when props change
  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
    placeholderRef.current = placeholder;
    defaultValueRef.current = defaultValue;

  }, [onPlaceSelect, placeholder, defaultValue]);
  useEffect(() => {
    // initialize if not already done
    if (initializedRef.current) {
      console.log('[AddressSearch] Already initialized, skipping...');
      return;
    }
    console.log('[AddressSearch] Starting initialization...');
    const initMap = async () => {
      try {
        // request needed libraries
        await window.google.maps.importLibrary("places");
        if (!containerRef.current) {
          console.log('[AddressSearch] Container ref not available, aborting');
          return;
        }
        // create the input HTML element
        const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement();
        // create and style a slotted input
        const inputEl = document.createElement('input');
        inputEl.setAttribute('slot', 'input');
        inputEl.type = 'text';
        inputEl.placeholder = placeholderRef.current || 'input address';
        if (typeof defaultValueRef.current === 'string') inputEl.value = defaultValueRef.current;
        Object.assign(inputEl.style, {
          width: '100%',
          maxWidth: '1000px',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          fontSize: '18px',
          outline: 'none',
          transition: 'border-color 0.2s',
        });
        inputEl.onfocus = (e) => { e.currentTarget.style.borderColor = '#646cff'; };
        inputEl.onblur = (e) => { e.currentTarget.style.borderColor = '#ccc'; };
        // add the gmp-select listener
        placeAutocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
          try {
            const place = placePrediction.toPlace();
            await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
            const json = place.toJSON();
            console.log('[AddressSearch] place JSON:', json);
            const formatted_address = json.formattedAddress || json.displayName || '';
            const location = json.location;
            // handle the actual data format: location.lat and location.lng are direct values
            if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
              const lat = location.lat;
              const lng = location.lng;
              console.log('[AddressSearch] coordinates:', { lat, lng });
              const placeData = {
                formatted_address,
                geometry: {
                  location: {
                    lat: () => lat,
                    lng: () => lng,
                  }
                }
              };
              onPlaceSelectRef.current(placeData);
              // try to set the value on the Google component's internal input
              try {
                // Find the internal input field within the Google component
                const internalInput = placeAutocomplete.querySelector('input[aria-autocomplete="list"]');
                if (internalInput) {
                  internalInput.value = formatted_address;
                  console.log('[AddressSearch] Set internal input value:', formatted_address);
                  // Also set our slotted input
                  inputEl.value = formatted_address;
                  // Trigger events to ensure the value is recognized
                  internalInput.dispatchEvent(new Event('input', { bubbles: true }));
                  inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                }
              } catch (err) {
                console.warn('Could not set internal input value:', err);
              }
            } else {
              console.log('[AddressSearch] No valid location found, location:', location);
            }
          } catch (err) {
            console.error('Error processing place:', err);
          }
        });
        // Clear container and append
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(placeAutocomplete);
        placeAutocomplete.appendChild(inputEl);
        // Mark as initialized
        initializedRef.current = true;
        console.log('[AddressSearch] Successfully initialized, set initializedRef.current = true');

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };
    // Load Google Maps API first, then init
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places']
    });
    loader.load().then(() => {
      console.log('[AddressSearch] Google Maps API loaded, calling initMap');
      initMap();
    });
    // Cleanup function
    return () => {
      console.log('[AddressSearch] Cleanup: resetting initializedRef.current to false');
      initializedRef.current = false;
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div ref={containerRef} style={{ width: '100%', maxWidth: 1000, margin: '16px auto' }} />
  );
};

export default AddressSearch;