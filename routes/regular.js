const express = require("express");

const validator = require("../middleware/validators/regular");
const regularController = require("../controllers/regular");

const router = express.Router();

router.get("/getProjects", regularController.getProjects);
router.get("/getTasks/:project", regularController.getTasks);
router.put("/exitTask", validator.exitTask, regularController.exitTask);

module.exports = router;
