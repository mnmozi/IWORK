const { body, check, param } = require("express-validator");
const validator = require("validator");
const { validationResult } = require("express-validator");
const dbPool = require("../util/database");
const logger = require("../util/log");

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

exports.applicationOwnerCheck = [
  param("application").custom(async (application, { req }) => {
    const result = await dbPool.query(
      `SELECT * FROM Applications WHERE id = ? AND user = ?`,
      [application, req.username]
    );
    if (result[0].length === 0) {
      throw new Error("You have no application with that ID");
    }
    req.application = result[0][0];
    return true;
  }),
];
exports.setVacationsDays = [
  body("vacations").custom(async (vacations, { req }) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      const application = req.application;
      const result = await dbPool.query(
        `SELECT no_days_off FROM Jobs WHERE title = ? AND department = ? AND company = ?`,
        [application.job, application.department, application.company]
      );
      const daysOff = result[0][0].no_days_off;
      logger.info("%o", daysOff);
      //
      var uniqueRightDaysOff = [];
      vacations.filter((value, index, self) => {
        if (
          validator.isInt(value, { min: 0, max: 6 }) &&
          self.indexOf(value) === index
        ) {
          uniqueRightDaysOff.push([req.username, value]);
          return true;
        }
        return false;
      });
      if (uniqueRightDaysOff.length != daysOff) {
        throw new Error(
          "You must select " +
            daysOff +
            " days to be your vecations, with no duplicates, and only integers"
        );
      }
      req.uniqueRightDaysOff = uniqueRightDaysOff;
      return true;
    }
  }),
];
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
        throw new Error("The to-date should be before the from-date");
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

exports.addQuestionValidation = [body("question").not().isEmpty()];

exports.newJobValidation = [
  body("title")
    .not()
    .isEmpty()
    .custom(async (title, { req }) => {
      const jobCheck = await dbPool.query(
        `SELECT 1 FROM Jobs WHERE title = ? AND department = ? AND company = ?`,
        [title, req.staffMember.department, req.staffMember.company]
      );
      if (jobCheck[0].length === 1) {
        throw new Error("Your department have a job with the same title");
      }
    }),
  body("short_description").not().isEmpty(),
  body("detailed_description").not().isEmpty(),
  body("min_xp").not().isEmpty().isInt(),
  body("salary").isInt(),
  body("no_of_vacancies").isInt(),
  body("questions").custom(async (questions, { req }) => {
    // logger.info("%o", questions);
    const questionsCheck = await dbPool.query(
      `SELECT COUNT(id) AS count FROM Questions WHERE id IN(?) AND company = ? AND department = ?`,
      [questions, req.staffMember.company, req.staffMember.department]
    );
    // logger.info("%o", questionsCheck[0][0].count);
    if (questionsCheck[0][0].count !== questions.length) {
      throw new Error("something wrong with the questions IDs provided");
    }
  }),
  body("working_hours").isInt(),
  body("deadline").isISO8601().isAfter(),
  body("work_time").isIn(["full", "part"]),
  body("role").isIn(["regular", "hr", "manager"]),
  body("no_days_off").isInt(),
];
