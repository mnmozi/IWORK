const express = require("express");
const jobsController = require("../controllers/jobs");

const router = express.Router();
router.get("/vacancies/:companyDomain", jobsController.availableVacancies);
router.get(
  "/CompaniesWithhighestSalaries",
  jobsController.highAvgSalariesCompanies
);
router.get("/jobsSearch", jobsController.searchByNameOrDesc);
module.exports = router;
