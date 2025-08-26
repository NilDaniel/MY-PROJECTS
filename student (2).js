const express = require('express');
const router = express.Router();

// Get all students
router.get('/', (req, res) => {
    const query = `
        SELECT s.*, c.class_name, c.section, u.email
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.status = 'Active'
        ORDER BY s.first_name, s.last_name
    `;
    
    req.db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get student by ID
router.get('/:id', (req, res) => {
    const query = `
        SELECT s.*, c.class_name, c.section, u.email
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
    `;
    
    req.db.query(query, [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json(results[0]);
    });
});

// Create new student
router.post('/', (req, res) => {
    const {
        student_id, first_name, last_name, date_of_birth, gender,
        address, phone, emergency_contact, parent_guardian_name,
        parent_guardian_phone, parent_guardian_email, class_id
    } = req.body;
    
    const query = `
        INSERT INTO students (
            student_id, first_name, last_name, date_of_birth, gender,
            address, phone, emergency_contact, parent_guardian_name,
            parent_guardian_phone, parent_guardian_email, class_id, admission_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
    `;
    
    const values = [
        student_id, first_name, last_name, date_of_birth, gender,
        address, phone, emergency_contact, parent_guardian_name,
        parent_guardian_phone, parent_guardian_email, class_id
    ];
    
    req.db.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to create student' });
        }
        
        res.status(201).json({
            message: 'Student created successfully',
            studentId: result.insertId
        });
    });
});

// Update student
router.put('/:id', (req, res) => {
    const {
        first_name, last_name, date_of_birth, gender, address, phone,
        emergency_contact, parent_guardian_name, parent_guardian_phone,
        parent_guardian_email, class_id, status
    } = req.body;
    
    const query = `
        UPDATE students SET
            first_name = ?, last_name = ?, date_of_birth = ?, gender = ?,
            address = ?, phone = ?, emergency_contact = ?, parent_guardian_name = ?,
            parent_guardian_phone = ?, parent_guardian_email = ?, class_id = ?, status = ?
        WHERE id = ?
    `;
    
    const values = [
        first_name, last_name, date_of_birth, gender, address, phone,
        emergency_contact, parent_guardian_name, parent_guardian_phone,
        parent_guardian_email, class_id, status, req.params.id
    ];
    
    req.db.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to update student' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json({ message: 'Student updated successfully' });
    });
});

// Delete student
router.delete('/:id', (req, res) => {
    const query = 'UPDATE students SET status = "Inactive" WHERE id = ?';
    
    req.db.query(query, [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete student' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json({ message: 'Student deleted successfully' });
    });
});

module.exports = router;
