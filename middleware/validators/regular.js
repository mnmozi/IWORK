const { body } = require("express-validator");
const validator = require("validator");
const dbPool = require("../../util/database");

exports.exitTask = [
  body("project").not().isEmpty(),
  body("task").custom(async (task, { req }) => {
    const staffMember = req.staffMember;
    const taskResult = await dbPool.query(
      `SELECT Tasks.* FROM Tasks JOIN Task_Contributors 
        ON Tasks.name = Task_Contributors.task AND Tasks.company = Task_Contributors.company AND Tasks.project = Task_Contributors.project
        WHERE Tasks.project = ? AND Tasks.name = ? AND Tasks.company = ? AND Task_Contributors.username = ?`,
      [req.body.project, req.body.task, staffMember.company, req.username]
    );
    if (taskResult[0].length !== 1) {
      throw new Error(
        "There is no task with that name in your company that you are assigned to"
      );
    }
    if (new Date().getTime() > new Date(taskResult[0][0].deadline)) {
      throw new Error("Your can't edit as The deadline has passed");
    }
    req.task = taskResult[0][0];
  }),
  body("status").custom((status, { req }) => {
    if (!validator.isIn(status, ["fixed", "assigned"])) {
      throw new Error(`Value should be assigned or fixed`);
    }
    if (status === req.task.status) {
      throw new Error(`The task is already at ${req.body.status} status`);
    }
    return true;
  }),
];
