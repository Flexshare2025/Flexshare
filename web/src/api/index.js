import { getCookie, setCookie } from '@/utils/storage'
import { FLEXSHARE_ACCESS_TOKEN } from '@/constant'

export const API_FAILED = 'Error'

// todo
export const API_DOMAIN = 'http://34.229.93.154:10001/'

let token = ''

export const apiReqs = {
	// Get Email Verification Code
	sendVerificationCode: config => {
		config.url = API_DOMAIN + '/api/auth/send-verification-code'
		config.method = 'post'
		apiFetch(config)
	},
}

export function goLogin() {
	// ?from=${encodeURIComponent(window.location.href)}
	window.location.href = `${location.origin}${location.pathname}#/`
}

export function logout() {
	// Clear token and redirect to login
	setCookie({ key: FLEXSHARE_ACCESS_TOKEN, value: '' })
	window.location.href = `${location.origin}${location.pathname}#/`
}
// register
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
		url: API_DOMAIN + '/api/auth/email-verification',
		method: 'get',
	})
}
// According to requirements, make further changes.
// export function emailVerification(config) {
//   const params = new URLSearchParams(config.data).toString();
//   apiFetch({
//     ...config,
//     url: API_DOMAIN + `/api/auth/email-verification?${params}`,
//     method: 'get',
//     data: null // GET
//   })
// }
async function addHeader(h, config) {
	// Skip token check for authentication endpoints
	if (
		config.url &&
		(config.url.includes('/users/register') ||
			config.url.includes('/users/login'))
	) {
		return h
	}

	if (!h['Authorization']) {
		token = getCookie(FLEXSHARE_ACCESS_TOKEN) || ''

		if (token) {
			h['Authorization'] = `Bearer ${token}`
		} else {
			goLogin()
		}
	}

	return h
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

	let fetchConfig = {
		method: config.method,
		headers: newHeaders,
	}

	if (config.method !== 'get') {
		fetchConfig.body = data
	}

	fetch(config.url, fetchConfig)
		.then(res => {
			// Check for authentication errors first
			if (res.status === 401 || res.status === 403) {
				// Only redirect for non-auth endpoints
				if (
					!config.url.includes('/users/register') &&
					!config.url.includes('/users/login')
				) {
					setCookie({ key: FLEXSHARE_ACCESS_TOKEN, value: '' })
					console.log('trigger-login-401')
					goLogin()
					return res.json()
				}
			}

			// Check if response is successful (2xx status codes)
			if (res.ok) {
				return res.json()
			} else {
				// For any other error status codes, throw an error
				throw new Error(`HTTP ${res.status}: ${res.statusText}`)
			}
		})
		.then(result => {
			config.done && config.done()
			config.success && config.success(result)
		})
		.catch(err => {
			config.done && config.done()
			config.fail && config.fail(err.message || API_FAILED)
		})
}
