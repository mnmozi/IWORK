const express = require("express");

const staffMemberController = require("../controllers/staff_members");
const validator = require("../middleware/validator");

const router = express.Router();

router.get("/checkIn", staffMemberController.checkIn);
router.get("/checkOut", staffMemberController.checkOut);
router.post(
  "/myRecords",
  validator.oldPeriodCheck,
  staffMemberController.getAttendanceRecords
);
router.post(
  "/applyForRequest",
  validator.comingPeriodCheck,
  validator.applyForRequest,
  staffMemberController.applyForRequest
);

router.get("/getMyRequests", staffMemberController.getMyRequests);
router.delete(
  "/deleteRequest",
  validator.idValidation,
  staffMemberController.deleteRequest
);
router.get("/announcements", staffMemberController.getAnnouncements);

module.exports = router;
