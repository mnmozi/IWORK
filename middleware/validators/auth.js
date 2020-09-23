const { body } = require("express-validator");

exports.signupValidator = [
  body("email").isEmail().withMessage("Please enter a valid email address"),
  body("password")
    .trim()
    .isLength({ min: 5 })
    .withMessage("password need to be minimum 5")
    .isAscii()
    .withMessage("Password should be in length 5"),
  body("username").trim().not().isEmpty(),
  body("birthDate").isISO8601().isBefore(),
  body("yearsOfXp").isInt(),
  body("firstName").not().isEmpty(),
];
