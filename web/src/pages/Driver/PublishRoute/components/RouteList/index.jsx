import { useEffect, useState } from 'react';
import { List, ErrorBlock, Modal, Toast, SwipeAction } from 'antd-mobile'
import { removeCountryInAddress } from '@/utils/common';
import Loading from '@/components/Loading';
import RightArrow from '@/assets/right_arrow.png';
import { viewPublishRoutes } from '@/api';
import './index.scss';


export default function App() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    viewPublishRoutes({
      success: res => {
        setLoading(false)
        console.log('viewPublishRoutes-res', res)
        setList(res.data);
      },
      err: () => {
        setLoading(false)
      }
    })
  }, [])

  if (loading) {
    return <Loading />
  }

  if (list.length === 0) {
    return (
      <ErrorBlock status='empty' description="" />

    )
  }

  const cancelOrder = () => {
    Modal.confirm({
      title: 'Cancel Order',
      content: 'Are you sure you want to cancel this order?',
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
      <List header='Publish Routes'>
        {list.map(order => (
          <SwipeAction
            rightActions={[
              {
                key: 'delete',
                text: 'Cancel',
                color: 'danger',
                onClick: cancelOrder,
              },
            ]}
          >
            <List.Item key={order.schedule_id}>
              <div>
                <p className="route-item">
                  <span>{order.departure_time}</span>
                  <span className='seat-item'>({order.available_seats} seats)</span>
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