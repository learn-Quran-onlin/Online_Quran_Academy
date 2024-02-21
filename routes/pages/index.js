const { lessons } = require("../../database/lessons");

const indexRoute = (req, res) => {
  res.render("index", {
    lessons: Array.from(lessons.values()), // converts it to an array
  }); // Renders index.ejs from the views directory with the lessons
};

const paymentRoute = (req, res) => {
  const lessonId = Number(req.query.lessonId);
  const lesson = lessons.get(lessonId);

  res.render("payment", {
    lesson,
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
  });
};

module.exports = {
  indexRoute,
  paymentRoute,
};
