const axios = require("axios");

const { PAYPAL_API_BASE } = require("./config");

async function fetch(invoiceId, access_token) {
  const { data } = await axios({
    url: `${PAYPAL_API_BASE}/v2/invoicing/invoices/${invoiceId}`,
    method: "get",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
  });

  console.log(`🧾 Invoice #${invoiceId} fetched`);
  return data;
}

async function paid(invoiceId, amount, paymentId, access_token) {
  const { data } = await axios({
    url: `${PAYPAL_API_BASE}/v2/invoicing/invoices/${invoiceId}/payments`,
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    data: {
      method: 'PAYPAL',
      amount: amount,
      payment_date: new Date().toISOString().slice(0, 10),
      // payment_id: paymentId, # Bad request error: The specified resource does not exist
    },
  });

  console.log(`✔ Invoice #${invoiceId} marked as paid`);
  return data;
}

module.exports = {
    fetch,
    paid,
};