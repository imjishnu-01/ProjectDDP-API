const pool = require('../../dbConfig');
const nodemailer = require('nodemailer');
require('dotenv').config();

const projectName = process.env.PROJECT_NAME;
const baseURL1 = process.env.FRONT_END_BASE_URL;

// Controller to send a job invitation to a user
exports.sendJobInvitation = (req, res) => {
  const { user_id, sender_id, message, company_name, role, jd_link } = req.body;

  // Validate input data
  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID provided' });
  }

  // Insert the invitation into the database
  const insertInvitationQuery = `
    INSERT INTO invitations (sender_id, user_id, company_name, role, jd_link, message, response_status, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
  `;

  pool.query(
    insertInvitationQuery,
    [sender_id, user_id, company_name, role, jd_link, message],
    (error, results) => {
      if (error) {
        console.error('Error sending job invitation:', error);
        return res.status(500).json({ error: 'Error sending job invitation' });
      }


      // Retrieve the receiver's email from the user ID
      const getUserEmailQuery = 'SELECT email FROM users WHERE id = ?';
      pool.query(getUserEmailQuery, [user_id], async (emailError, emailResult) => {
        if (emailError || emailResult.length === 0) {
          console.error('Error retrieving user email:', emailError);
          return res.status(500).json({ error: 'Error sending job invitation' });
        }

        const receiverEmail = emailResult[0].email;

        // Send an email to the user who received the invitation
        try {
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
            to: receiverEmail,
            subject: 'You have received a job invitation',
            text: `You have received a job invitation from ${company_name}. Click the following link to check the details: ${baseURL1}`
          };

          await transporter.sendMail(mailOptions);
          console.log('Job invitation email sent');
        } catch (emailError) {
          console.error('Error sending job invitation email:', emailError);
        }
      });


      return res.status(200).json({ message: 'Job invitation sent successfully' });
    }
  );
};


// Controller to get list of invitations received by a user
exports.getReceivedInvitations = (req, res) => {
  const { user_id } = req.params;

  // Validate user_id
  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID provided' });
  }

  // Query to fetch invitations received by the user
  const getInvitationsQuery = `
    SELECT i.*, u.firstName as sender_firstName, u.lastName as sender_lastName
    FROM invitations i
    INNER JOIN users u ON i.sender_id = u.id
    WHERE i.user_id = ?
  `;

  pool.query(getInvitationsQuery, [user_id], (error, results) => {
    if (error) {
      console.error('Error fetching invitations:', error);
      return res.status(500).json({ error: 'Error fetching invitations' });
    }

    return res.status(200).json(results);
  });
};


// Controller to get list of invitations sent by a user
exports.getSenderInvitations = (req, res) => {
  const { user_id } = req.params;

  // Validate user_id
  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID provided' });
  }

  // Query to fetch invitations sent by the user
  const getInvitationsQuery = `
    SELECT invitations.*,
           receiver.firstName AS receiver_firstName,
           receiver.lastName AS receiver_lastName
    FROM invitations
    JOIN users AS receiver ON invitations.user_id = receiver.id
    WHERE sender_id = ?
  `;

  pool.query(getInvitationsQuery, [user_id], (error, results) => {
    if (error) {
      console.error('Error fetching invitations:', error);
      return res.status(500).json({ error: 'Error fetching invitations' });
    }

    return res.status(200).json(results);
  });
};

// Update invitation status
exports.updateInvitationStatus = (req, res) => {
  const { invitationID } = req.params;
  const { status } = req.body;
  // Validate invitationID and status
  if (!invitationID || !status || typeof invitationID !== 'string' || typeof status !== 'string') {
    return res.status(400).json({ error: 'Invalid invitation ID or status provided' });
  }

  // Validate status value
  if (!['pending', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status provided' });
  }

  // Update the invitation status in the database
  const updateStatusQuery = `
    UPDATE invitations
    SET response_status = ?
    WHERE id = ?
  `;

  pool.query(updateStatusQuery, [status, invitationID], (error, results) => {
    if (error) {
      console.log(error)
      console.error('Error updating invitation status:', error);
      return res.status(500).json({ error: 'Error updating invitation status' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
     
    if (status === 'accepted') {
      // Fetch invitation details (sender and receiver IDs) from the database
      const getInvitationQuery = `
        SELECT invitations.*, 
               sender.firstName AS senderFirstName,
               sender.lastName AS senderLastName,
               sender.email AS senderEmail,
               receiver.firstName AS receiverFirstName,
               receiver.lastName AS receiverLastName,
               receiver.email AS receiverEmail
        FROM invitations
        JOIN users AS sender ON invitations.sender_id = sender.id
        JOIN users AS receiver ON invitations.user_id = receiver.id
        WHERE invitations.id = ?
      `;

      pool.query(getInvitationQuery, [invitationID], (error, invitationData) => {
        if (error) {
          console.error('Error fetching invitation data:', error);
        } else {
          const {
            senderFirstName,
            senderLastName,
            senderEmail,
            receiverFirstName,
            receiverLastName,
            receiverEmail,
            company_name,
            role
          } = invitationData[0];

          // Send email to sender
          const transporter = nodemailer.createTransport({
            //host: 'smtp.gmail.com',
            //port: 587,
            //secure: false,
            service: "Gmail",
            auth: {
              user: process.env.EMAIL,
              pass: process.env.GMAIL_PASSWORD
            }
          });
          // Send email to receiver (as CC)
          const MailOptions = {
            from: `${projectName} <${process.env.EMAIL}>`,
            to: senderEmail,
            cc: receiverEmail,
            subject: 'Invitation Accepted',
            text: `Invitation to ${receiverFirstName} ${receiverLastName} has been accepted. Company: ${company_name}, Role: ${role}.
            
            In order to advance with the referral process and establish contact, please respond to all recipients of this email

            `
          };

          transporter.sendMail(MailOptions, (error, info) => {
            if (error) {
              console.error('Error sending email to receiver:', error);
            } else {
              console.log('Email sent to receiver:', info.response);
            }
          });
        }
      });
    }
    return res.status(200).json({ message: 'Invitation status updated successfully' });
  });
};
