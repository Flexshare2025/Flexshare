import { useEffect, useState } from 'react';
import { List, ErrorBlock, Modal, Toast, SwipeAction } from 'antd-mobile'
import { removeCountryInAddress } from '@/utils/common';
import Loading from '@/components/Loading';
import RightArrow from '@/assets/right_arrow.png';
import { viewPublishRoutes, cancelPublishRoutes } from '@/api';
import UserOrderList from '../UserOrderList';
import './index.scss';


export default function App() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false)

  function getPublishRoutes() {
    setLoading(true)
    viewPublishRoutes({
      data: {
        role: 'driver'
      },
      success: res => {
        setLoading(false)
        console.log('viewPublishRoutes-res', res)
        const data = res.data;
        console.log('viewPublishRoutes-data', data)
        setList(data);
      },
      fail: () => {
        setLoading(false)
      }
    })
  }

  useEffect(() => {
    getPublishRoutes()
  }, [])

  if (loading) {
    return <Loading />
  }

  if (list.length === 0) {
    return (
      <ErrorBlock status='empty' description="" />

    )
  }

  const cancelOrder = (order) => {
    Modal.confirm({
      title: 'Cancel Order',
      content: 'Are you sure you want to cancel this order?',
      confirmText: 'Sure',
      cancelText: 'Cancel',
      onClose: () => { },
      onConfirm: () => {
        cancelPublishRoutes({
          data: { schedule_id: order.schedule_id },
          success: res => {
            console.log('cancelOrder--res', res)
            if (res.code == '200') {
              getPublishRoutes();
              Toast.show({
                content: 'Order cancelled',
                duration: 500,
              });
            } else {
              Toast.show({
                content: res.msg,
                duration: 500,
              });
            }
          },
          fail: err => {
            console.log('cancelOrder--err', err)
            Toast.show({
              content: err.msg,
              duration: 500,
            });
          }
        })
      },
    });
  }

  const isCancel = i => i === 'cancel';

  return (
    <div className='route-list-container'>
      <List header='Publish Routes'>
        {list.map(order => order && (
          <SwipeAction
            rightActions={isCancel(order.status) ? [] : [
              {
                key: 'delete',
                text: 'Cancel',
                color: 'danger',
                onClick: () => cancelOrder(order),
              },
            ]}
          >
            <List.Item key={order.schedule_id} className={`${isCancel(order.status) ? 'disabled' : ''}`}>
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
              {/* <UserOrderList /> */}
            </List.Item>
          </SwipeAction>
        ))}
      </List>
    </div>
  )
}