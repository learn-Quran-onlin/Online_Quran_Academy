const { lessons } = require("../../database/lessons");

const tuitionsRoute = (req, res) => {
  res.render("tuitions", {
    lessons: Array.from(lessons.values()), // converts it to an array
  }); // Renders index.ejs from the views directory with the lessons
};

module.exports = {tuitionsRoute}