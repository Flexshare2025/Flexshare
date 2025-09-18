# **API**

-   [**API**](#api)
    -   [**1. Authentication Module**](#1-authentication-module)
        -   [1.1 Get Email Verification Code](#11-get-email-verification-code)
        -   [1.2 User Registration](#12-user-registration)
        -   [1.3 Email Verification (Link)](#13-email-verification-link)
        -   [1.4 User Login](#14-user-login)
        -   [1.5 Get Current User Info](#15-get-current-user-info)
    -   [**2. Driver Module**](#2-driver-module)
        -   [2.1 Publish a Route](#21-publish-a-route)
        -   [2.2 Broadcast Driver Location (Real-Time Tracking)](#22-broadcast-driver-location-real-time-tracking)
        -   [2.3 Driver View Own Published Routes](#23-driver-view-own-published-routes)
        -   [2.4 Driver Cancel Published Route](#24-driver-cancel-published-route)
    -   [**3. Passenger Module**](#3-passenger-module)
        -   [3.1 View/Search for Routes](#31-viewsearch-for-routes)
        -   [3.2 Place an Schedule](#32-place-an-schedule)
        -   [3.3 Cancel an Schedule](#33-cancel-an-schedule)
        -   [3.4 Update Passenger Location (Real-Time)](#34-update-passenger-location-real-time)

## **1. Authentication Module**

### 1.1 Get Email Verification Code

**POST** `/api/auth/send-verification-code`

**Request Body**:

```json
{
	"email": "user@example.com"
}
```

**Response**:

```json
{
	"status": "success",
	"message": "Verification code sent to your email"
}
```

---

### 1.2 User Registration

**POST** `/api/auth/register`

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "string",
  "name": "string",
  "role": "passenger" | "driver",
  "verification_code": "123456"
}
```

**Response**:

```json
{
	"status": "success",
	"message": "Registration successful"
}
```

---

### 1.3 Email Verification (Link)

**GET** `/api/auth/verify-email?token=xxxx`

**Query Parameters**:

-   `token` – verification token from email link

**Response**:

```json
{
	"status": "success",
	"message": "Email verified successfully"
}
```

---

### 1.4 User Login

**POST** `/api/auth/login`

**Request Body**:

```json
{
	"email": "user@example.com",
	"password": "string"
}
```

**Response**:

```json
{
  "status": "success",
  "token": "jwt_token_string",
  "user": {
    "id": "string",
    "name": "string",
    "role": "passenger" | "driver",
    "email": "string"
  }
}
```

---

### 1.5 Get Current User Info

**GET** `/api/auth/me`

**Headers**:

-   `Authorization: Bearer jwt_token`

**Response**:

```json
{
  "id": "string",
  "name": "string",
  "role": "passenger" | "driver",
  "email": "string"
}
```

---

## **2. Driver Module**

### 2.1 Publish a Route

**POST** `/api/driver/route`

**Request Body**:

```json
{
	"start_point": { "lat": 123.45, "lng": 67.89, "address": "string" },
	"end_point": { "lat": 124.0, "lng": 68.0, "address": "string" },
	"stops": [{ "lat": 123.5, "lng": 67.9, "address": "string" }],
	"route_points": [
		[-36.84925, 174.76346],
		[-36.848443190092766, 174.76147862772547],
		[-36.85258581598056, 174.75931948464387],
		[-36.856528268685395, 174.75666085948717],
		[-36.85962971384861, 174.7589223641967],
		[-36.86154166130732, 174.76366918762983],
		[-36.86498001355628, 174.76714706600038],
		[-36.8686889419483, 174.7700563278551],
		[-36.871869903174854, 174.77398576761965]
	],
	"departure_time": " 2025-09-01 11:00:00",
	"available_seats": 4,
	"price_per_km": 2.5
}
```

**Response**:

```json
{
	"status": "success",
	"route_id": "string"
}
```

---

### 2.2 Broadcast Driver Location (Real-Time Tracking)

**POST** `/api/driver/location`

**Headers**:

-   `Authorization: Bearer jwt_token` (driver)

**Request Body**:

```json
{
	"lat": 123.45,
	"lng": 67.89
}
```

**Response**:

```json
{
	"status": "success",
	"message": "Location updated"
}
```

---

### 2.3 Driver View Own Published Routes

**POST** `/api/driver/routes`

**Request Body**:

```json
{
	"status": "active|cancelled|completed (optional)",
	"sort_by": "departure_time|created_at",
	"order": "asc|desc",
	"page": 1,
	"page_size": 20
}
```

**Response**:

```json
{
	"routes": [
		{
			"route_id": "rte_456",
			"start_point": { "lat": 123.45, "lng": 67.89, "address": "string" },
			"end_point": { "lat": 124.0, "lng": 68.0, "address": "string" },
			"departure_time": "2025-08-22T08:30:00Z",
			"available_seats": 3,
			"status": "active",
			"created_at": "2025-08-20T10:00:00Z"
		}
	],
	"pagination": {
		"page": 1,
		"page_size": 20,
		"total": 12
	}
}
```

---

### 2.4 Driver Cancel Published Route

**Post** `/api/driver/routes/{route_id}`

**Response**:

```json
{
	"success": true,
	"route_id": "rte_456",
	"status": "cancelled"
}
```

---

## **3. Passenger Module**

### 3.1 View/Search for Routes

**Post** `/api/passenger/routes/search`

**Request Body**:

```json
{
  "start_point": { "lat": 123.46, "lng": 67.91, "address": "string" } (optional),
  "end_point": { "lat": 123.99, "lng": 68.01, "address": "string" } (optional),
  "date": "YYYY-MM-DD (optional)",
  "sort_by": "time|price",
  "order": "asc|desc",
  "page": 1,
  "page_size": 20
}
```

**Response**:

```json
[
	{
		"route_id": "string",
		"driver": { "id": "string", "name": "string", "rating": 4.8 },
		"start_point": { "lat": 123.45, "lng": 67.89, "address": "string" },
		"end_point": { "lat": 124.0, "lng": 68.0, "address": "string" },
		"stops": [],
		"departure_time": "2025-08-12T09:00:00Z",
		"available_seats": 3,
		"price_estimate": 15.0
	}
]
```

---

### 3.2 Place an Schedule

**POST** `/api/passenger/schedule`

**Request Body**:

```json
{
	"route_id": "string",
	"pickup_point": { "lat": 123.46, "lng": 67.91, "address": "string" },
	"dropoff_point": { "lat": 123.99, "lng": 68.01, "address": "string" },
	"seat_count": 1
}
```

**Response**:

```json
{
	"status": "success",
	"schedule_id": "string"
}
```

---

### 3.3 Cancel an Schedule

**POST** `/api/passenger/schedule/{schedule_id}/cancel`

**Request Body**:

```json
{
	"reason": "string"
}
```

**Response**:

```json
{
	"status": "success",
	"message": "Schedule cancelled"
}
```

---

### 3.4 Update Passenger Location (Real-Time)

**POST** `/api/passenger/location`

**Headers**:

-   `Authorization: Bearer jwt_token` (passenger)

**Request Body**:

```json
{
	"lat": 123.5,
	"lng": 67.95
}
```

**Response**:

```json
{
	"status": "success",
	"message": "Passenger location updated"
}
```

---
