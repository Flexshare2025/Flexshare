import { API_DOMAIN } from '@/api'

export const pushGPS = data =>
	fetch(`${API_DOMAIN}/pushGPS`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		//     {
		//    "userID":"asda77777444441",
		//    "auth":"sadasdasd",
		//    "role":"driver",
		//    "scheduleId":"123123",
		//    "GPS":"123.23213,456.32131"
		// }
		body: JSON.stringify({
			userID: data.userID,
			auth: data.auth,
			role: data.role,
			scheduleId: data.scheduleId,
			GPS: `${data.lat}, ${data.lng}`,
		}),
	})

export const getGPS = data =>
	fetch(`${API_DOMAIN}/pushGPS`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			userID: data.userID,
			auth: data.auth,
			role: data.role,
			scheduleId: data.scheduleId,
			GPS: `${data.lat}, ${data.lng}`,
		}),
	})
