import AddressSearch from '../../components/search-location';

export default function App() {
  const handlePlaceSelect = (place) => {
    console.log('选中的地点信息:', place);
    // 你可以在这里处理 place，比如显示在地图上
  };

  return (
    <div>
      <h2>地址检索</h2>
      <AddressSearch onPlaceSelect={handlePlaceSelect} />
    </div>
  );
}
