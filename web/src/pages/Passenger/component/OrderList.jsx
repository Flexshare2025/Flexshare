import { useContext } from 'react';
import { Image, List, Button } from 'antd-mobile';
import { DirectionsContext } from './DirectionsProvider';

export default function OrderList({ orderLists }) {
  const { handleBook } = useContext(DirectionsContext);

  return (
    <List header="Order list">
      {orderLists.map(list => (
        <List.Item
          key={list.id}
          prefix={
            <Image
              src={list.avatar}
              style={{ borderRadius: 20 }}
              fit="cover"
              width={40}
              height={40}
            />
          }
          description={`${list.start} -> ${list.end}`}
          extra={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Button color="primary" onClick={() => handleBook(list)}>
                {list.price}-Book
              </Button>
            </div>
          }
        >
          {list.time}
        </List.Item>
      ))}
    </List>
  );
}