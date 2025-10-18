// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../models/productModel"); // Import the Product model

// POST route to add a new product
router.post("/add-product", async (req, res) => {
  try {

    const { tagId, name, category, status, imageUrl, description, allocatedTo } = req.body;

    const newProduct = new Product({
      tagId,
      name,
      category,
      status,
      imageUrl,
      description,
      allocatedTo,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.log("Error: ", error)
    res.status(500).json({ message: "Error adding product", error: error.message });
  }
});


// GET route to fetch all products
router.get("/all-products", async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products from the database
    res.status(200).json(products); // Send the products as JSON response
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
});


module.exports = router;
