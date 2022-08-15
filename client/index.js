/* eslint-disable  no-alert, no-unused-vars */

const urlParams = new URLSearchParams(window.location.search);
const paypalButtons = document.querySelectorAll(".paypal-button");
const order = {
    // intent: "CAPTURE",
    purchase_units: []
};

paypalButtons.forEach((el) => {
    el.style.pointerEvents = "none";
});

fetch(`/invoice/${urlParams.get('invoice')}`, {
    method: "get",
})
    .then((res) => res.json())
    .then((data) => {
        order.purchase_units = [{
            invoice_id: data.id,
            amount: {
                value: data.due_amount.value,
                currency_code: data.due_amount.currency_code,
            },
        }];

        // prefill form
        const form = document.querySelector("form[name=purchase_unit]");

        form.elements["invoice_number"].value = data.detail.invoice_number;
        form.elements["amount[value]"].value = data.due_amount.value;
        form.elements["amount[currency_code]"].value = data.due_amount.currency_code;

        // enable buttons
        paypalButtons.forEach((el) => {
            el.style.pointerEvents = "auto";
        });
    })
    .catch(console.error);

/* Paypal */
paypal
  .Marks({
    fundingSource: paypal.FUNDING.PAYPAL,
  })
  .render("#paypal-mark");

paypal
  .Buttons({
    fundingSource: paypal.FUNDING.PAYPAL,
    style: {
      label: "pay",
      color: "silver",
    },
    createOrder(data, actions) {
      return actions.order.create(order);
    },
    onApprove(data, actions) {
      return actions.order.capture().then(function (details) {
        alert(`Transaction completed by ${details.payer.name.given_name}!`);
      });
    },
  })
  .render("#paypal-btn");

/* P24 */
paypal
  .Marks({
    fundingSource: paypal.FUNDING.P24,
  })
  .render("#p24-mark");

paypal
  .PaymentFields({
    fundingSource: paypal.FUNDING.P24,
    style: {},
    fields: {
      name: {
        value: "",
      },
    },
  })
  .render("#p24-container");

paypal.Buttons({
  fundingSource: paypal.FUNDING.P24,
  style: {
    label: "pay",
  },
  createOrder(data, actions) {
    return actions.order.create(order);
  },
  onApprove(data, actions) {
    fetch(`/capture/${data.orderID}`, {
      method: "post",
    })
      .then((res) => res.json())
      .then((data) => {
        swal(
          "Order Captured!",
          `Id: ${data.id}, ${Object.keys(data.payment_source)[0]}, ${
            data.purchase_units[0].payments.captures[0].amount.currency_code
          } ${data.purchase_units[0].payments.captures[0].amount.value}`,
          "success"
        );
      })
      .catch(console.error);
  },
  onCancel(data, actions) {
    swal("Order Canceled", `ID: ${data.orderID}`, "warning");
  },
  onError(err) {
    console.error(err);
  },
})
.render("#p24-btn");


document.getElementById("p24-btn").style.display = "none";
document.getElementById("p24-container").style.display = "none";

/* Radio buttons */
// Listen for changes to the radio buttons
document.querySelectorAll("input[name=payment-option]").forEach((el) => {
  // handle button toggles
  el.addEventListener("change", (event) => {
    switch (event.target.value) {
      case "paypal":
        document.getElementById("p24-container").style.display = "none";
        document.getElementById("p24-btn").style.display = "none";

        document.getElementById("paypal-btn").style.display = "block";

        break;
      case "p24":
        document.getElementById("p24-container").style.display = "block";
        document.getElementById("p24-btn").style.display = "block";

        document.getElementById("paypal-btn").style.display = "none";
        break;

      default:
        break;
    }
  });
});
