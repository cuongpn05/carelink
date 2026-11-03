const express = require("express");
const router = express.Router();

const {
  getCaregivers,
  getFeaturedCaregivers,
  getCaregiverDetail,
  matchElderlyCaregivers,
} = require("../controllers/caregiverController");

// GET /api/caregivers/match-elderly (Phải đặt trước /:id)
router.get("/match-elderly", matchElderlyCaregivers);

// GET /api/caregivers
router.get("/", getCaregivers);
router.get("/featured", getFeaturedCaregivers);
router.get("/:id", getCaregiverDetail);

module.exports = router;
