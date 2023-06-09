const express = require("express");
const router = express.Router();
const Homepage_Controllers = require("../controllers/Homepage_Controller");
const { isAuth, isVerified } = require("../middleware/Auth");

const uploads = require("../multer");

router.get("/", isAuth, isVerified, Homepage_Controllers.HomePage_Load_Page);
router.post(
  "/upload-profile-pic",
  isAuth,
  isVerified,
  uploads.single("profile"),
  Homepage_Controllers.Homepage_Upload_Profile_Pic
);
module.exports = router;
