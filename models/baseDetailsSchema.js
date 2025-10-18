// models/baseDetailsSchema.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Base schema with common fields for both Books and Products
const baseDetailsSchema = new Schema({
  tagId: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, default: true },
  imageUrl: { type: String },
  description: { type: String },
  allocatedTo: { type: String },
  entryDate: { type: Date, default: Date.now }
}, { discriminatorKey: 'type', _id: false });

module.exports = baseDetailsSchema;
