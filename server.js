require("dotenv").config();
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const nodemailer = require("nodemailer");

const { indexRoute, paymentRoute } = require("./routes/pages");
const { createOrderRoute, captureOrder } = require("./routes/payment");
const { plansRoute } = require("./routes/plans/plans");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(cors());
app.use(express.static("public")); // Remove redundant express.static()
app.use(express.json()); // This includes body-parser functionality
app.use(bodyParser.urlencoded({ extended: false })); // Remove redundant body-parser middleware

// Define routes for terms and privacy policy
app.get("/terms", (req, res) => {
  res.render("terms");
});

app.get("/privacy-policy", (req, res) => {
  res.render("privacy-policy");
});

app.get("/payment-success", (req, res) => {
  res.render("payment-success");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/plans", plansRoute);

// Define your route to render the index.ejs template
app.get("/", indexRoute);

app.get("/payment", paymentRoute);

app.post("/create-order", createOrderRoute);

app.get("/capture-order", captureOrder);

// handle not found URLs.
app.get("*", (req, res) => {
  res.status(404).send("Not Found 404!");
});

// Middleware for catching errors.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.post("/send_email", function(req, res){
  var name = req.body.name;
  var email = req.body.email;
  var phone = req.body.phone;
  var country = req.body.country;
  var city = req.body.city;
  var age = req.body.age;
  var gender = req.body.gender;
  var lessontime = req.body.lessontime;

  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    },
  });
  // Email sent to Dar Arqam
  var darArqamMailOptions = {
    from: name,
    to: process.env.EMAIL,
    subject: "New Trial",
    text: `
    Assalamu Alaikum, You Have a New Free Trial.\nName: ${name}
    \nEmail: ${email}\nPhone Number: ${phone}\nCountry: ${country}
    \nCity: ${city}\nAge: ${age}\nGender: ${gender}\nLesson time: ${lessontime}
    `,
  }

  // Email sent to the student
  // var studentMailOptions = {
  //   from: name,
  //   to: email,
  //   subject: "Welcome to Dar Arqam",
  //   html: `
  //   <div style="background-color: #f0efef; padding: 20px; ">
  //     <div style="max-width: 600px; margin: 0 auto; padding: 15px; border-radius: 5px; background-color: #ffffff;">
  //       <p>Assalamu Alaykum, ${name}. Welcome to Dar Arqam!</p>
  //       <p style="text-align: center; font-size: 17px;">We will contact you shortly to schedule your free trial lesson.</p>
  //       <p>Jazak Allah Khayran.</p>
  //       <p style="font-family: 'Old English Text MT', 'Old English'; font-size: 24px;">
  //         <a href="https://dararqam.com" target="_blank" style="text-decoration: none; color: #800080;">Dar Arqam</a>
  //       </p>
  //     </div>
  //   </div>
  //   `,
  // };

  // Send emails
  transporter.sendMail(darArqamMailOptions, function (error1, info1) {
    if (error1) {
      console.log("Error sending email to Dar Arqam:", error1);
    } else {
      console.log("Email sent to Dar Arqam", info1.response);
    }

    transporter.sendMail(studentMailOptions, function (error2, info2) {
      if (error2) {
        console.log("Error sending email to the student:", error2);
      } else {
        console.log("Email sent to the student", info2.response);
      }

      res.redirect("/");
    });
  });
})

const port = process.env.PORT || 3000; // some of the hosting providers will provide you with the appropriate port in the PORT variable
app.listen(port);
