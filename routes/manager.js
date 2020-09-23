const express = require("express");

const validator = require("../middleware/validators/manager");
const managerController = require("../controllers/manager");

const router = express.Router();

router.get("/viewRequests", managerController.viewRequests);
router.put(
  "/requestRespond",
  validator.managerRequestRespond,
  managerController.requestRespond
);
router.get("/getApplications", managerController.getApplications);
router.put(
  "/applicationRespond",
  validator.managerApplicationRespond,
  managerController.applicationsRespond
);
router.post(
  "/createProject",
  validator.createProject,
  managerController.createProject
);
router.post(
  "/addProjectContributor",
  validator.addProjectContributor,
  managerController.assignToProject
);
router.delete(
  "/removeProjectContributor",
  validator.removeProjectContributor,
  managerController.removeProjectContributor
);
router.post("/createTask", validator.createTask, managerController.createTask);
router.post(
  "/assignToTask",
  validator.assignToTask,
  managerController.assignToTask
);

router.post(
  "/changeContributor",
  validator.changeContributor,
  managerController.changeContributor
);
router.get("/getTasks", validator.getTasks, managerController.getTasks);

router.put("/reviewTask", validator.reviewTask, managerController.reviewTask);

module.exports = router;
