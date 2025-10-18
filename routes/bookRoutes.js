// routes/bookRoutes.js
const express = require("express");
const router = express.Router();
const Book = require("../models/bookModel"); // Import the Book model

// POST route to add a new book
router.post("/add-book", async (req, res) => {
  try {
    const { tagId, name, author, isbn, status, imageUrl, description, allocatedTo } = req.body;

    const newBook = new Book({
      tagId,
      name,
      author,
      isbn,
      status,
      imageUrl,
      description,
      allocatedTo,
    });

    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (error) {
    res.status(500).json({ message: "Error adding book", error: error.message });
  }
});

module.exports = router;
