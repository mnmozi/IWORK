// const { body, check, param } = require("express-validator");
// const validator = require("validator");
// const { validationResult } = require("express-validator");
// const dbPool = require("../util/database");

// exports.signupValidator = [
//   body("email").isEmail().withMessage("Please enter a valid email address"),
//   body("password")
//     .trim()
//     .isLength({ min: 5 })
//     .withMessage("password need to be minimum 5")
//     .isAscii()
//     .withMessage("Password should be in length 5"),
//   body("username").trim().not().isEmpty(),
//   body("birthDate").isISO8601().isBefore(),
//   body("yearsOfXp").isInt(),
//   body("firstName").not().isEmpty(),
// ];
// exports.updateProfileValidator = [
//   body("new_birth_date").custom((value) => {
//     if (value && !validator.isISO8601(value) && !validator.isBefore(value)) {
//       throw new Error("Birth date should be YYYY-MM-DD and a valid date");
//     }
//     return true;
//   }),
//   body("new_years_of_xp").custom((value) => {
//     if (value && !Number.isInteger(value)) {
//       throw new Error("Years of experiance should be int");
//     }
//     return true;
//   }),
//   body("new_first_name").not().isEmpty().isAlpha(),
//   body("new_last_name").custom((value) => {
//     if (value && value != "" && !validator.isAlpha(value)) {
//       throw new Error("last name should be alphabetic only");
//     }
//     return true;
//   }),
// ];

// exports.applicationOwnerCheck = [
//   param("application").custom(async (application, { req }) => {
//     const result = await dbPool.query(
//       `SELECT * FROM Applications WHERE id = ? AND user = ?`,
//       [application, req.username]
//     );
//     if (result[0].length === 0) {
//       throw new Error("You have no application with that ID");
//     }
//     req.application = result[0][0];
//     return true;
//   }),
// ];
// exports.setVacationsDays = [
//   body("vacations").custom(async (vacations, { req }) => {
//     const errors = validationResult(req);
//     if (errors.isEmpty()) {
//       const application = req.application;
//       const result = await dbPool.query(
//         `SELECT no_days_off FROM Jobs WHERE title = ? AND department = ? AND company = ?`,
//         [application.job, application.department, application.company]
//       );
//       const daysOff = result[0][0].no_days_off;
//       var uniqueRightDaysOff = [];
//       vacations.filter((value, index, self) => {
//         if (
//           validator.isInt(value, { min: 0, max: 6 }) &&
//           self.indexOf(value) === index
//         ) {
//           uniqueRightDaysOff.push([req.username, value]);
//           return true;
//         }
//         return false;
//       });
//       if (uniqueRightDaysOff.length != daysOff) {
//         throw new Error(
//           "You must select " +
//             daysOff +
//             " days to be your vecations, with no duplicates, and only integers"
//         );
//       }
//       req.uniqueRightDaysOff = uniqueRightDaysOff;
//       return true;
//     }
//   }),
// ];
// exports.oldPeriodCheck = [
//   body("from")
//     .isISO8601()
//     .isBefore()
//     .withMessage("From-date should be before today's date")
//     .custom((fromValue, { req }) => {
//       if (!validator.isBefore(fromValue, req.body.to)) {
//         throw new Error("The from-date should be before the to-date");
//       }
//     }),
//   body("to").isISO8601(),
// ];

// exports.comingPeriodCheck = [
//   body("from")
//     .isISO8601()
//     .isAfter()
//     .withMessage("From-date should be after today's date"),
//   body("to")
//     .isISO8601()
//     .isAfter()
//     .withMessage("to-date should be after today's date")
//     .custom((toValue, { req }) => {
//       if (!validator.isAfter(toValue, req.body.from)) {
//         throw new Error("The to-date should be after the from-date");
//       }
//       return true;
//     }),
// ];

// exports.applyForRequest = [
//   body("replacement")
//     .trim()
//     .not()
//     .isEmpty()
//     .withMessage("replacement user is required"),
//   body("requestType").not().isEmpty().isBoolean(),
// ];

// exports.idValidation = [body("id").trim().isInt()];

