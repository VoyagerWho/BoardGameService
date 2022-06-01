/**
 * XHR request
 * @type {XMLHttpRequest}
 */
var request;

/**
 * Function to create new XHR object
 * @returns {XMLHttpRequest}
 */
function getRequestObject()
{
    if ( window.ActiveXObject)
    {
        return ( new ActiveXObject("Microsoft.XMLHTTP"));
    }
    else if (window.XMLHttpRequest)
    {
        return (new XMLHttpRequest());
    }
    else
    {
        return (null);
    }
}

/**
 * Function to send AJAX request via post method
 * @param {string} strURL 
 * @param {string} mess 
 * @param {Function} respFunc 
 */
function xmlhttpPost(strURL, mess, respFunc) {
    var xhr = getRequestObject();
    if (xhr)
    {
        xhr.onreadystatechange = function() {
            if(xhr.readyState == 4)
            {
                if(xhr.status == 200)
                {    
                respFunc(xhr.responseText);
                }
                else if(xhr.status == 401)
                {
                window.location.reload();
                } 
            }
        };
        xhr.open("POST", strURL);
        xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");
        xhr.setRequestHeader("Content-Type","application/json; charset=UTF-8");
        xhr.send(JSON.stringify(mess));  
    }
    else
    {
    console.error("XHR not available!");  
    }       
}