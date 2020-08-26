const logger = require("winston");

const dbPool = require("../util/database");

exports.getCompany = async (req, res, next) => {
  try {
    const companyEmail = req.params.companyEmail;
    const company = await dbPool.query(
      "SELECT * FROM Companies WHERE email = ?",
      [companyEmail]
    );
    const departments = await dbPool.query(
      "SELECT * FROM Departments WHERE company = ?",
      [companyEmail]
    );
    res.status(201).json({
      company: company[0],
      Departments: departments[0],
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.companyFilter = async (req, res, next) => {
  try {
    const companyName = req.body.companyName;
    const companyAddress = req.body.companyAddress;
    const type = req.body.type;
    var result;
    if (!companyName && !companyAddress && !type) {
      result = await dbPool.query("SELECT * FROM Companies");
    } else {
      result = await dbPool.query(
        `SELECT * FROM Companies WHERE name LIKE ? OR address LIKE ? OR type = ?`,
        ["%" + companyName + "%", "%" + companyAddress + "%", type]
      );
    }
    // logger.info("%o", { data: result[0] });
    res.status(201).json({
      data: result[0],
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
