const express = require("express");
const router = express.Router();
const {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  activateCampaign,
  getCampaignDonations,
  addCampaignEvidence,
  uploadEvidence,
} = require("../controllers/campaignController");
const { protect } = require("../middleware/authMiddleware");
// routes/campaignRoutes.js
const upload = require('../utils/fileUpload'); 

/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign
 * @access  Private
 */
router.post("/", protect, createCampaign);

/**
 * @route   POST /api/campaigns/upload
 * @desc    Upload evidence files to Cloudinary
 * @access  Private
 */
router.post(
  "/upload",
  protect,
  upload.array("evidence", 10), // <--- Changed from 5 to 10
  uploadEvidence
);

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns
 * @access  Public
 */
router.get("/", getAllCampaigns);

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get a single campaign by its ID
 * @access  Public
 */
router.get("/:id", getCampaignById);

/**
 * @route   PATCH /api/campaigns/:id/activate
 * @desc    Active a campaign after successful on-chain launch
 * @access  Private
 */
router.patch("/:id/activate", protect, activateCampaign);

/**
 * @route   PATCH /api/campaigns/:id/evidence
 * @desc    Add new evidence to a campaign
 * @access  Private
 */
router.patch("/:id/evidence", protect, addCampaignEvidence);

router.get("/:id/donations", getCampaignDonations);

module.exports = router;
