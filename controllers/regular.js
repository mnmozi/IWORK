const logger = require("winston");
const { validationResult } = require("express-validator");

const dbPool = require("../util/database");

exports.getProjects = async (req, res, next) => {
  try {
    const username = req.username;
    const staffMember = req.staffMember;
    const results = await dbPool.query(
      `SELECT Projects.* FROM Projects 
    JOIN Task_Contributors ON Projects.company = Task_Contributors.company AND Projects.name = Task_Contributors.project 
    WHERE Task_Contributors.username = ? AND Projects.company = ?`,
      [username, staffMember.company]
    );
    const returnedObject = {
      message: `Projects`,
      username: username,
      Data: {
        projects: results[0],
      },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const username = req.username;
    const project = req.params.project;
    const staffMember = req.staffMember;
    const result = await dbPool.query(
      `SELECT Tasks.* FROM Tasks JOIN Task_Contributors 
    ON Tasks.name = Task_Contributors.task AND Tasks.company = Task_Contributors.company AND Tasks.project = Task_Contributors.project
    WHERE Task_Contributors.username = ? AND Tasks.project = ? AND Tasks.company = ?`,
      [username, project, staffMember.company]
    );
    const returnedObject = {
      message: `Task`,
      username: username,
      Data: {
        projects: result[0],
      },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};

exports.exitTask = async (req, res, next) => {
  try {
    const username = req.username;
    const project = req.body.project;
    const taskName = req.body.task;
    const staffMember = req.staffMember;
    const status = req.body.status;
    logger.info("%o", req.task);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed");
      error.URL = req.originalUrl;
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    if (status === "assigned" && req.task.manager !== null) {
      const error = new Error(
        "you can't open the task as one of the managers reviewed it"
      );
      error.data = {
        project: project,
        task: taskName,
        manager: req.task.manager,
      };
      throw error;
    }
    const result = await dbPool.query(
      `UPDATE Tasks SET status = ? WHERE Tasks.name = ? AND Tasks.project = ? AND Tasks.company = ?`,
      [status, taskName, project, staffMember.company]
    );
    if (result[0].affectedRows !== 1) {
      const error = new Error(
        "something went wrong while updating the status of the task"
      );
      error.username = username;
      error.data = {
        project: project,
        task: taskName,
        company: staffMember.company,
      };
    }
    const returnedObject = {
      message: `edit task status`,
      username: username,
      Data: {
        project: project,
        task: taskName,
        status: status,
      },
      URL: req.originalUrl,
    };
    res.status(201).json({ returnedObject });
  } catch (err) {
    next(err);
  }
};
