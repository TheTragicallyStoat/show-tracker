require('express');
require('mongodb');

exports.setApp = function ( app, client )
{
// === API to Add a Card ===
app.post('/api/addshow', async (req, res, next) =>
{
  // Incoming data: userId (owner of the card), card (card name)
  // Outgoing: error message (if any)

  const { userId, show } = req.body; // Extract userId and card from request body
  const newShow = { Show: show, UserId: userId }; // Create a new card document
  let error = '';

  try
  {
    const db = client.db('COP4331_MERN_STACK'); // Use the appropriate database
    await db.collection('Shows').insertOne(newShow); // Insert the new card
  }
  catch(e)
  {
    error = e.toString(); // Capture any error
  }

  // Optionally pushing to in-memory card list (unused currently)

  // Send JSON response back
  const ret = { error: error };
  res.status(200).json(ret);
});


app.post('/api/deleteshow', async (req, res) => {
  // Incoming: userId, show
  // Outgoing: error message (if any)

  const { userId, show } = req.body;
  const db = client.db('COP4331_MERN_STACK');
  let error = '';

  try {
    const result = await db.collection('Shows').deleteOne({ UserId: userId, Show: show });

    if (result.deletedCount === 0) {
      error = 'Show not found or already deleted';
    }
    else
      error = 'Successfully Deleted'; // Successfully deleted
  } catch (e) {
    error = e.toString();
  }

  const ret = { error: error };
  res.status(200).json(ret);
});

const { ObjectId } = require('mongodb');

app.post('/api/register', async (req, res) => {
  // Incoming: login, password, firstName, lastName, email
  // Outgoing: firstName, lastName, email, userId, error

  const { login, password, firstName, lastName, email } = req.body;
  const db = client.db('COP4331_MERN_STACK');

  // ✅ Validate required fields
  if (!login || !password || !firstName || !lastName || !email) {
    return res.status(400).json({
      error: 'All fields (login, password, firstName, lastName, email) are required.'
    });
  }

  // ✅ Validate password strength
  const symbolRegex = /[^A-Za-z0-9]/;         // At least one symbol
  const capitalRegex = /[A-Z]/;               // At least one capital letter
  if (
    password.length < 7 ||                    // Greater than 6 characters
    !symbolRegex.test(password) ||            // Contains a symbol
    !capitalRegex.test(password)              // Contains a capital letter
  ) {
    return res.status(400).json({
      error: 'Password must be at least 7 characters, contain at least one symbol, and have at least one capital letter.'
    });
  }

  try {
    // ✅ Check if username or email already exists
    const existingUser = await db.collection('Users').findOne({
      $or: [{ Login: login }, { Email: email }]
    });

    if (existingUser) {
      if (existingUser.Login === login) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      if (existingUser.Email === email) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    // ✅ Generate unique UserID
    const userId = new ObjectId().toString();

    // ✅ Create new user document (plain-text password ⚠️)
    const newUser = {
      UserID: userId,
      Login: login,
      Password: password, // ⚠️ PLAIN-TEXT, do NOT use this in production!
      FirstName: firstName,
      LastName: lastName,
      Email: email
    };

    // ✅ Insert user into DB
    await db.collection('Users').insertOne(newUser);

    // ✅ Respond with success
    return res.status(200).json({
      firstName: firstName,
      lastName: lastName,
      email: email,
      userId: userId,
      error: ''
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again.'
    });
  }
});

// === API to Login a User ===
app.post('/api/login', async (req, res) => {
  // Incoming: login, password (sent in the request body)
  // Outgoing: JSON containing id, firstName, lastName, email, and error message

  let error = ''; // Initialize an empty error string to capture any errors
  const { login, password } = req.body; // Extract login and password from the request body
  const db = client.db('COP4331_MERN_STACK'); // Get the MongoDB database instance

  try {
    // Query the Users collection to find documents matching both login and password
    const results = await db.collection('Users').find({ Login: login, Password: password }).toArray();

    // Initialize variables to default values in case no matching user is found
    let id = -1;
    let fn = '';
    let ln = '';
    let email = '';

    if (results.length > 0) {
      // If a user matching login and password is found, assign their info to variables
      id = results[0].UserID;        // User's unique ID
      fn = results[0].FirstName;     // User's first name
      ln = results[0].LastName;      // User's last name
      email = results[0].Email;      // User's email address
    }

    // Prepare the response object with the user info and empty error string
    const ret = { id: id, firstName: fn, lastName: ln, email: email, error: '' };
    res.status(200).json(ret); // Send back the JSON response with status 200 (OK)

  } catch (e) {
    // If any error occurs during the database operation, capture the error message
    error = e.toString();

    // Prepare the error response with default values and the error message
    const ret = { id: -1, firstName: '', lastName: '', email: '', error: error };
    res.status(500).json(ret); // Send back the JSON error response with status 500 (Internal Server Error)
  }
});
// === API to Search Shows ===
app.post('/api/searchshows', async (req, res, next) =>
{
  // Incoming: userId, search (string)
  // Outgoing: results[], error

  let error = '';
  const { userId, search } = req.body;
  const _search = search.trim(); 

  const db = client.db('COP4331_MERN_STACK');

  // Search shows matching the input text and user
  const results = await db.collection('Shows').find({
    "Show": { $regex: _search + '.*', $options: 'i' }, // Case-insensitive starts-with match
    "UserId": userId
  }).toArray();

  // Extract show names only
  const _ret = results.map(record => record.Show);

  const ret = { results: _ret, error: error };
  res.status(200).json(ret);
});
}
