import { useEffect, useState, useRef } from 'react';
import { List, ErrorBlock, Modal, Toast, SwipeAction } from 'antd-mobile'
import { removeCountryInAddress } from '@/utils/common';
import Loading from '@/components/Loading';
import Header from '@/components/Header';
import RightArrow from '@/assets/right_arrow.png';
import { listSchedules, cancelSchedulePassenger } from '@/api';
import './PassengerOrderList.scss';

export default function PassengerOrderList({ onClose }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  //avoid duplicate loading
  const hasLoaded = useRef(false);
  function getPassengerOrders() {
    setLoading(true)
    listSchedules({
      data: {
        role: 'passenger'
      },
      success: res => {
        setLoading(false)
        setList(res.data);
      },
      fail: () => {
        setLoading(false)
      }
    })
  }
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      getPassengerOrders();
    }
  }, [])
  if (loading) {
    return <Loading />
  }
  if (list.length === 0) {
    // no orders
    return (
      <>
        <Header title="My Orders" onBack={onClose} />
        <ErrorBlock status='empty' description="No orders" />
      </>
    )
  }
  const cancelOrder = (order) => {
    Modal.confirm({
      title: 'Cancel Order',
      content: 'Are you sure you want to cancel this order?',
      confirmText: 'Sure',
      cancelText: 'Cancel',
      onConfirm: () => {
        cancelSchedulePassenger({
          data: { schedule_id: order.schedule_id },
          success: res => {
            if (res.code == '200') {
              getPassengerOrders();
              Toast.show({
                content: 'Order cancelled',
                duration: 1500,
              });
            } else {
              Toast.show({
                content: res.msg,
                duration: 1500,
              });
            }
          },
          fail: err => {
            Toast.show({
              content: err.msg,
              duration: 1500,
            });
          }
        })
      },
    });
  }
  const isCancel = i => i === 'cancel' || i === 'invalid' || i === 'timeout';
  return (
    <div className='passenger-order-list-container'>
      <Header title="My Orders" onBack={onClose} />

      <List >
        {list.map(order => order && (
          <SwipeAction
            key={order.schedule_id}
            rightActions={isCancel(order.status) ? [] : [
              {
                key: 'delete',
                text: 'Cancel',
                color: 'danger',
                onClick: () => cancelOrder(order),
              },
            ]}
          >
            <List.Item className={`${isCancel(order.status) ? 'disabled' : ''}`}>
              <div>
                <p className="route-item">
                  <span>{order.departure_time}</span>
                  <span className='seat-item'>({order.seat_count || 1} people)</span>
                </p>
                <p className='route-item-detail'>
                  <span className='address'> {removeCountryInAddress(order.start_point.address)}</span>
                  <img className='rode-icon' src={RightArrow} alt="" />
                  <span className='address'>{removeCountryInAddress(order.end_point.address)}</span>
                </p>
                <p className='order-status'>
                  Status: {order.status === 'active' ? 'Active' : order.status === 'cancel' ? 'Cancelled' : order.status === 'invalid' ? 'Cancelled' : order.status}
                </p>
              </div>
            </List.Item>
          </SwipeAction>
        ))}
      </List>
    </div>
  )
}
