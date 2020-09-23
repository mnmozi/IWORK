const { body } = require("express-validator");
const validator = require("validator");
const dbPool = require("../../util/database");

exports.managerRequestRespond = [
  body("requestId").custom(async (requestId, { req }) => {
    const staffMember = req.staffMember;
    let request;
    if (staffMember.type === "HR") {
      // view all request in that department
      request = await dbPool.query(
        `SELECT Requests.*, Staff_Members.annual_leaves FROM Requests 
            JOIN Staff_Members ON Requests.username = Staff_Members.username  
            WHERE Requests.id = ? AND Staff_Members.department = ? AND Staff_Members.company = ? AND Requests.manager_response IS NULL`,
        [requestId, staffMember.department, staffMember.company]
      );
    } else {
      //else I can view all request except for hr employees
      request = await dbPool.query(
        `SELECT Requests.*, Staff_Members.annual_leaves FROM Requests 
        JOIN Staff_Members ON Requests.username = Staff_Members.username  
        WHERE Requests.id = ?
        AND Staff_Members.department = ? 
        AND Staff_Members.company = ? 
        AND manager_response IS NULL 
        AND Requests.username NOT IN (SELECT Hrs.username FROM Hrs)`,
        [requestId, staffMember.department, staffMember.company]
      );
    }
    if (request[0].length !== 1) {
      throw new Error(
        "This request does not exist, or you are not authorized to view it, or some other manager reviewed it "
      );
    }
    req.request = request[0][0];
  }),
  body("respond").custom((respond, { req }) => {
    if (!validator.isIn(respond, ["0", "1"])) {
      throw new Error("Invalid input: should be 0 or 1");
    }
    if (
      respond === "0" &&
      (!req.body.reason || validator.isEmpty(req.body.reason))
    ) {
      throw new Error(
        "you should provied a reason if you want to reject the request"
      );
    }
    return true;
  }),
];

exports.managerApplicationRespond = [
  body("applicationId").custom(async (applicationId, { req }) => {
    const staffMember = req.staffMember;
    const application = await dbPool.query(
      `SELECT * FROM Applications WHERE id = ? AND department = ? AND company = ? AND hr_response = 1 AND manager_response IS NULL `,
      [applicationId, staffMember.department, staffMember.company]
    );
    if (application[0].length !== 1) {
      throw new Error(
        "There is no application with that id in your department that passed the hr review and not reviewed by any manager"
      );
    }
  }),
  body("response").isIn(["0", "1"]),
];

exports.createProject = [
  body("projectName")
    .not()
    .isEmpty()
    .custom(async (projectName, { req }) => {
      const staffMember = req.staffMember;
      const searchResult = await dbPool.query(
        `SELECT 1 FROM Projects WHERE company = ? AND name = ? `,
        [staffMember.company, projectName]
      );
      if (searchResult[0].length === 1) {
        throw new Error(
          "There is a project with the same name in your company. Please enter another one"
        );
      }
    }),
  body("startDate")
    .isISO8601()
    .isAfter()
    .withMessage("From-date should be after today's date"),
  body("endDate")
    .isISO8601()
    .isAfter()
    .withMessage("to-date should be after today's date")
    .custom((toValue, { req }) => {
      if (!validator.isAfter(toValue, req.body.startDate)) {
        throw new Error("The end-date should be after the start-date");
      }
      return true;
    }),
];

