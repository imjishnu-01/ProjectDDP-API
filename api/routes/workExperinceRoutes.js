const express = require('express');
const authMiddleware = require('../../middleWare/authMiddleware');
const { getAllWorkExperiences,addWorkExperience,updateWorkExperience,deleteWorkExperience } = require('../services/workExperinceService');

const router = express.Router();

router.post('/:userId',authMiddleware,addWorkExperience);
router.get('/:userId',authMiddleware,getAllWorkExperiences);
router.put('/:userId/:workExperienceId',authMiddleware,updateWorkExperience);
router.delete('/:userId/:workExperienceId',authMiddleware,deleteWorkExperience);

module.exports = router;