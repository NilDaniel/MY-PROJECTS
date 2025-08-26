// Student Management Module
let studentsData = [];
let filteredStudents = [];

// Initialize student module
document.addEventListener('DOMContentLoaded', function() {
    initializeStudentModule();
});

function initializeStudentModule() {
    // Setup event listeners
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            openAddStudentModal();
        });
    }

    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', handleStudentSubmit);
    }

    // Search and filter
    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) {
        studentSearch.addEventListener('input', filterStudents);
    }

    const classFilter = document.getElementById('classFilter');
    if (classFilter) {
        classFilter.addEventListener('change', filterStudents);
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterStudents);
    }
}

async function loadStudentsData() {
    try {
        // Load students
        studentsData = await app.apiRequest('/students');
        filteredStudents = [...studentsData];
        
        // Load classes for filters and forms
        await loadClassOptions();
        
        // Render students table
        renderStudentsTable();
        
    } catch (error) {
        console.error('Error loading students:', error);
        app.showAlert('Error loading students data', 'error');
    }
}

async function loadClassOptions() {
    try {
        const classes = await app.apiRequest('/classes');
        
        // Populate class filter
        const classFilter = document.getElementById('classFilter');
        const studentClassSelect = document.getElementById('studentClass');
        
        if (classFilter) {
            classFilter.innerHTML = '<option value="">All Classes</option>';
            classes.forEach(cls => {
                classFilter.innerHTML += `<option value="${cls.id}">${cls.class_name} - ${cls.section}</option>`;
            });
        }
        
        if (studentClassSelect) {
            studentClassSelect.innerHTML = '<option value="">Select Class</option>';
            classes.forEach(cls => {
                studentClassSelect.innerHTML += `<option value="${cls.id}">${cls.class_name} - ${cls.section}</option>`;
            });
        }
        
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

function renderStudentsTable() {
    const tbody = document.querySelector('#studentsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (filteredStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No students found</td></tr>';
        return;
    }

    filteredStudents.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.student_id}</td>
            <td>${student.first_name} ${student.last_name}</td>
            <td>${student.class_name ? `${student.class_name} - ${student.section}` : 'Not Assigned'}</td>
            <td>${student.phone || 'N/A'}</td>
            <td>${student.parent_guardian_phone || 'N/A'}</td>
            <td><span class="badge badge-${getStatusBadgeClass(student.status)}">${student.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editStudent(${student.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-info" onclick="viewStudent(${student.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudent(${student.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const classFilter = document.getElementById('classFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    filteredStudents = studentsData.filter(student => {
        const matchesSearch = !searchTerm || 
            student.first_name.toLowerCase().includes(searchTerm) ||
            student.last_name.toLowerCase().includes(searchTerm) ||
            student.student_id.toLowerCase().includes(searchTerm);
        
        const matchesClass = !classFilter || student.class_id == classFilter;
        const matchesStatus = !statusFilter || student.status === statusFilter;

        return matchesSearch && matchesClass && matchesStatus;
    });

    renderStudentsTable();
}

function openAddStudentModal() {
    document.getElementById('studentModalTitle').textContent = 'Add Student';
    document.getElementById('studentForm').reset();
    document.getElementById('studentForm').removeAttribute('data-student-id');
    app.openModal('studentModal');
}

async function editStudent(studentId) {
    try {
        const student = await app.apiRequest(`/students/${studentId}`);
        
        // Populate form
        document.getElementById('studentId').value = student.student_id;
        document.getElementById('firstName').value = student.first_name;
        document.getElementById('lastName').value = student.last_name;
        document.getElementById('dateOfBirth').value = student.date_of_birth ? student.date_of_birth.split('T')[0] : '';
        document.getElementById('gender').value = student.gender || '';
        document.getElementById('studentClass').value = student.class_id || '';
        document.getElementById('address').value = student.address || '';
        document.getElementById('phone').value = student.phone || '';
        document.getElementById('emergencyContact').value = student.emergency_contact || '';
        document.getElementById('parentName').value = student.parent_guardian_name || '';
        document.getElementById('parentPhone').value = student.parent_guardian_phone || '';
        document.getElementById('parentEmail').value = student.parent_guardian_email || '';
        
        // Set modal title and form data
        document.getElementById('studentModalTitle').textContent = 'Edit Student';
        document.getElementById('studentForm').setAttribute('data-student-id', studentId);
        
        app.openModal('studentModal');
        
    } catch (error) {
        console.error('Error loading student:', error);
        app.showAlert('Error loading student data', 'error');
    }
}

async function viewStudent(studentId) {
    try {
        const student = await app.apiRequest(`/students/${studentId}`);
        
        // Create view modal content
        const viewContent = `
            <div class="student-details">
                <div class="detail-row">
                    <strong>Student ID:</strong> ${student.student_id}
                </div>
                <div class="detail-row">
                    <strong>Name:</strong> ${student.first_name} ${student.last_name}
                </div>
                <div class="detail-row">
                    <strong>Date of Birth:</strong> ${app.formatDate(student.date_of_birth)}
                </div>
                <div class="detail-row">
                    <strong>Gender:</strong> ${student.gender || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Class:</strong> ${student.class_name ? `${student.class_name} - ${student.section}` : 'Not Assigned'}
                </div>
                <div class="detail-row">
                    <strong>Phone:</strong> ${student.phone || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Address:</strong> ${student.address || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Parent/Guardian:</strong> ${student.parent_guardian_name || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Parent Phone:</strong> ${student.parent_guardian_phone || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Parent Email:</strong> ${student.parent_guardian_email || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> <span class="badge badge-${getStatusBadgeClass(student.status)}">${student.status}</span>
                </div>
                <div class="detail-row">
                    <strong>Admission Date:</strong> ${app.formatDate(student.admission_date)}
                </div>
            </div>
        `;
        
        // Show in a simple alert or create a view modal
        // For now, we'll use a simple alert
        alert(`Student Details:\n\nName: ${student.first_name} ${student.last_name}\nStudent ID: ${student.student_id}\nClass: ${student.class_name ? `${student.class_name} - ${student.section}` : 'Not Assigned'}\nPhone: ${student.phone || 'N/A'}\nStatus: ${student.status}`);
        
    } catch (error) {
        console.error('Error loading student:', error);
        app.showAlert('Error loading student data', 'error');
    }
}

async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student?')) {
        return;
    }

    try {
        await app.apiRequest(`/students/${studentId}`, {
            method: 'DELETE'
        });
        
        app.showAlert('Student deleted successfully', 'success');
        loadStudentsData(); // Reload data
        
    } catch (error) {
        console.error('Error deleting student:', error);
        app.showAlert('Error deleting student', 'error');
    }
}

async function handleStudentSubmit(e) {
    e.preventDefault();
    
    if (!app.validateForm(e.target)) {
        app.showAlert('Please fill in all required fields', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const studentData = Object.fromEntries(formData.entries());
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const isEdit = e.target.hasAttribute('data-student-id');
    const studentId = e.target.getAttribute('data-student-id');

    try {
        app.showLoading(submitBtn);
        
        if (isEdit) {
            await app.apiRequest(`/students/${studentId}`, {
                method: 'PUT',
                body: JSON.stringify(studentData)
            });
            app.showAlert('Student updated successfully', 'success');
        } else {
            await app.apiRequest('/students', {
                method: 'POST',
                body: JSON.stringify(studentData)
            });
            app.showAlert('Student added successfully', 'success');
        }
        
        app.closeModal('studentModal');
        loadStudentsData(); // Reload data
        
    } catch (error) {
        console.error('Error saving student:', error);
        app.showAlert(error.message || 'Error saving student', 'error');
    } finally {
        app.hideLoading(submitBtn, isEdit ? 'Update Student' : 'Save Student');
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Active': return 'success';
        case 'Inactive': return 'secondary';
        case 'Graduated': return 'info';
        case 'Transferred': return 'warning';
        default: return 'secondary';
    }
}

// Export functions
window.studentModule = {
    loadStudentsData,
    editStudent,
    viewStudent,
    deleteStudent
};
