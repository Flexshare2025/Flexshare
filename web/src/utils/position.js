export function getCurrentPosition() {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error('Geolocation is not supported by this browser.'))
			return
		}
		// Use the Geolocation API to get the current position
		navigator.geolocation.getCurrentPosition(
			position => {
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				})
			},
			error => {
				reject(error)
			}
		)
	})
}
