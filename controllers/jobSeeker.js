const logger = require("winston");

const dbPool = require("../util/database");
const { validationResult } = require("express-validator");

exports.applyForJob = async (req, res, next) => {
  try {
    const username = req.username;
    const jobTitle = req.body.jobTitle;
    const department = req.body.department;
    const company = req.body.company;

    const alreadyAppliedCheck = await dbPool.query(
      `SELECT * FROM Applications WHERE user = ? AND job = ? AND department = ? AND company = ?;`,
      [username, jobTitle, department, company]
    );
    if (alreadyAppliedCheck[0].length > 0) {
      const error = new Error("Your already applied to this job");
      error.statusCode = 400;
      error.data = {
        username: username,
        jobTitle: jobTitle,
        department: department,
        company: company,
      };
      throw error;
    }
    const result = await dbPool.query(
      `INSERT INTO Applications (job,department,company,user)
    SELECT ?,?,?, Job_Seekers.username from Job_Seekers 
    JOIN Users ON Job_Seekers.username = Users.username 
    WHERE Job_Seekers.username = ? AND 
    Users.years_of_xp  >= (SELECT min_xp FROM Jobs WHERE Jobs.title = ? AND Jobs.department = ? AND Jobs.company = ?);`,
      [jobTitle, department, company, username, jobTitle, department, company]
    );
    if (result[0].affectedRows != 0) {
      returnObject = {
        message: "Applied succssesfully",
        username: username,
        applicaitonID: result[0].insertId,
        URL: req.originalUrl,
      };
      logger.info("%o", returnObject);
      res.status(201).json(returnObject);
    } else {
      const error = new Error("Sorry The experience requirements are not meet");
      error.statusCode = 400;
      error.data = {
        username: username,
        jobTitle: jobTitle,
        department: department,
        company: company,
      };
      throw error;
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getJobQuestions = async (req, res, next) => {
  // logger.info("%o", req.params);
  const company = req.params.company;
  const department = req.params.department;
  const job = req.params.job;
  // logger.info("hello");
  const questions = await dbPool.query(
    `SELECT jhq.job,jhq.department,jhq.company,q.question,q.id 
    FROM Job_Has_Questions AS jhq JOIN Questions as q 
    ON (jhq.question = q.id)
    WHERE jhq.company = ? AND jhq.department = ? AND jhq.job = ?
    `,
    [company, department, job]
  );
  res.status(201).json({ Questions: questions[0] });
};

exports.postAnswers = async (req, res, next) => {
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
    const company = req.params.company;
    const department = req.params.department;
    const job = req.params.job;
    const application = req.params.application;
    const userAnswers = req.body.answers;
    // logger.info("%o", req.applicaiton);
    if (req.application.score) {
      const error = new Error(
        "you already solved this application You can't resubmit"
      );
      throw error;
    }
    //get the answers of the questions from the db
    // logger.info("%o", userAnswers);
    const questionsAnswers = await dbPool.query(
      `SELECT q.id, q.answer
    FROM Job_Has_Questions AS jhq JOIN Questions as q 
    ON (jhq.question = q.id)
    WHERE jhq.company = ? AND jhq.department = ? AND jhq.job = ?
    `,
      [company, department, job]
    );
    var score = 0;
    var answersToSave = [];
    questionsAnswers[0].forEach((questionAnswer) => {
      // logger.info("%o", questionAnswer.answer);
      const userAnswer = userAnswers.find((x) => x.id === questionAnswer.id);
      // logger.info("%o", userAnswer);
      if (!userAnswer) {
        const error = new Error("There are Answers missing");
        error.statusCode = 400;
        error.data = {
          username: username,
          jobTitle: job,
          department: department,
          company: company,
          questionNumber: questionAnswer.id,
        };
        throw error;
      }
      if (userAnswer && userAnswer.answer === questionAnswer.answer) {
        score++;
      }
      answersToSave.push([application, questionAnswer.id, userAnswer.answer]);
    });
    // logger.info(score);
    //update the score In the application
    const updateScoreResult = dbPool.query(
      `UPDATE Applications SET score = ? WHERE Applications.id = ?`,
      [score, application]
    );
    // logger.info("%o", updateScoreResult);
    // logger.info("%o", answersToSave);
    // compare the 2 and update the score in the application
    const result = await dbPool.query(
      `INSERT INTO Answers (application_id, question_id,answer) VALUES ?`,
      [answersToSave]
    );
    logger.info("%o", result[0]);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getApplications = async (req, res, next) => {
  try {
    const username = req.username;
    const applications = await dbPool.query(
      `SELECT * from Applications WHERE user = ? `,
      [username]
    );
    res.status(201).json({ Data: applications[0] });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.deleteApplication = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed");
      error.URL = req.originalUrl;
      error.username = req.username;
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const username = req.username;
    const application = req.application;
    if (application.status === "pending") {
      //delete
      const result = await dbPool.query(
        `DELETE FROM Applications WHERE id = ?`,
        [application.id]
      );
      if (result[0].affectedRows === 1) {
        const returnObject = {
          message: "Data deleted Successfully",
          username: username,
          applicaitonID: application.id,
          URL: req.originalUrl,
        };
        logger.info("%o", returnObject);
        res.status(201).json(returnObject);
      }
    } else {
      const error = new Error(
        "You can only delete an application at pending state"
      );
      error.statusCode = 400;
      error.data = {
        username: username,
        application: application.id,
      };
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.acceptOffer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed");
      error.URL = req.originalUrl;
      error.username = req.username;
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const username = req.username;
    const application = req.application;
    if (!application.manager_response) {
      const error = new Error("This application is not accepted yet");
      error.username = username;
      throw error;
    }
    // the application is ok to be accepted and take the position
    //need to get the job and company
    const result = await dbPool.query(
      `INSERT INTO Staff_Members(username, annual_leaves, company_email,work_time,salary,job,department,company)  
      (SELECT ?, ?, concat(?,"@",Companies.domain),Jobs.work_time,Jobs.salary,Jobs.title,Jobs.department,Jobs.company FROM Companies JOIN Jobs ON Companies.email = Jobs.company
       WHERE Companies.email = ? AND Jobs.title = ? AND Jobs.company = ? AND Jobs.department = ?);`,
      [
        username,
        30,
        username,
        application.company,
        application.job,
        application.company,
        application.department,
      ]
    );
    // logger.info("%o", result);
    if (result[0].affectedRows === 1) {
      // he is added to the staff member need to add him or her into the regular or hr or managers then delete all his applications
      const jobSelect = await dbPool.query(
        `SELECT role FROM Jobs WHERE Jobs.title = ? AND Jobs.company = ? AND Jobs.department = ?`,
        [application.job, application.company, application.department]
      );
      const role = jobSelect[0][0].role;
      var roleInsert;
      switch (role) {
        case "regular":
          roleInsert = await dbPool.query(
            `INSERT INTO Regulars (user) VALUES(?)`,
            [username]
          );
          break;
        case "hr":
          roleInsert = await dbPool.query(`INSERT INTO Hrs (user) VALUES(?)`, [
            username,
          ]);
          break;
        case "manager":
          roleInsert = await dbPool.query(
            `INSERT INTO Managers (user) VALUES(?)`,
            [username]
          );
          break;
      }
      // add the days off
      const daysOffResult = await dbPool.query(
        `INSERT INTO Staff_DaysOff VALUES ? `,
        [req.uniqueRightDaysOff]
      );
      if (daysOffResult[0].affectedRows !== req.uniqueRightDaysOff.length) {
        throw new Error("error at inserting days off");
      }

      if (roleInsert[0].affectedRows < 1) {
        throw new Error("Inserting into role tables had error");
      }
      //remove all applications of that user
      const applicationsRemoving = await dbPool.query(
        `DELETE FROM Applications WHERE user = ?`,
        [username]
      );
      if (applicationsRemoving[0].affectedRows < 1) {
        throw new Error("removing all applications had error");
      }
      //remove the user from the jobseekers
      const Job_SeekerRemoving = await dbPool.query(
        `DELETE FROM Job_Seekers WHERE username = ?`,
        [username]
      );
      if (Job_SeekerRemoving[0].affectedRows < 1) {
        throw new Error(
          "error when removing the user from the jobSeekers table"
        );
      }
      const returnObject = {
        message: "You are a employee in " + application.company,
        username: username,
        applicaitonID: application.id,
        URL: req.originalUrl,
      };
      logger.info("%o", returnObject);
      res.status(201).json({ returnObject });
    }
  } catch (err) {
    next(err);
  }
};
