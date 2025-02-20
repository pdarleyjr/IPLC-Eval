// Form handler for the Articulation Evaluation form

class FormHandler {
    constructor() {
        this.formSections = {
            patientInfo: new Map(),
            protocol: new Set(),
            standardizedAssessment: new Map(),
            background: new Map(),
            socialBehavioral: new Map(),
            languageSample: new Map(),
            oralMechanism: new Map(), // Will be structured data
            speechSound: new Map(),    // Will be structured data
            speechSample: new Map(),
            clinicalImpressions: new Map()
        };

        this.autosaveTimeout = null;

        // Initialize handlers after DOM is fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeHandlers());
        } else {
            this.initializeHandlers();
        }
    }

    initializeHandlers() {
        try {
            // Initialize section-specific handlers
            this.initializePatientInfoHandlers();
            this.initializeProtocolHandlers();
            this.initializeStandardizedAssessmentHandlers();
            this.initializeBackgroundHandlers();
            this.initializeSocialBehavioralHandlers();
            this.initializeLanguageSampleHandlers();
            this.initializeOralMechanismHandlers();
            this.initializeSpeechSoundHandlers();
            this.initializeSpeechSampleHandlers();
            this.initializeClinicalImpressionHandlers();

            // Set up form-wide event listeners
            this.setupFormEventListeners();

            // Load saved data if available
            this.loadSavedData();

            // Set up Generate Report button handler
            this.setupGenerateReportHandler();
        } catch (error) {
            console.error('Error initializing form handlers:', error);
        }
    }

    setupFormEventListeners() {
        const form = document.getElementById('evaluationForm');
        if (form) {
            form.addEventListener('input', (event) => {
                this.handleFieldChange(event.target);
                this.scheduleAutosave();
            });

            form.addEventListener('change', (event) => {
                this.handleFieldChange(event.target);
                this.scheduleAutosave();
            });
        }
    }

    setupGenerateReportHandler() {
        const generateButton = document.getElementById('generateReport');
        if (generateButton) {
            generateButton.addEventListener('click', async (event) => {
                event.preventDefault();

                // Get the minimum required fields
                const firstName = document.getElementById('firstName')?.value;
                const lastName = document.getElementById('lastName')?.value;

                if (!firstName || !lastName) {
                    alert('Please fill in at least the patient\'s first and last name before generating a report.');
                    return;
                }

                try {
                    const formData = this.collectFormData();
                    const impressionsField = document.querySelector('#clinicalImpressions textarea');
                    const { templateEngine } = await import('./template-engine.js');

                    if (impressionsField && templateEngine) {
                        const summary = templateEngine.generateSummary(formData);
                        console.log('Generated summary:', summary);
                        // Summary is generated but not automatically populated
                        // User can manually copy and edit the summary as needed
                        this.saveFormData();
                    } else {
                        console.error('Missing required components for report generation');
                        alert('Error generating report. Please try again.');
                    }
                } catch (error) {
                    console.error('Error generating report:', error);
                    alert('Error generating report. Please try again.');
                }
            });
        }
    }

    // Patient Information Handlers
    initializePatientInfoHandlers() {
        const dobInput = document.getElementById('dob');
        const evaluationDateInput = document.getElementById('evaluationDate');
        const ageInput = document.getElementById('age');

        if (dobInput && evaluationDateInput && ageInput) {
            const calculateAge = () => {
                if (dobInput.value && evaluationDateInput.value) {
                    const dob = new Date(dobInput.value);
                    const evalDate = new Date(evaluationDateInput.value);
                    const ageInMilliseconds = evalDate - dob;
                    const ageDate = new Date(Math.abs(ageInMilliseconds));
                    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
                    const months = ageDate.getUTCMonth();
                    ageInput.value = `${years} years, ${months} months`;
                }
            };

            dobInput.addEventListener('change', calculateAge);
            evaluationDateInput.addEventListener('change', calculateAge);
        }
    }

    // Protocol Handlers
    initializeProtocolHandlers() {
        const protocolCheckboxes = document.querySelectorAll('#protocol input[type="checkbox"]');

        protocolCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.formSections.protocol.add(checkbox.id);
                } else {
                    this.formSections.protocol.delete(checkbox.id);
                }
            });
        });
    }

    // Background Handlers
    initializeBackgroundHandlers() {
        // Handle background information fields
        const backgroundFields = document.querySelectorAll('#backgroundInfo input, #backgroundInfo textarea');
        backgroundFields.forEach(field => {
            field.addEventListener('change', () => {
                this.formSections.background.set(field.id, this.getFieldValue(field));
            });
        });
    }

    // Social Behavioral Handlers
    initializeSocialBehavioralHandlers() {
        const behavioralFields = document.querySelectorAll('#socialBehavioral input[type="checkbox"]');
        behavioralFields.forEach(field => {
            field.addEventListener('change', () => {
                this.formSections.socialBehavioral.set(field.id, field.checked);
            });
        });
    }

    // Language Sample Handlers
    initializeLanguageSampleHandlers() {
        const sampleFields = document.querySelectorAll('#languageSample textarea');
        sampleFields.forEach(field => {
            field.addEventListener('input', () => {
                this.formSections.languageSample.set(field.id, field.value);
            });
        });
    }

    // Oral Mechanism Handlers
    initializeOralMechanismHandlers() {
        const structureFields = document.querySelectorAll('#oralMechanism-structure input, #oralMechanism-structure textarea'); // Assuming new section IDs
        structureFields.forEach(field => {
            field.addEventListener('change', () => {
                this.formSections.oralMechanism.set(['structure', field.id], this.getFieldValue(field)); // Nested key
            });
        });

        const functionFields = document.querySelectorAll('#oralMechanism-function input, #oralMechanism-function textarea'); // Assuming new section IDs
        functionFields.forEach(field => {
            field.addEventListener('change', () => {
                this.formSections.oralMechanism.set(['function', field.id], this.getFieldValue(field)); // Nested key
            });
        });
        const overallNotesField = document.getElementById('oralMechanismOverallNotes'); // Assuming new field ID
        if (overallNotesField) {
            overallNotesField.addEventListener('input', () => {
                this.formSections.oralMechanism.set(['overallNotes'], overallNotesField.value); // Nested key
            });
        }
    }

    // Speech Sound Handlers
    initializeSpeechSoundHandlers() {
        const articulationFields = document.querySelectorAll('#speechSound-articulation input, #speechSound-articulation textarea'); // Assuming new section IDs
        articulationFields.forEach(field => {
            field.addEventListener('change', () => {
                this.formSections.speechSound.set(['articulation', field.id], this.getFieldValue(field)); // Nested key
            });
        });

        const intelligibilityFields = document.querySelectorAll('#speechSound-intelligibility input, #speechSound-intelligibility textarea'); // Assuming new section IDs
        intelligibilityFields.forEach(field => {
            field.addEventListener('change', () => {
                this.formSections.speechSound.set(['intelligibility', field.id], this.getFieldValue(field)); // Nested key
            });
        });
        const overallNotesField = document.getElementById('speechSoundOverallNotes'); // Assuming new field ID
        if (overallNotesField) {
            overallNotesField.addEventListener('input', () => {
                this.formSections.speechSound.set(['overallNotes'], overallNotesField.value); // Nested key
            });
        }
    }

    // Speech Sample Handlers
    initializeSpeechSampleHandlers() {
        const sampleFields = document.querySelectorAll('#speechSample textarea');
        sampleFields.forEach(field => {
            field.addEventListener('input', () => {
                this.formSections.speechSample.set(field.id, field.value);
            });
        });
    }

    // Clinical Impression Handlers
    initializeClinicalImpressionHandlers() {
        const impressionFields = document.querySelectorAll('#clinicalImpressions textarea');
        impressionFields?.forEach(field => {
            field.addEventListener('input', () => {
                this.formSections.clinicalImpressions.set(field.id, field.value);
            });
        });
    }

    // Standardized Assessment Handlers
    initializeStandardizedAssessmentHandlers() {
        const subtests = ['ac', 'ec', 'tl']; // Auditory Comprehension, Expressive Communication, Total Language

        subtests.forEach(subtest => {
            const standardScoreInput = document.getElementById(`${subtest}_standard_score`);
            const severityInput = document.getElementById(`${subtest}_severity`);

            if (standardScoreInput && severityInput) {
                standardScoreInput.addEventListener('input', () => {
                    const score = parseInt(standardScoreInput.value);
                    severityInput.value = this.calculateSeverity(score);
                });
            }
        });
    }

    calculateSeverity(score) {
        if (!score) return '';
        if (score > 115) return 'Above Average';
        if (score >= 85) return 'Average/Within Normal Limits';
        if (score >= 78) return 'Marginal/Below Average/Mild';
        if (score >= 71) return 'Low Range/Moderate';
        if (score >= 50) return 'Very Low Range/Severe';
        return 'Profound';
    }

    handleFieldChange(field) {
        if (!field.id && !field.name) return;

        const value = this.getFieldValue(field);
        const key = field.id || field.name;

        // Update form section data
        Object.entries(this.formSections).forEach(([section, data]) => {
            if (field.closest(`#${section}`)) {
                if (data instanceof Set) {
                    // Only handle checkboxes for Set data
                    if (field.type === 'checkbox') {
                        if (field.checked) {
                            data.add(key);
                        } else {
                            data.delete(key);
                        }
                    }
                } else {
                    // Store all other field values in Map
                    data.set(key, value === '' ? null : value);
                }
            }
        });

        // Handle dependent fields
        this.updateDependentFields(field);
    }

    getFieldValue(field) {
        switch (field.type) {
            case 'checkbox':
                return field.checked;
            case 'radio':
                return field.checked ? field.value : null;
            default:
                return field.value;
        }
    }

    updateDependentFields(field) {
        // Handle "Other" checkboxes and their text inputs
        if (field.type === 'checkbox' && field.id.startsWith('other')) {
            const textInput = document.getElementById(`${field.id}Text`);
            if (textInput) {
                textInput.disabled = !field.checked;
                if (!field.checked) {
                    textInput.value = '';
                }
            }
        }
    }

    scheduleAutosave() {
        if (this.autosaveTimeout) {
            clearTimeout(this.autosaveTimeout);
        }
        this.autosaveTimeout = setTimeout(() => this.saveFormData(), 1000);
    }

    saveFormData() {
        try {
            const data = this.collectFormData();
            localStorage.setItem('evaluationFormData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving form data:', error);
        }
    }

    loadSavedData() {
        try {
            const savedData = localStorage.getItem('evaluationFormData');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.populateForm(data);
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }

    populateForm(data) {
        Object.entries(data || {}).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else if (element.type === 'radio') {
                    element.checked = element.value === value;
                } else {
                    element.value = value || '';
                }
            }
        });
    }

    collectFormData() {
        const form = document.getElementById('evaluationForm');
        if (!form) return {};

        let formData = {};

        // Collect all form field values
        form.querySelectorAll('input, textarea, select').forEach(element => {
            if (element.id || element.name) {
                const key = element.id || element.name;
                const value = this.getFieldValue(element);
                if (value !== null && value !== '') formData[key] = value;
            }
        });

        // Process standardized assessment scores
        const subtests = ['ac', 'ec', 'tl'];
        formData.standardizedAssessment = {};
        subtests.forEach(subtest => {
            const score = document.getElementById(`${subtest}_standard_score`)?.value;
            const severity = document.getElementById(`${subtest}_severity`)?.value;
            if (score) {
                formData.standardizedAssessment[subtest] = { standardScore: parseInt(score), severity };
            }
        });

        // Convert Map data to plain objects for storage
        Object.entries(this.formSections).forEach(([section, data]) => {
            if (data instanceof Map) {
                if (section === 'oralMechanism' || section === 'speechSound') { // Handle structured data
                    formData[section] = {};
                    data.forEach((value, key) => {
                        if (Array.isArray(key)) { // For nested Maps (structure/function)
                            if (key && key[0]) {
                                formData[section][key[0]] = formData[section][key[0]] || {};
                                if (key[1]) {
                                    formData[section][key[0]][key[1]] = value;
                                }
                            }
                        } else { // For overallNotes
                            formData[section][key] = value;
                        }
                    });
                }
 else {
                    data.forEach((value, key) => {
                        if (value !== null && value !== '') {
                            formData[key] = value;
                        }
                    });
                }
            }
            else if (data instanceof Set && data.size > 0) {
                // Only include non-empty Sets
                // Convert Set to array of values
                formData[section] = Array.from(data);
            }
        });

        Object.entries(formData).forEach(([key, value]) => {
            if (value === undefined || value === null) delete formData[key];
        });

        return formData;
    }

    handleFormSubmission() {
        try {
            if (this.validateForm()) {
                const formData = this.collectFormData();
                this.saveFormData();
                return formData;
            }
            return null;
        } catch (error) {
            console.error('Error handling form submission:', error);
            return null;
        }
    }

    validateForm() {
        let isValid = true;
        const requiredFields = document.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = this.getFieldValue(field);
        const isValid = value !== null && value !== '';

        field.classList.toggle('is-invalid', !isValid);

        const errorDiv = field.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
            errorDiv.style.display = isValid ? 'none' : 'block';
        }

        return isValid;
    }
}

// Export the FormHandler class
export default FormHandler;
