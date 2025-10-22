const express = require('express');
const router = express.Router();
const {
    createCampaign,
    getAllCampaigns,
    getCampaignById
} = require('../controllers/campaignController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign
 * @access  Private
 */
router.post('/', protect, createCampaign);

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns
 * @access  Public
 */
router.get('/', getAllCampaigns);

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get a single campaign by its ID
 * @access  Public
 */
router.get('/:id', getCampaignById);

/**
 * @route   PATCH /api/campaigns/:id/activate
 * @desc    Active a campaign after successful on-chain launch
 * @access  Private
 */
router.patch("/:id/activate", protect, activateCampaign);

module.exports = router;