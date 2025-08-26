// Attendance Management Module
let attendanceData = [];
let currentDate = new Date().toISOString().split('T')[0];
let currentClass = '';

// Initialize attendance module
document.addEventListener('DOMContentLoaded', function() {
    initializeAttendanceModule();
});

function initializeAttendanceModule() {
    // Set default date to today
    const attendanceDateInput = document.getElementById('attendanceDate');
    if (attendanceDateInput) {
        attendanceDateInput.value = currentDate;
        attendanceDateInput.addEventListener('change', (e) => {
            currentDate = e.target.value;
            loadAttendanceForDate();
        });
    }

    // Setup class filter
    const attendanceClassSelect = document.getElementById('attendanceClass');
    if (attendanceClassSelect) {
        attendanceClassSelect.addEventListener('change', (e) => {
            currentClass = e.target.value;
            loadAttendanceForDate();
        });
    }

    // Mark attendance button
    const markAttendanceBtn = document.getElementById('markAttendanceBtn');
    if (markAttendanceBtn) {
        markAttendanceBtn.addEventListener('click', saveAttendance);
    }
}

async function loadAttendanceData() {
    try {
        // Load classes for dropdown
        await loadClassesForAttendance();
        
        // Load attendance for current date
        await loadAttendanceForDate();
        
    } catch (error) {
        console.error('Error loading attendance data:', error);
        app.showAlert('Error loading attendance data', 'error');
    }
}

async function loadClassesForAttendance() {
    try {
        const classes = await app.apiRequest('/classes');
        
        const attendanceClassSelect = document.getElementById('attendanceClass');
        if (attendanceClassSelect) {
            attendanceClassSelect.innerHTML = '<option value="">All Classes</option>';
            classes.forEach(cls => {
                attendanceClassSelect.innerHTML += `
                    <option value="${cls.id}">${cls.class_name} - ${cls.section}</option>
                `;
            });
        }
        
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

async function loadAttendanceForDate() {
    if (!currentDate) return;

    try {
        // Get students for the selected class
        let studentsQuery = '/students';
        if (currentClass) {
            studentsQuery += `?class_id=${currentClass}`;
        }
        
        const students = await app.apiRequest(studentsQuery);
        
        // Get existing attendance for the date
        let attendanceQuery = `/attendance?date=${currentDate}`;
        if (currentClass) {
            attendanceQuery += `&class_id=${currentClass}`;
        }
        
        const existingAttendance = await app.apiRequest(attendanceQuery);
        
        // Merge student data with attendance data
        attendanceData = students.map(student => {
            const attendance = existingAttendance.find(att => att.student_id === student.id);
            return {
                ...student,
                status: attendance ? attendance.status : 'Present',
                remarks: attendance ? attendance.remarks : ''
            };
        });
        
        renderAttendanceList();
        updateAttendanceSummary();
        
    } catch (error) {
        console.error('Error loading attendance for date:', error);
        app.showAlert('Error loading attendance data', 'error');
    }
}

function renderAttendanceList() {
    const attendanceList = document.getElementById('attendanceList');
    if (!attendanceList) return;

    attendanceList.innerHTML = '';

    if (attendanceData.length === 0) {
        attendanceList.innerHTML = '<p class="text-center">No students found for the selected criteria.</p>';
        return;
    }

    attendanceData.forEach((student, index) => {
        const attendanceItem = document.createElement('div');
        attendanceItem.className = 'attendance-item';
        attendanceItem.innerHTML = `
            <div class="student-info">
                <div class="student-avatar">
                    ${student.first_name.charAt(0)}${student.last_name.charAt(0)}
                </div>
                <div>
                    <strong>${student.first_name} ${student.last_name}</strong>
                    <br>
                    <small>${student.student_id} - ${student.class_name || 'No Class'}</small>
                </div>
            </div>
            <div class="attendance-status">
                <button class="status-btn ${student.status === 'Present' ? 'active present' : ''}" 
                        onclick="updateAttendanceStatus(${index}, 'Present')">
                    Present
                </button>
                <button class="status-btn ${student.status === 'Absent' ? 'active absent' : ''}" 
                        onclick="updateAttendanceStatus(${index}, 'Absent')">
                    Absent
                </button>
                <button class="status-btn ${student.status === 'Late' ? 'active late' : ''}" 
                        onclick="updateAttendanceStatus(${index}, 'Late')">
                    Late
                </button>
                <button class="status-btn ${student.status === 'Excused' ? 'active excused' : ''}" 
                        onclick="updateAttendanceStatus(${index}, 'Excused')">
                    Excused
                </button>
            </div>
        `;
        attendanceList.appendChild(attendanceItem);
    });
}

function updateAttendanceStatus(studentIndex, status) {
    attendanceData[studentIndex].status = status;
    renderAttendanceList();
    updateAttendanceSummary();
}

function updateAttendanceSummary() {
    const presentCount = attendanceData.filter(s => s.status === 'Present').length;
    const absentCount = attendanceData.filter(s => s.status === 'Absent').length;
    const lateCount = attendanceData.filter(s => s.status === 'Late').length;
    const totalCount = attendanceData.length;
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    // Update summary cards
    document.getElementById('presentCount').textContent = presentCount;
    document.getElementById('absentCount').textContent = absentCount;
    document.getElementById('lateCount').textContent = lateCount;
    document.getElementById('attendancePercentage').textContent = `${percentage}%`;
}

async function saveAttendance() {
    if (!currentDate) {
        app.showAlert('Please select a date', 'error');
        return;
    }

    if (attendanceData.length === 0) {
        app.showAlert('No students to mark attendance for', 'error');
        return;
    }

    const attendanceRecords = attendanceData.map(student => ({
        student_id: student.id,
        status: student.status,
        remarks: student.remarks
    }));

    const markAttendanceBtn = document.getElementById('markAttendanceBtn');

    try {
        app.showLoading(markAttendanceBtn);
        
        await app.apiRequest('/attendance/mark', {
            method: 'POST',
            body: JSON.stringify({
                date: currentDate,
                attendance_records: attendanceRecords
            })
        });
        
        app.showAlert('Attendance marked successfully', 'success');
        
    } catch (error) {
        console.error('Error saving attendance:', error);
        app.showAlert(error.message || 'Error saving attendance', 'error');
    } finally {
        app.hideLoading(markAttendanceBtn, 'Mark Attendance');
    }
}

// Export functions
window.attendanceModule = {
    loadAttendanceData,
    updateAttendanceStatus,
    saveAttendance
};
