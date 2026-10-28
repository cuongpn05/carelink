const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI;

    if (!connStr) {
      throw new Error("MONGODB_URI is not configured in .env");
    }

    await mongoose.connect(connStr);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Database connection error:", error.message);
    throw error;
  }
};

module.exports = connectDB;
