// === LOAD REQUIRED MODULES ===
require('express');                // Express framework for building the REST API
require('mongodb');                // MongoDB client
require('dotenv').config();        // Loads environment variables from .env (e.g., email credentials)
const nodemailer = require('nodemailer');  // Nodemailer for sending emails
const { ObjectId } = require('mongodb');
const crypto = require('crypto');

// === EXPORT FUNCTION TO SET UP ROUTES ===
exports.setApp = function (app, client) {

  // === ADD SHOW API ===
  // ➜ Adds a new show to the user's list in the 'Shows' collection.
  //    Expects: { userId, show }
  //    Responds: { error: '' } or { error: 'message' }
 app.post('/api/addshow', async (req, res) => {
  const { userId, show, rating, genre } = req.body;
  let error = '';

  if (!userId || !show || !genre || rating === undefined) {
    return res.status(400).json({ error: 'User ID, show, genre, and rating are required.' });
  }

  const validRating = rating === 'Not Watched Yet' || (typeof rating === 'number' && rating >= 0 && rating <= 10);
  if (!validRating) {
    return res.status(400).json({ error: 'Rating must be a number between 0 and 10 or "Not Watched Yet".' });
  }

  const newShow = { Show: show, UserId: userId, Genre: genre, Rating: rating };

  try {
    const db = client.db('COP4331_MERN_STACK');
    await db.collection('Shows').insertOne(newShow);
  } catch (e) {
    error = e.toString();
  }

  res.status(200).json({ error });
});

// === REGISTER USER API ===
// ➜ Registers a new user.
//    Generates an initial email verification code (10 min expiry) and sends it.
//    Enforces password rules: min 7 chars, 1 symbol, 1 uppercase.
//    Uses a 6-character hex UserID.
//    Expects: { login, password, firstName, lastName, email }
//    Responds: User info, verification code, and message.
app.post('/api/register', async (req, res) => {
  const { login, password, firstName, lastName, email } = req.body;
  const db = client.db('COP4331_MERN_STACK');

  if (!login || !password || !firstName || !lastName || !email) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const symbolRegex = /[^A-Za-z0-9]/;
  //const capitalRegex = /[A-Z]/;
  if (password.length < 6 || !symbolRegex.test(password)) {
    return res.status(400).json({ error: 'Password must be at least 7 characters, contain a symbol, and a capital letter.' });
  }

  try {
    const existingUser = await db.collection('Users').findOne({ $or: [{ Login: login }, { Email: email }] });
    if (existingUser) {
      if (existingUser.Login === login) return res.status(409).json({ error: 'Username already exists' });
      if (existingUser.Email === email) return res.status(409).json({ error: 'Email already exists' });
    }

    // Generate unique 6-character hex UserID
    let userId;
    let userExists;
    do {
      userId = crypto.randomBytes(3).toString('hex'); // 6 hex characters
      userExists = await db.collection('Users').findOne({ UserID: userId });
    } while (userExists);

    const verificationCode = crypto.randomBytes(3).toString('hex');
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await db.collection('Users').insertOne({
      UserID: userId,
      Login: login,
      Password: password, // ⚠️ Should hash this!
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      isVerified: false,
      verificationCode,
      verificationCodeExpires
    });


  const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 2525,       // or 2525 (often unblocked)
  secure: false,   // use TLS
  auth: {
    user: 'apikey',              // this literal string 'apikey'
    pass: process.env.SENDGRID_API_KEY
  }
});


    await transporter.sendMail({
      from: '"Showdex" <cop4331summer2025@gmail.com>', // sender address
      to: email,
      subject: 'Verify Your Account',
      text: `Hello ${firstName},\n\nYour verification code is: ${verificationCode}\n\nThis code is valid for 10 minutes.`
    });

    res.status(200).json({
      firstName, lastName, email, userId, isVerified: false,
      verificationCode, verificationCodeExpires,
      error: '', message: 'Registration successful! Please check your email.'
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});


  // === LOGIN API ===
  // ➜ Logs in a user if credentials match.
  //    If not verified, includes the verification code for testing.
  //    Expects: { login, password }
  //    Responds: User info + verification status.
  app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    const db = client.db('COP4331_MERN_STACK');

    try {
      const results = await db.collection('Users').find({ Login: login, Password: password }).toArray();

      let id = -1, fn = '', ln = '', email = '', isVerified = false, message = '', verificationCode = '';

      if (results.length > 0) {
        const user = results[0];
        id = user.UserID;
        fn = user.FirstName;
        ln = user.LastName;
        email = user.Email;
        isVerified = user.isVerified === true;

        if (isVerified) {
          message = 'Login successful.';
        } else {
          message = 'Account not verified.';
          verificationCode = user.verificationCode || '';
        }
      } else {
        message = 'Invalid login or password.';
      }

      res.status(200).json({ id, firstName: fn, lastName: ln, email, isVerified, message, error: '', ...( !isVerified && { verificationCode } ) });

    } catch (e) {
      res.status(500).json({ id: -1, firstName: '', lastName: '', email: '', isVerified: false, message: '', error: e.toString() });
    }
  });

  // === SEARCH SHOWS API ===
  // ➜ Searches user's shows that match a search term (case-insensitive, starts-with).
  //    Expects: { userId, search }
  //    Responds: { results: [...], error: '' }
  // === SEARCH SHOWS API ===