// exports.addQuestionValidation = [body("question").not().isEmpty()];

// exports.newJobValidation = [
//   body("title")
//     .not()
//     .isEmpty()
//     .custom(async (title, { req }) => {
//       const jobCheck = await dbPool.query(
//         `SELECT 1 FROM Jobs WHERE title = ? AND department = ? AND company = ?`,
//         [title, req.staffMember.department, req.staffMember.company]
//       );
//       if (jobCheck[0].length === 1) {
//         throw new Error("Your department have a job with the same title");
//       }
//     }),
//   body("short_description").not().isEmpty(),
//   body("detailed_description").not().isEmpty(),
//   body("min_xp").not().isEmpty().isInt(),
//   body("salary").isInt(),
//   body("no_of_vacancies").isInt(),
//   body("questions").custom(async (questions, { req }) => {
//     // logger.info("%o", questions);
//     if (questions.length !== 0) {
//       const questionsCheck = await dbPool.query(
//         `SELECT COUNT(id) AS count FROM Questions WHERE id IN(?) AND company = ? AND department = ?`,
//         [questions, req.staffMember.company, req.staffMember.department]
//       );
//       // logger.info("%o", questionsCheck[0][0].count);
//       if (questionsCheck[0][0].count !== questions.length) {
//         throw new Error("something wrong with the questions IDs provided");
//       }
//     }
//   }),
//   body("working_hours").isInt(),
//   body("deadline").isISO8601().isAfter(),
//   body("work_time").isIn(["full", "part"]),
//   body("role").isIn(["regular", "hr", "manager"]),
//   body("no_days_off").isInt(),
// ];

// exports.editJobValidation = [
//   param("jobTitle")
//     .not()
//     .isEmpty()
//     .custom(async (title, { req }) => {
//       const newTitle = req.body.title;
//       //check if the new title is equal to the old title if so then we will only check if the job exists
//       if (title === newTitle) {
//         const jobSelect = await dbPool.query(
//           `SELECT * FROM Jobs WHERE title = ? AND department = ? AND company = ?`,
//           [title, req.staffMember.department, req.staffMember.company]
//         );
//         if (jobSelect[0].length !== 1) {
//           throw new Error(
//             "Your department doesn't have a job with the same title"
//           );
//         }
//         req.job = jobSelect[0][0];
//       } else {
//         const newAndOldTitles = [title, newTitle];
//         const jobSelect = await dbPool.query(
//           `SELECT * FROM Jobs WHERE title IN (?) AND department = ? AND company = ?`,
//           [newAndOldTitles, req.staffMember.department, req.staffMember.company]
//         );
//         var wantedJobExistance = false;
//         var newTitleExistance = false;
//         jobSelect[0].forEach((job, index) => {
//           if (job.title === title) {
//             wantedJobExistance = true;
//           } else if (job.title === newTitle) {
//             newTitleExistance = true;
//           }
//         });
//         if (!wantedJobExistance) {
//           throw new Error("the job you want to edit doesn't exist");
//         }
//         if (newTitleExistance) {
//           throw new Error(
//             "Your department have another job with that new title you choose"
//           );
//         }
//       }
//     }),
//   body("short_description").not().isEmpty(),
//   body("detailed_description").not().isEmpty(),
//   body("min_xp").not().isEmpty().isInt(),
//   body("salary").isInt(),
//   body("no_of_vacancies").isInt(),
//   body("questions").custom(async (questions, { req }) => {
//     if (questions.length !== 0) {
//       const questionsCheck = await dbPool.query(
//         `SELECT COUNT(id) AS count FROM Questions WHERE id IN (?) AND company = ? AND department = ?`,
//         [questions, req.staffMember.company, req.staffMember.department]
//       );
//       if (questionsCheck[0][0].count !== questions.length) {
//         throw new Error("something wrong with the questions IDs provided");
//       }
//       const AlreadyExistCheck = await dbPool.query(
//         `SELECT question FROM Job_Has_Questions WHERE question IN (?) AND company = ? AND department = ? AND job = ?`,
//         [
//           questions,
//           req.staffMember.company,
//           req.staffMember.department,
//           req.params.jobTitle,
//         ]
//       );
//       AlreadyExistCheck[0].forEach((value, index, self) => {
//         if (questions.includes(value.question)) {
//           req.body.questions.pop(value.question);
//         }
//       });
//     }
//   }),
//   body("working_hours").isInt(),
//   body("deadline").isISO8601().isAfter(),
//   body("work_time").isIn(["full", "part"]),
//   body("role").isIn(["regular", "hr", "manager"]),
//   body("no_days_off").isInt(),
// ];

