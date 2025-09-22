import { useEffect, useState } from 'react';
import { List, ErrorBlock, Modal, Toast, SwipeAction, Popup } from 'antd-mobile'
import { removeCountryInAddress } from '@/utils/common';
import Loading from '@/components/Loading';
import Header from '@/components/Header';
import RightArrow from '@/assets/right_arrow.png';
import { viewPublishRoutes, cancelPublishRoutes } from '@/api';
import UserOrderList from '../UserOrderList';
import './index.scss';


export default function App({ onClose, setOrder, setVisible2 }) {
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
        const data = res.data;
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
            Toast.show({
              content: err.msg,
              duration: 500,
            });
          }
        })
      },
    });
  }

  const isPending = i => i === 'pending';

  const goDetail = (currentOrder) => {
    if (currentOrder) {
      setOrder(currentOrder);
      setVisible2(true);
    }
  }

  return (
    <>
      <div className='route-list-container'>
        <Header title="Publish Routes" onBack={onClose} />

        {loading ? (
          <Loading />
        ) : !list || list?.length === 0 ? (
          <ErrorBlock status='empty' description="" />
        ) : (
          <List>
            {list.map(order => order && (
              <SwipeAction
                rightActions={isPending(order.status) ? [
                  {
                    key: 'delete',
                    text: 'Cancel',
                    color: 'danger',
                    onClick: () => cancelOrder(order),
                  },
                  {
                    key: 'detail',
                    text: 'Detail',
                    color: 'primary',
                    onClick: () => goDetail(order),
                  },
                ] : []}
              >
                <List.Item key={order.schedule_id} className={`${isPending(order.status) ? '' : 'disabled'}`}>
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
                  <UserOrderList data={Object.values(order.passengerSchedules || {})} />
                </List.Item>
              </SwipeAction>
            ))}
          </List>
        )}
      </div>

    </>
  )
}