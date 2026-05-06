const paypal = require("@paypal/checkout-server-sdk");

const express = require("express");
const nodemailer = require("nodemailer");
const app = express();

const fs = require("fs").promises;
const { DOMAIN, adminEmail } = require("../../lib/utils");
const { lessons } = require("../../database/lessons");
const { transporter } = require("../../lib/email/transporter");

const Environment =
  process.env.NODE_ENV === "production"
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment;

const paypalClient = new paypal.core.PayPalHttpClient(
  new Environment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
);

const createOrderRoute = async (req, res) => {
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    // console.log({ request });

    const lessonId = Number(req.body.lessonId);
    const lesson = lessons.get(lessonId);
    let lessonOriginalPrice = lesson.price;
    // console.log({ lesson });

    const months = Number(req.body.months);
    lessonOriginalPrice = lessonOriginalPrice * months;

    // let discountedPrice = lessonOriginalPrice;
    // if (months == 12) {
    //   discountedPrice = Math.floor(lessonOriginalPrice * 0.85); // 15% discount
    // } else if (months >= 6) {
    //   discountedPrice = Math.floor(lessonOriginalPrice * 0.93); // 7% discount
    // } else if (months >= 3) {
    //   discountedPrice = Math.floor(lessonOriginalPrice * 0.97); // 3% discount
    // }

    const processingFees = Number((lessonOriginalPrice * 0.05).toFixed(2)); // Paypal Fees

    const total = (lessonOriginalPrice) + (processingFees);

    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      application_context: {
        cancel_url: DOMAIN ,
        return_url: DOMAIN + "/payment-success",
        // payment_method: "",
        user_action: "PAY_NOW",
      },
      purchase_units: [
        {
          description: "Lessons Course.",
          amount: {
            currency_code: "USD",
            value: total,
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: total,
              },
            },
          },
          items: [
            {
              name: lesson.name,
              unit_amount: {
                currency_code: "USD",
                value: total,
              },
              quantity: 1,
              description: `${lesson.name} for: ${months} months.`,
              category: "DIGITAL_GOODS",
            },
          ],
        },
      ],
    });

    // res.status(500).json({ orderBody: request.body });
    const order = await paypalClient.execute(request);
    console.log({ order });

    const jsonFilePath = "./database/orders.json";
    const data = await fs.readFile(jsonFilePath, "utf8");

    // you should validate these things first.
    const newRecord = {
      orderId: order.result.id,
      amount: total,
      email: req.body.email,
      fullName: req.body.fullName,
      agreeToTerms: req.body.agreeToTerms,
      status: "PENDING",

      lessonName: lesson.name,
      months: months,
    };

    let jsonData = JSON.parse(data);
    jsonData.push(newRecord);

    const updatedJsonData = JSON.stringify(jsonData, null, 2);

    await fs.writeFile(jsonFilePath, updatedJsonData, "utf8");

    for (const linkObject of order.result.links) {
      if (linkObject.rel === "approve") {
        return res.redirect(linkObject.href);
      }
    }
  } catch (e) {
    console.log({ error: e });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const captureOrder = async (req, res) => {
  try {
    console.log({ query: req.query });
    const orderId = req.query.token;
    const payerId = req.query.PayerID;

    // get order from the database
    const readData = await fs.readFile("./database/orders.json");
    const orders = JSON.parse(readData);

    const currentOrder = orders.find((order) => {
      return order.orderId == orderId && order.status == "PENDING";
    });
    console.log({ currentOrder });
    if (!currentOrder) {
      return res.status(400).json({ error: "No order found!" });
    }

    // capture the order after the use approved it
    const request = new paypal.orders.OrdersGetRequest(orderId);
    // request.requestBody({});

    const response = await paypalClient.execute(request);
    console.log(`Capture: ${JSON.stringify(response.result)}`); // Here you will find all the oder deatils of the Paypal payments such as the payer payapl email0

    if (response.result.status !== "APPROVED") {
      return res.status(400).json({ error: "Order Is Not Approved!" });
    }
    // update the payment status
    const updatedOrders = orders.map((order) =>
      order.orderId === orderId ? { ...order, status: "COMPLETED" } : order
    );

    await fs.writeFile(
      "./database/orders.json",
      JSON.stringify(updatedOrders, null, 2),
      "utf8"
    );

    // send email to Dar Arqam
    const darArqamMailOptions = {
      from: adminEmail,
      to: process.env.EMAIL,
      subject: "New Student",
      text: `Assalamu Alaikum, You have a New Student.\nName: ${currentOrder.fullNamee}\nEmail: ${currentOrder.mail}\nLesson details: ${currentOrder.lessonName} for ${currentOrder.months} months`,
    };
    // send email to the student
    const studentMailOptions = {
      from: adminEmail,
      to: currentOrder.email,
      subject: "Welcome to Dar Arqam",
      html: `
      <div style="background-color: #f0efef; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; padding: 15px; border-radius: 5px; background-color: #ffffff;">
          <p>Assalamu Alaykum, ${currentOrder.fullName}.</p>
          <p style="text-align: center; font-weight: bold; font-size: 18px;">You have successfully chosen your plan.</p>
          <p style="text-align: center; font-weight: bold;">${currentOrder.lessonName} per week, for ${currentOrder.months} months (Month = 4 Weeks).</p>
          <p>Let us consistently remind ourselves of the perpetual renewal of our intentions. Let our intentions be solely devoted to Allah, particularly as we learn the Quran and every facet of our lives.</p>
          <p>Jazak Allah Khayran.</p>
          <p style="font-family: 'Old English Text MT', 'Old English'; font-size: 24px;">
            <a href="https://dararqam.com" target="_blank" style="text-decoration: none; color: #800080;">Dar Arqam</a>
          </p>
        </div>
      </div>
      `,
    };

    const dinfo = await transporter.sendMail(darArqamMailOptions);
    // console.log("Email sent:", dinfo.response);
    const info = await transporter.sendMail(studentMailOptions);
    // console.log("Email sent:", info.response);

    res.redirect(DOMAIN + "/payment-success"); // this page is not available yet.
  } catch (e) {
    console.log({ error: e });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createOrderRoute,
  captureOrder,
};
