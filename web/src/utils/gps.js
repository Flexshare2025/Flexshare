import { getCurrentPosition } from '@/utils/position'
const API_DOMAIN = 'https://9whrslv2k8.execute-api.us-east-1.amazonaws.com/flexshare/gps/'

export const pushGPS = async data => {
	console.log('pushGPS', data)

	const pos = await getCurrentPosition()

	console.log('pos', pos)

	if (!pos?.latitude) {
		return
	}

	return fetch(`${API_DOMAIN}/push`, {
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
}

export const getGPS = async data => {
	const pos = await getCurrentPosition()

	console.log('pos', pos)

	if (!pos?.latitude) {
		return
	}

	return fetch(`${API_DOMAIN}/push`, {
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
}
