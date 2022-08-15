const express = require("express");
const { resolve } = require("path");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const { getAccessToken } = require("./oauth");
const { WEBHOOK_ID, PORT, PAYPAL_API_BASE } = require("./config");
const invoice = require("./invoice");
const order = require("./order");

const app = express();

app.use(express.static(resolve(__dirname, "../client")));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(resolve(__dirname, "../client/index.html"));
});

app.get("/invoice/:invoiceId", async (req, res) => {
  const { invoiceId } = req.params;
  const { access_token } = await getAccessToken();

  try {
    const { id, detail, due_amount } = await invoice.fetch(invoiceId, access_token);

    res.json({
      id: id,
      detail: detail,
      due_amount: due_amount
    });
  } catch (err) {
    return res.sendStatus(404);
  }
});

app.post("/capture/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { access_token } = await getAccessToken();
  const data = await order.capturePayment(orderId, access_token);

  res.json(data);
});

/**
 * Webhook handlers.
 */
app.post("/webhook", async (req, res) => {
  const { access_token } = await getAccessToken();

  const { event_type, resource } = req.body;

  console.log(`🪝 Recieved ${event_type} Webhook Event`);

  /* verify the webhook signature */
  try {
    const { data } = await axios({
      url: `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      data: {
        transmission_id: req.headers["paypal-transmission-id"],
        transmission_time: req.headers["paypal-transmission-time"],
        cert_url: req.headers["paypal-cert-url"],
        auth_algo: req.headers["paypal-auth-algo"],
        transmission_sig: req.headers["paypal-transmission-sig"],
        webhook_id: WEBHOOK_ID,
        webhook_event: req.body,
      },
    });

    const { verification_status } = data;

    if (verification_status !== "SUCCESS") {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.sendStatus(400);
    }
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`);
    return res.sendStatus(400);
  }

  /* capture the order */
  if (event_type === "CHECKOUT.ORDER.APPROVED") {
    try {
      await order.capturePayment(resource.id, access_token);
    } catch (err) {
      console.log(err);
      return res.sendStatus(400);
    }
  }

  if (event_type === "PAYMENT.CAPTURE.COMPLETED") {
    try {
      await invoice.paid(resource.invoice_id, resource.amount, resource.id, access_token);
    } catch (err) {
      console.log(err);
      return res.sendStatus(400);
    }
  }

  res.sendStatus(200);
});

if ('development' === app.get('env')) {
  const open = require('open');

  app.listen(PORT, async () => {
    await open(`http://localhost:${PORT}`);
    console.log(`The app listening at http://localhost:${PORT}`);
  });
}