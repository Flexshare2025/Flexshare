import React, { useState } from 'react'
import { TabBar } from 'antd-mobile'
import CarIcon from '@/assets/car.png'
import PeopleIcon from '@/assets/people.png'
import CarActiveIcon from '@/assets/car_active.png'
import PeopleActiveIcon from '@/assets/people_active.png'
import { Outlet, useNavigate } from "react-router-dom"

import './index.scss';

export default function Driver() {
  const navigate = useNavigate();

  const tabs = [
    {
      key: 'publish',
      title: 'Route',
      icon: (active) =>
        active ? <img className='driver-tab-icon' src={CarActiveIcon} /> : <img className='driver-tab-icon' src={CarIcon} />,
    },
    {
      key: 'rode',
      title: 'Orders',
      icon: (active) =>
        active ? <img className='driver-tab-icon' src={PeopleActiveIcon} /> : <img className='driver-tab-icon' src={PeopleIcon} />,
    },
  ]

  const [activeKey, setActiveKey] = useState('publish')

  const setRouteActive = (value) => {
    navigate(`/driver/${value}`)
    setActiveKey(value)
  }

  return (
    <div className='driver-page-container'>
      <div className='driver-page-content'>
        <Outlet />
      </div>
      <div className='driver-page-tab-bar'>
        <TabBar activeKey={activeKey} onChange={setRouteActive}>
          {tabs.map(item => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div >
  )
}