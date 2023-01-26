const express = require("express");
const router = express.Router();

const start = function (req, res, next) {
	console.log("start->");
	res.redirect("/contactPage");
};

/* GET home page. */
router.get("/", start);
router.get("/contactPage", function (req, res, next) {
	res.render("contactPage", { title: "Contact Page" });
});

module.exports = router;
