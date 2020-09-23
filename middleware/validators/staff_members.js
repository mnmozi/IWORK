const { body } = require("express-validator");
const validator = require("validator");

exports.oldPeriodCheck = [
  body("from")
    .isISO8601()
    .isBefore()
    .withMessage("From-date should be before today's date")
    .custom((fromValue, { req }) => {
      if (!validator.isBefore(fromValue, req.body.to)) {
        throw new Error("The from-date should be before the to-date");
      }
    }),
  body("to").isISO8601(),
];

exports.comingPeriodCheck = [
  body("from")
    .isISO8601()
    .isAfter()
    .withMessage("From-date should be after today's date"),
  body("to")
    .isISO8601()
    .isAfter()
    .withMessage("to-date should be after today's date")
    .custom((toValue, { req }) => {
      if (!validator.isAfter(toValue, req.body.from)) {
        throw new Error("The to-date should be after the from-date");
      }
      return true;
    }),
];

exports.applyForRequest = [
  body("replacement")
    .trim()
    .not()
    .isEmpty()
    .withMessage("replacement user is required"),
  body("requestType").not().isEmpty().isBoolean(),
];

exports.idValidation = [body("id").trim().isInt()];
