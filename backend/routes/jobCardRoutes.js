const express = require("express");

const {
  createJobCard,
  getJobCards,
  getJobCard,
  updateJobCard,
  deleteJobCard,
  addPartToJobCard,
  changeJobCardStatus,
} = require("../controllers/jobCardController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");
const { authorizePermission } = require("../utils/permissions");

const router = express.Router();

// View all job cards
router.get("/", protect, authorizePermission("jobs.view"), getJobCards);

router.post(
  "/:id/parts",
  protect,
  authorizePermission("jobs.parts"),
  addPartToJobCard
);

// View one job card
router.get("/:id", protect, authorizePermission("jobs.view"), getJobCard);

// Create job card
router.post(
  "/",
  protect,
  authorizePermission("jobs.create"),
  createJobCard
);

// Update job card
router.put(
  "/:id",
  protect,
  authorizePermission("jobs.manage"),
  updateJobCard
);

// Change status (start / complete / cancel)
router.put(
  "/:id/status",
  protect,
  authorizePermission("jobs.status"),
  changeJobCardStatus
);

// Delete job card
router.delete(
  "/:id",
  protect,
  authorizePermission("jobs.delete"),
  deleteJobCard
);

module.exports = router;