// ➜ Searches user's shows that match a search term (case-insensitive, starts-with).
//    Expects: { userId, search }
//    Responds: { results: [...], error: '' }
app.post('/api/searchshows', async (req, res) => {
  const { userId, search, genreFilter } = req.body;
  const db = client.db('COP4331_MERN_STACK');
  const _search = search.trim();

  try {
    // Build query with optional filters
    let query = { UserId: userId };
    if (_search.length > 0) {
      query.Show = { $regex: _search + '.*', $options: 'i' };
    }
    if (genreFilter && genreFilter.length > 0) {
      query.Genre = genreFilter;
    }

    const results = await db.collection('Shows').find(query).toArray();

    const formattedResults = results.map(r => ({
      show: r.Show,
      rating: r.Rating,
      genre: r.Genre
    }));

    res.status(200).json({ results: formattedResults, error: '' });
  } catch (e) {
    res.status(500).json({ results: [], error: e.toString() });
  }
});


  // === VERIFY ACCOUNT API ===
  // ➜ Confirms a user's account using verification code.
  //    Expects: { identifier, verificationCode }
  //    Marks account as verified and removes code/expiry.
  app.post('/api/verify', async (req, res) => {
    const { identifier, verificationCode } = req.body;
    const db = client.db('COP4331_MERN_STACK');

    if (!identifier || !verificationCode) {
      return res.status(400).json({ error: 'Identifier and code required.' });
    }

    try {
      const user = await db.collection('Users').findOne({
        $and: [
          { verificationCode },
          { $or: [{ Login: identifier }, { Email: identifier }] }
        ]
      });

      if (!user) return res.status(400).json({ error: 'Invalid identifier or code.' });
      if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
        return res.status(400).json({ error: 'Verification code expired.' });
      }

      await db.collection('Users').updateOne(
        { _id: user._id },
        { $set: { isVerified: true }, $unset: { verificationCode: "", verificationCodeExpires: "" } }
      );

      res.status(200).json({ message: 'Account verified successfully!' });
    } catch (e) {
      res.status(500).json({ error: 'Unexpected error. Try again.' });
    }
  });

  // === RESEND VERIFICATION API ===
  // ➜ Sends a new verification code if expired.
  //    Expects: { identifier }
  //    Responds: message with status or explains when the current code expires.
  app.post('/api/resendverification', async (req, res) => {
    const { identifier } = req.body;
    const db = client.db('COP4331_MERN_STACK');

    if (!identifier) return res.status(400).json({ error: 'Identifier required.' });

    try {
      const user = await db.collection('Users').findOne({ $or: [{ Login: identifier }, { Email: identifier }] });
      if (!user) return res.status(200).json({ message: 'If your account exists and is not verified, a code will be sent.' });
      if (user.isVerified) return res.status(400).json({ error: 'Account is already verified.' });

      const now = new Date();
      let { verificationCode, verificationCodeExpires } = user;
      const codeExpired = !verificationCodeExpires || verificationCodeExpires < now;

      if (codeExpired) {
        verificationCode = crypto.randomBytes(3).toString('hex');
        verificationCodeExpires = new Date(now.getTime() + 10 * 60 * 1000);

        await db.collection('Users').updateOne(
          { _id: user._id },
          { $set: { verificationCode, verificationCodeExpires } }
        );

        const transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 2525,       // or 2525 (often unblocked)
        secure: false,   // use TLS
        auth: {
        user: 'apikey',              // this literal string 'apikey'
        pass: process.env.SENDGRID_API_KEY
  }
});

        await transporter.sendMail({
          from: '"Showdex" <cop4331summer2025@gmail.com>',
          to: user.Email,
          subject: 'Your Verification Code',
          text: `Hello ${user.FirstName},\n\nYour new verification code is: ${verificationCode}\n\nIt expires in 10 minutes.`
        });

        return res.status(200).json({ message: 'A new verification code has been sent to your email.' });

      } else {
        const formatted = new Date(verificationCodeExpires).toLocaleString('en-US', {
          timeZone: 'America/New_York',
          hour12: true
        });
        return res.status(200).json({ message: `Your current code is still active until ${formatted} EST.` });
      }
    } catch (e) {
      res.status(500).json({ error: 'Unexpected error.' });
    }
  });

  // === FORGOT PASSWORD API ===
  // ➜ Initiates password reset by sending a reset token (15 min expiry).
  //    Expects: { identifier }
  //    Responds: Always generic.
