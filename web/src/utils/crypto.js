import CryptoJS from 'crypto-js'

/**
 * encrypt the password using MD5
 * @param {string} password - original password
 * @returns {string} - md5 encrypted password
 */
export const encryptPassword = password => {
	if (!password) {
		throw new Error('password cannot be empty')
	}
	// encrypt the password using MD5
	const encryptedPassword = CryptoJS.MD5(password).toString()
	return encryptedPassword
}
/**
 * validate the password format
 * @param {string} password - password
 * @returns {boolean} - whether the password format is valid
 */
export const validatePasswordFormat = password => {
	// password length 8-20 characters, contains letters and numbers
	const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,20}$/
	return passwordRegex.test(password)
}
/**
 * encrypt the password field in the user data
 * @param {object} userData - user data object
 * @returns {object} - encrypted user data
 */
export const encryptUserData = userData => {
	if (!userData || typeof userData !== 'object') {
		throw new Error('user data format error')
	}
	const encryptedData = { ...userData }
	// if the password field exists, encrypt it
	if (encryptedData.password) {
		encryptedData.password = encryptPassword(encryptedData.password)
	}
	return encryptedData
}
