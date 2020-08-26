const logger = require("winston");
const dbPool = require("../util/database");
const { validationResult } = require("express-validator");
const validator = require("validator");

exports.proflie = async (req, res, next) => {
  const username = req.username;
  var result;
  const userData = await dbPool.query(
    `SELECT username,email,birth_date,years_of_xp,first_name,last_name,job_status FROM Users WHERE username = ?`,
    [username]
  );
  result = userData[0][0];
  if (userData[0][0].job_status != "job_seeker") {
    const staffMember = await dbPool.query(
      `SELECT * FROM Staff_Members WHERE username  = ?`,
      [username]
    );
    result = { ...result, ...staffMember[0][0] };
    if (staffMember[0][0].job_status === "manager") {
      const managerData = await dbPool.query(
        `SELECT * FROM Managers WHERE username = ? `,
        [username]
      );
      result = { ...result, ...managerData[0][0] };
    }
  }
  res.status(201).json(result);
};
exports.editProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed");
      error.URL = req.originalUrl;
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const username = req.username;
    const userData = await dbPool.query(
      `SELECT username,email,birth_date,years_of_xp,first_name,last_name,job_status FROM Users WHERE username = ?`,
      [username]
    );

    const new_birth_date = !req.body.new_birth_date
      ? userData[0][0].birth_date
      : new Date(req.body.new_birth_date);
    const new_years_of_xp = !req.body.new_years_of_xp
      ? userData[0][0].years_of_xp
      : req.body.new_years_of_xp;
    const new_first_name = !req.body.new_first_name
      ? userData[0][0].first_name
      : req.body.new_first_name;
    const new_last_name =
      typeof userData[0][0].last_name === "undefined"
        ? userData[0][0].last_name
        : req.body.new_last_name;

    if (
      new_birth_date.getTime() == userData[0][0].birth_date.getTime() &&
      new_years_of_xp === userData[0][0].years_of_xp &&
      new_first_name === userData[0][0].first_name &&
      new_last_name === userData[0][0].last_name
    ) {
      res.status(400).json({ message: "Your Data is the same" });
      return;
    }
    const updateResult = await dbPool.query(
      `UPDATE Users
  SET birth_date = ?, years_of_xp = ?, first_name = ? , last_name = ?
  WHERE username = ? `,
      [new_birth_date, new_years_of_xp, new_first_name, new_last_name, username]
    );
    res.status(201).json({ message: "Updated Successfully" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
