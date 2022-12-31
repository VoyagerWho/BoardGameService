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
 * Function to send AJAX request via post method
 * @param {string} strURL - Request address
 * @param {string} mess - Message data
 * @param {Function} respFunc - Handle function to run on response
 */
function xmlhttpPost(strURL, mess, respFunc) {
	var xhr = getRequestObject();
	if (xhr) {
		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					respFunc(xhr.responseText);
				} else if (xhr.status == 401) {
					window.location.reload();
				}
			}
		};
		xhr.open('POST', strURL);
		xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify(mess));
	} else {
		console.error('XHR not available!');
	}
}

/**
 * Function to send game api validation request
 * @param {html.form} form - Initiator
 */
function checkGame(form) {
	xmlhttpPost('/games/check', { url: form.url.value }, function (response) {
		var resjson = JSON.parse(response);
		console.log(resjson);
		document.getElementById('gameResponse').innerHTML = resjson.message;
		if (resjson.accepted) {
			document.getElementById('gameResponse').style.color = 'limegreen';
		} else {
			document.getElementById('gameResponse').style.color = 'yellow';
		}
	});
}

/**
 * Function to send game status validation request
 * @param {html.form} form - Initiator
 */
function checkStatus(form, name) {
	xmlhttpPost('/games/check/' + name, {}, function (response) {
		var resjson = JSON.parse(response);
		console.log(resjson);
		form.getElementsByTagName('div')[0].innerHTML = resjson.message;
		if (resjson.accepted) {
			form.getElementsByTagName('div')[0].style.color = 'limegreen';
		} else {
			form.getElementsByTagName('div')[0].style.color = 'yellow';
		}
	});
}
