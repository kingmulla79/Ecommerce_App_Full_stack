require("dotenv").config();
const jwt = require("jsonwebtoken");
const { sendEmail, sendOTPEmail } = require("../utils/Auto_Email");
const bcrypt = require("bcrypt");
const UserDetails = require("../models/UserDetails");
const UserOTPVerification = require("../models/UserOTPVerification");

const User_Register_User = async (req, res) => {
  try {
    const isNewUsername = await UserDetails.isThisUsernameInUse(
      req.body.username
    );
    if (!isNewUsername)
      return res.status(409).json({
        success: false,
        message: "A user with this username already exists",
      });
    const isNewEmail = await UserDetails.isThisEmailInUse(req.body.email);
    if (!isNewEmail)
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    const user_email = req.body.email;

    const userDetails = await new UserDetails({
      username: req.body.username,
      phone: req.body.phone,
      email: req.body.email,
      password: req.body.password,
    })
      .save()
      .then((result) => {
        console.log("User successfully registered");
      })
      .catch((err) => {
        console.log(err);
        res.status(401).json({
          success: false,
          message: "Error in registration.Try again",
        });
      });

    const newuser_id = await UserDetails.find({}).sort({ _id: -1 }).limit(1);

    console.log(newuser_id);

    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const subject = `Ecommerce email verification`;
    const html = `<p>Enter the OTP code below.</p><p>This code will expire in 1 hours.</p><br/>
      <p>Enter this code <b>${otp}</b> to verify</p>`;

    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);
    new UserOTPVerification({
      userId: newuser_id[0]._id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    })
      .save()
      .then((result) => {
        console.log("OTP successfully saved");
      })
      .catch((err) => {
        console.log(err);
        res.status(401).json({
          success: false,
          message: "Error in saving the OTP.Try again later",
        });
      });

    sendOTPEmail(user_email, subject, html)
      .then((result) => {
        res.status(201).json({
          status: "PENDING",
          success: true,
          message: `Successfully registered${result.message}.Please authenticate your email.`,
          data: {
            userId: newuser_id[0]._id,
            email: user_email,
          },
          redirect: "/api/auth/verifyOTP",
        });
      })
      .catch((error) => {
        console.log(error);
        res.status(401).json({
          success: false,
          message: error.message,
        });
      });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "The signup attempt failed",
      error: e,
    });
  }
};

const User_Verify_OTP = async (req, res) => {
  try {
    let { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(409).json({
        success: false,
        message: "Empty otp details",
      });
    } else {
      const UserOTPVerificationRecords = await UserOTPVerification.find({
        userId,
      });
      if (UserOTPVerificationRecords.length <= 0) {
        return res.status(409).json({
          success: false,
          message:
            "No existing OTP record. The account record does not exist or has already been verified. Please sign up or log in",
        });
      } else {
        const { expiresAt } = UserOTPVerificationRecords[0];
        const hashedOTP = UserOTPVerificationRecords[0].otp;

        if (expiresAt < Date.now()) {
          // OTP has expired
          await UserOTPVerification.deleteMany({ userId })
            .then(() => {
              res.json({
                message: `The OTP code has expired. Please sign in again`,
              });
            })
            .catch((error) => {
              console.log(error);
              res.status(400).json({
                success: false,
                message:
                  "An error occured while deleting verified user details",
                error,
              });
            });
        } else {
          const validOTP = await bcrypt.compare(otp, hashedOTP);

          if (!validOTP) {
            // supplied OTP is wrong
            res.status(400).json({
              success: false,
              message: "Invalid OTP code passed. Check your mail",
              error,
            });
          } else {
            await UserDetails.updateOne({ _id: userId }, { verified: true });
            UserOTPVerification.deleteMany({ userId })
              .then((result) => {
                res.status(201).json({
                  success: true,
                  message: `Successfully verified. You can now login`,
                  redirect: "/api/auth/login",
                });
              })
              .catch((error) => {
                console.log(error);
                res.status(400).json({
                  success: false,
                  message:
                    "An error occured while deleting OTP verification credentials",
                  error,
                });
              });
          }
        }
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "OTP verification attempt failed",
      error: error,
    });
  }
};

