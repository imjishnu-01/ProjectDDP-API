const express = require('express');
const authMiddleware = require('../../middleWare/authMiddleware');
const { addSkills,getAllSkills,updateSkill,deleteSkill } = require('../services/skillsServices');
const router = express.Router();

router.post('/:userId',authMiddleware,addSkills);
router.get('/:userId',authMiddleware,getAllSkills);
router.put('/:userId/:skillId',authMiddleware,updateSkill);
router.delete('/:userId/:skillId',authMiddleware,deleteSkill);

module.exports = router;