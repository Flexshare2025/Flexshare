import React, { useState } from 'react'
import {
  Form,
  Input,
  Button,
  ImageUploader,
} from 'antd-mobile'

function mockUpload(file) {
  return {
    url: URL.createObjectURL(file),
  }
}

export default function App() {
  const maxCount = 1;
  const [vehicle_photo, setVehiclePhoto] = useState([])
  const [driver_license_image, setVDriverLicenseImage] = useState([])
  const onFinish = (values) => {
    console.log('Form values:', values);
  }

  return (
    <>
      <Form
        onFinish={onFinish}
        footer={
          <Button block type='submit' color='primary' size='large'>
            Submit
          </Button>
        }
      >
        <Form.Item
          name='plate_number'
          label='Plate Number'
          rules={[{ required: true, message: 'The plate number cannot be empty' }]}
        >
          <Input onChange={console.log} placeholder='Please Input Plate Number' />
        </Form.Item>
        <Form.Item
          name='driver_license'
          label='Driver License'
          rules={[{ required: true, message: 'The driver license number cannot be empty' }]}
        >
          <Input onChange={console.log} placeholder='Please Input Driver License Number' />
        </Form.Item>
        <Form.Item
          name='vehicle_photo'
          label='Vehicle Photo'
          rules={[{ required: true, message: 'The vehicle photo cannot be empty' }]}
        >
          <ImageUploader
            value={vehicle_photo}
            onChange={setVehiclePhoto}
            upload={mockUpload}
            multiple
            maxCount={1}
            showUpload={vehicle_photo.length < maxCount}
          />
        </Form.Item>
          <Form.Item
          name='driver_license_image'
          label='Driver License Image'
          rules={[{ required: true, message: 'The vehicle driver license image be empty' }]}
        >
          <ImageUploader
            value={driver_license_image}
            onChange={setVDriverLicenseImage}
            upload={mockUpload}
            multiple
            maxCount={1}
            showUpload={driver_license_image.length < maxCount}
          />
        </Form.Item>
      </Form>
    </>
  )
}