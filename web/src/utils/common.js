export function formatDateTime(date) {
	if (typeof date === 'number') {
		date = new Date(date)
	}

	if (!date) {
		date = new Date()
	}

	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')

	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')

	return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function removeCountryInAddress(str) {
	if (!str) return str
	const parts = str.split(',').map(part => part.trim())
	if (parts.length > 1) {
		return parts.slice(0, -1).join(', ')
	}
	return str
}

export function enterFullscreen(ele) {
	if (ele.requestFullscreen) {
		ele.requestFullscreen()
	} else if (ele.mozRequestFullScreen) {
		ele.mozRequestFullScreen()
	} else if (ele.webkitRequestFullscreen) {
		ele.webkitRequestFullscreen()
	} else if (ele.msRequestFullscreen) {
		ele.msRequestFullscreen()
	}
}

export function exitFullscreen(element) {
	if (document.exitFullScreen) {
		document.exitFullScreen()
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen()
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen()
	} else if (element.msExitFullscreen) {
		element.msExitFullscreen()
	}
}
