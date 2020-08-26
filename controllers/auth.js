const logger = require("winston");
const { validationResult } = require("express-validator");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const dbPool = require("../util/database");

exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed");
      error.URL = req.originalUrl;
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const birthDate = req.body.birthDate;
    const yearsOfXp = req.body.yearsOfXp;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName || "";
    const oldUser = await dbPool.query(
      "SELECT * FROM Users WHERE username = ? or email = ?",
      [username, email]
    );
    if (oldUser[0].length > 0) {
      const error = new Error("username or email Already exists");
      error.statusCode = 403;
      error.data = { username: username, email: email };
      throw error;
    }
    const hashPassword = await bcrypt.hash(password, 12);
    const user = await dbPool.query(
      `INSERT INTO Users(username,password,email,birth_date,years_of_xp,first_name,last_name)
    VALUES (?,?,?,?,?,?,?)`,
      [username, hashPassword, email, birthDate, yearsOfXp, firstName, lastName]
    );
    const jobSeekerRespond = await dbPool.query(
      `INSERT INTO Job_Seekers (username) VALUE (?)`,
      [username]
    );
    const data = {
      username: username,
      email: email,
      birthDate: birthDate,
      yearsOfXp: yearsOfXp,
      firstName: firstName,
      lastName: lastName,
    };
    logger.info("%o", {
      message: "User created!",
      data: data,
    });
    res.status(201).json({
      message: "User created!",
      data: data,
    });
    return;
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.signin = async (req, res, next) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    var userData = await dbPool.query(
      "SELECT * FROM Users WHERE username = ? or email = ?",
      [username, username]
    );
    const user = userData[0][0];
    if (!user) {
      const error = new Error("There is no user with this username or email");
      error.statusCode = 403;
      error.data = { username: username };
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Wrong password");
      error.statusCode = 401;
      error.data = { username: username };
      throw error;
    }
    const token = jwt.sign(
      {
        username: user.username,
        email: user.email,
      },
      process.env.JWTKEY,
      { expiresIn: "10h" }
    );
    delete user["password"];
    logger.info("%o", {
      message: "User Login",
      data: user,
    });
    res.status(200).json({
      token: token,
      username: user.username,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
