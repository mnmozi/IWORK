const logger = require("winston");

const { validationResult } = require("express-validator");

const dbPool = require("../util/database");
const { default: validator } = require("validator");

exports.viewRequests = async (req, res, next) => {
  const username = req.username;
  const staffMember = req.staffMember;
  let requests;
  if (staffMember.type === "HR") {
    // view all request in that department
    requests = await dbPool.query(
      `SELECT * FROM Requests 
        JOIN Staff_Members ON Requests.username = Staff_Members.username  
        WHERE Staff_Members.department = ? AND Staff_Members.company = ? AND manager_response IS NULL`,
      [staffMember.department, staffMember.company]
    );
  } else {
    //else I can view all request except for hr employees
    requests = await dbPool.query(
      `SELECT * FROM Requests 
    JOIN Staff_Members ON Requests.username = Staff_Members.username  
    WHERE Staff_Members.department = ? 
    AND Staff_Members.company = ? 
    AND manager_response IS NULL 
    AND Requests.username NOT IN (SELECT Hrs.username FROM Hrs)`,
      [staffMember.department, staffMember.company]
    );
  }
  const returnedObject = {
    message: "Requests Need to be reviewed",
    username: username,
    Data: { requests: requests[0] },
    URL: req.originalUrl,
  };
  res.status(201).json({ returnedObject });
};