exports.addProjectContributor = [
  body("project")
    .not()
    .isEmpty()
    .custom(async (project, { req }) => {
      const staffMember = req.staffMember;
      const result = await dbPool.query(
        `SELECT 1 FROM Projects WHERE name = ? AND company = ?`,
        [project, staffMember.company]
      );
      if (result[0].length !== 1) {
        throw new Error("There is no project with that name in your company");
      }
    }),
  body("contributor")
    .not()
    .isEmpty()
    .custom(async (contributor, { req }) => {
      const staffMember = req.staffMember;

      const result = await dbPool.query(
        `SELECT 1 FROM Staff_Members WHERE username = ? AND department = ? AND company = ?`, // can use NOT IN to check if he is not member in the project
        [contributor, staffMember.department, staffMember.company]
      );
      if (result[0].length !== 1) {
        throw new Error(
          "There is no staff member with that username in your department"
        );
      }
      if (req.body.project) {
        const checkIfInProject = await dbPool.query(
          `SELECT 1 FROM Project_Contributors WHERE project = ? AND username = ?`,
          [req.body.project, contributor]
        );
        if (checkIfInProject[0].length === 1) {
          throw new Error("this user is already a contributor in that project");
        }
      }
      const numberOfProjects = await dbPool.query(
        `SELECT username FROM Project_Contributors WHERE username = ?`,
        contributor
      );
      if (numberOfProjects[0].length >= 2) {
        throw new Error(
          "This user are in two projects so he can't join any other project"
        );
      }
    }),
];
exports.removeProjectContributor = [
  body("project")
    .not()
    .isEmpty()
    .custom(async (project, { req }) => {
      const staffMember = req.staffMember;
      const result = await dbPool.query(
        `SELECT 1 FROM Projects WHERE name = ? AND company = ?`,
        [project, staffMember.company]
      );
      if (result[0].length !== 1) {
        throw new Error("There is no project with that name in your company");
      }
    }),
  body("contributor")
    .not()
    .isEmpty()
    .custom(async (contributor, { req }) => {
      if (req.body.project) {
        const result = await dbPool.query(
          `SELECT username FROM Project_Contributors WHERE username = ? AND project = ? AND username NOT IN (SELECT username FROM Task_Contributors WHERE project = ?)`,
          [contributor, req.body.project, req.body.project]
        );
        if (result[0].length !== 1) {
          throw new Error(
            "There is no contributor with that username and have no tasks assigned to"
          );
        }
      }
    }),
];
exports.createTask = [
  body("taskName")
    .not()
    .isEmpty()
    .custom(async (taskName, { req }) => {
      const project = req.body.project;
      if (project) {
        const result = await dbPool.query(
          `SELECT 1 FROM Tasks WHERE name = ? AND project = ? `,
          [taskName, project]
        );
        if (result[0].length !== 0) {
          throw new Error("There is a task with that name already");
        }
      }
    }),
  body("project")
    .not()
    .isEmpty()
    .custom(async (project, { req }) => {
      const staffMember = req.staffMember;
      const result = await dbPool.query(
        `SELECT 1 FROM Projects JOIN Staff_Members ON Projects.manager = Staff_Members.username 
          WHERE Projects.name = ? AND Projects.company = ? AND Staff_Members.department = ?`,
        [project, staffMember.company, staffMember.department]
      );
      if (result[0].length !== 1) {
        throw new Error("There is no project with that name in your company");
      }
    }),
  body("deadline").isISO8601().isAfter(),
  body("description").not().isEmpty(),
];

exports.assignToTask = [
  body("taskName")
    .not()
    .isEmpty()
    .custom(async (task, { req }) => {
      const staffMember = req.staffMember;
      const project = req.body.project;
      if (project && task) {
        const result = await dbPool.query(
          `SELECT 1 FROM Tasks WHERE name = ? AND project = ? AND company = ? `,
          [task, req.body.project, staffMember.company]
        );
        if (result[0].length !== 1) {
          throw new Error("There is no task With that name");
        }
      }
    }),
  body("project").not().isEmpty(),
  body("contributor")
    .not()
    .isEmpty()
    .custom(async (contributor, { req }) => {
      const project = req.body.project;
      const taskName = req.body.taskName;
      const staffMember = req.staffMember;
      if (project && taskName) {
        const result = await dbPool.query(
          `SELECT 1 FROM Project_Contributors WHERE username=? AND project=? AND company=?`,
          [contributor, project, staffMember.company]
        );
        if (result[0].length !== 1) {
          throw new Error(
            "There is no a contributor with that username in the project"
          );
        }
        const assignedToTaskCheck = await dbPool.query(
          `SELECT 1 FROM Task_Contributors WHERE task = ? AND project = ? AND company = ? AND username = ?`,
          [taskName, project, staffMember.company, contributor]
        );
        if (assignedToTaskCheck[0].length !== 0) {
          throw new Error("that user aready assigned to that task");
        }
      }
    }),
];

