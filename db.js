const mongoose = require("mongoose");
require("dotenv").config();
// const MongoDB_URL = process.env.MONGODB_LOCAL_URL;
const MongoDB_URL = process.env.MONGODB_LIVE_URL;

mongoose.connect(MongoDB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("connected", () => {
  console.log("MongoDB connected successfully");
});

db.on("error", (error) => {
  console.log("MongoDB connection error", error);
});

db.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

module.exports = db;
