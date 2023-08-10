const express = require('express');
const { sendJobInvitation,getReceivedInvitations,getSenderInvitations, updateInvitationStatus } = require('../services/invitationServices');
const authMiddleware = require('../../middleWare/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, sendJobInvitation);
router.get('/received/:user_id/', authMiddleware, getReceivedInvitations);
router.get('/sent/:user_id', authMiddleware, getSenderInvitations);
router.put('/:invitationID', authMiddleware,updateInvitationStatus);


module.exports = router;
