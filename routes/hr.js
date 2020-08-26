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
router.get("/getJob/:jobTitle", hrController.getJob);

module.exports = router;
