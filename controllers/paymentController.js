const axios = require('axios');
const User = require('../models/userModel'); 

const paystackApi = axios.create({
    baseURL: 'https://api.paystack.co',
    headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
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
        const response = await paystackApi.post('/subaccount', {
            business_name: businessName,
            bank_code: bankCode,
            account_number: accountNumber,
            // 'manual' holds all funds until a payout is triggered.
            settlement_schedule: 'manual', 
            // This is your platform fee.
            percentage_charge: 0,
        });

        const { subaccount_code } = response.data.data;

        // Save the new subaccount code to the user's record in your database
        await User.findByIdAndUpdate(userId, { subaccountCode: subaccount_code });

        res.status(201).json({
            status: 'success',
            message: 'Subaccount created successfully.',
            data: response.data.data,
        });

    } catch (error) {
        console.error('Error creating subaccount:', error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: 'An error occurred while creating the subaccount.' });
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

        // Check if the transaction was successful
        if (status !== 'success') {
            return res.status(400).json({ status: 'error', message: 'Transaction was not successful.' });
        }

        // Transaction is verified! Now, the business logic.
        // For example:
        // - Find the campaign the donation was for (you could pass campaignId in metadata)
        // - Create a new "Donation" record in your database
        // - Update the campaign's total amount raised
        // - Send a thank you email to the donor
        console.log(`Donation of ${amount / 100} NGN by ${customer.email} verified successfully.`);
        
        res.status(200).json({
            status: 'success',
            message: 'Transaction has been verified successfully.',
        });

    } catch (error) {
        console.error('Error verifying transaction:', error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: 'An error occurred during transaction verification.' });
    }
};


/**
 * @desc    Trigger a payout to a campaign creator
 * @route   POST /api/payments/payout
 * @access  Private
 */
exports.triggerPayout = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user || !user.subaccountCode) {
            return res.status(400).json({ status: 'error', message: 'User has no subaccount configured for payout.' });
        }

        // To trigger a payout, we simply update the subaccount's settlement schedule to daily.
        // Paystack will then process all accumulated funds in the next settlement window.
        await paystackApi.put(`/subaccount/${user.subaccountCode}`, {
            settlement_schedule: 'daily',
        });
        
        res.status(200).json({
            status: 'success',
            message: 'Payout has been initiated. Funds will be settled to your account shortly.',
        });

    } catch (error) {
        console.error('Error triggering payout:', error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: 'An error occurred while initiating the payout.' });
    }
};