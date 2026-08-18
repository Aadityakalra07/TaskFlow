const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");
  } catch (err) {
    console.log("Connection Unsuccesful ", err.message);
    throw err;
  }
};
module.exports = connectDB;