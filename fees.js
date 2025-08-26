// Fee Management Module
let feeStructures = [];
let feePayments = [];
let currentTab = 'fee-structure';

// Initialize fee module
document.addEventListener('DOMContentLoaded', function() {
    initializeFeeModule();
});

function initializeFeeModule() {
    // Setup tab navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.getAttribute('data-tab'));
        });
    });

    // Setup event listeners
    const addFeeStructureBtn = document.getElementById('addFeeStructureBtn');
    if (addFeeStructureBtn) {
        addFeeStructureBtn.addEventListener('click', openAddFeeStructureModal);
    }

    const recordPaymentBtn = document.getElementById('recordPaymentBtn');
    if (recordPaymentBtn) {
        recordPaymentBtn.addEventListener('click', () => {
            app.openModal('paymentModal');
        });
    }

    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }

    // Search and filter for payments
    const paymentSearch = document.getElementById('paymentSearch');
    if (paymentSearch) {
        paymentSearch.addEventListener('input', filterPayments);
    }

    const paymentStatusFilter = document.getElementById('paymentStatusFilter');
    if (paymentStatusFilter) {
        paymentStatusFilter.addEventListener('change', filterPayments);
    }
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    currentTab = tabName;
}

async function loadFeesData() {
    try {
        // Load fee structures and payments
        const [structures, payments] = await Promise.all([
            app.apiRequest('/fees/structures'),
            app.apiRequest('/fees/payments')
        ]);

        feeStructures = structures;
        feePayments = payments;

        // Load students and classes for dropdowns
        await loadFeeFormOptions();

        // Render current tab
        if (currentTab === 'fee-structure') {
            renderFeeStructuresTable();
        } else if (currentTab === 'fee-payments') {
            renderFeePaymentsTable();
        }

    } catch (error) {
        console.error('Error loading fees data:', error);
        app.showAlert('Error loading fees data', 'error');
    }
}

async function loadFeeFormOptions() {
    try {
        const [students, structures] = await Promise.all([
            app.apiRequest('/students'),
            app.apiRequest('/fees/structures')
        ]);

        // Populate student dropdown
        const paymentStudent = document.getElementById('paymentStudent');
        if (paymentStudent) {
            paymentStudent.innerHTML = '<option value="">Select Student</option>';
            students.forEach(student => {
                paymentStudent.innerHTML += `
                    <option value="${student.id}">
                        ${student.first_name} ${student.last_name} (${student.student_id})
                    </option>
                `;
            });
        }

        // Populate fee structure dropdown
        const paymentFeeStructure = document.getElementById('paymentFeeStructure');
        if (paymentFeeStructure) {
            paymentFeeStructure.innerHTML = '<option value="">Select Fee Type</option>';
            structures.forEach(structure => {
                paymentFeeStructure.innerHTML += `
                    <option value="${structure.id}" data-amount="${structure.amount}">
                        ${structure.fee_type} - ${structure.class_name} (₹${structure.amount})
                    </option>
                `;
            });

            // Auto-fill amount when fee structure is selected
            paymentFeeStructure.addEventListener('change', (e) => {
                const selectedOption = e.target.selectedOptions[0];
                const amount = selectedOption.getAttribute('data-amount');
                if (amount) {
                    document.getElementById('paymentAmount').value = amount;
                }
            });
        }

    } catch (error) {
        console.error('Error loading form options:', error);
    }
}

