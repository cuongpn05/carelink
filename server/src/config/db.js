const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI;

    if (!connStr) {
      throw new Error("MONGODB_URI is not configured in .env");
    }

    await mongoose.connect(connStr);

    console.log("MongoDB connected successfully");

    // Auto-seed hospitals if collection is empty
    try {
      const Hospital = require('../models/Hospital');
      const count = await Hospital.countDocuments();
      if (count === 0) {
        const { seedHospitals } = require('../seeders/hospitalSeeder');
        await seedHospitals();
      }
    } catch (seedErr) {
      console.warn("Could not auto-seed hospitals:", seedErr.message);
    }

    // Auto-seed caregivers if collection is empty
    try {
      const CaregiverProfile = require('../models/CaregiverProfile');
      const caregiverCount = await CaregiverProfile.countDocuments();
      if (caregiverCount === 0) {
        const { seedCaregiverList } = require('../seeders/caregiverListSeeder');
        await seedCaregiverList();
      }
    } catch (caregiverErr) {
      console.warn("Could not auto-seed caregivers:", caregiverErr.message);
    }
  } catch (error) {
    console.error("Database connection error:", error.message);
    throw error;
  }
};

module.exports = connectDB;