// exports.postAnnouncement = [
//   body("title").not().isEmpty(),
//   body("description").not().isEmpty(),
//   body("type").not().isEmpty(),
// ];

// exports.hrRequestRespond = [
//   body("request")
//     .not()
//     .isEmpty()
//     .custom(async (requestId, { req }) => {
//       const staffMember = req.staffMember;
//       const selectResult = await dbPool.query(
//         `SELECT Requests.*, Business_Trips.*,Staff_Members.annual_leaves FROM Requests
//         LEFT JOIN Business_Trips ON Business_Trips.id = Requests.id
//         JOIN Staff_Members ON Requests.username = Staff_Members.username
//         WHERE Requests.id = ? AND Staff_Members.department = ? AND Staff_Members.company = ? AND Requests.manager_response > 0 AND Requests.replacement_response > 0 AND Requests.hr_response IS NULL`,
//         [requestId, staffMember.department, staffMember.company]
//       );
//       if (selectResult[0].length !== 1) {
//         throw new Error(
//           "There is no Pending request in your department with that id that one of the managers and the replacement accepted it"
//         );
//       }
//       req.request = selectResult[0][0];
//     }),
//   body("respond").isIn(["0", "1"]),
// ];

// exports.atTheSameCompanyDepartmentCheck = [
//   param("username").custom(async (username, { req }) => {
//     const staffMember = req.staffMember;
//     const result = await dbPool.query(
//       `SELECT 1 FROM Staff_Members WHERE username = ? , company = ? , department = ?`,
//       username,
//       staffMember.company,
//       staffMember.department
//     );
//     if (result[0].length !== 1) {
//       throw new Error("There is no user with that usename in your department");
//     }
//   }),
// ];

// exports.exitTask = [
//   body("project").not().isEmpty(),
//   body("task").custom(async (task, { req }) => {
//     const staffMember = req.staffMember;
//     const taskResult = await dbPool.query(
//       `SELECT Tasks.* FROM Tasks JOIN Task_Contributors
//       ON Tasks.name = Task_Contributors.task AND Tasks.company = Task_Contributors.company AND Tasks.project = Task_Contributors.project
//       WHERE Tasks.project = ? AND Tasks.name = ? AND Tasks.company = ? AND Task_Contributors.username = ?`,
//       [req.body.project, req.body.task, staffMember.company, req.username]
//     );
//     if (taskResult[0].length !== 1) {
//       throw new Error(
//         "There is no task with that name in your company that you are assigned to"
//       );
//     }
//     if (new Date().getTime() > new Date(taskResult[0][0].deadline)) {
//       throw new Error("Your can't edit as The deadline has passed");
//     }
//     req.task = taskResult[0][0];
//   }),
//   body("status").custom((status, { req }) => {
//     if (!validator.isIn(status, ["fixed", "assigned"])) {
//       throw new Error(`Value should be assigned or fixed`);
//     }
//     if (status === req.task.status) {
//       throw new Error(`The task is already at ${req.body.status} status`);
//     }
//     return true;
//   }),
// ];

