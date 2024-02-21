const { lessons } = require("../../database/lessons");

const plansRoute = (req, res) => {
  res.render("plans", {
    lessons: Array.from(lessons.values()), // converts it to an array
  }); // Renders index.ejs from the views directory with the lessons
};

module.exports = {plansRoute}