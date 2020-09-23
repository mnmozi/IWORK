const { body, param } = require("express-validator");
const validator = require("validator");

exports.updateProfileValidator = [
  body("new_birth_date").custom((value) => {
    if (value && !validator.isISO8601(value) && !validator.isBefore(value)) {
      throw new Error("Birth date should be YYYY-MM-DD and a valid date");
    }
    return true;
  }),
  body("new_years_of_xp").custom((value) => {
    if (value && !Number.isInteger(value)) {
      throw new Error("Years of experiance should be int");
    }
    return true;
  }),
  body("new_first_name").not().isEmpty().isAlpha(),
  body("new_last_name").custom((value) => {
    if (value && value != "" && !validator.isAlpha(value)) {
      throw new Error("last name should be alphabetic only");
    }
    return true;
  }),
];
