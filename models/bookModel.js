// models/bookModel.js
const mongoose = require("mongoose");
const baseDetailsSchema = require("./baseDetailsSchema"); // Import common fields

const bookSchema = new mongoose.Schema({
  author: { type: String, required: true },   // Specific field for Books
  isbn: { type: String },                     // ISBN for Books
  ...baseDetailsSchema.obj // Spread the base schema fields
});

const Book = mongoose.model("Book", bookSchema, "books");

module.exports = Book;
