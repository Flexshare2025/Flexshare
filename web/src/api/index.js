import { getCookie, setCookie } from '@/utils/storage'
import { FLEXSHARE_ACCESS_TOKEN } from '@/constant'

export const API_FAILED = 'Error'

// todo
export const API_DOMAIN = 'http://192.168.134.61:10001/'

let token = ''

export function goLogin() {
	// ?from=${encodeURIComponent(window.location.href)}
	window.location.href = `${location.origin}${location.pathname}#/login`
}

async function addHeader(h) {
	if (!h['authorization']) {
		token = getCookie(FLEXSHARE_ACCESS_TOKEN) || ''

		if (token) {
			h['authorization'] = `${token}`
		} else {
			// goLogin()
		}
	}

	return h
}
export function register(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + 'users/register',
		method: 'post',
	})
}
// login
export function login(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + 'users/login',
		method: 'post',
	})
}
// email verification
export function emailVerification(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + 'users/mail-verification',
		method: 'post',
	})
}

export function resetPassword(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + 'users/reset-password',
		method: 'post',
	})
}

export async function apiFetch(config) {
	if (config.data === undefined) {
		config.data = {}
	}

	config.method = config.method || 'post'
	let headers = config.headers || {}
	let data = null

	headers['Content-Type'] = 'application/json;charset=UTF-8'
	data = JSON.stringify(config.data)

	const newHeaders = await addHeader(headers, config)

	let axiosConfig = {
		method: config.method,
		credentials: 'include',
		headers: newHeaders,
		body: null,
	}

	if (config.method !== 'get') {
		axiosConfig.body = data
	}

	fetch(config.url, { ...axiosConfig })
		.then(res => {
			// status: 401
			if (res.status === 401 || res.status === 403) {
				setCookie({ key: FLEXSHARE_ACCESS_TOKEN, value: '' })
				console.log('trigger-login-401')
				// goLogin()
				return res.json()
			}

			return res.json()
		})
		.then(result => {
			if (result.code === '4005') {
				goLogin()
			} else {
				config.done && config.done()
				config.success && config.success(result)
			}
		})
		.catch(err => {
			console.log('fetch-err', err)
			config.done && config.done()
			config.fail && config.fail(API_FAILED)
		})
}

// Driver Api
// Publish a Route Schedule
export function publishSchedule(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + 'schedules/create',
		method: 'post',
	})
}

// Driver View/Search Passenger Orders
export function scheduleOrders(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + 'driver/schedule/orders',
		method: 'post',
	})
}

// Get Current Schedule List
export function getCurrentSchedule(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + 'driver/schedule/current',
		method: 'post',
	})
}

// Accept an Schedule
export function acceptSchedule(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + `driver/schedule/${config.data.schedule_id}/accept`,
		method: 'post',
	})
}

// Cancel an Schedule
export function cancelSchedule(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + `driver/schedule/${config.data.schedule_id}/cancel`,
		method: 'post',
	})
}

// Broadcast Driver Location (Real-Time Tracking)
export function broadcastLocation(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + `driver/location`,
		method: 'post',
	})
}

// Start a Trip
export function startTrip(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + `driver/trips/${config.data.trip_id}/start`,
		method: 'post',
	})
}

// End a Trip
export function endTrip(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + `driver/trips/${config.data.trip_id}/end`,
		method: 'post',
	})
}

// Driver View Own Published Routes
export function viewPublishRoutes(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + `driver/routes`,
		method: 'post',
	})
}

// Driver Cancel Published Route
export function cancelPublishRoutes(config) {
	apiFetch({
		...config,
		url: API_DOMAIN + `driver/routes/${config.data.route_id}`,
		method: 'post',
	})
}
