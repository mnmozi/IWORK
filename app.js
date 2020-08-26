const path = require("path");

const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const db = require("./util/database");
const logger = require("./util/log");

const authMiddleware = require("./middleware/auth");
const roleMiddleware = require("./middleware/rolesCheck");

const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const companiesRouter = require("./routes/companies");
const jobsRouter = require("./routes/jobs");
const jobSeekerRouter = require("./routes/jobSeeker");
const staffMemberRouter = require("./routes/staff_members");
const hrRouter = require("./routes/hr");
// app.use((req, res, next) => {
//   logger.info(req.originalUrl);
//   next();
// });

app.use(bodyParser.json());
app.use("/auth", authRouter);
app.use("/user", authMiddleware, userRouter);
app.use("/companies", companiesRouter);
app.use("/jobs", jobsRouter);
app.use("/jobSeeker", authMiddleware, jobSeekerRouter);
app.use(
  "/staffMember",
  authMiddleware,
  roleMiddleware.staffMemberQuery,
  staffMemberRouter
);
app.use("/hr", authMiddleware, roleMiddleware.hrCheck, hrRouter);
// app.use("/", (req, res) => {
//   logger.info("This is the main page");
// });
app.use((error, req, res, next) => {
  const URL = req.originalUrl;
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  const username = error.username;
  // logger.error(JSON.stringify({ message: message, data: data }));
  logger.error("%o", {
    URL: req.originalUrl,
    status: status,
    username: username,
    message: message,
    data: data,
  });
  res.status(status).json({
    message: message,
    data: data,
  });
});

module.exports = app;
