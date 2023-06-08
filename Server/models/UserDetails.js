const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const userDetailsSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Please enter a valid username"],
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Please enter a valid password"],
    },
    profile_pic: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "user",
    },
    tokens: [{ type: Object }],
  },
  { timestamps: true }
);

userDetailsSchema.pre("save", function (next) {
  if (!this.isModified("password")) {
    next();
  }
  bcrypt.hash(this.password, 10, (err, hash) => {
    if (err) return next(err);

    this.password = hash;
    next();
  });
});

userDetailsSchema.methods.comparePassword = async function (password) {
  if (!password) throw new Error("No password provided.");

  try {
    const result = await bcrypt.compare(password, this.password);
    return result;
  } catch (error) {
    console.log("Error while comparing password!", error.message);
  }
};

userDetailsSchema.statics.isThisUsernameInUse = async function (username) {
  if (!username) throw new Error("Invalid username: No username provided");
  try {
    const user = await this.findOne({ username });
    if (user) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.log("Error inside isThisUsernameInUse method", error.message);
    return false;
  }
};

userDetailsSchema.statics.isThisEmailInUse = async function (email) {
  if (!email) throw new Error("Invalid email: No email provided");
  try {
    const user = await this.findOne({ email });
    if (user) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.log("Error inside isThisEmailInUse method", error.message);
    return false;
  }
};

const UserDetails = mongoose.model("User", userDetailsSchema);

module.exports = UserDetails;
