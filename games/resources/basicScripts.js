/**
 * XHR request
 * @type {XMLHttpRequest}
 */
var request;

/**
 * Function to create new XHR object
 * @returns {XMLHttpRequest}
 */
function getRequestObject() {
	if (window.ActiveXObject) {
		return new ActiveXObject('Microsoft.XMLHTTP');
	} else if (window.XMLHttpRequest) {
		return new XMLHttpRequest();
	} else {
		return null;
	}
}

/**
 * Function to send AJAX request as a promise
 * @param {string} method - xhr method
 * @param {string} url - address of the request
 * @param {object} message - body of the request (for POST)
 * @returns Promise for AJAX request
 */
function xhrMakeRequest(method, url, message) {
	return new Promise((resolve, reject) => {
		let xhr = getRequestObject();
		if (xhr) {
			xhr.open(method, url);
			xhr.onload = () => {
				if (xhr.status == 200) {
					resolve(xhr.responseText);
				} else {
					reject(xhr.responseText);
				}
			};
			xhr.onerror = () => {
				reject({
					status: xhr.status,
					statusText: 'xhr error',
				});
			};
			xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
			if (method == 'POST' && message) {
				xhr.send(JSON.stringify(message));
			} else xhr.send();
		} else reject('No support for XHR object');
	});
}
