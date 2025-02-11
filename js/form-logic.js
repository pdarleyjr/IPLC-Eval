// Form validation and state management
class FormManager {
    constructor() {
        this.forms = document.querySelectorAll('form');
        this.setupValidation();
        this.setupAutoSave();
        this.setupAssessmentTools();
        this.loadSavedData();
        this.saveIndicatorTimeout = null;
    }

    setupValidation() {
        this.forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
            form.addEventListener('input', (e) => this.handleInput(e));
            form.addEventListener('change', (e) => this.handleChange(e));

            form.querySelectorAll('[data-required="true"]').forEach(field => {
                this.addValidationUI(field);
            });
        });
    }

    setupAssessmentTools() {
        const assessmentTools = document.querySelectorAll('input[name="assessment-tools"]');
        const testScoresContainer = document.getElementById('test-scores-container');
        
        if (!assessmentTools || !testScoresContainer) return;

        // Map of assessment tool values to their corresponding score sections
        const toolToSection = {
            'celf-5': 'celf-5-scores',
            'ctopp-2': 'ctopp-2-scores',
            'dibels-8': 'dibels-8-scores'
        };

        assessmentTools.forEach(tool => {
            tool.addEventListener('change', () => {
                const sectionId = toolToSection[tool.value];
                if (sectionId) {
                    const section = document.getElementById(sectionId);
                    if (section) {
                        section.style.display = tool.checked ? 'block' : 'none';
                        // Enable/disable inputs in the section
                        section.querySelectorAll('input').forEach(input => {
                            input.disabled = !tool.checked;
                            if (!tool.checked) input.value = '';
                        });
                    }
                }

                // Handle 'other' option
                if (tool.value === 'other') {
                    const otherInput = tool.closest('.checkbox-group').parentElement.querySelector('.other-input');
                    if (otherInput) {
                        otherInput.style.display = tool.checked ? 'block' : 'none';
                        if (tool.checked) otherInput.focus();
                    }
                }
            });
        });
    }

    addValidationUI(field) {
        const wrapper = document.createElement('div');
        wrapper.className = 'validation-wrapper';
        field.parentNode.insertBefore(wrapper, field);
        wrapper.appendChild(field);

        const indicator = document.createElement('span');
        indicator.className = 'validation-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        wrapper.appendChild(indicator);

        const message = document.createElement('span');
        message.className = 'validation-message';
        message.setAttribute('role', 'alert');
        message.setAttribute('aria-live', 'polite');
        wrapper.appendChild(message);
    }

    validateField(field) {
        if (!field.hasAttribute('data-required')) return true;

        const isValid = this.validateFieldValue(field);
        const wrapper = field.closest('.validation-wrapper');
        if (wrapper) {
            wrapper.classList.toggle('invalid', !isValid);
            const message = wrapper.querySelector('.validation-message');
            if (message) {
                const errorMessage = isValid ? '' : this.getValidationMessage(field);
                message.textContent = errorMessage;
                if (!isValid) {
                    message.setAttribute('aria-invalid', 'true');
                    field.setAttribute('aria-describedby', message.id || `error-${field.id}`);
                } else {
                    message.removeAttribute('aria-invalid');
                    field.removeAttribute('aria-describedby');
                }
            }
        }
        return isValid;
    }

    validateFieldValue(field) {
        const value = field.value.trim();
        if (value === '') return false;

        // Specific validation rules based on field type and context
        switch (field.type) {
            case 'number':
                if (field.closest('#test-scores-container')) {
                    // Test score validation (typically 0-100 or specific ranges)
                    const score = parseFloat(value);
                    const min = parseFloat(field.getAttribute('min') || '0');
                    const max = parseFloat(field.getAttribute('max') || '100');
                    return !isNaN(score) && score >= min && score <= max;
                }
                return !isNaN(parseFloat(value));

            case 'tel':
                return /^\d{10}$/.test(value.replace(/\D/g, ''));

            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

            case 'date':
                const date = new Date(value);
                const minDate = new Date(field.getAttribute('min') || '1900-01-01');
                const maxDate = new Date(field.getAttribute('max') || new Date().toISOString().split('T')[0]);
                return date instanceof Date && !isNaN(date) && date >= minDate && date <= maxDate;

            default:
                if (field.classList.contains('percentile-input')) {
                    const num = parseFloat(value);
                    return !isNaN(num) && num >= 0 && num <= 100;
                }
                return true;
        }
    }

    getValidationMessage(field) {
        if (!field.value.trim()) {
            return 'This field is required';
        }
        if (field.type === 'email' && !field.value.includes('@')) {
            return 'Please enter a valid email address';
        }
        if (field.type === 'tel' && !/^\d{10}$/.test(field.value.replace(/\D/g, ''))) {
            return 'Please enter a valid phone number';
        }
        
        const value = field.value.trim();
        
        switch (field.type) {
            case 'number':
                if (field.closest('#test-scores-container')) {
                    return 'Please enter a valid test score';
                }
                return 'Please enter a valid number';

            case 'date':
                if (!value) return 'Please enter a valid date';
                const date = new Date(value);
                if (!(date instanceof Date) || isNaN(date)) return 'Please enter a valid date';
                if (field.min && date < new Date(field.min)) return `Date must be after ${field.min}`;
                if (field.max && date > new Date(field.max)) return `Date must be before ${field.max}`;
                return 'Please enter a valid date';

            default:
                if (field.classList.contains('percentile-input')) {
                    return 'Please enter a valid percentile (0-100)';
                }
                return field.validationMessage || 'Please enter a valid value';
        }
    }

    handleInput(e) {
        const field = e.target;
        this.validateField(field);
        this.autoSave();
    }

    handleChange(e) {
        const field = e.target;
        this.validateField(field);
        this.autoSave();

        // Handle 'Other' option in dropdowns
        if (field.tagName === 'SELECT' && field.dataset.hasOther === 'true') {
            const otherInput = field.nextElementSibling;
            if (otherInput && otherInput.classList.contains('other-input')) {
                otherInput.style.display = field.value === 'other' ? 'block' : 'none';
                if (field.value === 'other') otherInput.focus();
            }
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        let invalidFields = [];

        form.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled])').forEach(field => {
            if (!this.validateField(field)) {
                invalidFields.push(field);
            }
        });

        if (invalidFields.length === 0) {
            this.saveFormData();
            this.showSaveIndicator('Form submitted successfully');
            // Trigger a custom event that tab manager can listen for
            const event = new CustomEvent('formSubmitted', { 
                detail: { formId: form.id }
            });
            document.dispatchEvent(event);
        } else {
            // Enhanced error handling for missing required fields
        // Show error summary
        this.showErrorSummary = function(invalidFields) {
            const summary = document.createElement('div');
            summary.className = 'error-summary';
            summary.textContent = 'Please correct the following errors:';
            invalidFields.forEach(field => {
                const errorItem = document.createElement('div');
                errorItem.textContent = field.validationMessage || 'Missing required field';
                summary.appendChild(errorItem);
            });
            document.body.appendChild(summary);
        };
            this.showErrorSummary(invalidFields);
            // Scroll to first invalid field
            if (invalidFields[0]) {
                invalidFields[0].scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center'
                });
                invalidFields[0].focus();
            }
        }
    }

    showErrorSummary(invalidFields) {
        const summary = document.createElement('div');
        summary.className = 'error-summary';
        summary.setAttribute('role', 'alert');
        summary.setAttribute('aria-live', 'polite');
        summary.setAttribute('tabindex', '-1');

        const heading = document.createElement('h3');
        heading.textContent = `Please correct ${invalidFields.length} error${invalidFields.length > 1 ? 's' : ''}:`;
        summary.appendChild(heading);

        const list = document.createElement('ul');
        invalidFields.forEach(field => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#' + (field.id || '');
            link.textContent = this.getFieldLabel(field) + ': ' + this.getValidationMessage(field);
            link.onclick = (e) => {
                e.preventDefault();
                field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                field.focus();
            };
            item.appendChild(link);
            list.appendChild(item);
        });
        summary.appendChild(list);

        // Remove any existing error summary
        const existingSummary = document.querySelector('.error-summary');
        if (existingSummary) {
            existingSummary.remove();
        }

        // Insert at the top of the form
        const form = invalidFields[0].closest('form');
        form.insertBefore(summary, form.firstChild);
        summary.focus();
    }

    getFieldLabel(field) {
        // Try to find an associated label
        const labelElement = document.querySelector(`label[for="${field.id}"]`);
        if (labelElement) {
            return labelElement.textContent.trim();
        }

        // Try to find a parent label
        const parentLabel = field.closest('label');
        if (parentLabel) {
            return parentLabel.textContent.trim();
        }

        // Try to find a section heading
        const section = field.closest('.form-section');
        if (section) {
            const heading = section.querySelector('h3, h4');
            if (heading) {
                return heading.textContent.trim();
            }
        }

        // Fall back to the field's name or id
        return field.name || field.id || 'Unknown field';
    }

    setupAutoSave() {
        let timeout;
        this.forms.forEach(form => {
            form.addEventListener('input', (e) => {
                try {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => this.autoSave(), 1000); // Increased debounce time
                } catch (error) {
                    console.error('Auto-save setup error:', error);
                    this.showSaveIndicator('Auto-save temporarily unavailable');
                }
            });
        });
    }

    autoSave() {
        this.saveFormData();
        this.showSaveIndicator('Changes saved');
    }

    saveFormData() {
        const formData = {};
        try {
            this.forms.forEach(form => {
                const formElements = form.elements;
                for (let element of formElements) {
                    if (element.name && !element.disabled) {
                        if (element.type === 'checkbox') {
                            formData[element.name] = element.checked;
                        } else if (element.type === 'radio') {
                            if (element.checked) {
                                formData[element.name] = element.value;
                            }
                        } else if (element.tagName === 'SELECT' && element.dataset.hasOther === 'true') {
                            formData[element.name] = element.value;
                            const otherInput = element.nextElementSibling;
                            if (otherInput && otherInput.classList.contains('other-input')) {
                                formData[`${element.name}_other`] = otherInput.value;
                            }
                        } else {
                            formData[element.name] = element.value;
                        }
                    }
                }
            });
            localStorage.setItem('formData', JSON.stringify(formData));
        } catch (error) {
            console.error('Error saving form data:', error);
            this.showSaveIndicator('Error saving changes');
        }
    }

    loadSavedData() {
        const savedData = localStorage.getItem('formData');
        if (!savedData) return;

        try {
            const formData = JSON.parse(savedData);
            for (let [name, value] of Object.entries(formData)) {
                if (name.endsWith('_other')) continue; // Skip other inputs, handled with main field

                const element = document.querySelector(`[name="${name}"]`);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = value;
                        // Trigger change event for assessment tools
                        if (element.name === 'assessment-tools') {
                            const event = new Event('change');
                            element.dispatchEvent(event);
                        }
                    } else if (element.type === 'radio') {
                        const radio = document.querySelector(`[name="${name}"][value="${value}"]`);
                        if (radio) radio.checked = true;
                    } else if (element.tagName === 'SELECT' && element.dataset.hasOther === 'true') {
                        element.value = value;
                        const event = new Event('change');
                        element.dispatchEvent(event);
                        
                        if (value === 'other') {
                            const otherInput = element.nextElementSibling;
                            if (otherInput && otherInput.classList.contains('other-input')) {
                                otherInput.value = formData[`${name}_other`] || '';
                            }
                        }
                    } else {
                        element.value = value;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
            this.showSaveIndicator('Error loading saved data');
        }
    }

    showSaveIndicator(message) {
        const indicator = document.querySelector('.save-indicator') || document.createElement('div');
        indicator.className = 'save-indicator';
        indicator.textContent = message;
        indicator.setAttribute('role', 'status');
        indicator.setAttribute('aria-live', 'polite');
        
        if (!document.body.contains(indicator)) {
            document.body.appendChild(indicator);
        }

        // Clear any existing timeout
        if (this.saveIndicatorTimeout) {
            clearTimeout(this.saveIndicatorTimeout);
        }

        // Set new timeout
        this.saveIndicatorTimeout = setTimeout(() => {
            indicator.classList.add('hiding');
            setTimeout(() => {
                if (document.body.contains(indicator)) {
                    indicator.remove();
                }
            }, 300);
        }, 2000);
    }

    clearValidation(form) {
        form.querySelectorAll('.validation-wrapper.invalid').forEach(wrapper => {
            wrapper.classList.remove('invalid');
            const message = wrapper.querySelector('.validation-message');
            if (message) {
                message.textContent = '';
                message.removeAttribute('aria-invalid');
            }
        });

        const summary = form.querySelector('.error-summary');
        if (summary) {
            summary.remove();
        }
    }
}

// Add edit and save functionality
        this.editAndSaveEvaluation = function() {
            // Implement editing logic here
            console.log('Editing and saving evaluation');
        };
        // Initialize form manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.formManager = new FormManager();
});