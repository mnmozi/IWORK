const logger = require("winston");

const { validationResult } = require("express-validator");

const dbPool = require("../util/database");

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
    questions.filter((value, index, self) => {
      jobHasQuestionsData.push([
        jobData.title,
        staffMember.department,
        staffMember.company,
        value,
      ]);
      return true;
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
    const jobHasQuestionsInsert = await dbPool.query(
      `INSERT INTO Job_Has_Questions VALUES ?`,
      [jobHasQuestionsData]
    );
    logger.info("%o", jobHasQuestionsData);
    if (jobHasQuestionsInsert[0].affectedRows !== jobHasQuestionsData.length) {
      const error = new Error(
        "Error while inserting the questions for this job"
      );
      error.username = username;
      throw error;
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
