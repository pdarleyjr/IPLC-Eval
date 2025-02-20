// Main JavaScript functionality for the Articulation Evaluation form

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form elements
    initializeForm();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize auto-save functionality
    initializeAutoSave();
});

// Form initialization
function initializeForm() {
    // Calculate age when DOB changes
    const dobInput = document.getElementById('dob');
    const evaluationDateInput = document.getElementById('evaluationDate');
    const ageInput = document.getElementById('age');
    
    function calculateAge() {
        if (!dobInput.value || !evaluationDateInput.value) return;
        
        const dob = new Date(dobInput.value);
        const evalDate = new Date(evaluationDateInput.value);
        let age = evalDate.getFullYear() - dob.getFullYear();
        const monthDiff = evalDate.getMonth() - dob.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && evalDate.getDate() < dob.getDate())) {
            age--;
        }
        
        // Format age with years and months
        const months = monthDiff < 0 ? 12 + monthDiff : monthDiff;
        ageInput.value = `${age} years, ${months} months`;
    }

    dobInput.addEventListener('change', calculateAge);
    evaluationDateInput.addEventListener('change', calculateAge);

    // Update patient name in protocol description
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const patientNameSpans = document.getElementsByClassName('patient-name');

    function updatePatientName() {
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        
        Array.from(patientNameSpans).forEach(span => {
            span.textContent = fullName || '[Patient Name]';
        });
    }

    firstNameInput.addEventListener('input', updatePatientName);
    lastNameInput.addEventListener('input', updatePatientName);

    // Handle name field paste events
    firstNameInput.addEventListener('paste', function(e) {
        const pastedText = e.clipboardData.getData('text').trim();
        if (pastedText.includes(' ')) {
            e.preventDefault();
            const [first, ...rest] = pastedText.split(' ');
            this.value = first;
            if (!lastNameInput.value) {
                lastNameInput.value = rest.join(' ');
            }
            updatePatientName();
        }
    });

    // Initialize sound assessment rows
    document.querySelectorAll('.sound-row').forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const inputs = row.querySelectorAll('input[type="text"]');
        
        inputs.forEach(input => {
            input.disabled = !checkbox?.checked;
        });
        
        checkbox?.addEventListener('change', function() {
            inputs.forEach(input => {
                input.disabled = !this.checked;
                if (!this.checked) input.value = '';
            });
        });
    });

    // Load saved data if available
    loadSavedData();
}

// Event listeners setup
function setupEventListeners() {
    // Save Progress button
    const saveButton = document.getElementById('saveProgress');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            saveFormData();
            showNotification('Progress saved successfully!', 'success');
        });
    }

    // Generate Report button
    const generateButton = document.getElementById('generateReport');
    if (generateButton) {
        generateButton.addEventListener('click', async function(e) {
            e.preventDefault();
            if (validateForm()) {
                saveFormData();
                showNotification('Generating PDF...', 'info');
                try {
                    if (window.pdfGenerator) {
                        await window.pdfGenerator.generatePDF();
                        showNotification('PDF generated successfully!', 'success');
                    } else {
                        throw new Error('PDF generator not initialized');
                    }
                } catch (error) {
                    console.error('PDF generation error:', error);
                    showNotification('Error generating PDF', 'error');
                }
            }
        });
    }

    // Form validation on submit
    const form = document.getElementById('evaluationForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm()) {
                saveFormData();
                showNotification('Form submitted successfully!', 'success');
            }
        });
    }
}

// Form validation
function validateForm() {
    const requiredFields = document.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');
            showError(field, 'This field is required');
        } else {
            field.value = field.value.trim();
            field.classList.add('is-valid');
            field.classList.remove('is-invalid');
            removeError(field);
        }
    });

    // Additional validation for name fields
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    
    if (firstName && lastName) {
        // Handle case where full name is entered in first name field
        if (firstName.value.includes(' ')) {
            const [first, ...rest] = firstName.value.trim().split(' ');
            firstName.value = first;
            if (!lastName.value) {
                lastName.value = rest.join(' ');
            }
        }
        
        // Validate both fields
        [firstName, lastName].forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('is-invalid');
                field.classList.remove('is-valid');
                showError(field, 'Name is required');
            }
        });
    }

    return isValid;
}

// Save form data to localStorage
function saveFormData() {
    const form = document.getElementById('evaluationForm');
    if (!form) return;

    const data = {};

    // Save all form inputs
    form.querySelectorAll('input[type="text"], input[type="date"], textarea').forEach(input => {
        if (input.id) {
            data[input.id] = input.value.trim();
        }
    });

    // Save radio buttons
    form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
        if (radio.name) {
            data[radio.name] = radio.value;
        }
    });

    // Save checkboxes
    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.id) {
            data[checkbox.id] = checkbox.checked;
        }
    });

    // Save sound assessment data
    document.querySelectorAll('.sound-row').forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const inputs = row.querySelectorAll('input[type="text"]');
        if (checkbox?.id) {
            data[checkbox.id] = checkbox.checked;
            if (checkbox.checked) {
                inputs.forEach(input => {
                    if (input.id) {
                        data[input.id] = input.value.trim();
                    }
                });
            }
        }
    });

    localStorage.setItem('articulationEvalData', JSON.stringify(data));
}

// Load saved form data
function loadSavedData() {
    try {
        const savedData = localStorage.getItem('articulationEvalData');
        if (!savedData) return;

        const data = JSON.parse(savedData);
        
        // Populate form fields
        Object.entries(data).forEach(([key, value]) => {
            const element = document.querySelector(`#${key}, [name="${key}"]`);
            if (element) {
                switch(element.type) {
                    case 'checkbox':
                        element.checked = value;
                        element.dispatchEvent(new Event('change'));
                        break;
                    case 'radio':
                        if (element.value === value) {
                            element.checked = true;
                            element.dispatchEvent(new Event('change'));
                        }
                        break;
                    default:
                        element.value = value;
                        element.dispatchEvent(new Event('change'));
                        break;
                }
            }
        });

        // Update calculated fields
        const dobInput = document.getElementById('dob');
        const firstNameInput = document.getElementById('firstName');
        
        if (dobInput?.value) {
            dobInput.dispatchEvent(new Event('change'));
        }
        if (firstNameInput?.value) {
            firstNameInput.dispatchEvent(new Event('input'));
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
        showNotification('Error loading saved data', 'error');
    }
}

// Auto-save functionality
function initializeAutoSave() {
    let autoSaveTimeout;
    const form = document.getElementById('evaluationForm');

    if (form) {
        form.addEventListener('input', function() {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(function() {
                saveFormData();
                showNotification('Progress auto-saved', 'info');
            }, 2000);
        });
    }
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} position-fixed top-0 end-0 m-3 fade show`;
    notification.style.zIndex = '1000';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 150);
    }, 3000);
}

// Error handling
function showError(field, message) {
    if (!field) return;
    
    removeError(field);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    field.parentNode?.appendChild(errorDiv);
}

function removeError(field) {
    if (!field?.parentNode) return;
    
    const errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Export functions for use in other modules
window.formUtils = {
    saveFormData,
    loadSavedData,
    validateForm,
    showNotification
};