const User_Resend_OTP_Code = async (req, res) => {
  try {
    let { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(409).json({
        success: false,
        message: "Empty otp details",
      });
    } else {
      // delete existing records and resend OTP code
      await UserOTPVerification.deleteMany({ userId });
      const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
      const subject = `Ecommerce email verification`;
      const html = `<p>Enter the OTP code below.</p><p>This code will expire in 1 hours.</p><br/>
      <p>Enter this code <b>${otp}</b> to verify</p>`;

      const saltRounds = 10;
      const hashedOTP = await bcrypt.hash(otp, saltRounds);
      new UserOTPVerification({
        userId: userId,
        otp: hashedOTP,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      })
        .save()
        .then((result) => {
          console.log("OTP successfully saved");
        })
        .catch((err) => {
          console.log(err);
          res.status(401).json({
            success: false,
            message: "Error in saving the OTP.Try again later",
          });
        });

      sendOTPEmail(email, subject, html)
        .then((result) => {
          res.status(201).json({
            status: "PENDING",
            success: true,
            message: `Resend code operation successfully completed${result.message}.Please authenticate your email.`,
            data: {
              userId: userId,
              email: email,
            },
            redirect: "/api/auth/verifyOTP",
          });
        })
        .catch((error) => {
          console.log(error);
          res.status(401).json({
            success: false,
            message: error.message,
          });
        });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "The resend OTP code operation failed",
      error: error,
    });
  }
};

const User_Login_User = async (req, res) => {
  try {
    const saved_user = await UserDetails.findOne({
      username: req.body.username,
    });
    if (saved_user) {
      console.log(saved_user);
      if (saved_user.verified === true) {
        const result = await saved_user.comparePassword(req.body.password);
        if (result) {
          const token = jwt.sign(
            { user_id: saved_user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
          );

          let oldTokens = saved_user.tokens || [];

          if (oldTokens.length) {
            oldTokens = oldTokens.filter((t) => {
              const timeDiff = (Date.now() - parseInt(t.signedAt)) / 1000;
              if (timeDiff < 86400) {
                return t;
              }
            });
          }

          await UserDetails.findByIdAndUpdate(saved_user._id, {
            tokens: [...oldTokens, { token, signedAt: Date.now().toString() }],
          });
          console.log("success");
          res.status(200).json({
            success: true,
            message: "Login successful",
            authorization: token,
            user: {
              email: saved_user.email,
              username: saved_user.username,
              profile_pic: saved_user.profile_pic,
              phone: saved_user.phone,
            },
          });
        } else {
          console.log("Error");
          res.status(403).json({
            success: false,
            message: "The email or password is invalid",
            redirect: "/api/auth/login",
          });
        }
      } else {
        res.status(403).json({
          success: false,
          message: "Your email has not been verified",
          redirect: "/api/auth/login",
        });
      }
    } else {
      res.status(403).json({
        success: false,
        message: "The email or password is invalid",
        redirect: "/api/auth/login",
      });
    }
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "The login attempt failed",
      error: e,
    });
  }
};

const User_Logout_User = async (req, res) => {
  try {
    if (req.headers && req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authorization failed",
        });
      }
      const tokens = req.user.tokens;

      const newTokens = tokens.filter((t) => t.token !== token);
      await UserDetails.findByIdAndUpdate(req.user._id, { tokens: newTokens });
      res.status(200).json({
        success: true,
        message: "Signed out successfully",
        redirect: "/api/auth/login",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Sign out attempt failed",
    });
  }
};

module.exports = {
  User_Login_User,
  User_Register_User,
  User_Logout_User,
  User_Verify_OTP,
  User_Resend_OTP_Code,
};
