const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();
const caregiverRoutes = require("./routes/caregiverRoutes");
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Logging Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "CareLink Server is running",
  });
});
app.use("/api/caregivers", caregiverRoutes);
// Start Server after connecting to Database
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`CareLink Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
