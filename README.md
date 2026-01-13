# Donation-Based CrowdFunding System API 🚀

> The backend RESTful API powering the donation-based crowdfunding system.

![Node.js](https://img.shields.io/badge/Node.js-v18-green?style=flat&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-4.x-blue?style=flat&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat&logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)

## 📖 Introduction

Welcome to the server-side repository for the **Donation-Based Crowdfunding System**.

This API is built with **Express.js** and **MongoDB** to handle the off-chain logic of the platform. While the smart contracts handle the secure transfer of funds on the blockchain, this backend manages user authentication, campaign metadata storage, and provides a fast indexing layer for retrieving donation history and user profiles.

It allows the frontend to interact seamlessly with the database while maintaining high performance and security.


## ⚡ Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **MongoDB** (Local instance or Atlas connection string)
* **Git**

### Installation

1.  **Clone the repository**
    ```bash
    git clone git@github.com:LanreAkintayo/donation-based-crowdfunding-backend.git
    cd donation-based-crowdfunding-backend
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file in the root directory and add the following:
    ```env
    DB_URI=mongodb+srv://lanre_user:secure_password123@cluster0.mongodb.net/crowdfund_db
    JWT_SECRET=super_secret_random_string_xyz_123
    PAYSTACK_SECRET_KEY=sk_test_1234567890abcdef1234567890abcdef12345678
    SENDGRID_API_KEY=SG.random_string_here.more_random_characters_here
    GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
    CLOUDINARY_CLOUD_NAME=dyx4p9qz
    CLOUDINARY_API_KEY=123456789012345
    CLOUDINARY_API_SECRET=abcde_fghijklm_nopqrstuvwxyz
    CLOUDINARY_URL=cloudinary://123456789012345:abcde_fghijklm_nopqrstuvwxyz@dyx4p9qz
    ```

4.  **Run the server**
    ```bash
    # Run in dev mode (with Nodemon)
    npm run dev

    # Run in production
    npm start
    ```