exports.changeContributor = [
  body("taskName")
    .not()
    .isEmpty()
    .custom(async (task, { req }) => {
      const staffMember = req.staffMember;
      const project = req.body.project;
      if (project && task) {
        const result = await dbPool.query(
          `SELECT 1 FROM Tasks WHERE name = ? AND project = ? AND company = ? `,
          [task, req.body.project, staffMember.company]
        );
        if (result[0].length !== 1) {
          throw new Error("There is no task With that name");
        }
      }
    }),
  body("project").not().isEmpty(),
  body("newContributor")
    .not()
    .isEmpty()
    .custom(async (contributor, { req }) => {
      const project = req.body.project;
      const taskName = req.body.taskName;
      const staffMember = req.staffMember;
      if (project && taskName) {
        const result = await dbPool.query(
          `SELECT 1 FROM Project_Contributors WHERE username=? AND project=? AND company=?`,
          [contributor, project, staffMember.company]
        );
        if (result[0].length !== 1) {
          throw new Error(
            "There is no a contributor with that username in the project"
          );
        }
        const assignedToTaskCheck = await dbPool.query(
          `SELECT 1 FROM Task_Contributors WHERE task = ? AND project = ? AND company = ? AND username = ?`,
          [taskName, project, staffMember.company, contributor]
        );
        if (assignedToTaskCheck[0].length !== 0) {
          throw new Error("that user aready assigned to that task");
        }
      }
    }),
  body("oldContributor")
    .not()
    .isEmpty()
    .custom(async (contributor, { req }) => {
      const project = req.body.project;
      const taskName = req.body.taskName;
      const staffMember = req.staffMember;
      if (project && taskName) {
        const assignedToTaskCheck = await dbPool.query(
          `SELECT 1 FROM Task_Contributors WHERE task = ? AND project = ? AND company = ? AND username = ?`,
          [taskName, project, staffMember.company, contributor]
        );
        if (assignedToTaskCheck[0].length !== 1) {
          throw new Error("that old contributor Not assigned to that task");
        }
      }
    }),
];

exports.getTasks = [
  body("project")
    .not()
    .isEmpty()
    .custom(async (project, { req }) => {
      const staffMember = req.staffMember;
      const result = await dbPool.query(
        `SELECT 1 FROM Projects WHERE name = ? AND company = ?`,
        [project, staffMember.company]
      );
      if (result[0].length !== 1) {
        throw new Error("There is no project with that name in your company");
      }
    }),
  body("status").isIn(["open", "assigned", "closed", "fixed"]),
];

exports.reviewTask = [
  body("taskName")
    .not()
    .isEmpty()
    .custom(async (task, { req }) => {
      const staffMember = req.staffMember;
      const project = req.body.project;
      if (project && task) {
        const result = await dbPool.query(
          `SELECT 1 FROM Tasks WHERE name = ? AND project = ? AND company = ? AND status = "fixed" `,
          [task, req.body.project, staffMember.company]
        );
        if (result[0].length !== 1) {
          throw new Error(
            "There is no task With that name with a fixed Status"
          );
        }
      }
    }),
  body("project")
    .not()
    .isEmpty()
    .custom(async (project, { req }) => {
      const staffMember = req.staffMember;
      const result = await dbPool.query(
        `SELECT 1 FROM Projects JOIN Staff_Members ON Projects.manager = Staff_Members.username 
        WHERE Projects.name = ? AND Projects.company = ? AND Staff_Members.department = ?`,
        [project, staffMember.company, staffMember.department]
      );
      if (result[0].length !== 1) {
        throw new Error("There is no project with that name in your company");
      }
    }),
  body("respond").isIn(["0", "1"]),
];
