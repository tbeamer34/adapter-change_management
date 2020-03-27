const request = require('request');

const validResponseRegex = /(2\d\d)/;


/**
 * The ServiceNowConnector class.
 *
 * @summary ServiceNow Change Request Connector
 * @description This class contains properties and methods to execute the
 *   ServiceNow Change Request product's APIs.
 */
class ServiceNowConnector {

  /**
   * @memberof ServiceNowConnector
   * @constructs
   * @description Copies the options parameter to a public property for use
   *   by class methods.
   *
   * @param {object} options - API instance options.
   * @param {string} options.url - Your ServiceNow Developer instance's URL.
   * @param {string} options.username - Username to your ServiceNow instance.
   * @param {string} options.password - Your ServiceNow user's password.
   * @param {string} options.serviceNowTable - The table target of the ServiceNow table API.
   */
  constructor(options) {
    this.options = options;
  }

  /**
   * @memberof ServiceNowConnector
   * @method get
   * @summary Calls ServiceNow GET API
   * @description Call the ServiceNow GET API. Sets the API call's method and query,
   * @param {iapCallback} callback - Callback a function.
   * @param {(object|string)} callback.data - The API's response
   * @param {error} callback.error - The error property of callback.
   */
  get(callback) {
    let getCallOpt = this.options;
    getCallOpt.method = 'GET';
    getCallOpt.query = 'sysparm_limit=1';
    this.sendRequest(getCallOpt, (results, error) => callback(results, error));
  }

/**
 * @function post
 * @description Call the ServiceNow POST API. Sets the API call's method,
 * @param {object} callOptions - Passed call options.
 * @param {string} callOptions.serviceNowTable - The table target of the ServiceNow table API.
 * @param {iapCallback} callback - Callback a function.
 * @param {(object|string)} callback.data - The API's response.
 * @param {error} callback.error - The error property of callback.
 */
 post(callback) {
   let postOpt = this.options;
   postOpt.method = 'POST';
  this.sendRequest(postOpt, (results, error) => callback(results, error));
}
/**
 * @function constructUri
 * @description Build and return the proper URI by appending an optionally passed
 * @param {string} serviceNowTable - The table target of the ServiceNow table API.
 * @param {string} [query] - Optional URL query string.
 *
 * @return {string} ServiceNow URL
 */
 constructUri(serviceNowTable, query = null) {
  let uri = `/api/now/table/${serviceNowTable}`;
  if (query) {
    uri = uri + '?' + query;
  }
  return uri;
}
    /**
    * @method isHibernating
    * @description Checks if request function responded hibernating
    * @param {object} response - The response argument passed by the request function in its callback.
    * @return {boolean} Returns true if instance is hibernating. Otherwise returns false.
    */
    isHibernating(response) {
        return response.body.includes('Hibernating Instance')
        && response.body.includes('<html>')
        && response.statusCode === 200;
    }

    /**
    * @method processRequestResults
    * @description Inspect ServiceNow API response for an error
    * @param {error} error - The error argument passed by the request function in its callback.
    * @param {object} response - The response argument passed by the request function in its callback.
    * @param {string} body - The HTML body argument passed by the request function in its callback.
    * @param {iapCallback} callback - Callback a function.
    * @param {(object|string)} callback.data - The API's response. Will be an object if sunnyday path.
    *   Will be HTML text if hibernating instance.
    * @param {error} callback.error - The error property of callback.
    */
    processRequestResults(error, response, body, callback) {

        let callbackData = null;
        let callbackError = null;

        if (error) {
            console.error('Error present.');
            callbackError = error;
        } else if (!validResponseRegex.test(response.statusCode)) {
            console.error('Bad response code.');
            callbackError = response;
        } else if (this.isHibernating(response)) {
            callbackError = 'hibernating';
            console.error(callbackError);
        } else {
            callbackData = response;
        }
        return callback(callbackData, callbackError);
    }

    /**
    * @method sendRequest
    * @description Builds final options
    * @param {object} callOptions - Passed call options.
    * @param {string} callOptions.query - URL query string.
    * @param {string} callOptions.serviceNowTable - The table target of the ServiceNow table API.
    * @param {string} callOptions.method - HTTP API request method.
    * @param {iapCallback} callback - Callback a function.
    * @param {(object|string)} callback.data - The API's response.
    * @param {error} callback.error - The error property of callback.
    */
    sendRequest(callOptions, callback) {
        // Initialize return arguments for callback
        let uri;
        if (callOptions.query)
            uri = this.constructUri(callOptions.serviceNowTable, callOptions.query);
        else
            uri = this.constructUri(callOptions.serviceNowTable);

        const requestOptions = {
            method: callOptions.method,
            auth: {
            user: this.options.username,
            pass: this.options.password,
            },
            baseUrl: this.options.url,
            uri: uri,
        };
        request(requestOptions, (error, response, body) => {
            this.processRequestResults(error, response, body, (processedResults, processedError) => callback(processedResults, processedError));
        });
    }
}
module.exports = ServiceNowConnector;