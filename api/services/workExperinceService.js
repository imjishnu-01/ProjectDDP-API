const pool = require('../../dbConfig');


  exports.addWorkExperience = (req, res) => {
    const { userId } = req.params;
    const { company_name, position, start_date, end_date } = req.body;

    const startDate = new Date(start_date);
    const endDate = end_date ? new Date(end_date) : new Date();

    // Calculate the difference in years and the decimal portion
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();

    let yearsOfExperience = '';

    if (yearDiff > 0) {
        yearsOfExperience += `${yearDiff} yr`;
    }

    if (monthDiff > 0) {
        if (yearsOfExperience !== '') {
            yearsOfExperience += ' ';
        }
        yearsOfExperience += `${monthDiff} mo`;
    }

    // Insert the work experience into the database
    const sql =
        'INSERT INTO work_experience (company_name, position, start_date, end_date, yearsOfExperience, user_id) VALUES (?, ?, ?, ?, ?, ?)';
    pool.query(
        sql,
        [
            company_name,
            position,
            startDate,
            end_date ? endDate : null,
            yearsOfExperience,
            userId,
        ],
        (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: 'Error adding work experience' });
            }

            return res.status(201).json({ message: 'Work experience added successfully' });
        }
    );
};

  exports.getAllWorkExperiences = (req, res) => {
    const { userId } = req.params;
    // Fetch all work experiences associated with the user using the provided userId
    const sql = 'SELECT * FROM work_experience WHERE user_id = ?';
    pool.query(sql, [userId], (error, results) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ error: 'Error fetching work experiences' });
      }
      return res.status(200).json(results);
    });
  }; 

  

  // Update work experience for a user
exports.updateWorkExperience = (req, res) => {
  const { userId, workExperienceId } = req.params;
  const { company_name, position, start_date, end_date } = req.body;
   
  // Convert the date values to "YYYY-MM-DD" format
   const startDate = new Date(start_date);
   const endDate = end_date ? new Date(end_date) : new Date();
   const yearDiff = endDate.getFullYear() - startDate.getFullYear();
   const monthDiff = endDate.getMonth() - startDate.getMonth();
   const yearsOfExperience = yearDiff + (monthDiff >= 0 ? 0 : -1);

  // Update the work experience in the database for the given workExperienceId and userId
  const sql =
    'UPDATE work_experience SET company_name = ?, position = ?, start_date = ?, end_date = ?, yearsOfExperience = ? WHERE id = ? AND user_id = ?';
  pool.query(sql, [company_name, position, startDate, endDate, yearsOfExperience, workExperienceId, userId], (error, result) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ error: 'Error updating work experience' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Work experience not found or does not belong to the user' });
    }

    return res.status(200).json({ message: 'Work experience updated successfully' });
  });
};

// Delete work experience for a user
exports.deleteWorkExperience = (req, res) => {
  const { userId, workExperienceId } = req.params;

  // Delete the work experience from the database for the given workExperienceId and userId
  const sql = 'DELETE FROM work_experience WHERE id = ? AND user_id = ?';
  pool.query(sql, [workExperienceId, userId], (error, result) => {
    if (error) {
      return res.status(500).json({ error: 'Error deleting work experience' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Work experience not found or does not belong to the user' });
    }

    return res.status(200).json({ message: 'Work experience deleted successfully' });
  });
};
