import { List, ErrorBlock, Button, Modal, Toast, SwipeAction } from 'antd-mobile'
import { removeCountryInAddress } from '@/utils/common';
import RightArrow from '@/assets/right_arrow.png';
import './index.scss';

export default function App() {
  const list = [
    {
      "route_id": "rte_456",
      "start_point": { "lat": 123.45, "lng": 67.89, "address": "ANZ Hamilton" },
      "end_point": { "lat": 124.0, "lng": 68.0, "address": "University of Waikato" },
      "departure_time": "2025-09-01 08:30:00",
      "available_seats": 3,
      "status": "active",
      "created_at": "2025-09-01T10:00:00Z",
      "seat_count": 1
    },
    {
      "route_id": "rte_456",
      "start_point": { "lat": 123.45, "lng": 67.89, "address": "Hamilton Lake" },
      "end_point": { "lat": 124.0, "lng": 68.0, "address": "University of Waikato" },
      "departure_time": "2025-09-02 08:30:00",
      "available_seats": 3,
      "status": "active",
      "created_at": "2025-09-02T10:00:00Z",
      "seat_count": 2
    },
    {
      "route_id": "rte_456",
      "start_point": { "lat": 123.45, "lng": 67.89, "address": "ANZ Hamilton" },
      "end_point": { "lat": 124.0, "lng": 68.0, "address": "University of Waikato" },
      "departure_time": "2025-09-01 08:30:00",
      "available_seats": 3,
      "status": "active",
      "created_at": "2025-09-01T10:00:00Z",
      "seat_count": 1
    },
  ];
  if (list.length === 0) {
    return (
      <ErrorBlock status='empty' description="" />

    )
  }

  const refuseOrder = () => {
    Modal.confirm({
      title: 'Refuse Order',
      content: 'Are you sure you want to refuse this order?',
      confirmText: 'Sure',
      cancelText: 'Cancel',
      onClose: () => { },
      onConfirm: () => {
        // todo call api to cancel order
        Toast.show({
          content: 'Order cancelled',
          duration: 1000,
        });
      },
    });
  }

  return (
    <div className='route-list-container'>
      <List header=''>
        {list.map(order => (
          <SwipeAction
            rightActions={[
              {
                key: 'accept',
                text: 'Refuse',
                color: 'danger',
                onClick: refuseOrder,
              },
            ]}
          >
            <List.Item key={order.schedule_id}>
              <div>
                <p className="route-item">
                  <span>{order.departure_time}</span>
                  <span className='seat-item'>({order.seat_count} people)</span>
                </p>
                <p className='route-item-detail'>
                  <span className='address'> {removeCountryInAddress(order.start_point.address)}</span>
                  <img className='rode-icon' src={RightArrow} alt="" />
                  <span className='address'>{removeCountryInAddress(order.end_point.address)}</span>
                </p>
              </div>
            </List.Item>
          </SwipeAction>
        ))}
      </List>
    </div>
  )
}