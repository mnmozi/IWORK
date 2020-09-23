const { body, param } = require("express-validator");
const validator = require("validator");
const { validationResult } = require("express-validator");
const dbPool = require("../../util/database");

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
