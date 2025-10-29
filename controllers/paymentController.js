const axios = require("axios");
const User = require("../models/userModel");
const Campaign = require("../models/campaignModel");
const Donation = require("../models/donationModel");
const { sendPayoutNotification } = require('../utils/emailSender');


const paystackApi = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * @desc    Create a Paystack Subaccount for a campaign creator
 * @route   POST /api/payments/subaccount
 * @access  Private (only logged-in users)
 */
exports.createSubaccount = async (req, res) => {
  try {
    const { businessName, bankCode, accountNumber } = req.body;

    // Get the logged-in user's ID
    const userId = req.user.id;

    // Call Paystack to create the subaccount
    const response = await paystackApi.post("/subaccount", {
      business_name: businessName,
      bank_code: bankCode,
      account_number: accountNumber,
      settlement_schedule: "manual", // 'manual' holds all funds until a payout is triggered.
      percentage_charge: 0, // This is the platform fee.
    });

    const { subaccount_code } = response.data.data;

    // Save the new subaccount code to the user's record in your database
    await User.findByIdAndUpdate(userId, { subaccountCode: subaccount_code });

    res.status(201).json({
      status: "success",
      message: "Subaccount created successfully.",
      data: response.data.data,
    });
  } catch (error) {
    console.error(
      "Error creating subaccount:",
      error.response?.data || error.message
    );
    res.status(500).json({
      status: "error",
      message: "An error occurred while creating the subaccount.",
    });
  }
};

/**
 * @desc    Verify a transaction after a donation is made
 * @route   GET /api/payments/verify/:reference
 * @access  Public
 */
exports.verifyTransaction = async (req, res) => {
  try {
    const { reference } = req.params;
    const response = await paystackApi.get(`/transaction/verify/${reference}`);
    const { status, amount, customer, metadata } = response.data.data;
    const { campaignDbId, campaignId, isAnonymous, displayName } = metadata;

    console.log("CampaignId from metadata: ", campaignId);
    console.log("CampaignDbId from metadata: ", campaignDbId);
    console.log("Is anonymous: ", isAnonymous);

    // Check if the transaction was successful
    if (status !== "success") {
      return res
        .status(400)
        .json({ status: "error", message: "Transaction was not successful." });
    }

    // Check if this donation has already been verified and recorded
    const existingDonation = await Donation.findOne({
      paystackReference: reference,
    });
    if (existingDonation) {
      return res.status(200).json({
        status: "success",
        message: "Transaction has already been verified.",
      });
    }

    // Check the campaign id from the metadata
    if (!campaignId) {
      // The frontend did not send the campaignId
      console.error(
        "Error: CampaignId not found in metadata for reference",
        reference
      );
      return res.status(400).json({
        status: "error",
        message: "CampaignId not found in metadata.",
      });
    }

    // Create the donation record
    await Donation.create({
      campaignDbId: campaignDbId,
      campaignId: campaignId,
      donorEmail: customer.email,
      donorDisplayName: displayName,
      amount: amount, // Amount is already in Kobo from paystack
      paystackReference: reference,
      isAnonymous: isAnonymous,
    });

    // Update the campaigns' total amount raised
    await Campaign.findOneAndUpdate(
      { campaignId: campaignId },
      {
        $inc: { amountRaised: amount },
      }
    );

    console.log(
      `Donation of ${amount / 100} NGN by ${
        customer.email
      } verified and recorded.`
    );

    res.status(200).json({
      status: "success",
      message: "Transaction has been verified successfully.",
    });
  } catch (error) {
    console.error(
      "Error verifying transaction:",
      error.response?.data || error.message
    );
    res.status(500).json({
      status: "error",
      message: "An error occurred during transaction verification.",
    });
  }
};

/**
 * @desc    Trigger a payout to a campaign creator
 * @route   POST /api/payments/payout
 * @access  Private
 */
exports.triggerPayout = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user.id;

    const campaign = await Campaign.findOne({ campaignId: campaignId });
    const user = await User.findOne({ _id: userId });

    // Validate payout
    if (!campaign) {
      return res.status(404).json({
        status: "error",
        message: "Campaign not found.",
      });
    }

    console.log("Campaign found: ", campaign);

    if (campaign.user.toString() !== userId) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to initiate payout for this campaign.",
      });
    }

    console.log("User authorized for payout.");

    if (!campaign.subaccountCode) {
      return res.status(400).json({
        status: "error",
        message: "Campaign has no subaccount configured for payout.",
      });
    }

    console.log("Subaccount code found: ", campaign.subaccountCode);

    // Trigger payout
    await paystackApi.put(`/subaccount/${campaign.subaccountCode}`, {
      settlement_schedule: "auto",
    });

    console.log("User: ", user)

    // Send notification email to the campaign creator
    try {
      await sendPayoutNotification(
          user.email, 
          user.fullName, 
          campaign.title,
          campaign.amountRaised
      );
    } catch (emailError) {
      // Log email error but don't stop the success response
      console.error(`Payout initiated for ${campaign.subaccountCode}, but notification email failed.`);
    }

    res.status(200).json({
      status: "success",
      message:
        "Payout has been initiated. Funds will be settled to your account shortly.",
    });

    console.log("Payout triggered successfully.");
  } catch (error) {
    console.error("Error triggering payout:", error);
    
    const paystackError = error.response?.data;
    console.error("Error triggering payout:", paystackError || error.message);

    if (paystackError) {
      return res.status(error.response.status).json({
        status: "error",
        message:
          paystackError.message ||
          "An error occurred with Paystack during payout.",
      });
    }
    res.status(500).json({
      status: "error",
      message: "An error occurred while initiating the payout.",
    });
  }
};

exports.getBankList = async (req, res) => {
  try {
    const response = await axios.get("https://api.paystack.co/bank");
    res.status(200).json(response.data.data);
  } catch (error) {
    console.error("error: ", error);
    res.status(500).json({ status: "error", message: "Could not fetch banks" });
  }
};

exports.resolveAccount = async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;

    const response = await paystackApi.get(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Resolve account error:",
      error.response?.data || error.message
    );

    const statusCode = error.response ? error.response.status : 500;
    const message = error.response
      ? error.response.data.message
      : "Account details could not be resolved.";

    res.status(statusCode).json({ status: "error", message: message });
  }
};
