// Form handler specific functionality for the Articulation Evaluation form

class FormHandler {
    constructor() {
        this.formSections = {
            patientInfo: {},
            protocol: new Set(),
            standardizedAssessment: new Map(),
            background: new Map(),
            socialBehavioral: new Map(),
            languageSample: new Map(),
            oralMechanism: new Map(),
            speechSound: new Map(),
            speechSample: new Map(),
            clinicalImpressions: new Map()
        };
        
        // Initialize handlers after DOM is fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeHandlers());
        } else {
            this.initializeHandlers();
        }
    }

    // Social Behavioral Observation Handlers
    initializeSocialBehavioralHandlers() {
        const behaviorCheckboxes = document.querySelectorAll('[name="social_behavior"]');
        const behavioralNotes = document.getElementById('behavioral_notes');

        if (behaviorCheckboxes.length) {
            behaviorCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    if (behavioralNotes) {
                        behavioralNotes.disabled = false;
                    }
                    this.updateFormData();
                });
            });
        }
    }

    // Language Sample Analysis Handlers
    initializeLanguageSampleHandlers() {
        // Language Structure
        const structureCheckboxes = document.querySelectorAll('[name="language_structure"]');
        
        // Language Content
        const contentCheckboxes = document.querySelectorAll('[name="language_content"]');
        
        // Social Language Use
        const socialLanguageCheckboxes = document.querySelectorAll('[name="social_language_use"]');
        
        // Additional Observations
        const observationCheckboxes = document.querySelectorAll('[name="additional_observations"]');
        
        const languageSampleNotes = document.getElementById('language_sample_notes');

        const allCheckboxes = [
            ...structureCheckboxes,
            ...contentCheckboxes,
            ...socialLanguageCheckboxes,
            ...observationCheckboxes
        ];

        if (allCheckboxes.length) {
            allCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    if (languageSampleNotes) {
                        languageSampleNotes.disabled = false;
                    }
                    this.updateFormData();
                });
            });
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
        } catch (error) {
            console.error('Error initializing form handlers:', error);
        }
    }

    // Patient Information Handlers
    initializePatientInfoHandlers() {
        // Auto-calculate age
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

    // Protocol Section Handlers
    initializeProtocolHandlers() {
        const otherComponentCheckbox = document.getElementById('otherComponent');
        const otherComponentText = document.getElementById('otherComponentText');

        if (otherComponentCheckbox && otherComponentText) {
            otherComponentText.disabled = !otherComponentCheckbox.checked;
            
            otherComponentCheckbox.addEventListener('change', function() {
                otherComponentText.disabled = !this.checked;
                if (!this.checked) {
                    otherComponentText.value = '';
                }
            });

            // Clear other text when unchecking
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                const textInput = document.getElementById(`${checkbox.id}Text`);
                if (textInput) {
                    checkbox.addEventListener('change', function() {
                        if (!this.checked) {
                            textInput.value = '';
                        }
                    });
                }
            });
        }
    }

    // Standardized Assessment Handlers
    initializeStandardizedAssessmentHandlers() {
        // Initialize PLS-5 score calculations
        this.initializePLS5Handlers();
        
        // Initialize strength and difficulty checkboxes
        this.initializeStrengthDifficultyHandlers();
    }

    initializePLS5Handlers() {
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

    initializeStrengthDifficultyHandlers() {
        // Handle relative strengths checkboxes
        const strengthsContainer = document.querySelector('.relative-strengths');
        if (strengthsContainer) {
            const checkboxes = strengthsContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateFormData();
                });
            });
        }

        // Handle areas of difficulty
        const difficultiesContainer = document.querySelector('.areas-of-difficulty');
        if (difficultiesContainer) {
            const checkboxes = difficultiesContainer.querySelectorAll('input[type="checkbox"]');
            const additionalDifficulties = document.getElementById('additional_difficulties');

            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateFormData();
                });
            });

            if (additionalDifficulties) {
                additionalDifficulties.addEventListener('input', () => {
                    this.updateFormData();
                });
            }
        }
    }

    // Background Information Handlers
    initializeBackgroundHandlers() {
        this.initializeRadioGroup('birthHistory', ['pregnancyLength', 'deliveryType', 'birthNotes']);
        this.initializeRadioGroup('medicalHistory', ['medicalNotes']);
        this.initializeRadioGroup('developmentalMilestones', ['developmentalNotes'], 'Delayed');
        this.initializeRadioGroup('languageMilestones', ['languageNotes'], 'Delayed');
    }

    initializeRadioGroup(name, fieldIds, enableValue = 'remarkable') {
        const radios = document.querySelectorAll(`input[name="${name}"]`);
        const fields = fieldIds.map(id => document.getElementById(id)).filter(Boolean);

        if (radios.length && fields.length) {
            // Set initial state
            const checkedRadio = document.querySelector(`input[name="${name}"]:checked`);
            const shouldEnable = checkedRadio && checkedRadio.value === enableValue;
            fields.forEach(field => field.disabled = !shouldEnable);

            // Add change listeners
            radios.forEach(radio => {
                radio.addEventListener('change', function() {
                    const isEnabled = this.value === enableValue;
                    fields.forEach(field => {
                        field.disabled = !isEnabled;
                        if (!isEnabled) field.value = '';
                    });
                });
            });
        }
    }

    // Oral Mechanism Handlers
    initializeOralMechanismHandlers() {
        // Initialize structure assessments
        this.initializeStructureAssessments();
        
        // Initialize function assessments
        this.initializeFunctionAssessments();
    }

    initializeStructureAssessments() {
        const structureTypes = [
            'face', 'mandible', 'teeth', 'palatal', 'lips'
        ];

        structureTypes.forEach(type => {
            this.initializeRadioGroup(`${type}Structure`, [], 'Concern');
        });

        // Handle structure notes
        const structureNotes = document.getElementById('structureNotes');
        if (structureNotes) {
            document.querySelectorAll('[name$="Structure"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    structureNotes.disabled = false;
                });
    
        });
        }
    }

    initializeFunctionAssessments() {
        const functionTypes = [
            'jaw', 'velopharyngeal', 'phonation', 'reflexes', 'motor'
        ];

        functionTypes.forEach(type => {
            this.initializeRadioGroup(`${type}Function`, [], 'Concern');
        });

        // Handle function notes
        const functionNotes = document.getElementById('functionNotes');
        if (functionNotes) {
            document.querySelectorAll('[name$="Function"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    functionNotes.disabled = false;
                }
);
            }
);
        }
    }

    // Speech Sound Assessment Handlers
    initializeSpeechSoundHandlers() {
        const soundRows = document.querySelectorAll('.sound-row');
        
        soundRows.forEach(row => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            const inputs = row.querySelectorAll('input[type="text"]');
            
            if (checkbox && inputs.length) {
                // Initially disable inputs if checkbox is unchecked
                inputs.forEach(input => {
                    input.disabled = !checkbox.checked;
                });

                // Add change listener
                checkbox.addEventListener('change', function() {
                    inputs.forEach(input => {
                        input.disabled = !this.checked;
                        if (!this.checked) {
                            input.value = '';
                        }
                    });
                });
            }
        });
    }

    // Speech Sample Analysis Handlers
    initializeSpeechSampleHandlers() {
        this.initializeSoundProduction();
        this.initializePhonologicalPatterns();
        this.initializeIntelligibilityRatings();
        this.initializeConnectedSpeech();
        this.initializeStrengthsObserved();
    }

    initializeSoundProduction() {
        const soundProductionCheckboxes = document.querySelectorAll('.sound-production input[type="checkbox"]');
        const otherSoundProduction = document.getElementById('otherSoundProduction');

        const otherSoundProductionText = document.getElementById('otherSoundProductionText');

        if (soundProductionCheckboxes.length) {
            soundProductionCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', this.updateFormData.bind(this));
            });
        }

        if (otherSoundProduction && otherSoundProductionText) {
            otherSoundProductionText.disabled = !otherSoundProduction.checked;
            otherSoundProduction.addEventListener('change', function() {
                otherSoundProductionText.disabled = !this.checked;
                if (!this.checked) {
                    otherSoundProductionText.value = '';
                }
            });
        }
    }

    initializePhonologicalPatterns() {
        const patternCheckboxes = document.querySelectorAll('[id^="pattern"]');
        const otherPattern = document.getElementById('otherPattern');
        const otherPatternText = document.getElementById('otherPatternText');
        const phonologicalNotes = document.getElementById('phonologicalNotes');

        if (patternCheckboxes.length) {
            patternCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    if (phonologicalNotes) {
                        phonologicalNotes.disabled = false;
                    }
                    this.updateFormData();
                });
            });
        }

        if (otherPattern && otherPatternText) {
            otherPatternText.disabled = !otherPattern.checked;
            otherPattern.addEventListener('change', function() {
                otherPatternText.disabled = !this.checked;
                if (!this.checked) {
                    otherPatternText.value = '';
                }
            });
        }
    }

    initializeIntelligibilityRatings() {
        const familiarRadios = document.querySelectorAll('[name="familiarIntelligibility"]');
        const unfamiliarRadios = document.querySelectorAll('[name="unfamiliarIntelligibility"]');
        const intelligibilityNotes = document.getElementById('intelligibilityNotes');

        if (intelligibilityNotes) {
            [...familiarRadios, ...unfamiliarRadios].forEach(radio => {
                radio.addEventListener('change', () => {
                    intelligibilityNotes.disabled = false;
                    this.updateFormData();
                });
            });
        }
    }

    initializeConnectedSpeech() {
        const characteristicCheckboxes = document.querySelectorAll('[id^="speech"]');
        const otherCharacteristic = document.getElementById('otherCharacteristic');
        const otherCharacteristicText = document.getElementById('otherCharacteristicText');
        const characteristicsNotes = document.getElementById('characteristicsNotes');

        if (characteristicCheckboxes.length) {
            characteristicCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    if (characteristicsNotes) {
                        characteristicsNotes.disabled = false;
                    }
                    this.updateFormData();
                });
            });
        }

        if (otherCharacteristic && otherCharacteristicText) {
            otherCharacteristicText.disabled = !otherCharacteristic.checked;
            otherCharacteristic.addEventListener('change', function() {
                otherCharacteristicText.disabled = !this.checked;
                if (!this.checked) {
                    otherCharacteristicText.value = '';
                }
            });
        }
    }

    initializeStrengthsObserved() {
        const strengthCheckboxes = document.querySelectorAll('[id^="strength"]');
        const otherStrength = document.getElementById('otherStrength');
        const otherStrengthText = document.getElementById('otherStrengthText');

        if (strengthCheckboxes.length) {
            strengthCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', this.updateFormData.bind(this));
            });
        }

        if (otherStrength && otherStrengthText) {
            otherStrengthText.disabled = !otherStrength.checked;
            otherStrength.addEventListener('change', function() {
                otherStrengthText.disabled = !this.checked;
                if (!this.checked) {
                    otherStrengthText.value = '';
                }
            });
        }
    }

    // Helper method to update form data
    updateFormData() {
        const data = this.collectFormData();
        // Store in localStorage or update state as needed
        try {
            localStorage.setItem('evaluationFormData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving form data:', error);
        }
    }

    // Helper method to load saved form data
    loadFormData() {
        try {
            const savedData = localStorage.getItem('evaluationFormData');
            if (savedData) {
                const data = JSON.parse(savedData);
                Object.entries(data).forEach(([key, value]) => {
                    const element = document.getElementById(key);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = value;
                        } else if (element.type === 'radio') {
                            element.checked = element.value === value;
                        } else {
                            element.value = value;
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading form data:', error);
        }
    }

    // Clinical Impression Handlers
    initializeClinicalImpressionHandlers() {
        const impressionFields = document.querySelectorAll('.clinical-impression-field');
        if (impressionFields.length) {
            impressionFields.forEach(field => {
                field.addEventListener('input', this.updateClinicalSummary.bind(this));
            });
        }
    }

    // Helper method to update clinical summary
    updateClinicalSummary() {
        const firstName = document.getElementById('firstName')?.value || '';
        const age = document.getElementById('age')?.value || '';
        const summaryField = document.getElementById('clinicalSummary');

        if (summaryField && firstName && age) {
            const impressions = Array.from(document.querySelectorAll('.clinical-impression-field'))
                .map(field => field.value)
                .filter(value => value)
                .join(', ');
                
            summaryField.value = `Based on the results of formal and informal assessment, as well as parent interview and clinical observation, ${firstName}, a ${age} old, presents with: ${impressions}`;
        }
    }

    // Data collection methods
    collectFormData() {
        const form = document.getElementById('evaluationForm');
        if (!form) return {};

        const data = new Map();
        
        // Collect all form inputs
        form.querySelectorAll('input, textarea, select').forEach(element => {
            if (element.id || element.name) {
                const key = element.id || element.name;
                switch (element.type) {
                    case 'checkbox':
                        data.set(key, element.checked);
                        break;
                    case 'radio':
                        if (element.checked) {
                            data.set(element.name, element.value);
                        }
                        break;
                    default:
                        data.set(key, element.value);
                }
            }
        });
        
        return Object.fromEntries(data);
    }

    // Validation methods
    validateSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return true;

        const requiredFields = section.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('is-invalid');
                this.showValidationError(field, 'This field is required');
            } else {
                field.classList.remove('is-invalid');
                this.removeValidationError(field);
            }
        });

        return isValid;
    }

    showValidationError(field, message) {
        if (!field) return;
        
        this.removeValidationError(field); // Remove any existing error first
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentNode?.appendChild(errorDiv);
    }

    removeValidationError(field) {
        if (!field || !field.parentNode) return;
        
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
}

// Initialize form handler when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.formHandler = new FormHandler();
    });
} else {
    window.formHandler = new FormHandler();
}
