const axios = require("axios");

const { PAYPAL_API_BASE } = require("./config");

async function capturePayment(orderId, access_token) {
  const { data } = await axios({
    url: `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  })

  console.log(`💰 Payment for invoice ${data.invoice_id} captured!`);
  return data;
}

module.exports = {
  capturePayment,
};