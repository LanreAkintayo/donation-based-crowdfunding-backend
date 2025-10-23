const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const donationSchema = new Schema(
  {
    campaignDbId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },

    campaignId: {
      type: Number,
      required: true,
    },

    donorEmail: {
      type: String,
      required: true,
      trim: true,
    },
    donorUserName: {
      type: String,
      trim: true,
      default: null,
    },
    amount: {
      type: Number, // Stored in Kobo
      required: true,
    },
    paystackReference: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate entries for the same transaction
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    // This is optional
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const Donation = mongoose.model("Donation", donationSchema, "donations");

module.exports = Donation;
