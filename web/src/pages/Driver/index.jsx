import AddressSearch from '@/components/search-location';

export default function App() {
  const handlePlaceSelect = (place) => {
    console.log('Selected location information:', place);
  };

  return (
    <div>
      <h2>address search</h2>
      <AddressSearch onPlaceSelect={handlePlaceSelect} />
    </div>
  );
}
