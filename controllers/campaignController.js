const axios = require("axios");
const User = require("../models/userModel");
const Campaign = require("../models/campaignModel");
const Donation = require("../models/donationModel");

const paystackApi = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * @desc    Create a new campaign
 * @route   POST /api/campaigns
 * @access  Private
 *
 */
exports.createCampaign = async (req, res) => {
  try {
    const { title, description, goalAmount, bankCode, accountNumber } =
      req.body;

    // Get the logged-in user's ID
    const userId = req.user.id;
    const userFullName = req.user.fullName;

    if (!userFullName) {
      return res
        .status(400)
        .json({ status: "error", message: "User name not found." });
    }

    // console.log("User full name: ", userFullName);
    // console.log("Bank code: ", bankCode);
    // console.log("Account number: ", accountNumber);

    // Call Paystack to create the subaccount
    const response = await paystackApi.post("/subaccount", {
      business_name: userFullName,
      bank_code: bankCode,
      account_number: accountNumber,
      settlement_schedule: "manual", // 'manual' holds all funds until a payout is triggered.
      percentage_charge: 0, // This is the platform fee.
    });

    // console.log("Response: ", response)

    const { subaccount_code, settlement_bank } = response.data.data;

    // console.log("subaccount_code: ", subaccount_code);
    // console.log("bank_name: ", bank_name);

    // Create the campaign in the database
    const newCampaign = await Campaign.create({
      user: userId,
      title,
      description,
      goalAmount: goalAmount * 100,
      subaccountCode: subaccount_code,
      bankName: settlement_bank,
      accountNumber,
    });

    res.status(201).json({
      status: "success",
      message: "Campaign created successfully.",
      data: newCampaign,
    });
  } catch (error) {
    const paystackError = error.response?.data;
    console.error("Error creating campaign:", paystackError || error.message);

    // Send Paystack's actual error message and status code back
    if (paystackError) {
      return res.status(error.response.status).json({
        status: "error",
        message: paystackError.message || "An error occurred with Paystack.",
      });
    }

    // Handle other (e.g., database) errors
    res.status(500).json({
      status: "error",
      message: "An error occurred while creating the campaign.",
    });
  }
};

/**
 * @desc    Get all campaigns
 * @route   GET /api/campaigns
 * @access  Public
 */
exports.getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate(
      "user",
      "fullName username"
    );

    res.status(200).json({
      status: "success",
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

/**
 * @desc    Get a single campaign by its ID
 * @route   GET /api/campaigns/:id
 * @access  Public
 */
exports.getCampaignById = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = await Campaign.findOne({
      campaignId: campaignId,
    }).populate("user", "fullName username");

    if (!campaign) {
      return res
        .status(404)
        .json({ status: "error", message: "Campaign not found" });
    }

    res.status(200).json({
      status: "success",
      data: campaign,
    });
  } catch (error) {
    console.error("Error fetching campaign by ID:", error.message);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

/**
 * @desc    Activate a campaign after successful on-chain launch
 * @route   PATCH /api/campaigns/:id/activate
 * @access  Private
 */
exports.activateCampaign = async (req, res) => {
  try {
    const { campaignId } = req.body;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Ensure the person updating is the person who created it
    if (campaign.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    campaign.status = "active";
    campaign.campaignId = campaignId;
    await campaign.save();

    res.status(200).json({
      status: "success",
      message: "Campaign successfully activated.",
      data: campaign,
    });
  } catch (error) {
    console.error("Error activating campaign:", error.message);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};


/**
 * @desc    Get all Naira donations for a specific campaign
 * @route   GET /api/campaigns/:id/donations
 * @access  Public
 */
exports.getCampaignDonations = async (req, res) => {
    try {
        const campaignId = req.params.id;

        const donations = await Donation.find({ campaignId: campaignId }).sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            count: donations.length,
            data: donations,
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Server error" });
    }
}
