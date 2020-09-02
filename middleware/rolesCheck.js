const logger = require("winston");
const dbPool = require("../util/database");

exports.staffMemberQuery = async (req, res, next) => {
  try {
    const username = req.username;
    const staffMember = await dbPool.query(
      `SELECT * FROM Staff_Members WHERE username = ?`,
      [username]
    );
    if (staffMember[0].length !== 1) {
      const error = new Error("UNAUTHORIZED ACTION Employee check");
      error.statusCode = 401;
      throw error;
    }
    req.staffMember = staffMember[0][0];
    next();
  } catch (err) {
    next(err);
  }
};
exports.hrCheck = async (req, res, next) => {
  try {
    const username = req.username;
    const result = await dbPool.query(
      `SELECT Staff_Members.* FROM Staff_Members JOIN Hrs ON Staff_Members.username = Hrs.username WHERE Staff_Members.username = ?`,
      [username]
    );
    if (result[0].length !== 1) {
      const error = new Error("UNAUTHORIZED ACTION Hr check");
      error.statusCode = 401;
      throw error;
    }
    req.staffMember = result[0][0];
    next();
  } catch (err) {
    next(err);
  }
};
