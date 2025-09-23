export function getLocalData(key) {
	try {
		const data = localStorage.getItem(key)
		if (data === undefined || data === 'undefined' || data === 'null' || data === null)
			return ''
		return data
	} catch (error) {
		return ''
	}
}

export function setLocalData({ key, value }) {
	try {
		localStorage.setItem(key, value)
	} catch (error) {}
}

export function getCookie(name) {
	var cookieName = name + '=',
		decodedCookies = decodeURIComponent(document.cookie),
		cookiesArray = decodedCookies.split(';')

	for (var i = 0; i < cookiesArray.length; i++) {
		var cookie = cookiesArray[i]
		while (cookie.charAt(0) == ' ') {
			cookie = cookie.substring(1)
		}
		if (cookie.indexOf(cookieName) === 0) {
			return cookie.substring(cookieName.length, cookie.length)
		}
	}
	return ''
}

function deleteCookie(name) {
	document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
}

export function setCookie({ key, value }) {
	const v = getCookie(key)
	if (v) {
		deleteCookie(key)
	}
	let expires = ''
	const date = new Date()
	date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000)
	expires = '; expires=' + date.toUTCString()
	document.cookie = key + '=' + (value || '') + expires + '; path=/'
}
