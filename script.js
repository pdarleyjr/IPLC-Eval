document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Re-evaluation section toggle
    const evalTypeSelect = document.getElementById('eval-type');
    const reEvalSection = document.getElementById('re-eval-section');

    evalTypeSelect.addEventListener('change', () => {
        reEvalSection.style.display = evalTypeSelect.value === 're-eval' ? 'block' : 'none';
    });

    // Other languages section toggle
    const primaryLanguageSelect = document.getElementById('primary-language');
    const otherLanguageSection = document.getElementById('other-language-section');

    primaryLanguageSelect.addEventListener('change', () => {
        otherLanguageSection.style.display = primaryLanguageSelect.value === 'other' ? 'block' : 'none';
    });

    // Age calculation and group selection
    const dobInput = document.getElementById('dob');
    const evalDateInput = document.getElementById('eval-date');
    const ageGroupSelect = document.getElementById('age-group');

    function calculateAge() {
        if (dobInput.value && evalDateInput.value) {
            const dob = new Date(dobInput.value);
            const evalDate = new Date(evalDateInput.value);
            
            let years = evalDate.getFullYear() - dob.getFullYear();
            let months = evalDate.getMonth() - dob.getMonth();
            
            if (months < 0) {
                years--;
                months += 12;
            }
            
            // Adjust for day of month
            if (evalDate.getDate() < dob.getDate()) {
                months--;
                if (months < 0) {
                    years--;
                    months += 12;
                }
            }

            // Auto-select age group
            if (years === 0 && months <= 12) {
                ageGroupSelect.value = 'infant';
            } else if (years === 1 || (years === 2 && months === 0)) {
                ageGroupSelect.value = 'toddler';
            } else if (years >= 3 && years <= 5) {
                ageGroupSelect.value = 'preschool';
            } else if (years >= 6 && years <= 12) {
                ageGroupSelect.value = 'school-age';
            } else if (years >= 13 && years <= 18) {
                ageGroupSelect.value = 'adolescent';
            }
        }
    }

    dobInput.addEventListener('change', calculateAge);
    evalDateInput.addEventListener('change', calculateAge);

    // Initial concerns age toggle
    const firstConcernsCheckbox = document.getElementById('first-concerns');
    const concernsAgeSelect = document.getElementById('concerns-age');

    firstConcernsCheckbox.addEventListener('change', () => {
        concernsAgeSelect.style.display = firstConcernsCheckbox.checked ? 'block' : 'none';
    });

    // Form validation and data persistence
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        // Load saved value if exists
        const savedValue = localStorage.getItem(input.id);
        if (savedValue) {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = savedValue === 'true';
            } else if (input.multiple) {
                // Handle multiple select
                const selectedValues = JSON.parse(savedValue);
                Array.from(input.options).forEach(option => {
                    option.selected = selectedValues.includes(option.value);
                });
            } else {
                input.value = savedValue;
            }
        }

        // Save value on change
        input.addEventListener('change', () => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                localStorage.setItem(input.id, input.checked);
            } else if (input.multiple) {
                // Handle multiple select
                const selectedValues = Array.from(input.selectedOptions).map(option => option.value);
                localStorage.setItem(input.id, JSON.stringify(selectedValues));
            } else {
                localStorage.setItem(input.id, input.value);
            }

            // Trigger visibility updates for dependent sections
            if (input.id === 'eval-type') {
                reEvalSection.style.display = input.value === 're-eval' ? 'block' : 'none';
            } else if (input.id === 'primary-language') {
                otherLanguageSection.style.display = input.value === 'other' ? 'block' : 'none';
            } else if (input.id === 'first-concerns') {
                concernsAgeSelect.style.display = input.checked ? 'block' : 'none';
            }
        });
    });

    // Add summary generation functionality to specific sections
    const summaryEnabledSections = ['demographics', 'background', 'evaluation', 'impressions'];
    
    summaryEnabledSections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (!section) return;

        // Create and add the Generate Summary button
        const generateBtn = document.createElement('button');
        generateBtn.textContent = 'Generate Summary';
        generateBtn.className = 'generate-summary-btn';
        generateBtn.id = `${sectionId}-summary-btn`;
        section.appendChild(generateBtn);

        // Create container for summary (initially hidden)
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'summary-container';
        summaryContainer.id = `${sectionId}-summary-container`;
        
        const summaryTextarea = document.createElement('textarea');
        summaryTextarea.className = 'summary-textarea';
        summaryTextarea.id = `${sectionId}-summary-text`;
        summaryTextarea.placeholder = 'Generated summary will appear here...';
        
        summaryContainer.appendChild(summaryTextarea);
        section.appendChild(summaryContainer);

        // Load saved summary if exists
        const savedSummary = localStorage.getItem(`${sectionId}-summary`);
        if (savedSummary) {
            summaryTextarea.value = savedSummary;
            summaryContainer.classList.add('visible');
        }

        // Add click handler for generate button
        generateBtn.addEventListener('click', async () => {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';
            
            // Show container immediately
            summaryContainer.classList.add('visible');
            summaryTextarea.value = 'Generating summary...';
            
            try {
                const sectionData = collectSectionData(sectionId);
                const prompt = formatPromptForSection(sectionId, sectionData);
                
                console.log('Sending prompt:', prompt); // Debug log
                
                // Use the Hugging Face Space API endpoint
                const joinResponse = await fetch('https://huggingface.co/spaces/pdarleyjr/T5/api/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        data: [prompt]
                    })
                });

                const result = await joinResponse.json();
                console.log('API Response:', result);

                if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
                    const summary = result.data[0];
                    if (typeof summary === 'string' && summary.trim()) {
                        // Clean up the summary by removing any 'summarize:' prefix and trimming whitespace
                        const cleanedSummary = summary.replace(/^summarize:\s*/i, '').trim();
                        summaryTextarea.value = cleanedSummary;
                        localStorage.setItem(`${sectionId}-summary`, cleanedSummary);
                    } else {
                        throw new Error('Empty or invalid response from model');
                    }
                } else {
                    throw new Error('Invalid response format from API');
                }
            } catch (error) {
                console.error('Error generating summary:', error);
                summaryTextarea.value = `Error: ${error.message}\nPlease try again.`;
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Summary';
            }
        });

        // Save summary changes
        summaryTextarea.addEventListener('change', () => {
            localStorage.setItem(`${sectionId}-summary`, summaryTextarea.value);
        });
    });

    function collectSectionData(sectionId) {
        const section = document.getElementById(sectionId);
        const data = {};
        
        // Collect all input values from the section
        section.querySelectorAll('input, select, textarea').forEach(element => {
            if (element.classList.contains('summary-textarea')) return; // Skip summary textareas
            
            if (element.type === 'checkbox' || element.type === 'radio') {
                if (element.checked) {
                    data[element.id] = element.value || 'true';
                }
            } else if (element.multiple) {
                data[element.id] = Array.from(element.selectedOptions).map(opt => opt.value);
            } else if (element.tagName.toLowerCase() === 'select') {
                data[element.id] = element.value;
            } else if (element.value) {
                data[element.id] = element.value;
            }
        });
        
        return data;
    }

    function formatPromptForSection(sectionId, data) {
        let prompt = '';
        
        switch (sectionId) {
            case 'demographics':
                prompt = `summarize patient demographics: ${data['age-group'] || ''} ${data['gender'] || ''} patient`;
                if (data['primary-diagnosis']) prompt += `, diagnosed with ${data['primary-diagnosis']}`;
                if (data['primary-language']) prompt += `, primary language ${data['primary-language']}`;
                break;
                
            case 'background':
                prompt = 'summarize patient background:';
                if (data['pregnancy']) prompt += ` birth history ${data['pregnancy']}`;
                if (data['motor']) prompt += `, motor development ${data['motor']}`;
                if (data['language-dev']) prompt += `, language development ${data['language-dev']}`;
                break;
                
            case 'evaluation':
                prompt = 'summarize evaluation results:';
                // Add formal assessment results if available
                if (data['assessment-type']) {
                    prompt += ` ${data['assessment-type']} assessment performed`;
                }
                // Add behavioral observations
                if (data['eye-contact']) prompt += ', maintains eye contact';
                if (data['joint-attention']) prompt += ', demonstrates joint attention';
                break;
                
            case 'impressions':
                prompt = 'summarize clinical impressions:';
                if (data['communication-profile']) {
                    prompt += ` ${data['communication-profile']} communication profile`;
                }
                // Add areas of concern
                const concerns = [];
                if (data['receptive-concern']) concerns.push('receptive language');
                if (data['expressive-concern']) concerns.push('expressive language');
                if (data['articulation-concern']) concerns.push('articulation');
                if (concerns.length) {
                    prompt += `, concerns in ${concerns.join(', ')}`;
                }
                break;
        }
        
        return prompt.trim();
    }

    // Clear form data
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear All Data';
    clearButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 20px;
        background-color: #FFA500;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    
    clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all form data? This cannot be undone.')) {
            localStorage.clear();
            formInputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else if (input.multiple) {
                    Array.from(input.options).forEach(option => {
                        option.selected = false;
                    });
                } else {
                    input.value = '';
                }
            });

            // Reset dependent sections
            reEvalSection.style.display = 'none';
            otherLanguageSection.style.display = 'none';
            concernsAgeSelect.style.display = 'none';

            // Clear summaries
            summaryEnabledSections.forEach(sectionId => {
                const container = document.getElementById(`${sectionId}-summary-container`);
                const textarea = document.getElementById(`${sectionId}-summary-text`);
                if (container) container.classList.remove('visible');
                if (textarea) textarea.value = '';
            });
        }
    });
    
    document.body.appendChild(clearButton);

    // Export functionality
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Report';
    exportButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 160px;
        padding: 10px 20px;
        background-color: #8CC63F;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

    exportButton.addEventListener('click', () => {
        const formData = {};
        formInputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                formData[input.id] = input.checked;
            } else if (input.multiple) {
                formData[input.id] = Array.from(input.selectedOptions).map(option => option.value);
            } else {
                formData[input.id] = input.value;
            }
        });

        // Add summaries to export
        summaryEnabledSections.forEach(sectionId => {
            const textarea = document.getElementById(`${sectionId}-summary-text`);
            if (textarea) {
                formData[`${sectionId}-summary`] = textarea.value;
            }
        });

        const dataStr = JSON.stringify(formData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `evaluation-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    document.body.appendChild(exportButton);

    // Trigger initial states
    evalTypeSelect.dispatchEvent(new Event('change'));
    primaryLanguageSelect.dispatchEvent(new Event('change'));
    firstConcernsCheckbox.dispatchEvent(new Event('change'));
});
