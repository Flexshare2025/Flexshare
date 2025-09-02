import { getCookie, setCookie } from '@/utils/storage'
import { FLEXSHARE_ACCESS_TOKEN } from '@/constant'

export const API_FAILED = 'Error'

// todo
export const API_DOMAIN = 'http://192.168.212.61:10001/'

let token = ''

export const apiReqs = {
	// Get Email Verification Code
	sendVerificationCode: config => {
		config.url = API_DOMAIN + '/api/auth/send-verification-code'
		config.method = 'post'
		apiFetch(config)
	},
	// ...
}

export function goLogin() {
	// ?from=${encodeURIComponent(window.location.href)}
	window.location.href = `${location.origin}${location.pathname}#/login`
}

async function addHeader(h) {
	if (!h['Authorization']) {
		token = getCookie(FLEXSHARE_ACCESS_TOKEN) || ''

		if (token) {
			h['Authorization'] = `Bearer ${token}`
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
			config.done && config.done()
			config.success && config.success(result)
		})
		.catch(err => {
			console.log('fetch-err', err)
			config.done && config.done()
			config.fail && config.fail(API_FAILED)
		})
}
