
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const pool = require('../../dbConfig');
require('dotenv').config();

const baseURL = process.env.FRONT_END_BASE_URL;
const projectName = process.env.PROJECT_NAME;



// New user registration

exports.registerUser = (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Generate a unique verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Hash the password before storing it in the database
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const user = {
      id: 'UUID()',
      firstName,
      lastName,
      email,
      password: hashedPassword,
      created: new Date(),
      city: null, // Add other fields as needed
      state: null,
      verificationToken, // Save the verification token
    };

    // Insert the user into the database using the connection pool
    pool.query(
      'INSERT INTO users (id, firstName, lastName, email, password, created, city, state, verificationToken) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword, user.created, user.city, user.state, verificationToken],
      (error, results) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Send verification email
        sendVerificationEmail(email, verificationToken);

        // User successfully registered
        return res.status(201).json({ message: 'User registered successfully' });
      }
    );
  });
};

// Function to send verification email
const sendVerificationEmail = (email, verificationToken) => {
  const transporter = nodemailer.createTransport({
    // Configure your email service here
    service: "Gmail",
            auth: {
              user: process.env.EMAIL,
              pass: process.env.GMAIL_PASSWORD
            }
  });
  
  const verificationLink = `${baseURL}/verifyEmail/${verificationToken}`;
  
  const mailOptions = {
    from: `${projectName} <${process.env.EMAIL}>`,
    to: email,
    subject: 'Account Verification',
    html: `<p>Please click the following link to verify your account: <a href="${verificationLink}">${verificationLink}</a></p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};






exports.loginUser = (req, res) => {
  const { email, password } = req.body;
  // Check if the email exists in the database
  pool.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
    if (error) {
       console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      console.log(email, password);
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];
    const userID = user.id;
    const emailVerified = user.email_verified; // Get the email_verified status

    // Check if the email_verified status is 'pending'
    if (emailVerified === 'pending') {
      return res.status(403).json({ error: 'Email verification pending' });
    }

    // Compare the password with the hashed password in the database
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (!result) {
        return res.status(401).json({ error: 'Authentication failed' });
      }
      //secret key
      const secretKey = process.env.SECRET_KEY;
      // Generate a JWT token and send it in the response
      const token = jwt.sign(
        { id: user.id, email: user.email },
        secretKey, // Replace this with your secret key
        { expiresIn: '1h' } // Token expires in 1 hour
      );
      return res.status(200).json({ message: 'Authentication successful', token, userID });
    });
  });
};


// Get list of all users (requires authentication)
exports.getAllUsers = (req, res) => {

  // Fetch all users from the database
  pool.query('SELECT id, firstName, lastName, email, city, state FROM users', (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Return the list of users
    return res.status(200).json(results);
  });
};

// Get user profile
exports.getUserProfile = (req, res) => {

  const { id } = req.params;
  // Fetch all users from the database
  pool.query('SELECT id, firstName, lastName, email, city, state FROM users where id=?', id, (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Return the list of users
    return res.status(200).json(results);
  });
};

exports.updateUserProfile = (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, city, state } = req.body;

  // Update user profile in the database
  pool.query(
    'UPDATE users SET firstName=?, lastName=?, city=?, state=? WHERE id=?',
    [firstName, lastName, city, state, id],
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      // Return success response
      return res.status(200).json({ message: 'User profile updated successfully' });
    }
  );
};


// Get user by ID
exports.getUserById = (req, res) => {
  const { id } = req.params;

  // Fetch the user details from the database using the ID
  const query = `
    SELECT
      u.id,
      u.firstName,
      u.lastName,
      u.email,
      u.created,
      u.city,
      u.state,
      SUM(
        CASE
            WHEN yearsOfExperience REGEXP '([0-9]+) yr ([0-9]+) mos' THEN 
                CAST(REGEXP_SUBSTR(yearsOfExperience, '([0-9]+) yr') AS SIGNED) * 12
                + CAST(REGEXP_SUBSTR(yearsOfExperience, '([0-9]+) mos') AS SIGNED)
            WHEN yearsOfExperience REGEXP '([0-9]+) yr' THEN
                CAST(REGEXP_SUBSTR(yearsOfExperience, '([0-9]+) yr') AS SIGNED) * 12
            WHEN yearsOfExperience REGEXP '([0-9]+) mos' THEN
                CAST(REGEXP_SUBSTR(yearsOfExperience, '([0-9]+) mos') AS SIGNED)
            ELSE 0
        END
    ) AS total_months_of_experience,
      (
        SELECT GROUP_CONCAT(DISTINCT skill_name, '|',id) 
        FROM skills 
        WHERE user_id = u.id
      ) AS user_skills,
      (
        SELECT GROUP_CONCAT(DISTINCT company_name) 
        FROM work_experience 
        WHERE user_id = u.id
      ) AS user_companies,
      (
        SELECT GROUP_CONCAT(DISTINCT CONCAT(company_name, ' (', yearsOfExperience, ')'), '|', id, '||', position)
        FROM work_experience 
        WHERE user_id = u.id
      ) AS user_companies_with_experience
    FROM users u
    LEFT JOIN work_experience we ON u.id = we.user_id
    WHERE u.id = ?
    GROUP BY u.id, u.firstName, u.lastName, u.email, u.created;
  `;

  pool.query(query, [id], (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Check if the user with the given ID exists
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the user details
    return res.status(200).json(results[0]);
  });
};



exports.searchUsersBySkills = (req, res) => {
  const { skills } = req.query;

  // Ensure that skills query parameter is provided
  if (!skills) {
    return res.status(400).json({ error: 'Skills parameter is required' });
  }

  // Split the skills parameter into an array
  const skillsArray = skills.split(',');

  // Build the dynamic SQL query to search for users having all specified skills
  const placeholders = skillsArray.map(() => '?').join(',');
  const query = `
    SELECT
  u.id,
  u.firstName,
  u.lastName,
  u.email,
  u.created,
  SUM(we.yearsOfExperience) AS total_years_of_experience,
  (
    SELECT GROUP_CONCAT(DISTINCT s.skill_name)
    FROM skills s
    WHERE u.id = s.user_id
  ) AS user_skills,
  GROUP_CONCAT(DISTINCT we.position) AS user_positions,
  GROUP_CONCAT(DISTINCT we.company_name) AS user_companies
FROM users u
LEFT JOIN work_experience we ON u.id = we.user_id
WHERE
  u.id IN (
    SELECT DISTINCT s.user_id
    FROM skills s
    WHERE s.skill_name IN (${placeholders})
  )
  OR
  we.position IN (${placeholders})
GROUP BY u.id, u.firstName, u.lastName, u.email, u.created;
  `;

  // Execute the query with skills array
  pool.query(query, [...skillsArray, ...skillsArray], (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Error searching users' });
    }

    return res.status(200).json(results);
  });
};

// Verify Email
exports.verifyEmail = (req, res) => {
  const { token } = req.params;

  // Update user's email_verified status in the database
  const updateQuery = `
    UPDATE users
    SET email_verified = 'completed'
    WHERE verificationToken = ?;
  `;

  pool.query(updateQuery, [token], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Verification token not found' });
    }

    return res.status(200).json({ message: 'Email verified successfully' });
  });
};

exports.resendVerificationEmail = (req, res) => {
  const { email } = req.body;

  // Check if the email exists in the database
  pool.query('SELECT * FROM users WHERE email = ?', email, (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];
    const emailVerified = user.email_verified;

    // Check if the email_verified status is 'completed'
    if (emailVerified === 'completed') {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Resend verification email
    sendVerificationEmail(email, user.verificationToken);

    return res.status(200).json({ message: 'Verification email sent successfully' });
  });
};


exports.updatePassword = (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  // Fetch user data from the database
  pool.query('SELECT * FROM users WHERE id = ?', userId, (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];

    // Compare the provided currentPassword with the stored hashed password
    bcrypt.compare(currentPassword, user.password, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (!result) {
        return res.status(401).json({ error: 'Incorrect current password' });
      }

      // Hash the new password
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Update the user's password
        pool.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, userId],
          (error) => {
            if (error) {
              console.log(error);
              return res.status(500).json({ error: 'Internal Server Error' });
            }

            return res.status(200).json({ message: 'Password updated successfully' });
          }
        );
      });
    });
  });
};


// Generate a random password reset token
const generateToken = () => {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return token;
};

// Send the password reset email
exports.sendResetPasswordEmail = async (req, res) => {
  const { email } = req.body;

  // Check if the email exists in the database
  const userQuery = 'SELECT * FROM users WHERE email = ?';
  const user = await pool.query(userQuery, [email]);

  if (user.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Generate a reset token and update it in the database
  const resetToken = generateToken();
  const updateTokenQuery = 'UPDATE users SET reset_token = ? WHERE email = ?';
  await pool.query(updateTokenQuery, [resetToken, email]);

  // Send the password reset email with the token
  const transporter = nodemailer.createTransport({
    // Configure your email service here
    // For example, you can use Gmail SMTP
    service: 'Gmail',
    auth: {
              user: process.env.EMAIL,
              pass: process.env.GMAIL_PASSWORD
          }
  });

  const mailOptions = {
    from: `${projectName} <${process.env.EMAIL}>`,
    to: email,
    subject: 'Password Reset',
    text: `Click the following link to reset your password: ${baseURL}/resetPassword/${resetToken}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error sending email' });
    }
    console.log('Password reset email sent:', info.response);
    return res.status(200).json({ message: 'Password reset email sent' });
  });
};

// Reset the user's password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  console.log(newPassword, token);
  // Update the password in the database
  const updatePasswordQuery = 'UPDATE users SET password = ?, reset_token = NULL WHERE reset_token = ?';
  const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 is the number of salt rounds

  await pool.query(updatePasswordQuery, [hashedPassword, token], (error, result) => {
    if (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({ error: 'An error occurred while resetting the password' });
    }
  });
  
  return res.status(200).json({ message: 'Password reset successful' });
};