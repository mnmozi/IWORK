const express = require("express");
const userController = require("../controllers/user");
const validator = require("../middleware/validator");
const isAuth = require("../middleware/auth");

const router = express.Router();

router.get("/profile", userController.proflie);
router.put(
  "/updateProfile",
  validator.updateProfileValidator,
  userController.editProfile
);
module.exports = router;
