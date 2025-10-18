// models/productModel.js
const mongoose = require("mongoose");
const baseDetailsSchema = require("./baseDetailsSchema"); // Import common fields

const productSchema = new mongoose.Schema({
  category: { type: String, required: true }, // Specific field for Products
  ...baseDetailsSchema.obj // Spread the base schema fields
});

const Product = mongoose.model("Product", productSchema, "products");

module.exports = Product;
