const logger = require("winston");

const dbPool = require("../util/database");

exports.availableVacancies = async (req, res, next) => {
  try {
    const companyDomain = req.params.companyDomain;
    const departmentCode = req.query.departmentCode;
    var result;
    if (!departmentCode) {
      //retrun all departments with vacancies > 0
      result = await dbPool.query(
        "SELECT * from Jobs where company = ? and no_of_vacancies > 0 ORDER BY department",
        [companyDomain]
      );
    } else {
      //return the specific department available vacancies
      result = await dbPool.query(
        "SELECT * from Jobs where company = ? and department = ? and no_of_vacancies > 0 ",
        [companyDomain, departmentCode]
      );
    }
    res.status(201).json({
      jobs: result[0],
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.highAvgSalariesCompanies = async (req, res, next) => {
  try {
    const result = await dbPool.query(
      `SELECT AVG(salary) AS avgSalary , company FROM Jobs GROUP BY company ORDER BY avgSalary DESC`
    );
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
exports.searchByNameOrDesc = async (req, res, next) => {
  try {
    var filterInput = req.query.filterInput;
    if (!filterInput) {
      filterInput = "";
    }
    logger.info(filterInput);
    const result = await dbPool.query(
      `
    SELECT Jobs.*,Departments.name AS department_Name 
    FROM Jobs 
    JOIN Departments
    ON Jobs.department = Departments.code AND Jobs.company = Departments.company
    WHERE Jobs.no_of_vacancies > 0 AND ( Jobs.title OR Jobs.short_description LIKE ? )`,
      ["%" + filterInput + "%"]
    );
    logger.info(result[0]);
    res.status(201).json(result[0]);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
