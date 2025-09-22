import { useEffect, useState } from 'react';
import { List, ErrorBlock, Modal, Toast, SwipeAction } from 'antd-mobile'
import { removeCountryInAddress } from '@/utils/common';
import RightArrow from '@/assets/right_arrow.png';
import './index.scss';

export default function App(props) {
  const [list, setList] = useState(props?.data)

  useEffect(() => {
    setList(props.data)
  }, [props.data])

  if (!list || list.length === 0) {
    return null
  }
  return (
    <div className='route-list-container'>
      <List header=''>
        {list.map(order => (
          <List.Item key={order.schedule_id}>
            <div>
              <p className="route-item">
                <span>{order.departure_time}</span>
                <span className='seat-item'>({order.num_passenger} people)</span>
              </p>
              {/* <p className='route-item-detail'>
                <span className='address'> {removeCountryInAddress(order.start_point.address)}</span>
                <img className='rode-icon' src={RightArrow} alt="" />
                <span className='address'>{removeCountryInAddress(order.end_point.address)}</span>
              </p> */}
            </div>
          </List.Item>
        ))}
      </List>
    </div>
  )
}