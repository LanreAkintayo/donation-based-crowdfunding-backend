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
    // 1. Destructure ALL the new fields
    const { 
      title, 
      description, 
      goalAmount, 
      bankCode, 
      accountNumber,
      image,    // <--- Project/Cover Image URL
      duration, // <--- Duration in days (e.g. 30)
      evidence  // <--- Array of evidence objects [{name, url, type}]
    } = req.body;

    console.log("Title: ", title);
    console.log("description: ", description);
    console.log("goalAmount: ", goalAmount);
    console.log("bankCode: ", bankCode);
    console.log("accountNumber: ", accountNumber);
    console.log("Image URL: ", image);
    console.log("Duration (days): ", duration);
    console.log("Evidence: ", evidence);

    const userId = req.user.id;
    const userFullName = req.user.fullName;

    if (!userFullName) {
      return res.status(400).json({ status: "error", message: "User name not found." });
    }

    // 2. Calculate the Deadline
    // Current time + (duration in days * 24 hours * 60 mins * 60 secs * 1000 ms)
    const deadlineDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

    // 3. Call Paystack (No changes needed here)
    const response = await paystackApi.post("/subaccount", {
      business_name: userFullName,
      bank_code: bankCode,
      account_number: accountNumber,
      settlement_schedule: "manual",
      percentage_charge: 0,
    });

    const { subaccount_code, settlement_bank } = response.data.data;

    // 4. Create the campaign with ALL fields
    const newCampaign = await Campaign.create({
      user: userId,
      title,
      description,
      goalAmount: goalAmount * 100,
      subaccountCode: subaccount_code,
      bankName: settlement_bank,
      accountNumber,
      
      // --- NEW FIELDS ---
      image: image,         // Save the cover image URL
      duration: duration,   // Save duration (optional, for UI)
      deadline: deadlineDate, // Save the calculated end date
      evidence: evidence    // Save the array of evidence URLs
    });

    res.status(201).json({
      status: "success",
      message: "Campaign created successfully.",
      data: newCampaign,
    });

  } catch (error) {
    const paystackError = error.response?.data;
    console.error("Error creating campaign:", paystackError || error.message);

    if (paystackError) {
      return res.status(error.response.status).json({
        status: "error",
        message: paystackError.message || "An error occurred with Paystack.",
      });
    }

    res.status(500).json({
      status: "error",
      message: "An error occurred while creating the campaign.",
    });
  }
};

// exports.createCampaign = async (req, res) => {
//   try {
//     const { title, description, goalAmount, bankCode, accountNumber } =
//       req.body;

//     // Get the logged-in user's ID
//     const userId = req.user.id;
//     const userFullName = req.user.fullName;

//     if (!userFullName) {
//       return res
//         .status(400)
//         .json({ status: "error", message: "User name not found." });
//     }

//     // Call Paystack to create the subaccount
//     const response = await paystackApi.post("/subaccount", {
//       business_name: userFullName,
//       bank_code: bankCode,
//       account_number: accountNumber,
//       settlement_schedule: "manual", // 'manual' holds all funds until a payout is triggered.
//       percentage_charge: 0, // This is the platform fee.
//     });

//     // console.log("Response: ", response)

//     const { subaccount_code, settlement_bank } = response.data.data;

//     // console.log("subaccount_code: ", subaccount_code);
//     // console.log("bank_name: ", bank_name);

//     // Create the campaign in the database
//     const newCampaign = await Campaign.create({
//       user: userId,
//       title,
//       description,
//       goalAmount: goalAmount * 100,
//       subaccountCode: subaccount_code,
//       bankName: settlement_bank,
//       accountNumber,
//     });

//     res.status(201).json({
//       status: "success",
//       message: "Campaign created successfully.",
//       data: newCampaign,
//     });
//   } catch (error) {
//     const paystackError = error.response?.data;
//     console.error("Error creating campaign:", paystackError || error.message);

//     // Send Paystack's actual error message and status code back
//     if (paystackError) {
//       return res.status(error.response.status).json({
//         status: "error",
//         message: paystackError.message || "An error occurred with Paystack.",
//       });
//     }

//     // Handle other (e.g., database) errors
//     res.status(500).json({
//       status: "error",
//       message: "An error occurred while creating the campaign.",
//     });
//   }
// };

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

    // if (evidence && Array.isArray(evidence) && evidence.length > 0) {
    //   campaign.evidence.push(...evidence);
    // }

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
 * @desc    Add new evidence to an existing campaign
 * @route   PATCH /api/campaigns/:id/evidence
 * @access  Private
 */
exports.addCampaignEvidence = async (req, res) => {
  try {
    const { evidence } = req.body; // Expecting an array of new evidence objects
    
    // 1. Find the campaign
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // 2. Authorization: Ensure the person updating is the owner
    if (campaign.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to update this campaign" });
    }

    // 3. Validation: Ensure we actually have data to add
    if (!evidence || !Array.isArray(evidence) || evidence.length === 0) {
      return res.status(400).json({ message: "No evidence data provided" });
    }

    // 4. Update: Push the new items into the existing array
    // We use the spread operator (...) to push multiple items at once
    campaign.evidence.push(...evidence);

    // Optional: If you want to limit total evidence to say 10 items
    if (campaign.evidence.length > 10) {
        return res.status(400).json({ message: "Maximum limit of 10 evidence files reached." });
    }

    await campaign.save();

    res.status(200).json({
      status: "success",
      message: "New evidence added successfully.",
      data: campaign,
    });

  } catch (error) {
    console.error("Error adding evidence:", error.message);
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


// @desc    Upload campaign evidence files
// @route   POST /api/campaigns/upload
// @access  Private
exports.uploadEvidence = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Map the files to a clean format
    const fileLinks = req.files.map((file) => ({
      name: file.originalname,
      url: file.path,       // Cloudinary URL
      type: file.mimetype,  // e.g., 'application/pdf'
    }));

    res.status(200).json({
      message: "Evidence uploaded successfully",
      files: fileLinks,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "File upload failed" });
  }
};