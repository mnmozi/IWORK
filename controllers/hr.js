const logger = require("winston");

const { validationResult } = require("express-validator");

const dbPool = require("../util/database");
const { application } = require("express");

exports.getQuestions = async (req, res, next) => {
  try {
    const username = req.username;
    const staffMember = req.staffMember;
    const questionResult = await dbPool.query(
      `SELECT * FROM Questions WHERE department = ? AND company = ?`,
      [staffMember.department, staffMember.company]
    );
    const returnedObject = {
      message: "Questions",
      username: username,
      Data: { Questions: questionResult[0] },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};
exports.addQuestions = async (req, res, next) => {
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
    const question = req.body.question;
    const answer = req.body.answer;
    const insertResult = await dbPool.query(
      `INSERT INTO Questions (question,answer,department,company) VALUES (?,?,?,?)`,
      [question, answer, staffMember.department, staffMember.company]
    );
    if (insertResult[0].affectedRows !== 1) {
      const error = new Error("Error while inserting the question");
      error.username = username;
      throw error;
    }
    const returnedObject = {
      message: "Question Added successfully",
      username: username,
      Data: { Question: question, answer: answer },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};
exports.addNewJob = async (req, res, next) => {
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
    const questions = req.body.questions;
    const jobData = {};
    jobData.title = req.body.title;
    jobData.short_description = req.body.short_description;
    jobData.detailed_description = req.body.detailed_description;
    jobData.min_xp = req.body.min_xp;
    jobData.salary = req.body.salary;
    jobData.no_of_vacancies = req.body.no_of_vacancies;
    jobData.working_hours = req.body.working_hours;
    jobData.deadline = req.body.deadline;
    jobData.work_time = req.body.work_time;
    jobData.role = req.body.role;
    jobData.no_days_off = req.body.no_days_off;

    const jobHasQuestionsData = [];
    questions.forEach((value, index, self) => {
      jobHasQuestionsData.push([
        jobData.title,
        staffMember.department,
        staffMember.company,
        value,
      ]);
    });
    const insertResult = await dbPool.query(
      `INSERT INTO Jobs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        jobData.title,
        staffMember.department,
        staffMember.company,
        jobData.short_description,
        jobData.detailed_description,
        jobData.min_xp,
        jobData.salary,
        jobData.no_of_vacancies,
        jobData.working_hours,
        jobData.deadline,
        jobData.work_time,
        jobData.role,
        jobData.no_days_off,
      ]
    );
    if (insertResult[0].affectedRows !== 1) {
      const error = new Error("Error while inserting the new job");
      error.username = username;
      throw error;
    }
    if (jobHasQuestionsData.length !== 0) {
      const jobHasQuestionsInsert = await dbPool.query(
        `INSERT INTO Job_Has_Questions VALUES ?`,
        [jobHasQuestionsData]
      );
      logger.info("%o", jobHasQuestionsData);
      if (
        jobHasQuestionsInsert[0].affectedRows !== jobHasQuestionsData.length
      ) {
        const error = new Error(
          "Error while inserting the questions for this job"
        );
        error.username = username;
        throw error;
      }
    }
    const returnedObject = {
      message: "job Added successfully",
      username: username,
      Data: { job: jobData, questions: questions },
      URL: req.originalUrl,
    };
    logger.info("%o", returnedObject);
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.getJob = async (req, res, next) => {
  try {
    const username = req.username;
    const staffMember = req.staffMember;
    const title = req.params.jobTitle;
    const jobsResult = await dbPool.query(
      `SELECT * FROM Jobs WHERE title = ? AND department = ? AND company = ?`,
      [title, staffMember.department, staffMember.company]
    );
    if (jobsResult[0].length !== 1) {
      const error = new Error(
        "There is no job with that title in your department"
      );
      error.username = username;
      throw error;
    }
    const returnedObject = {
      message: "Job Data",
      username: username,
      Data: { job: jobsResult[0][0] },
      URL: req.originalUrl,
    };
    res.status(201).json(returnedObject);
  } catch (err) {
    next(err);
  }
};

exports.editJob = async (req, res, next) => {
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
    const questions = req.body.questions;
    const oldTitle = req.params.jobTitle;
    const removedQuestions = req.body.removedQuestions || [];
    const jobData = {};
    jobData.title = req.body.title;
    jobData.short_description = req.body.short_description;
    jobData.detailed_description = req.body.detailed_description;
    jobData.min_xp = req.body.min_xp;
    jobData.salary = req.body.salary;
    jobData.no_of_vacancies = req.body.no_of_vacancies;
    jobData.working_hours = req.body.working_hours;
    jobData.deadline = req.body.deadline;
    jobData.work_time = req.body.work_time;
    jobData.role = req.body.role;
    jobData.no_days_off = req.body.no_days_off;
    jobData.oldTitle = oldTitle;
    jobData.department = staffMember.department;
    jobData.company = staffMember.company;
    const result = await dbPool.query(
      `UPDATE Jobs SET
      title = ?, short_description = ?, detailed_description = ?, min_xp = ?, salary = ?, no_of_vacancies= ?, working_hours= ?, deadline = ?, work_time= ?, role= ?, no_days_off= ?
      WHERE title = ? AND department = ? AND company = ?`,
      Object.values(jobData)
    );

    const returnedObject = {
      message: "Edit job",
      username: username,
      Data: { Data: jobData, info: { JobInfo: result[0].info } },
      URL: req.originalUrl,
    };
    //removing the questions
    if (removedQuestions.length > 0) {
      const deletedQuestionsData = [];
      removedQuestions.forEach((value, index, self) => {
        deletedQuestionsData.push([
          jobData.title,
          staffMember.department,
          staffMember.company,
          value,
        ]);
      });
      const deleteQuestionsResult = await dbPool.query(
        `DELETE FROM Job_Has_Questions WHERE (job,department,company,question) IN (?)`,
        [deletedQuestionsData]
      );
      returnedObject.Data.info.removingQuestions =
        deleteQuestionsResult[0].affectedRows;
    }
    //adding the new questions
    if (questions.length > 0) {
      const jobHasQuestionsData = [];
      questions.forEach((value, index, self) => {
        jobHasQuestionsData.push([
          jobData.title,
          staffMember.department,
          staffMember.company,
          value,
        ]);
      });
      if (jobHasQuestionsData.length !== 0) {
        const jobHasQuestionsInsert = await dbPool.query(
          `INSERT INTO Job_Has_Questions VALUES ?`,
          [jobHasQuestionsData]
        );
        if (
          jobHasQuestionsInsert[0].affectedRows !== jobHasQuestionsData.length
        ) {
          const error = new Error(
            "Error while inserting the questions for this job"
          );
          error.username = username;
          throw error;
        }
        returnedObject.Data.info.addingQuestions =
          jobHasQuestionsInsert[0].affectedRows;
      }
    }
    logger.info("%o", returnedObject);
    res.status(201).json(returnedObject);
  } catch (err) {
    next(err);
  }
};
exports.viewApplications = async (req, res, next) => {
  try {
    const username = req.username;
    const job = req.params.jobTitle;
    const staffMember = req.staffMember;
    const result = await dbPool.query(
      `SELECT ap.*,Users.email,Users.birth_date,Users.first_name,Users.last_name,Users.years_of_xp,Jobs.* FROM Applications AS ap 
      JOIN Users ON ap.user = Users.username 
      JOIN Jobs ON ap.job = Jobs.title AND ap.department = Jobs.department AND ap.company = Jobs.company WHERE ap.job = ? AND ap.department = ? AND ap.company = ?  `,
      [job, staffMember.department, staffMember.company]
    );
    res.status(201).json({ Data: result[0] });
  } catch (err) {
    next(err);
  }
};

exports.applicationRespond = async (req, res, next) => {
  try {
    const username = req.username;
    const application = req.body.application;
    const staffMember = req.staffMember;
    const responsd = req.body.responsd;
    const result = await dbPool.query(
      `UPDATE Applications SET hr_response = ?,hr = ? WHERE id = ? AND department = ? AND company = ?`,
      [
        responsd,
        username,
        application,
        staffMember.department,
        staffMember.company,
      ]
    );
    logger.info("%o", result[0]);
    res.status(201).json({ Info: result[0].info });
  } catch (err) {
    next(err);
  }
};

exports.postAnnouncement = async (req, res, next) => {
  try {
    const username = req.username;
    const staffMember = req.staffMember;
    const date = new Date();
    const description = req.body.description;
    const type = req.body.type;
    const title = req.body.title;
    const result = await dbPool.query(
      `INSERT INTO Announcements (date,description,type,title,hr,company) VALUES (?,?,?,?,?,?)`,
      [date, description, type, title, username, staffMember.company]
    );
    logger.info("%o", result[0]);
    if (result[0].affectedRows !== 1) {
      const error = new Error("Error while inserting Announcement");
      error.username = username;
      throw error;
    }
    returnedObject = {
      message: "Announcement Added",
      username: username,
      Data: {
        date: date,
        description: description,
        type: type,
        title: title,
      },
      URL: req.originalUrl,
    };
    res.status(201).json({
      returnedObject,
    });
  } catch (err) {
    next(err);
  }
};

exports.getRequests = async (req, res, next) => {
  try {
    const username = req.username;
    const staffMember = req.staffMember;
    const result = await dbPool.query(
      `SELECT Staff_Members.*,Requests.*, Business_Trips.*, Leave_Requests.* FROM Requests 
      LEFT JOIN Leave_Requests ON Leave_Requests.id = Requests.id 
      LEFT JOIN Business_Trips ON Business_Trips.id = Requests.id AND Leave_Requests.type IS NULL
      JOIN Staff_Members ON Requests.username = Staff_Members.username 
      WHERE Staff_Members.department = ? AND Staff_Members.company = ? AND Requests.manager_response = 1`,
      [staffMember.department, staffMember.company]
    );
    logger.info("%o", result[0]);
    const returnedObject = {
      message: "Requests",
      username: username,
      Data: {
        Requests: result[0],
      },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
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
    const respond = req.body.respond;
    const request = req.body.request;

    if (req.request.purpose === null && respond == "1") {
      const daysOffQuery = await dbPool.query(
        "SELECT * FROM Staff_DaysOff WHERE user = ?",
        [req.request.username]
      );
      const daysOff = [];
      daysOffQuery[0].forEach((value, index, self) => {
        daysOff.push(value.day);
      });
      const to = new Date(req.request.to);
      const from = new Date(req.request.from);

      var ndays = 1 + Math.round((to - from) / (24 * 3600 * 1000));
      let totalDays = daysOff.reduce((total, currentValue, index) => {
        console.log(total + ".." + currentValue + "..." + index + ".." + ndays);
        return (
          total +
          Math.floor((ndays + ((from.getDay() + 6 - currentValue) % 7)) / 7)
        );
      }, 0);
      const annualLeavesLeft = req.request.annual_leaves - totalDays;
      if (annualLeavesLeft < 0) {
        const error = new Error(
          `You can't accept this request as the annual leaves of ${req.request.username} are not enough`
        );
        error.username = username;
        throw error;
      }
      const staffMemberUpdateResult = await dbPool.query(
        `UPDATE Staff_Members SET annual_leaves = ? WHERE username = ?`,
        [annualLeavesLeft, req.request.username]
      );
      logger.info("%o", staffMemberUpdateResult);
      if (staffMemberUpdateResult[0].affectedRows !== 1) {
        const error = new Error(
          "Error while updating the staff_member annual leaves"
        );
        error.username = username;
        throw error;
      }
    }
    const RequestUpdate = await dbPool.query(
      `UPDATE Requests SET hr_response = ?, hr = ? WHERE Requests.id = ?`,
      [respond, username, request]
    );
    if (RequestUpdate[0].affectedRows !== 1) {
      const error = new Error("Error while updating the request");
      error.username = username;
      throw error;
    }
    const returnedObject = {
      message: "Respond to Request",
      username: username,
      Data: {
        Request: request,
        respond: respond,
      },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.showAttendanceRecords = async (req, res, next) => {
  try {
    const username = req.username;
    const staffMember = req.staffMember;
    const requiredUser = req.params.username;

    const records = await dbPool.query(
      `SELECT ar.*, ROUND(((TIME_TO_SEC(TIMEDIFF( ar.check_out, ar.check_in)))/(60*60) ) - Jobs.working_hours )AS duration FROM Attendance_Records AS ar 
      JOIN Staff_Members AS sm ON ar.username = sm.username 
      JOIN Jobs ON sm.job = Jobs.title AND sm.department = Jobs.department AND sm.company = Jobs.company
      WHERE ar.username = ?;
      `,
      [requiredUser]
    );
    const returnedObject = {
      message: `Attendance Record for ${requiredUser}`,
      username: username,
      Data: {
        Records: records[0],
      },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.hoursInYearByMonth = async (req, res, next) => {
  try {
    const username = req.username;
    const staffMember = req.staffMember;
    const requiredUser = req.params.username;
    const year = req.params.year;

    const records = await dbPool.query(
      `SELECT 
      MONTH(ar.date) AS \`Month\`,
      SUM(ROUND(((TIME_TO_SEC(TIMEDIFF( ar.check_out, ar.check_in)))/(60*60) ) - Jobs.working_hours ))AS duration,
      SUM(ROUND((TIME_TO_SEC(TIMEDIFF( ar.check_out, ar.check_in)))/(60*60) )) AS totalHours
      FROM Attendance_Records AS ar 
      JOIN Staff_Members AS sm ON ar.username = sm.username 
      JOIN Jobs ON sm.job = Jobs.title AND sm.department = Jobs.department AND sm.company = Jobs.company
      WHERE ar.username ="nasr" AND YEAR(ar.date) = 2020
      GROUP BY MONTH(ar.date)`,
      [requiredUser, year]
    );
    const returnedObject = {
      message: `Attendance Record for ${requiredUser}`,
      username: username,
      Data: {
        RequiredUser: requiredUser,
        Records: records[0],
      },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};
