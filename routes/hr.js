const express = require("express");

const validator = require("../middleware/validator");
const hrController = require("../controllers/hr");

const router = express.Router();

router.get("/getQuestions", hrController.getQuestions);
router.post(
  "/addQuestion",
  validator.addQuestionValidation,
  hrController.addQuestions
);
router.post("/addJob", validator.newJobValidation, hrController.addNewJob);

router.put(
  "/editJob/:jobTitle",
  validator.editJobValidation,
  hrController.editJob
);
router.get("/getJob/:jobTitle", hrController.getJob);
router.get("/getApplications/:jobTitle", hrController.viewApplications);

router.post("/applicationRespond", hrController.applicationRespond);
router.post(
  "/postAnnouncement",
  validator.postAnnouncement,
  hrController.postAnnouncement
);
router.get("/getRequests", hrController.getRequests);
router.put(
  "/requestRespond",
  validator.hrRequestRespond,
  hrController.requestRespond
);

router.get(
  "/showAttendanceRecords/:username",
  validator.atTheSameCompanyDepartmentCheck,
  hrController.showAttendanceRecords
);
router.get(
  "/showAttendanceByMonth/:username/:year",
  validator.atTheSameCompanyDepartmentCheck,
  hrController.hoursInYearByMonth
);
module.exports = router;
