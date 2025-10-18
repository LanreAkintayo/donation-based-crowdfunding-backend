// Import all required modules
var createError = require('http-errors');  // Helps create error objects (like 404, 500)
var express = require('express');          // Main Express framework
var path = require('path');                // Node.js module for working with file paths
var cookieParser = require('cookie-parser'); // For parsing cookies
var logger = require('morgan');            // Logs HTTP requests in the console

// Import route files
var bookRouter = require('./routes/bookRoutes');
var productRouter = require('./routes/productRoutes');
var userRouter = require('./routes/userRoutes');
var usersRouter = require('./routes/users');

// Create express app
var app = express();

// ===== View engine setup =====
app.set('views', path.join(__dirname, 'views')); // Folder for EJS templates
app.set('view engine', 'ejs'); // Using EJS as the template engine

// ===== Middlewares =====
app.use(logger('dev')); // Logs requests (method, status, time, etc.)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded data (like form inputs)
app.use(cookieParser()); // Parse cookies sent by client
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (CSS, JS, images)

// ===== CORS setup =====
const cors = require("cors");
const corsOptions = {
  origin: "*", // Allow requests from any origin (can restrict later)
  credientials: true, // (Typo: should be 'credentials')
  optionSuccessStatus: 200, // For legacy browsers that choke on 204
};
app.use(cors(corsOptions)); // Enable CORS with the options above


// ===== Route handling =====
// Attach routers to specific paths
app.use('/users', usersRouter); // Handles routes under /users
app.use("/api/products", productRouter); // Handles routes under /api/products
app.use("/api/books", bookRouter); // Handles routes under /api/books
app.use("/api/users", userRouter); // Handles routes under /api/users

// ===== 404 Error handling =====
// If no route matches, this will create a 404 error and forward it
app.use(function(req, res, next) {
  next(createError(404));
});

// ===== General error handler =====
app.use(function(err, req, res, next) {
  // Pass the error message and stack (only in development)
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Set response status and render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Export the app so it can be used in another file (like server.js)
module.exports = app;
