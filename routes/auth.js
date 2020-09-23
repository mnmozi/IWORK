const express = require("express");
const authController = require("../controllers/auth");
const validator = require("../middleware/validators/auth");
const isAuth = require("../middleware/auth");
const router = express.Router();

router.post("/signup", validator.signupValidator, authController.signup);
router.post("/signin", authController.signin);
module.exports = router;