// exports.managerApplicationRespond = [
//   body("applicationId").custom(async (applicationId, { req }) => {
//     const staffMember = req.staffMember;
//     const application = await dbPool.query(
//       `SELECT * FROM Applications WHERE id = ? AND department = ? AND company = ? AND hr_response = 1 AND manager_response IS NULL `,
//       [applicationId, staffMember.department, staffMember.company]
//     );
//     if (application[0].length !== 1) {
//       throw new Error(
//         "There is no application with that id in your department that passed the hr review and not reviewed by any manager"
//       );
//     }
//   }),
//   body("response").isIn(["0", "1"]),
// ];
// exports.managerRequestRespond = [
//   body("requestId").custom(async (requestId, { req }) => {
//     const staffMember = req.staffMember;
//     let request;
//     if (staffMember.type === "HR") {
//       // view all request in that department
//       request = await dbPool.query(
//         `SELECT Requests.*, Staff_Members.annual_leaves FROM Requests
//           JOIN Staff_Members ON Requests.username = Staff_Members.username
//           WHERE Requests.id = ? AND Staff_Members.department = ? AND Staff_Members.company = ? AND Requests.manager_response IS NULL`,
//         [requestId, staffMember.department, staffMember.company]
//       );
//     } else {
//       //else I can view all request except for hr employees
//       request = await dbPool.query(
//         `SELECT Requests.*, Staff_Members.annual_leaves FROM Requests
//       JOIN Staff_Members ON Requests.username = Staff_Members.username
//       WHERE Requests.id = ?
//       AND Staff_Members.department = ?
//       AND Staff_Members.company = ?
//       AND manager_response IS NULL
//       AND Requests.username NOT IN (SELECT Hrs.username FROM Hrs)`,
//         [requestId, staffMember.department, staffMember.company]
//       );
//     }
//     if (request[0].length !== 1) {
//       throw new Error(
//         "This request does not exist, or you are not authorized to view it, or some other manager reviewed it "
//       );
//     }
//     req.request = request[0][0];
//   }),
//   body("respond").custom((respond, { req }) => {
//     if (!validator.isIn(respond, ["0", "1"])) {
//       throw new Error("Invalid input: should be 0 or 1");
//     }
//     if (
//       respond === "0" &&
//       (!req.body.reason || validator.isEmpty(req.body.reason))
//     ) {
//       throw new Error(
//         "you should provied a reason if you want to reject the request"
//       );
//     }
//     return true;
//   }),
// ];

// exports.createProject = [
//   body("projectName")
//     .not()
//     .isEmpty()
//     .custom(async (projectName, { req }) => {
//       const staffMember = req.staffMember;
//       const searchResult = await dbPool.query(
//         `SELECT 1 FROM Projects WHERE company = ? AND name = ? `,
//         [staffMember.company, projectName]
//       );
//       if (searchResult[0].length === 1) {
//         throw new Error(
//           "There is a project with the same name in your company. Please enter another one"
//         );
//       }
//     }),
//   body("startDate")
//     .isISO8601()
//     .isAfter()
//     .withMessage("From-date should be after today's date"),
//   body("endDate")
//     .isISO8601()
//     .isAfter()
//     .withMessage("to-date should be after today's date")
//     .custom((toValue, { req }) => {
//       if (!validator.isAfter(toValue, req.body.startDate)) {
//         throw new Error("The end-date should be after the start-date");
//       }
//       return true;
//     }),
// ];

// exports.addProjectContributor = [
//   body("project")
//     .not()
//     .isEmpty()
//     .custom(async (project, { req }) => {
//       const staffMember = req.staffMember;
//       const result = await dbPool.query(
//         `SELECT 1 FROM Projects WHERE name = ? AND company = ?`,
//         [project, staffMember.company]
//       );
//       if (result[0].length !== 1) {
//         throw new Error("There is no project with that name in your company");
//       }
//     }),
//   body("contributor")
//     .not()
//     .isEmpty()
//     .custom(async (contributor, { req }) => {
//       const staffMember = req.staffMember;

