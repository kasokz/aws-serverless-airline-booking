const fetch = require('node-fetch');

let coldStart = true;

let paymentEndpoint = process.env.PAYMENT_API_URL;

async function collectPayment(chargeId, stripeKey) {
  if (!paymentEndpoint) {
    throw new Error("Payment API URL is invalid -- Consider reviewing PAYMENT_API_URL env");
  }
  let paymentPayload = { "chargeId": chargeId, "stripeKey": stripeKey };
  try {
    const ret = await fetch.default(paymentEndpoint, {
      method: "POST",
      body: JSON.stringify(paymentPayload),
      headers: { 'Content-Type': 'application/json' }
    });
    if (ret.status < 200 || ret.status >= 300) {
      throw new Error("Error occured!");
    }
    const paymentResponse = await ret.json();
    return {
      "receiptUrl": paymentResponse.capturedCharge.receipt_url,
      "price": paymentResponse.capturedCharge.amount
    }
  } catch (err) {
    throw err;
  }
}

async function lambdaHandler(event, context) {
  if (coldStart) {
    coldStart = true;
    console.log("COLDSTART", context.awsRequestId);
  }
  const preAuthorizationToken = event.chargeId;
  const customerId = event.customerId;
  const stripeKey = event.stripeKey;

  if (!preAuthorizationToken) {
    throw new Error("Invalid Charge ID");
  }
  try {
    const ret = collectPayment(preAuthorizationToken, stripeKey);
    return ret
  } catch (err) {
    throw err;
  }
}
