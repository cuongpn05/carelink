const express = require("express");
const router = express.Router();

const {
  getCaregivers,
  getFeaturedCaregivers,
  getCaregiverDetail,
} = require("../controllers/caregiverController");

// GET /api/caregivers
router.get("/", getCaregivers);
router.get("/featured", getFeaturedCaregivers);
router.get("/:id", getCaregiverDetail);
module.exports = router;
