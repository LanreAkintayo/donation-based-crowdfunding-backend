// Load environment variables from .env file
require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

// --- Import API Routes ---
const bookRouter = require('./routes/bookRoutes');
const productRouter = require('./routes/productRoutes');
const userRouter = require('./routes/userRoutes');
const authRouter = require('./routes/authRoutes');
const paymentRouter = require('./routes/paymentRoutes'); 
const campaignRouter = require("./routes/campaignRoutes")

const app = express();

// --- View Engine Setup ---
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// --- Core Middlewares ---
app.use(logger('dev'));
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded form data
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// --- CORS Setup ---
const corsOptions = {
  origin: '*', // For development. Restrict this in production.
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// --- API Route Handling ---
// All API routes are prefixed with /api
app.use('/api/products', productRouter);
app.use('/api/books', bookRouter);
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/payments', paymentRouter); 
app.use("/api/campaigns", campaignRouter);

// --- 404 Error Handler ---
// Catches requests that don't match any of the routes above
app.use(function (req, res, next) {
  next(createError(404));
});

// --- General Error Handler ---
app.use(function (err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;