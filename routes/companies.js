const express = require("express");

const companiesController = require("../controllers/companies");

const router = express.Router();

router.get("/:companyEmail", companiesController.getCompany);
router.post("/filter", companiesController.companyFilter);
module.exports = router;
