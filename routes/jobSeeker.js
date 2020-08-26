const express = require("express");

const jobSeekerController = require("../controllers/jobSeeker");
const validator = require("../middleware/validator");

const router = express.Router();

router.post("/apply", jobSeekerController.applyForJob);
router.get(
  "/getquestions/:company/:department/:job",
  jobSeekerController.getJobQuestions
);
router.post(
  "/submitAnswers/:company/:department/:job/:application",
  validator.applicationOwnerCheck,
  jobSeekerController.postAnswers
);
router.get("/getapplications", jobSeekerController.getApplications);
router.delete(
  "/deleteApplication/:application",
  validator.applicationOwnerCheck,
  jobSeekerController.deleteApplication
);
router.post(
  "/acceptOffer/:application",
  validator.applicationOwnerCheck,
  validator.setVacationsDays,
  jobSeekerController.acceptOffer
);
module.exports = router;
