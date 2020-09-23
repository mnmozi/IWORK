const { body, param } = require("express-validator");
const dbPool = require("../../util/database");

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
    if (questions.length !== 0) {
      const questionsCheck = await dbPool.query(
        `SELECT COUNT(id) AS count FROM Questions WHERE id IN(?) AND company = ? AND department = ?`,
        [questions, req.staffMember.company, req.staffMember.department]
      );
      // logger.info("%o", questionsCheck[0][0].count);
      if (questionsCheck[0][0].count !== questions.length) {
        throw new Error("something wrong with the questions IDs provided");
      }
    }
  }),
  body("working_hours").isInt(),
  body("deadline").isISO8601().isAfter(),
  body("work_time").isIn(["full", "part"]),
  body("role").isIn(["regular", "hr", "manager"]),
  body("no_days_off").isInt(),
];

exports.editJobValidation = [
  param("jobTitle")
    .not()
    .isEmpty()
    .custom(async (title, { req }) => {
      const newTitle = req.body.title;
      //check if the new title is equal to the old title if so then we will only check if the job exists
      if (title === newTitle) {
        const jobSelect = await dbPool.query(
          `SELECT * FROM Jobs WHERE title = ? AND department = ? AND company = ?`,
          [title, req.staffMember.department, req.staffMember.company]
        );
        if (jobSelect[0].length !== 1) {
          throw new Error(
            "Your department doesn't have a job with the same title"
          );
        }
        req.job = jobSelect[0][0];
      } else {
        const newAndOldTitles = [title, newTitle];
        const jobSelect = await dbPool.query(
          `SELECT * FROM Jobs WHERE title IN (?) AND department = ? AND company = ?`,
          [newAndOldTitles, req.staffMember.department, req.staffMember.company]
        );
        var wantedJobExistance = false;
        var newTitleExistance = false;
        jobSelect[0].forEach((job, index) => {
          if (job.title === title) {
            wantedJobExistance = true;
          } else if (job.title === newTitle) {
            newTitleExistance = true;
          }
        });
        if (!wantedJobExistance) {
          throw new Error("the job you want to edit doesn't exist");
        }
        if (newTitleExistance) {
          throw new Error(
            "Your department have another job with that new title you choose"
          );
        }
      }
    }),
  body("short_description").not().isEmpty(),
  body("detailed_description").not().isEmpty(),
  body("min_xp").not().isEmpty().isInt(),
  body("salary").isInt(),
  body("no_of_vacancies").isInt(),
  body("questions").custom(async (questions, { req }) => {
    if (questions.length !== 0) {
      const questionsCheck = await dbPool.query(
        `SELECT COUNT(id) AS count FROM Questions WHERE id IN (?) AND company = ? AND department = ?`,
        [questions, req.staffMember.company, req.staffMember.department]
      );
      if (questionsCheck[0][0].count !== questions.length) {
        throw new Error("something wrong with the questions IDs provided");
      }
      const AlreadyExistCheck = await dbPool.query(
        `SELECT question FROM Job_Has_Questions WHERE question IN (?) AND company = ? AND department = ? AND job = ?`,
        [
          questions,
          req.staffMember.company,
          req.staffMember.department,
          req.params.jobTitle,
        ]
      );
      AlreadyExistCheck[0].forEach((value, index, self) => {
        if (questions.includes(value.question)) {
          req.body.questions.pop(value.question);
        }
      });
    }
  }),
  body("working_hours").isInt(),
  body("deadline").isISO8601().isAfter(),
  body("work_time").isIn(["full", "part"]),
  body("role").isIn(["regular", "hr", "manager"]),
  body("no_days_off").isInt(),
];

exports.postAnnouncement = [
  body("title").not().isEmpty(),
  body("description").not().isEmpty(),
  body("type").not().isEmpty(),
];

exports.hrRequestRespond = [
  body("request")
    .not()
    .isEmpty()
    .custom(async (requestId, { req }) => {
      const staffMember = req.staffMember;
      const selectResult = await dbPool.query(
        `SELECT Requests.*, Business_Trips.*,Staff_Members.annual_leaves FROM Requests 
        LEFT JOIN Business_Trips ON Business_Trips.id = Requests.id
        JOIN Staff_Members ON Requests.username = Staff_Members.username 
        WHERE Requests.id = ? AND Staff_Members.department = ? AND Staff_Members.company = ? AND Requests.manager_response > 0 AND Requests.replacement_response > 0 AND Requests.hr_response IS NULL`,
        [requestId, staffMember.department, staffMember.company]
      );
      if (selectResult[0].length !== 1) {
        throw new Error(
          "There is no Pending request in your department with that id that one of the managers and the replacement accepted it"
        );
      }
      req.request = selectResult[0][0];
    }),
  body("respond").isIn(["0", "1"]),
];

exports.atTheSameCompanyDepartmentCheck = [
  param("username").custom(async (username, { req }) => {
    const staffMember = req.staffMember;
    const result = await dbPool.query(
      `SELECT 1 FROM Staff_Members WHERE username = ? , company = ? , department = ?`,
      username,
      staffMember.company,
      staffMember.department
    );
    if (result[0].length !== 1) {
      throw new Error("There is no user with that usename in your department");
    }
  }),
];
