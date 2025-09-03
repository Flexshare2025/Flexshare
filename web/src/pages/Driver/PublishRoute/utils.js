import polyline from '@mapbox/polyline'

export function haversine(lat1, lon1, lat2, lon2) {
	const R = 6371000
	const toRad = x => (x * Math.PI) / 180
	const dLat = toRad(lat2 - lat1)
	const dLon = toRad(lon2 - lon1)
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toFiveDecimals(num) {
	return Math.round(num * 100000) / 100000
}

function calculateDistance(str) {
	return parseFloat(str) * 1000
}

export function generateRoutePoints(polylineStr, distance) {
	const interval = calculateDistance(distance) / 5
	console.log('interval', interval)

	const coords = polyline.decode(polylineStr) // [[lat,lng], ...]
	let points = []
	let distanceAccum = 0
	points.push({
		lat: toFiveDecimals(coords[0]?.[0]),
		lng: toFiveDecimals(coords[0]?.[1]),
	})

	for (let i = 1; i < coords.length; i++) {
		let [lat1, lon1] = coords[i - 1]
		let [lat2, lon2] = coords[i]
		let segmentDist = haversine(lat1, lon1, lat2, lon2)
		distanceAccum += segmentDist

		while (distanceAccum >= interval) {
			let overshoot = distanceAccum - interval
			let ratio = (segmentDist - overshoot) / segmentDist
			let newLat = lat1 + (lat2 - lat1) * ratio
			let newLon = lon1 + (lon2 - lon1) * ratio
			points.push({
				lat: toFiveDecimals(newLat),
				lng: toFiveDecimals(newLon),
			})
			distanceAccum -= interval
		}
	}
	return points
}
