const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary"); // You might need: npm install multer-storage-cloudinary
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "campaign_evidence", 
    allowed_formats: ["jpg", "png", "jpeg", "pdf", "doc"],
    resource_type: "auto", // Important for PDFs!
  },
});

const upload = multer({ storage: storage });

module.exports = upload;