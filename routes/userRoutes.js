const express = require("express");
const router = express.Router();
const { jwtauthMiddleware, generateToken } = require("../jwt");

const bodyParser = require("body-parser");
router.use(bodyParser.json());

const User = require("../models/user");
// POST route to add a person

router.post("/signup", async (req, res) => {
  try {
    const data = req.body; // Assuming the request body contains the person data''

    const adminUser = await User.findOne({ role: "admin" });
    if (data.role === "admin" && adminUser) {
      return res.status(403).json({ error: "Admin already exists" });
    }

    // Validate Aadhar Card Number must have exactly 12 digit
    if (!/^\d{12}$/.test(data.aadharCardNumber)) {
      return res
        .status(400)
        .json({ error: "Aadhar Card Number must be exactly 12 digits" });
    }

    // Check if a user with the same Aadhar Card Number already exists
    const existingUser = await User.findOne({
      aadharCardNumber: data.aadharCardNumber,
    });
    if (existingUser) {
      return res.status(400).json({
        error: "User with the same Aadhar Card Number already exists",
      });
    }
    // create a new User document using the Mongoose model

    const newUser = new User(data);

    // save the new user to the database

    const response = await newUser.save();
    console.log("data saved");
    const payload = {
      id: response.id,
    };
    console.log(JSON.stringify(payload));

    const token = generateToken(payload);
    console.log("Token is : ", token);

    res.status(200).json({ response: response, token: token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { aadharCardNumber, password } = req.body;
    // find the user by username

    // Check if aadharCardNumber or password is missing
    if (!aadharCardNumber || !password) {
      return res
        .status(400)
        .json({ error: "Aadhar Card Number and password are required" });
    }

    const user = await User.findOne({ aadharCardNumber: aadharCardNumber });
    // if user not found or password is incorrect return error
    if (!user || !(await user.comparePassword(password))) {
      return res.status(404).json({ error: "Invalid username and password" });
    }
    // generate token
    const payload = {
      id: user.id,
    };
    const token = generateToken(payload);
    // return token as response
    res.status(200).json({ token: token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// profile route
router.get("/profile", jwtauthMiddleware, async (req, res) => {
  try {
    const userData = req.user;

    const userID = userData.id;
    const user = await User.findById(userID);

    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT method to update records
router.put("/profile/password", jwtauthMiddleware, async (req, res) => {
  try {
    // extract id from token
    const userID = req.user;
    //req.body store data that can be passed by client
    const { currentPassword, newPassword } = req.body;
    // Check if currentPassword and newPassword are present in the request body
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both currentPassword and newPassword are required" });
    }
    // find the user by userID
    const user = await User.findById(userID);
    // if user not found or password is incorrect return error
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(404).json({ error: "Invalid password" });
    }
    user.password = newPassword;
    await user.save();
    console.log("password updated successfully");
    res.status(200).json({ message: "password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
