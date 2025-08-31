// current position using Geolocation API Cannot locate using a mobile phone
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
//use Google Geolocation API to get current position
// export async function getCurrentPosition() {
//   const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
//   try {
//     const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${API_KEY}`, {
//       method: 'POST'
//     });
//     const data = await res.json();
//     return {
//       latitude: data.location.lat,
//       longitude: data.location.lng,
//       accuracy: data.accuracy
//     };
//   } catch (err) {
//     console.error(err);
//     throw err;
//   }
// }
