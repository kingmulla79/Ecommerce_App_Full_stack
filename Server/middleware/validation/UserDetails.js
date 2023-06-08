const { check, validationResult } = require("express-validator");

exports.validateUserRegistration = [
  check("username")
    .trim()
    .not()
    .isEmpty()
    .withMessage("username is required")
    .isLength({ min: 5, max: 20 })
    .withMessage("Name must be between 5 to 20 characters"),
  check("phone")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Phone number is required")
    .isInt()
    .withMessage("Only uses numbers for your phone number")
    .isLength({ min: 10, max: 10 })
    .withMessage("Your number should contain exactly 10 digits"),
  check("email")
    .trim()
    .not()
    .isEmpty()
    .withMessage("The email address is empty")
    .normalizeEmail()
    .isEmail()
    .withMessage("Enter a valid email address")
    .matches(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
    .withMessage("Only use valid email characters"),

  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("password is required")
    .matches(/^[A-Za-z0-9 .,'!&]+$/)
    .withMessage(
      "Password must contains numbers, letters and special characters('[A-Za-z0-9 .,'!&]+$')"
    )
    .isLength({ min: 8 })
    .withMessage("Password must be 8 characters long"),
  check("confirmpassword")
    .trim()
    .not()
    .isEmpty()
    .withMessage("A password confirmation is required")
    .matches(/^[A-Za-z0-9 .,'!&]+$/)
    .withMessage(
      "Password must contains numbers, letters and special characters('^[A-Za-z0-9 .,'!&]+$')"
    )
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Both passwords must be the same");
      }
      return true;
    }),
];
exports.validateUserSignIn = [
  check("username").trim().not().isEmpty().withMessage("username is required"),
  check("password").trim().not().isEmpty().withMessage("password is required"),
];

exports.userValidation = (req, res, next) => {
  const result = validationResult(req).array();
  console.log(result);
  if (!result.length) return next();

  const error = result[0].msg;
  res.json({
    success: false,
    message: error,
  });
};
