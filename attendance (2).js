const express = require('express');
const router = express.Router();

// Get attendance for a specific date and class
router.get('/', (req, res) => {
    const { date, class_id } = req.query;
    
    let query = `
        SELECT a.*, s.first_name, s.last_name, s.student_id, c.class_name, c.section
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        
                JOIN classes c ON s.class_id = c.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (date) {
        query += ' AND DATE(a.date) = ?';
        params.push(date);
    }
    
    if (class_id) {
        query += ' AND s.class_id = ?';
        params.push(class_id);
    }
    
    query += ' ORDER BY s.first_name, s.last_name';
    
    req.db.query(query, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Mark attendance for multiple students
router.post('/mark', (req, res) => {
    const { date, attendance_records } = req.body;
    
    if (!attendance_records || attendance_records.length === 0) {
        return res.status(400).json({ error: 'No attendance records provided' });
    }
    
    // First, delete existing attendance for the date
    const deleteQuery = `
        DELETE FROM attendance 
        WHERE DATE(date) = ? AND student_id IN (${attendance_records.map(() => '?').join(',')})
    `;
    
    const deleteParams = [date, ...attendance_records.map(record => record.student_id)];
    
    req.db.query(deleteQuery, deleteParams, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to clear existing attendance' });
        }
        
        // Insert new attendance records
        const insertQuery = `
            INSERT INTO attendance (student_id, date, status, remarks)
            VALUES ?
        `;
        
        const insertValues = attendance_records.map(record => [
            record.student_id,
            date,
            record.status,
            record.remarks || null
        ]);
        
        req.db.query(insertQuery, [insertValues], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to mark attendance' });
            }
            
            res.json({
                message: 'Attendance marked successfully',
                recordsMarked: result.affectedRows
            });
        });
    });
});

// Get today's attendance summary
router.get('/today-summary', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
        SELECT 
            COUNT(*) as total_students,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
            SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_count,
            ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as percentage
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id AND DATE(a.date) = ?
        WHERE s.status = 'Active'
    `;
    
    req.db.query(query, [today], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json(results[0] || {
            total_students: 0,
            present_count: 0,
            absent_count: 0,
            late_count: 0,
            percentage: 0
        });
    });
});

// Get attendance statistics for a date range
router.get('/statistics', (req, res) => {
    const { start_date, end_date, class_id } = req.query;
    
    let query = `
        SELECT 
            DATE(a.date) as attendance_date,
            COUNT(*) as total_students,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
            SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_count,
            ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as percentage
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE DATE(a.date) BETWEEN ? AND ?
    `;
    
    const params = [start_date, end_date];
    
    if (class_id) {
        query += ' AND s.class_id = ?';
        params.push(class_id);
    }
    
    query += ' GROUP BY DATE(a.date) ORDER BY attendance_date';
    
    req.db.query(query, params, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

module.exports = router;