exports.requestRespond = async (req, res, next) => {
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
    const staffMember = req.staffMember;
    const requestId = req.body.requestId;
    const respond = req.body.respond;
    const reason = req.body.reason || null;
    const request = req.request;
    //check if the request owner is a hr employee if so then the annual leaves should be updated
    if (staffMember.type === "HR") {
      const hrCheck = await dbPool.query(
        `SELECT 1 FROM Hrs WHERE Hrs.username = ?`,
        [request.username]
      );
      if (hrCheck[0].length === 1 && respond === "1") {
        const daysOffQuery = await dbPool.query(
          "SELECT * FROM Staff_DaysOff WHERE user = ?",
          [request.username]
        );
        const daysOff = [];
        daysOffQuery[0].forEach((value, index, self) => {
          daysOff.push(value.day);
        });

        const to = new Date(request.to);
        const from = new Date(request.from);

        var ndays = 1 + Math.round((to - from) / (24 * 3600 * 1000));
        let totalDays = daysOff.reduce((total, currentValue, index) => {
          return (
            total +
            Math.floor((ndays + ((from.getDay() + 6 - currentValue) % 7)) / 7)
          );
        }, 0);

        const annualLeavesLeft = request.annual_leaves - (ndays - totalDays);
        if (annualLeavesLeft < 0) {
          const error = new Error(
            `You can't accept this request as the annual leaves of ${request.username} are not enough`
          );
          error.username = username;
          throw error;
        }
        const staffMemberUpdateResult = await dbPool.query(
          `UPDATE Staff_Members SET annual_leaves = ? WHERE username = ?`,
          [annualLeavesLeft, request.username]
        );
        if (staffMemberUpdateResult[0].affectedRows !== 1) {
          const error = new Error(
            "Error while updating the staff_member annual leaves"
          );
          error.username = username;
          throw error;
        }
      }
    }

    const result = await dbPool.query(
      `UPDATE Requests SET Requests.manager_response = ? , Requests.manager = ? , Requests.manager_reason = ? WHERE Requests.id = ?`,
      [respond, username, reason, requestId]
    );
    if (result[0].affectedRows !== 1) {
      const error = new Error("Error while inserting Announcement");
      error.username = username;
      throw error;
    }

    const returnedObject = {
      message: "Your response has been saved",
      username: username,
      Data: { request: requestId, response: respond, reason: reason },
      URL: req.originalUrl,
    };
    logger.info("%o", returnedObject);
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.getApplications = async (req, res, next) => {
  try {
    const username = req.username;
    const staffMember = req.staffMember;

    const result = await dbPool.query(
      `SELECT Applications.*, Jobs.*, Users.email,Users.birth_date,Users.first_name,Users.last_name,Users.years_of_xp,Jobs.* FROM Applications 
    JOIN Jobs ON Applications.job = Jobs.title AND Applications.company = Jobs.company AND Applications.department = Jobs.department 
    JOIN Users ON Applications.user = Users.username
    WHERE Applications.company = ? AND Applications.department = ? AND Applications. hr_response = 1 
  `,
      [staffMember.company, staffMember.department]
    );
    const returnedObject = {
      message: "Applications",
      username: username,
      Data: { Applications: result[0] },
      URL: req.originalUrl,
    };
    logger.info("%o", returnedObject);
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.applicationsRespond = async (req, res, next) => {
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
    const staffMember = req.staffMember;
    const applicationId = req.body.applicationId;
    const response = req.body.response;

    const updateResult = await dbPool.query(
      `UPDATE Applications SET manager_response = ?,manager = ? WHERE Applications.id = ?`,
      [response, username, applicationId]
    );
    logger.info("%o", updateResult);
    if (updateResult[0].affectedRows !== 1) {
      const error = new Error("Error while updating the application");
      error.username = username;
      throw error;
    }
    const returnedObject = {
      message: "Application response",
      username: username,
      Data: { Application: applicationId, response: response },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
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
    const staffMember = req.staffMember;
    const projectName = req.body.projectName;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    const insertResult = await dbPool.query(
      `INSERT INTO Projects(company,name,start,end,manager)VALUES(?,?,?,?,?)`,
      [staffMember.company, projectName, startDate, endDate, username]
    );
    if (insertResult[0].affectedRows !== 1) {
      const error = new Error("Error while inserting the project");
      error.username = username;
      throw error;
    }
    const returnedObject = {
      message: "Create a project",
      username: username,
      Data: { Project: projectName, start: startDate, end: endDate },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.assignToProject = async (req, res, next) => {
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
    const staffMember = req.staffMember;
    const contributor = req.body.contributor;
    const project = req.body.project;

    const insertResult = await dbPool.query(
      `INSERT INTO Project_Contributors(username,project,company)VALUES (?,?,?)`,
      [contributor, project, staffMember.company]
    );
    if (insertResult[0].affectedRows !== 1) {
      const error = new Error("Error while inserting the contributor");
      error.username = username;
      throw error;
    }
    const returnedObject = {
      message: "contributor added",
      username: username,
      Data: { contributor: contributor, project: project },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.removeProjectContributor = async (req, res, next) => {
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
    const staffMember = req.staffMember;
    const contributor = req.body.contributor;
    const project = req.body.project;
    const result = await dbPool.query(
      `DELETE FROM Project_Contributors WHERE username = ? AND project = ?`,
      [contributor, project]
    );
    if (result[0].affectedRows !== 1) {
      const error = new Error("Error while removing the contributor");
      error.username = username;
      throw error;
    }
    const returnedObject = {
      message: "Contributor was removed Successfully",
      username: username,
      contributor: contributor,
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed");
      error.URL = req.originalUrl;
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const taskName = req.body.taskName;
    const project = req.body.project;
    const description = req.body.description;
    const deadline = req.body.deadline;
    const staffMember = req.staffMember;
    const username = req.username;

    const result = await dbPool.query(
      `INSERT INTO Tasks (name,project,company,deadline,status,description)VALUES (?,?,?,?,?,?)`,
      [taskName, project, staffMember.company, deadline, "open", description]
    );
    if (result[0].affectedRows !== 1) {
      const error = new Error("Error while adding task");
      error.username = username;
      throw error;
    }
    const returnedObject = {
      message: "task was added Successfully",
      username: username,
      task: taskName,
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.assignToTask = async (req, res, next) => {
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
    const contributor = req.body.contributor;
    const taskName = req.body.taskName;
    const project = req.body.project;
    const staffMember = req.staffMember;
    const result = await dbPool.query(
      `INSERT INTO Task_Contributors(username,task,project,company)VALUES(?,?,?,?)`,
      [contributor, taskName, project, staffMember.company]
    );
    if (result[0].affectedRows !== 1) {
      const error = new Error("Error while adding task Contributor");
      error.username = username;
      throw error;
    }
    const changeStatus = await dbPool.query(
      `UPDATE Tasks SET status = "assigned" WHERE name = ? AND project = ? AND company = ?`,
      [taskName, project, staffMember.company]
    );
    if (changeStatus[0].affectedRows !== 1) {
      const error = new Error("Error while changing the status of the task");
      error.username = username;
      throw error;
    }
    const returnedObject = {
      message: "task was assigned Successfully",
      username: username,
      task: taskName,
      contributor: contributor,
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.changeContributor = async (req, res, next) => {
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
    const staffMember = req.staffMember;

    const oldContributor = req.body.oldContributor;
    const newContributor = req.body.newContributor;
    const project = req.body.project;
    const taskName = req.body.taskName;

    //remove the old contributor then add the new one
    // const removeResult = await dbPool.query(
    //   `DELETE FROM Task_Contributors WHERE username = ? AND task = ? AND project = ? AND company = ?`,
    //   [oldContributor, taskName, project, staffMember.company]
    // );
    // if (removeResult[0].affectedRows !== 1) {
    //   const error = new Error("Error while removing The old contributor");
    //   error.username = username;
    //   throw error;
    // }
    // const addNewContributor = await dbPool.query(
    //   `INSERT INTO Task_Contributors(username,task,project,company)VALUES(?,?,?,?)`,
    //   [newContributor, taskName, project, staffMember.company]
    // );
    // if (addNewContributor[0].affectedRows !== 1) {
    //   const error = new Error("Error while adding The new contributor");
    //   error.username = username;
    //   throw error;
    // }
    //or only update the row

    const result = await dbPool.query(
      `UPDATE Task_Contributors SET username = ? WHERE username = ? AND task = ? AND project = ? AND company = ?`,
      [newContributor, oldContributor, taskName, project, staffMember.company]
    );
    if (result[0].affectedRows !== 1) {
      const error = new Error("Error while adding The new contributor");
      error.username = username;
      throw error;
    }
    const returnedObject = {
      message: "Contributor changed successfully",
      username: username,
      task: taskName,
      oldContributor: oldContributor,
      newContributor: newContributor,
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.getTasks = async (req, res, next) => {
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
    const staffMember = req.staffMember;

    const status = req.body.status;
    const project = req.body.project;

    const result = await dbPool.query(
      `SELECT * FROM Tasks WHERE project = ? AND company = ? AND status = ?`,
      [project, staffMember.company, status]
    );
    const returnedObject = {
      message: "Tasks",
      username: username,
      Data: result[0],
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.reviewTask = async (req, res, next) => {
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
    const staffMember = req.staffMember;

    const project = req.body.project;
    const taskName = req.body.taskName;
    const respond = req.body.respond;
    const deadline = req.body.deadline || "";

    var returnedObject;
    if (respond === "0") {
      const deadlineValidaton = validator.isISO8601(deadline);
      const afterValidation = validator.isAfter(deadline);
      if (!deadlineValidaton || !afterValidation) {
        const error = new Error(
          "you need to provide a new deadline YYYY-MM-DD That is after today's date"
        );
        error.username = username;
        throw error;
      }
      const result = await dbPool.query(
        `UPDATE Tasks SET status = "assigned" , deadline = ? , manager = ? WHERE name = ? AND project = ? AND company = ?`,
        [deadline, username, taskName, project, staffMember.company]
      );
      logger.info("%o", result[0]);
      if (result[0].affectedRows !== 1) {
        const error = new Error("Error while updating the task");
        error.username = username;
        throw error;
      }
      returnedObject = {
        message: "review Task",
        username: username,
        Data: {
          project: project,
          task: taskName,
          respond: "assigned",
          deadline: deadline,
        },
        URL: req.originalUrl,
      };
    } else {
      const result = await dbPool.query(
        `UPDATE Tasks SET status = "closed" , manager = ? WHERE name = ? AND project = ? AND company = ?`,
        [username, taskName, project, staffMember.company]
      );
      if (result[0].affectedRows !== 1) {
        const error = new Error("Error while updating the task");
        error.username = username;
        throw error;
      }
      returnedObject = {
        message: "review Task",
        username: username,
        Data: { project: project, task: taskName, respond: "closed" },
        URL: req.originalUrl,
      };
    }
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};
