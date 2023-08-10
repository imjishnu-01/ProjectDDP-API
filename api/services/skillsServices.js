const pool = require('../../dbConfig');



  exports.addSkills = (req, res) => {
    const { userId } = req.params;
    const { skills } = req.body;
  
    // Check if the skills parameter is an array
    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills must be provided as an array' });
    }
  
    // Validate each skill in the array
    for (const skill of skills) {
      if (typeof skill !== 'string') {
        return res.status(400).json({ error: 'Invalid skill provided' });
      }
    }
  
    // Insert the skills into the database and associate them with the user using the provided userId
    const insertSkillQuery = 'INSERT INTO skills (skill_name, user_id) VALUES (?, ?)';
  
    for (const skill of skills) {
      pool.query(insertSkillQuery, [skill, userId], (error, result) => {
        if (error) {
          console.log(error)
          return res.status(500).json({ error: 'Error adding skills' });
        }
      });
    }
  
    return res.status(201).json({ message: 'Skills added successfully' });
  };
  
  
  exports.getAllSkills = (req, res) => {
    const { userId } = req.params;
  
    // Fetch all skills associated with the user using the provided userId
    const sql = 'SELECT * FROM skills WHERE user_id = ?';
    pool.query(sql, [userId], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Error fetching skills' });
      }
  
      return res.status(200).json(results);
    });
  };
  
  // Update a skill for a user
exports.updateSkill = (req, res) => {
  const { userId, skillId } = req.params;
  const { skill_name } = req.body;

  // Update the skill in the database for the given skillId and userId
  const sql = 'UPDATE skills SET skill_name = ? WHERE id = ? AND user_id = ?';
  pool.query(sql, [skill_name, skillId, userId], (error, result) => {
    if (error) {
      return res.status(500).json({ error: 'Error updating skill' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Skill not found or does not belong to the user' });
    }

    return res.status(200).json({ message: 'Skill updated successfully' });
  });
};

// Delete a skill for a user
exports.deleteSkill = (req, res) => {
  const { userId, skillId } = req.params;
  // Delete the skill from the database for the given skillId and userId
  const sql = 'DELETE FROM skills WHERE id = ? AND user_id = ?';
  pool.query(sql, [skillId, userId], (error, result) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ error: 'Error deleting skill' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Skill not found or does not belong to the user' });
    }

    return res.status(200).json({ message: 'Skill deleted successfully' });
  });
};
