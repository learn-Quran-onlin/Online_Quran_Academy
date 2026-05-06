require("dotenv").config();
const cors = require("cors");
const express = require("express");
const fs = require("fs");
// const morgan = require('morgan');
const bodyParser = require("body-parser");
const path = require("path");
const nodemailer = require("nodemailer");
// const axios = require('axios');

const { indexRoute, paymentRoute } = require("./routes/pages");
const { createOrderRoute, captureOrder } = require("./routes/payment");
const { tuitionsRoute } = require("./routes/tuitions/tuitions");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(cors());
app.use(express.static("public")); // Remove redundant express.static()
app.use(express.json()); // This includes body-parser functionality
app.use(bodyParser.urlencoded({ extended: false })); // Remove redundant body-parser middleware

// app.use(morgan('combined'));

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

app.get("/blog", (req, res) => {
  res.render("blog");
});

app.get("/trial", (req, res) => {
  res.render("trial");
});

app.get("/courses", (req, res) => {
  res.render("courses");
});

// Function to get all article filenames dynamically
function getValidArticles() {
  const articlesPath = path.join(__dirname, "views", "articles");
  return fs.readdirSync(articlesPath)
    .filter(file => file.endsWith(".ejs"))
    .map(file => file.replace(".ejs", ""));
}

// Dynamic article list
let validArticles = getValidArticles();

app.get("/:articleName", (req, res, next) => {
  const articleName = req.params.articleName;

  if (validArticles.includes(articleName)) {
    res.render(`articles/${articleName}`);
  } else {
    next(); // Pass to 404 handler
  }
});

app.get("/tuitions", tuitionsRoute);

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
  var course = req.body.course.split(",");
  var message = req.body.message;

  const courseNames = {
    "quranic-arabic": "Quranic Arabic Course",
    "arabic-kids": "Arabic Course for Kids",
    "arabic-adults": "Arabic Course for Adults",
    "arabic-conversation": "Arabic Conversation Course",
    "arabic-grammar": "Arabic Grammar Course",
    "islamic-kids": "Islamic Studies for Kids",
    "islamic-adults": "Islamic Studies for Adults",
    "noorani-qaida": "Noorani Qaida Course",
    "new-muslim": "New Muslim Converts Course",
    "quran-kids": "Quran for Kids Course",
    "quran-tajweed": "Quran with Tajweed Course",
    "quran-memorization": "Quran Memorization Course",
    "quran-hifz": "Quran Hifz Course",
    "quran-recitation": "Quran Recitation Course",
    "quran-ijazah": "Quran Ijazah Course",
    "tajweed-rules": "Tajweed Rules Course",
    "tafseer-quran": "Tafseer Quran Course",
    "10-qiraat": "10 Qiraat Quran Course",
    "modern-standard-arabic": "Modern Standard Arabic"
};
  // Convert the received courses into full names
  var fullCourseNames = course.map(c => courseNames[c] || c).join(", ");

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
    text: `Assalamu Alaikum, You Have a New Free Trial.\n
    Name: ${name}
    Email: ${email}
    Phone Number: ${phone}
    Country: ${country}
    City: ${city}
    Age: ${age}
    Gender: ${gender}
    Course: ${fullCourseNames}
    Message: ${message}`,
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

// reCAPTCHA
// app.post('/send_email', async (req, res) => {
//   const recaptchaResponse = req.body['g-recaptcha-response'];
//   const secretKey = 'YOUR_SECRET_KEY';

//   try {
//     const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
//       params: {
//         secret: secretKey,
//         response: recaptchaResponse
//       }
//     });

//     const result = response.data;

//     if (result.success) {
//       // The reCAPTCHA verification was successful
//       // Proceed with form processing and email sending
//       res.send('Form successfully submitted!');
//     } else {
//       // The reCAPTCHA verification failed
//       res.status(400).send('reCAPTCHA verification failed. Please try again.');
//     }
//   } catch (error) {
//     console.error('Error verifying reCAPTCHA:', error);
//     res.status(500).send('An error occurred while verifying reCAPTCHA.');
//   }
// });
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

const port = process.env.PORT || 4000; // some of the hosting providers will provide you with the appropriate port in the PORT variable
app.listen(port);
