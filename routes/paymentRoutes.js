const express = require('express');
const router = express.Router();
const { 
    createSubaccount, 
    verifyTransaction, 
    triggerPayout ,
    getBankList,
    resolveAccount
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/payments/subaccount
 * @desc    Create a bank subaccount for a campaign creator
 * @access  Private
 */
router.post('/subaccount', protect, createSubaccount);

/**
 * @route   GET /api/payments/verify/:reference
 * @desc    Verify a donation after it's made on the frontend
 * @access  Public
 */
router.get('/verify/:reference', verifyTransaction);

/**
 * @route   POST /api/payments/payout
 * @desc    Trigger a payout for the campaign creator
 * @access  Private
 */
router.post('/payout', protect, triggerPayout);

router.get("/banks", getBankList);

router.post('/resolve', protect, resolveAccount);

module.exports = router;