// === Load required modules ===
require('express');                // Load Express framework for creating API endpoints
require('mongodb');                // Load MongoDB client for database operations
require('dotenv').config();        // Load environment variables from .env file (e.g., email credentials)
const nodemailer = require('nodemailer');  // Load Nodemailer for sending emails

// === Export function to set up routes ===
exports.setApp = function ( app, client )
{

  // === ADD SHOW API ===
  app.post('/api/addshow', async (req, res, next) => {
    // Extract userId and show name from request body
    const { userId, show } = req.body;

    // Create a new document representing the show entry for this user
    const newShow = { Show: show, UserId: userId };
    let error = '';

    try {
      // Connect to database
      const db = client.db('COP4331_MERN_STACK');
      // Insert the new show into the Shows collection
      await db.collection('Shows').insertOne(newShow);
    } catch(e) {
      // Capture any database insertion error
      error = e.toString();
    }

    // Return JSON response with error message (empty if success)
    const ret = { error: error };
    res.status(200).json(ret);
  });

  // === DELETE SHOW API ===
  app.post('/api/deleteshow', async (req, res) => {
    // Extract userId and show name from request body
    const { userId, show } = req.body;

    const db = client.db('COP4331_MERN_STACK');
    let error = '';

    try {
      // Attempt to delete one matching show for this user
      const result = await db.collection('Shows').deleteOne({ UserId: userId, Show: show });

      // Check if anything was actually deleted
      if (result.deletedCount === 0) {
        error = 'Show not found or already deleted';
      } else {
        error = 'Successfully Deleted';
      }
    } catch (e) {
      // Capture any error during delete operation
      error = e.toString();
    }

    // Return JSON response with error message
    const ret = { error: error };
    res.status(200).json(ret);
  });

  // === Register User API ===
  const { ObjectId } = require('mongodb'); // For creating unique User IDs

  app.post('/api/register', async (req, res) => {
    // Extract incoming user registration fields
    const { login, password, firstName, lastName, email } = req.body;
    const db = client.db('COP4331_MERN_STACK');

    // Check for any missing required fields
    if (!login || !password || !firstName || !lastName || !email) {
      return res.status(400).json({
        error: 'All fields (login, password, firstName, lastName, email) are required.'
      });
    }

    // Validate password strength:
    // - Minimum 7 characters
    // - At least 1 symbol
    // - At least 1 capital letter
    const symbolRegex = /[^A-Za-z0-9]/;
    const capitalRegex = /[A-Z]/;

    if (
      password.length < 7 ||
      !symbolRegex.test(password) ||
      !capitalRegex.test(password)
    ) {
      return res.status(400).json({
        error: 'Password must be at least 7 characters, contain at least one symbol, and have at least one capital letter.'
      });
    }

    try {
      // Check if username or email already exists in Users collection
      const existingUser = await db.collection('Users').findOne({
        $or: [{ Login: login }, { Email: email }]
      });

      if (existingUser) {
        // Return appropriate error if user or email already exists
        if (existingUser.Login === login) {
          return res.status(409).json({ error: 'Username already exists' });
        }
        if (existingUser.Email === email) {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }

      // Generate unique UserID using Mongo ObjectId
      const userId = new ObjectId().toString();
      // Create a 6-digit verification code from last 6 characters of ObjectId
      const verificationCode = userId.toString().slice(-6);

      // Prepare new user document
      const newUser = {
        UserID: userId,
        Login: login,
        Password: password, // ⚠️ NOTE: Plain-text for demo — never store plain passwords in production!
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        isVerified: false,
        verificationCode: verificationCode
      };

      // Insert new user into database
      await db.collection('Users').insertOne(newUser);

      // Create Nodemailer transporter for Gmail
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USERNAME, // Gmail username from .env
          pass: process.env.EMAIL_PASSWORD  // Gmail app password from .env
        }
      });

      // Compose verification email content
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Verify Your Account',
        text: `Hello ${firstName},\n\nYour verification code is: ${verificationCode}\n\nPlease enter this code to verify your account.\n\nThank you!`
      };

      // Send verification email
      await transporter.sendMail(mailOptions);

      // Respond with registration success info
      return res.status(200).json({
        firstName: firstName,
        lastName: lastName,
        email: email,
        userId: userId,
        isVerified: false,
        verificationCode: verificationCode,
        error: '',
        message: 'Registration successful! Please check your email for the verification code.'
      });

    } catch (e) {
      console.error(e);
      return res.status(500).json({
        error: 'An unexpected error occurred. Please try again.'
      });
    }
  });

  // === LOGIN API ===
  app.post('/api/login', async (req, res) => {
    // Extract login and password from request body
    let error = '';
    const { login, password } = req.body;
    const db = client.db('COP4331_MERN_STACK');

    try {
      // Find user matching login and password (plain-text match ⚠️)
      const results = await db.collection('Users').find({ Login: login, Password: password }).toArray();

      let id = -1;
      let fn = '';
      let ln = '';
      let email = '';
      let isVerified = false;
      let message = '';

      if (results.length > 0) {
        // If user found, extract user info
        const user = results[0];
        id = user.UserID;
        fn = user.FirstName;
        ln = user.LastName;
        email = user.Email;
        isVerified = user.isVerified === true;

        if (isVerified) {
          message = 'Login successful.';
        } else {
          message = 'Account not verified. Please check your email to verify your account.';
        }
      } else {
        // No matching user found
        message = 'Invalid login or password.';
      }

      // Send back login response
      const ret = {
        id,
        firstName: fn,
        lastName: ln,
        email,
        isVerified,
        message,
        error: ''
      };
      res.status(200).json(ret);

    } catch (e) {
      error = e.toString();
      const ret = { id: -1, firstName: '', lastName: '', email: '', isVerified: false, message: '', error };
      res.status(500).json(ret);
    }
  });

  // === SEARCH SHOWS API ===
  app.post('/api/searchshows', async (req, res, next) => {
    // Extract userId and search query from request body
    let error = '';
    const { userId, search } = req.body;
    const _search = search.trim();  // Remove leading/trailing spaces

    const db = client.db('COP4331_MERN_STACK');

    // Find shows matching the search term for this user (case-insensitive, starts-with)
    const results = await db.collection('Shows').find({
      "Show": { $regex: _search + '.*', $options: 'i' },
      "UserId": userId
    }).toArray();

    // Return array of show names
    const _ret = results.map(record => record.Show);

    const ret = { results: _ret, error: error };
    res.status(200).json(ret);
  });

  // === VERIFY ACCOUNT API ===
  app.post('/api/verify', async (req, res) => {
    // Extract identifier (login/email) and verification code from request body
    const { identifier, verificationCode } = req.body;
    const db = client.db('COP4331_MERN_STACK');

    // Validate required inputs
    if (!identifier || !verificationCode) {
      return res.status(400).json({ error: 'Identifier (login or email) and verificationCode are required.' });
    }

    try {
      // Find user matching identifier (login or email) and verification code
      const user = await db.collection('Users').findOne({
        $and: [
          { verificationCode: verificationCode },
          { $or: [{ Login: identifier }, { Email: identifier }] }
        ]
      });

      if (!user) {
        return res.status(400).json({ error: 'Invalid identifier or verification code.' });
      }

      // Update user to mark verified and remove verification code
      await db.collection('Users').updateOne(
        { _id: user._id },
        {
          $set: { isVerified: true },
          $unset: { verificationCode: "" }
        }
      );

      // Respond with success message
      return res.status(200).json({ message: 'Account verified successfully!' });

    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
    }
  });

} // === End of exports.setApp ===
