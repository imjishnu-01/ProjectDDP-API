const express = require('express');
const { registerUser, loginUser, getAllUsers, searchUsersBySkills, getUserById, getUserProfile, updateUserProfile, verifyEmail, resendVerificationEmail, updatePassword, sendResetPasswordEmail, resetPassword } = require('../services/userServices');
const authMiddleware = require('../../middleWare/authMiddleware');

const router = express.Router();

router.post("/register",registerUser);
router.post("/login", loginUser);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', sendResetPasswordEmail);
router.post('/reset-password', resetPassword);


router.get('/verify/:token', verifyEmail);
router.get('/users', authMiddleware, getAllUsers);
router.get('/search',authMiddleware,searchUsersBySkills);
router.get('/:id', authMiddleware,getUserById);
router.get('/profile/:id', authMiddleware,getUserProfile);
router.put('/profile/:id', authMiddleware,updateUserProfile);
router.put('/update-password', authMiddleware, updatePassword);


module.exports = router;