app.post('/api/forgotpassword', async (req, res) => {
  const { identifier } = req.body;
  const db = client.db('COP4331_MERN_STACK');
  if (!identifier) return res.status(400).json({ error: 'Identifier required.' });

  try {
    const user = await db.collection('Users').findOne({ $or: [{ Login: identifier }, { Email: identifier }] });
    if (!user)
      return res.status(200).json({ message: 'If your account exists, a reset code has been sent to your email.' });

    if (!user.isVerified)
      return res.status(400).json({ error: 'Account must be verified to reset password.' });

    // Check if reset token already exists and is still valid
    if (user.resetToken && user.resetTokenExpires && new Date(user.resetTokenExpires) > new Date()) {
      const formatted = new Date(user.resetTokenExpires).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour12: true
      });
      return res.status(400).json({
        error: 'A reset token was already sent. Please wait until it expires before requesting another.',
        nextAllowedRequestTime: formatted
      });
    }

    const resetToken = crypto.randomBytes(3).toString("hex"); // 6-digit hex
    const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.collection('Users').updateOne(
      { _id: user._id },
      { $set: { resetToken, resetTokenExpires } }
    );

    const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 2525,       // or 2525 (often unblocked)
    secure: false,   // use TLS
    auth: {
    user: 'apikey',              // this literal string 'apikey'
    pass: process.env.SENDGRID_API_KEY
  }
});

    await transporter.sendMail({
          from: '"Showdex" <cop4331summer2025@gmail.com>',
      to: user.Email,
      subject: 'Password Reset Request',
      text: `Hello ${user.FirstName},\n\nUse the code below to reset your password. It expires in 10 minutes.\n\nToken: ${resetToken}`
    });

    const formatted = new Date(resetTokenExpires).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: true
    }) + ' EST';

    res.status(200).json({
      message: 'If your account exists, a reset email has been sent.',
      nextAllowedRequestTime: formatted
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Unexpected error.' });
  }
});


  // === RESET PASSWORD API ===
  // ➜ Completes password reset if token is valid and not expired.
  //    Updates password and clears token.
  //    Expects: { identifier, resetToken, newPassword }
  app.post('/api/resetpassword', async (req, res) => {
    const { identifier, resetToken, newPassword } = req.body;
    const db = client.db('COP4331_MERN_STACK');
    if (!identifier || !resetToken || !newPassword) {
      return res.status(400).json({ error: 'Identifier, reset token, and new password required.' });
    }

    const symbolRegex = /[^A-Za-z0-9]/;
    const capitalRegex = /[A-Z]/;
    if (newPassword.length < 7 || !symbolRegex.test(newPassword) || !capitalRegex.test(newPassword)) {
      return res.status(400).json({ error: 'Password must be strong (7+ chars, symbol, capital).' });
    }

    try {
      const user = await db.collection('Users').findOne({
        $and: [
          { resetToken },
          { $or: [{ Login: identifier }, { Email: identifier }] }
        ]
      });

      if (!user) return res.status(400).json({ error: 'Invalid identifier or reset token.' });
      if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
        return res.status(400).json({ error: 'Reset token expired.' });
      }

      await db.collection('Users').updateOne(
        { _id: user._id },
        { $set: { Password: newPassword }, $unset: { resetToken: '', resetTokenExpires: '' } }
      );

      res.status(200).json({ message: 'Password has been reset successfully!' });
    } catch (e) {
      res.status(500).json({ error: 'Unexpected error.' });
    }
  });
// Update Show
app.post('/api/updateshow', async (req, res) => {
  const { userId, oldShowName, newShowName, rating, genre } = req.body;
  let error = '';

  if (!userId || !oldShowName || !newShowName || !genre || rating === undefined) {
    return res.status(400).json({ error: 'User ID, old show name, new show name, genre, and rating are required.' });
  }

  const validRating = rating === 'Not Watched Yet' || (typeof rating === 'number' && rating >= 0 && rating <= 10);
  if (!validRating) {
    return res.status(400).json({ error: 'Rating must be a number between 0 and 10 or "Not Watched Yet".' });
  }

  try {
    const db = client.db('COP4331_MERN_STACK');
    const result = await db.collection('Shows').updateOne(
      { UserId: userId, Show: oldShowName },
      { $set: { Show: newShowName, Rating: rating, Genre: genre } }
    );

    if (result.matchedCount === 0) {
      error = 'Show to update not found';
    }
  } catch (e) {
    error = e.toString();
  }

  res.status(200).json({ error });
});
app.post('/api/deleteshow', async (req, res) => {
  const { userId, show } = req.body;
  const db = client.db('COP4331_MERN_STACK');
  let error = '';

  try {
    const result = await db.collection('Shows').deleteOne({ UserId: userId, Show: show });
    if (result.deletedCount === 0) {
      error = 'Show not found or already deleted';
    } else {
      error = 'Successfully Deleted';
    }
  } catch (e) {
    error = e.toString();
  }

  res.status(200).json({ error });
});
}; // === END OF EXPORT ===
