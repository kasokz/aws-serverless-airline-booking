const fetch = require('node-fetch');

const paymentEndpoint = process.env.PAYMENT_API_URL;

let coldStart = true;

async function refundPayment(chargeId) {
  if (!paymentEndpoint) {
    throw new Error("Payment API URL is invalid -- Consider reviewing PAYMENT_API_URL env");
  }
  const refundPayload = { "chargeId": chargeId };
  try {
    const ret = await fetch.default(paymentEndpoint, {
      method: "POST",
      body: JSON.stringify(refundPayload),
      headers: { 'Content-Type': 'application/json' }
    });
    if (ret.status < 200 || ret.status >= 300) {
      throw new Error("Error occured!");
    }
    const refundResponse = await ret.json();

    return { "refundId": refundResponse.createdRefund.id };
  } catch (err) {
    throw err;
  }
}

async function lambdaHandler(event, context) {
  if (coldStart) {
    coldStart = false;
    console.log("COLDSTART", context.awsRequestId);
  }
  const paymentToken = event.chargeId;
  const customerId = event.customerId

  if (!paymentToken) {
    throw new Error("Invalid Charge ID");
  }
  try {
    const ret = refundPayment(paymentToken);
    return ret;
  } catch (err) {
    throw err;
  }
}