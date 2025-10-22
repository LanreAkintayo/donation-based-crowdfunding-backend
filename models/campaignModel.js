const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const campaignSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a campaign title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },
    goalAmount: {
      type: Number,
      required: [true, "Please provide a goal amount"],
    },
    amountRaised: {
      type: Number,
      default: 0,
    },

    // --- Payout & Subaccount Details ---
    subaccountCode: {
      type: String,
      required: [true, "Paystack subaccount code is required"],
      trim: true,
    },
    bankName: {
      type: String,
      required: [true, "Bank name is required"],
    },
    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
    },
    status: {
      type: String,
      enum: ["pending", "active", "failed"],
      default: "pending",
    },
    campaignId: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

const Campaign = mongoose.model("Campaign", campaignSchema);

module.exports = Campaign;