function renderFeeStructuresTable() {
    const tbody = document.querySelector('#feeStructureTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (feeStructures.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No fee structures found</td></tr>';
        return;
    }

    feeStructures.forEach(structure => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${structure.class_name || 'All Classes'} ${structure.section ? '- ' + structure.section : ''}</td>
            <td>${structure.fee_type}</td>
            <td>₹${structure.amount}</td>
            <td>${app.formatDate(structure.due_date)}</td>
            <td>${structure.year_name || 'Current Year'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editFeeStructure(${structure.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteFeeStructure(${structure.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderFeePaymentsTable() {
    const tbody = document.querySelector('#feePaymentsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (feePayments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No payments found</td></tr>';
        return;
    }

    feePayments.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.receipt_number || 'N/A'}</td>
            <td>${payment.first_name} ${payment.last_name} (${payment.student_id})</td>
            <td>${payment.fee_type}</td>
            <td>₹${payment.amount_paid}</td>
            <td>${app.formatDate(payment.payment_date)}</td>
            <td>${payment.payment_method}</td>
            <td><span class="badge badge-success">Paid</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewPaymentReceipt(${payment.id})">
                    <i class="fas fa-receipt"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="printReceipt(${payment.id})">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterPayments() {
    // Implementation for filtering payments based on search and status
    // This would filter the feePayments array and re-render the table
    console.log('Filtering payments...');
}

function openAddFeeStructureModal() {
    // This would open a modal for adding fee structures
    // For now, we'll use a simple prompt
    const feeType = prompt('Enter fee type (e.g., Tuition, Library, Sports):');
    const amount = prompt('Enter amount:');
    
    if (feeType && amount) {
        // Create fee structure
        createFeeStructure({ fee_type: feeType, amount: parseFloat(amount) });
    }
}

async function createFeeStructure(structureData) {
    try {
        await app.apiRequest('/fees/structures', {
            method: 'POST',
            body: JSON.stringify(structureData)
        });
        
        app.showAlert('Fee structure created successfully', 'success');
        loadFeesData(); // Reload data
        
    } catch (error) {
        console.error('Error creating fee structure:', error);
        app.showAlert('Error creating fee structure', 'error');
    }
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    if (!app.validateForm(e.target)) {
        app.showAlert('Please fill in all required fields', 'error');
        return;
    }

    const formData = new FormData(e.target);
    const paymentData = Object.fromEntries(formData.entries());
    
    // Generate receipt number if not provided
    if (!paymentData.receipt_number) {
        paymentData.receipt_number = generateReceiptNumber();
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');

    try {
        app.showLoading(submitBtn);
        
        await app.apiRequest('/fees/payments', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
        
        app.showAlert('Payment recorded successfully', 'success');
        app.closeModal('paymentModal');
        loadFeesData(); // Reload data
        
    } catch (error) {
        console.error('Error recording payment:', error);
        app.showAlert(error.message || 'Error recording payment', 'error');
    } finally {
        app.hideLoading(submitBtn, 'Record Payment');
    }
}

function generateReceiptNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    
    return `RCP${year}${month}${day}${time}`;
}

async function viewPaymentReceipt(paymentId) {
    try {
        const payment = await app.apiRequest(`/fees/payments/${paymentId}`);
        
        // Create receipt content
        const receiptContent = `
            PAYMENT RECEIPT
            ===============
            
            Receipt No: ${payment.receipt_number}
            Date: ${app.formatDate(payment.payment_date)}
            
            Student: ${payment.first_name} ${payment.last_name}
            Student ID: ${payment.student_id}
            
            Fee Type: ${payment.fee_type}
            Amount Paid: ₹${payment.amount_paid}
            Payment Method: ${payment.payment_method}
            
            ${payment.transaction_id ? `Transaction ID: ${payment.transaction_id}` : ''}
            ${payment.remarks ? `Remarks: ${payment.remarks}` : ''}
            
            Thank you for your payment!
        `;
        
        alert(receiptContent);
        
    } catch (error) {
        console.error('Error loading payment receipt:', error);
        app.showAlert('Error loading payment receipt', 'error');
    }
}

function printReceipt(paymentId) {
    // Implementation for printing receipt
    console.log('Printing receipt for payment:', paymentId);
    app.showAlert('Print functionality would be implemented here', 'info');
}

async function editFeeStructure(structureId) {
    // Implementation for editing fee structure
    console.log('Editing fee structure:', structureId);
    app.showAlert('Edit functionality would be implemented here', 'info');
}

async function deleteFeeStructure(structureId) {
    if (!confirm('Are you sure you want to delete this fee structure?')) {
        return;
    }

    try {
        await app.apiRequest(`/fees/structures/${structureId}`, {
            method: 'DELETE'
        });
        
        app.showAlert('Fee structure deleted successfully', 'success');
        loadFeesData(); // Reload data
        
    } catch (error) {
        console.error('Error deleting fee structure:', error);
        app.showAlert('Error deleting fee structure', 'error');
    }
}

// Export functions
window.feeModule = {
    loadFeesData,
    switchTab
};
