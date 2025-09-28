import { getCurrentPosition } from '@/utils/position'
const API_DOMAIN =
	'https://9whrslv2k8.execute-api.us-east-1.amazonaws.com/flexshare/gps'

export const pushGPS = async data => {
	const pos = await getCurrentPosition()

	if (!pos?.latitude) {
		return
	}

	const res = await fetch(`${API_DOMAIN}/push`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},

		body: JSON.stringify({
			userID: data?.userID,
			auth: data?.auth,
			role: data?.role,
			scheduleId: data?.scheduleId,
			GPS: `${pos.latitude}, ${pos.longitude}`,
		}),
	})
	if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status}`)
	}

	return res.json()
}

export const getGPS = async data => {
	const pos = await getCurrentPosition()

	if (!pos?.latitude) {
		return
	}

	const res = await fetch(`${API_DOMAIN}/get`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},

		body: JSON.stringify({
			userID: data?.userID,
			auth: data?.auth,
			role: data?.role,
			scheduleId: data?.scheduleId,
			GPS: `${pos.latitude}, ${pos.longitude}`,
		}),
	})
	if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status}`)
	}

	return res.json()
}