//       const result = await dbPool.query(
//         `SELECT 1 FROM Staff_Members WHERE username = ? AND department = ? AND company = ?`, // can use NOT IN to check if he is not member in the project
//         [contributor, staffMember.department, staffMember.company]
//       );
//       if (result[0].length !== 1) {
//         throw new Error(
//           "There is no staff member with that username in your department"
//         );
//       }
//       if (req.body.project) {
//         const checkIfInProject = await dbPool.query(
//           `SELECT 1 FROM Project_Contributors WHERE project = ? AND username = ?`,
//           [req.body.project, contributor]
//         );
//         if (checkIfInProject[0].length === 1) {
//           throw new Error("this user is already a contributor in that project");
//         }
//       }
//       const numberOfProjects = await dbPool.query(
//         `SELECT username FROM Project_Contributors WHERE username = ?`,
//         contributor
//       );
//       if (numberOfProjects[0].length >= 2) {
//         throw new Error(
//           "This user are in two projects so he can't join any other project"
//         );
//       }
//     }),
// ];
// exports.removeProjectContributor = [
//   body("project")
//     .not()
//     .isEmpty()
//     .custom(async (project, { req }) => {
//       const staffMember = req.staffMember;
//       const result = await dbPool.query(
//         `SELECT 1 FROM Projects WHERE name = ? AND company = ?`,
//         [project, staffMember.company]
//       );
//       if (result[0].length !== 1) {
//         throw new Error("There is no project with that name in your company");
//       }
//     }),
//   body("contributor")
//     .not()
//     .isEmpty()
//     .custom(async (contributor, { req }) => {
//       if (req.body.project) {
//         const result = await dbPool.query(
//           `SELECT username FROM Project_Contributors WHERE username = ? AND project = ? AND username NOT IN (SELECT username FROM Task_Contributors WHERE project = ?)`,
//           [contributor, req.body.project, req.body.project]
//         );
//         if (result[0].length !== 1) {
//           throw new Error(
//             "There is no contributor with that username and have no tasks assigned to"
//           );
//         }
//       }
//     }),
// ];
// exports.createTask = [
//   body("taskName")
//     .not()
//     .isEmpty()
//     .custom(async (taskName, { req }) => {
//       const project = req.body.project;
//       if (project) {
//         const result = await dbPool.query(
//           `SELECT 1 FROM Tasks WHERE name = ? AND project = ? `,
//           [taskName, project]
//         );
//         if (result[0].length !== 0) {
//           throw new Error("There is a task with that name already");
//         }
//       }
//     }),
//   body("project")
//     .not()
//     .isEmpty()
//     .custom(async (project, { req }) => {
//       const staffMember = req.staffMember;
//       const result = await dbPool.query(
//         `SELECT 1 FROM Projects JOIN Staff_Members ON Projects.manager = Staff_Members.username
//         WHERE Projects.name = ? AND Projects.company = ? AND Staff_Members.department = ?`,
//         [project, staffMember.company, staffMember.department]
//       );
//       if (result[0].length !== 1) {
//         throw new Error("There is no project with that name in your company");
//       }
//     }),
//   body("deadline").isISO8601().isAfter(),
//   body("description").not().isEmpty(),
// ];

// exports.assignToTask = [
//   body("taskName")
//     .not()
//     .isEmpty()
//     .custom(async (task, { req }) => {
//       const staffMember = req.staffMember;
//       const project = req.body.project;
//       if (project && task) {
//         const result = await dbPool.query(
//           `SELECT 1 FROM Tasks WHERE name = ? AND project = ? AND company = ? `,
//           [task, req.body.project, staffMember.company]
//         );
//         if (result[0].length !== 1) {
//           throw new Error("There is no task With that name");
//         }
//       }
//     }),
//   body("project").not().isEmpty(),
//   body("contributor")
//     .not()
//     .isEmpty()
//     .custom(async (contributor, { req }) => {
//       const project = req.body.project;
//       const taskName = req.body.taskName;
//       const staffMember = req.staffMember;
//       if (project && taskName) {
//         const result = await dbPool.query(
//           `SELECT 1 FROM Project_Contributors WHERE username=? AND project=? AND company=?`,
//           [contributor, project, staffMember.company]
//         );
//         if (result[0].length !== 1) {
//           throw new Error(
//             "There is no a contributor with that username in the project"
//           );
//         }
//         const assignedToTaskCheck = await dbPool.query(
//           `SELECT 1 FROM Task_Contributors WHERE task = ? AND project = ? AND company = ? AND username = ?`,
//           [taskName, project, staffMember.company, contributor]
//         );
//         if (assignedToTaskCheck[0].length !== 0) {
//           throw new Error("that user aready assigned to that task");
//         }
//       }
//     }),
// ];

