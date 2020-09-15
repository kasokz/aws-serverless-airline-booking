const AWS = require('../catalog/src/release-flight/node_modules/aws-sdk'),
  ssm = new AWS.SSM(),
  qs = require('querystring'),
  processResponse = require('./src/process-response'),
  createCharge = require('./src/create-charge'),
  STRIPE_SECRET_KEY_NAME = `/${process.env.SSM_PARAMETER_PATH}`
  IS_CORS = true;
  stripeSecretKeys = "";
  _cold_start = true

exports.handler = (event, context) => {
    if (_cold_start) {
        _cold_start = false
		console.log("COLDSTART " + context.awsRequestId)
    }
  if (event.httpMethod === 'OPTIONS') {
    return Promise.resolve(processResponse(IS_CORS));
  }
  if (!event.body) {
    return Promise.resolve(processResponse(IS_CORS, 'invalid', 400));
  }

  const chargeRequest = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
  if (!chargeRequest.amount || !chargeRequest.currency) {
    return Promise.resolve(processResponse(IS_CORS, 'invalid arguments, please provide amount and currency fields as mentioned in the app README', 400));
  }

  if (stripeSecretKeys === "") {
	  return ssm.getParameter({ Name: STRIPE_SECRET_KEY_NAME, WithDecryption: true }).promise()
	  .then(response => {
		  stripeSecretKeys = response.Parameter.Value.split(',');
		  keyId = 0;
		  if(typeof(chargeRequest.stripeKey) !== "undefined"){
			  keyId = chargeRequest.stripeKey
		  }
		  const stripeSecretKeyValue = stripeSecretKeys[keyId]
		   return createCharge(stripeSecretKeyValue, chargeRequest.stripeToken, chargeRequest.email, chargeRequest.amount, chargeRequest.currency, chargeRequest.description);
	  }).then(createdCharge => processResponse(IS_CORS, {createdCharge }))
	  .catch((err) => {
		  console.log(err);
		  return processResponse(IS_CORS, { err }, 500);
	  });
  } else {
	  keyId = 0;
	  if(typeof(chargeRequest.stripeKey) !== "undefined"){
		keyId = chargeRequest.stripeKey
	  }
	  const stripeSecretKeyValue = stripeSecretKeys[keyId]
	  return createCharge(stripeSecretKeyValue, chargeRequest.stripeToken, chargeRequest.email, chargeRequest.amount, chargeRequest.currency, chargeRequest.description)
      .then(createdCharge => processResponse(IS_CORS, {createdCharge }))
	  .catch((err) => {
		  console.log(err);
		  return processResponse(IS_CORS, { err }, 500);
	  });
  }
};