// exports.changeContributor = [
//   body("taskName")
//     .not()
//     .isEmpty()
//     .custom(async (task, { req }) => {
//       const staffMember = req.staffMember;
//       const project = req.body.project;
//       if (project && task) {
//         const result = await dbPool.query(
//           `SELECT 1 FROM Tasks WHERE name = ? AND project = ? AND company = ? `,
//           [task, req.body.project, staffMember.company]
//         );
//         if (result[0].length !== 1) {
//           throw new Error("There is no task With that name");
//         }
//       }
//     }),
//   body("project").not().isEmpty(),
//   body("newContributor")
//     .not()
//     .isEmpty()
//     .custom(async (contributor, { req }) => {
//       const project = req.body.project;
//       const taskName = req.body.taskName;
//       const staffMember = req.staffMember;
//       if (project && taskName) {
//         const result = await dbPool.query(
//           `SELECT 1 FROM Project_Contributors WHERE username=? AND project=? AND company=?`,
//           [contributor, project, staffMember.company]
//         );
//         if (result[0].length !== 1) {
//           throw new Error(
//             "There is no a contributor with that username in the project"
//           );
//         }
//         const assignedToTaskCheck = await dbPool.query(
//           `SELECT 1 FROM Task_Contributors WHERE task = ? AND project = ? AND company = ? AND username = ?`,
//           [taskName, project, staffMember.company, contributor]
//         );
//         if (assignedToTaskCheck[0].length !== 0) {
//           throw new Error("that user aready assigned to that task");
//         }
//       }
//     }),
//   body("oldContributor")
//     .not()
//     .isEmpty()
//     .custom(async (contributor, { req }) => {
//       const project = req.body.project;
//       const taskName = req.body.taskName;
//       const staffMember = req.staffMember;
//       if (project && taskName) {
//         const assignedToTaskCheck = await dbPool.query(
//           `SELECT 1 FROM Task_Contributors WHERE task = ? AND project = ? AND company = ? AND username = ?`,
//           [taskName, project, staffMember.company, contributor]
//         );
//         if (assignedToTaskCheck[0].length !== 1) {
//           throw new Error("that old contributor Not assigned to that task");
//         }
//       }
//     }),
// ];

// exports.getTasks = [
//   body("project")
//     .not()
//     .isEmpty()
//     .custom(async (project, { req }) => {
//       const staffMember = req.staffMember;
//       const result = await dbPool.query(
//         `SELECT 1 FROM Projects WHERE name = ? AND company = ?`,
//         [project, staffMember.company]
//       );
//       if (result[0].length !== 1) {
//         throw new Error("There is no project with that name in your company");
//       }
//     }),
//   body("status").isIn(["open", "assigned", "closed", "fixed"]),
// ];

// exports.reviewTask = [
//   body("taskName")
//     .not()
//     .isEmpty()
//     .custom(async (task, { req }) => {
//       const staffMember = req.staffMember;
//       const project = req.body.project;
//       if (project && task) {
//         const result = await dbPool.query(
//           `SELECT 1 FROM Tasks WHERE name = ? AND project = ? AND company = ? AND status = "fixed" `,
//           [task, req.body.project, staffMember.company]
//         );
//         if (result[0].length !== 1) {
//           throw new Error(
//             "There is no task With that name with a fixed Status"
//           );
//         }
//       }
//     }),
//   body("project")
//     .not()
//     .isEmpty()
//     .custom(async (project, { req }) => {
//       const staffMember = req.staffMember;
//       const result = await dbPool.query(
//         `SELECT 1 FROM Projects JOIN Staff_Members ON Projects.manager = Staff_Members.username
//       WHERE Projects.name = ? AND Projects.company = ? AND Staff_Members.department = ?`,
//         [project, staffMember.company, staffMember.department]
//       );
//       if (result[0].length !== 1) {
//         throw new Error("There is no project with that name in your company");
//       }
//     }),
//   body("respond").isIn(["0", "1"]),
// ];
