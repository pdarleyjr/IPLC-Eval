console.log('Script loaded');

// Tab switching functionality
class TabManager {
    constructor() {
        console.log('TabManager initializing');
        this.tabs = document.querySelectorAll('.tab-btn');
        this.panels = document.querySelectorAll('.tab-panel');
        console.log('Found tabs:', this.tabs.length);
        console.log('Found panels:', this.panels.length);
        
        // Touch handling properties
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.touchStartTime = 0;
        this.SWIPE_THRESHOLD = 50; // Minimum distance for swipe
        this.SWIPE_TIMEOUT = 300;  // Maximum time for swipe
        
        // Initialize ARIA attributes and roles
        this.initializeARIA();
        
        // Set initial active tab
        if (this.tabs.length > 0 && !document.querySelector('.tab-btn.active')) {
            console.log('Setting initial active tab');
            this.switchTab(this.tabs[0]);
        }
        
        this.setupTabHandlers();
        this.setupTouchHandlers();
    }

    initializeARIA() {
        // Set up tablist
        const tabList = document.querySelector('.tabs');
        if (tabList) {
            tabList.setAttribute('role', 'tablist');
            tabList.setAttribute('aria-label', 'Evaluation Sections');
        }

        // Set up tabs
        this.tabs.forEach((tab, index) => {
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', 'false');
            tab.setAttribute('aria-controls', tab.getAttribute('data-tab'));
            tab.setAttribute('id', `tab-${tab.getAttribute('data-tab')}`);
            tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });

        // Set up panels
        this.panels.forEach(panel => {
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', `tab-${panel.id}`);
            panel.setAttribute('tabindex', '0');
        });

        // Initialize form controls with ARIA labels
        this.initializeFormARIA();
    }

    initializeFormARIA() {
        try {
            // Add ARIA labels to form groups
            document.querySelectorAll('.form-group').forEach(group => {
                try {
                    const label = group.querySelector('.form-label');
                    const inputs = group.querySelectorAll('input, select, textarea');
                    if (label && inputs.length) {
                        const labelId = `label-${Math.random().toString(36).substr(2, 9)}`;
                        label.id = labelId;
                        inputs.forEach(input => {
                            input.setAttribute('aria-labelledby', labelId);
                        });
                    }
                } catch (error) {
                    console.warn('Error processing form group:', error);
                }
            });

            // Add ARIA labels to rating scales
            document.querySelectorAll('.rating-scale').forEach(scale => {
                try {
                    const ratingItem = scale.closest('.rating-item');
                    if (ratingItem) {
                        const groupLabel = ratingItem.querySelector('label');
                        if (groupLabel) {
                            const groupId = `group-${Math.random().toString(36).substr(2, 9)}`;
                            scale.setAttribute('role', 'radiogroup');
                            scale.setAttribute('aria-labelledby', groupId);
                            groupLabel.id = groupId;
                        }
                    }
                } catch (error) {
                    console.warn('Error processing rating scale:', error);
                }
            });

            // Add ARIA labels to checkbox groups
            document.querySelectorAll('.checkbox-group').forEach(group => {
                try {
                    let label;
                    const formField = group.closest('.form-field');
                    if (formField) {
                        label = formField.querySelector('label');
                    }

                    if (!label) {
                        label = document.createElement('label');
                        label.className = 'form-label';
                        label.textContent = 'Group Label';
                        group.parentNode.insertBefore(label, group);
                    }

                    const groupId = `group-${Math.random().toString(36).substr(2, 9)}`;
                    group.setAttribute('role', 'group');
                    group.setAttribute('aria-labelledby', groupId);
                    label.id = groupId;
                } catch (error) {
                    console.warn('Error processing checkbox group:', error);
                }
            });
        } catch (error) {
            console.error('Error in initializeFormARIA:', error);
        }
    }

    setupTabHandlers() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                console.log('Tab clicked:', tab.getAttribute('data-tab'));
                this.switchTab(tab);
            });

            // Add keyboard handling for accessibility
            tab.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.focusPreviousTab();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.focusNextTab();
                        break;
                    case 'Home':
                        e.preventDefault();
                        this.focusFirstTab();
                        break;
                    case 'End':
                        e.preventDefault();
                        this.focusLastTab();
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        this.switchTab(tab);
                        break;
                }
            });
        });
    }

    setupTouchHandlers() {
        const tabsContainer = document.querySelector('.tabs');
        if (!tabsContainer) return;

        tabsContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = Date.now();
        }, { passive: true });

        tabsContainer.addEventListener('touchmove', (e) => {
            if (!this.touchStartX) return;

            const deltaX = this.touchStartX - e.touches[0].clientX;
            const deltaY = Math.abs(this.touchStartY - e.touches[0].clientY);

            // If horizontal scrolling is detected, prevent vertical scrolling
            if (Math.abs(deltaX) > deltaY) {
                e.preventDefault();
            }
        }, { passive: false });

        tabsContainer.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].clientX;
            this.touchEndY = e.changedTouches[0].clientY;
            this.handleSwipe();
        }, { passive: true });
    }

    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = Math.abs(this.touchEndY - this.touchStartY);
        const deltaTime = Date.now() - this.touchStartTime;

        // Check if the gesture is a horizontal swipe
        if (Math.abs(deltaX) > this.SWIPE_THRESHOLD && 
            deltaTime < this.SWIPE_TIMEOUT &&
            Math.abs(deltaX) > deltaY) {
            
            if (deltaX > 0) {
                this.focusPreviousTab();
            } else {
                this.focusNextTab();
            }
        }

        // Reset touch values
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.touchStartTime = 0;
    }

    switchTab(newTab) {
        console.log('Switching to tab:', newTab.getAttribute('data-tab'));
        // Remove active class from all tabs and panels
        this.tabs.forEach(tab => {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
            tab.setAttribute('tabindex', '-1');
        });

        this.panels.forEach(panel => {
            panel.classList.remove('active');
            panel.style.display = 'none'; // Ensure panel is hidden
        });

        // Add active class to clicked tab and its panel
        newTab.classList.add('active');
        newTab.setAttribute('aria-selected', 'true');
        newTab.setAttribute('tabindex', '0');

        const panelId = newTab.getAttribute('data-tab');
        console.log('Looking for panel with ID:', panelId);
        const panel = document.getElementById(panelId);
        if (panel) {
            console.log('Found panel, activating');
            panel.classList.add('active');
            panel.style.display = 'block'; // Ensure panel is visible
            
            // Scroll tab into view on mobile
            if (window.innerWidth <= 768) {
                newTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        } else {
            console.warn('Panel not found:', panelId);
        }
    }

    focusPreviousTab() {
        const currentTab = document.querySelector('.tab-btn.active');
        const previousTab = currentTab.previousElementSibling || this.tabs[this.tabs.length - 1];
        this.switchTab(previousTab);
        previousTab.focus();
    }

    focusNextTab() {
        const currentTab = document.querySelector('.tab-btn.active');
        const nextTab = currentTab.nextElementSibling || this.tabs[0];
        this.switchTab(nextTab);
        nextTab.focus();
    }

    focusFirstTab() {
        const firstTab = this.tabs[0];
        this.switchTab(firstTab);
        firstTab.focus();
    }

    focusLastTab() {
        const lastTab = this.tabs[this.tabs.length - 1];
        this.switchTab(lastTab);
        lastTab.focus();
    }
}

// Form field initialization
class FormInitializer {
    constructor() {
        console.log('FormInitializer initializing');
        this.initializeClientInfoDropdowns();
        this.setupDynamicFields();
        this.setupDateOfBirthHandler();
        this.setupOtherInputHandlers();
        this.preventIOSZoom();
    }

    preventIOSZoom() {
        // Prevent iOS zoom on input focus
        const inputs = document.querySelectorAll('input[type="text"], input[type="number"], select, textarea');
        inputs.forEach(input => {
            input.style.fontSize = '16px'; // Minimum font size to prevent zoom
        });
    }

    populateDropdown(selectId, options, includeBlank = true, preserveExisting = false) {
        console.log('Populating dropdown:', selectId);
        const select = document.getElementById(selectId);
        
        if (!select || select.tagName !== 'SELECT') {
            console.warn(`Select element not found or invalid for ID: ${selectId}`);
            return;
        }

        // If preserveExisting is true and the select already has options, skip population
        if (preserveExisting && select.options && select.options.length > 0) return;

        // Clear existing options if not preserving
        if (!preserveExisting) {
            select.innerHTML = '';

            // Add blank option if needed
            if (includeBlank) {
                const blankOption = document.createElement('option');
                blankOption.value = '';
                blankOption.textContent = 'Select...';
                select.appendChild(blankOption);
            }
        }

        // Add provided options
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.toLowerCase().replace(/\s+/g, '-');
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });

        console.log('Dropdown populated:', selectId, select.options.length, 'options');
    }

    initializeClientInfoDropdowns() {
        console.log('Initializing client info dropdowns');
        // Gender dropdown
        const genderOptions = [
            'Male',
            'Female',
            'Non-binary',
            'Prefer not to say',
            'Other'
        ];
        this.populateDropdown('gender', genderOptions);

        // Language dropdowns
        const languages = [
            'English',
            'Spanish',
            'French',
            'Mandarin',
            'Arabic',
            'Other'
        ];
        this.populateDropdown('primaryLanguage', languages);
        this.populateDropdown('secondaryLanguage', languages);

        // Insurance providers
        const insuranceOptions = [
            'Medicare',
            'Medicaid',
            'Blue Cross',
            'Aetna',
            'UnitedHealth',
            'Cigna',
            'Other'
        ];
        this.populateDropdown('insuranceProvider', insuranceOptions);

        // Referral sources
        const referralOptions = [
            'Physician',
            'School',
            'Parent',
            'Self',
            'Other Healthcare Provider',
            'Other'
        ];
        this.populateDropdown('referralSource', referralOptions);

        // Initialize dropdowns that already have options with preserveExisting=true
        const existingDropdowns = ['birthType', 'educationalSetting', 'gradeLevel'];
        existingDropdowns.forEach(id => {
            try {
                this.populateDropdown(id, [], true, true);
            } catch (error) {
                console.warn(`Failed to initialize dropdown ${id}:`, error);
            }
        });
    }

    setupDateOfBirthHandler() {
        const dobInput = document.getElementById('dateOfBirth');
        const ageInput = document.getElementById('age');
        if (dobInput && ageInput) {
            dobInput.addEventListener('change', () => {
                if (dobInput.value) {
                    const dob = new Date(dobInput.value);
                    const today = new Date();
                    let age = today.getFullYear() - dob.getFullYear();
                    const monthDiff = today.getMonth() - dob.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                        age--;
                    }
                    ageInput.value = age;
                } else {
                    ageInput.value = '';
                }
            });
        }
    }

    setupOtherInputHandlers() {
        document.querySelectorAll('select[data-has-other="true"]').forEach(select => {
            const otherInput = document.createElement('input');
            otherInput.type = 'text';
            otherInput.className = 'form-input other-input';
            otherInput.style.display = 'none';
            otherInput.style.fontSize = '16px'; // Prevent iOS zoom
            otherInput.placeholder = `Please specify ${select.name}`;
            select.parentNode.insertBefore(otherInput, select.nextSibling);

            select.addEventListener('change', () => {
                otherInput.style.display = select.value === 'other' ? 'block' : 'none';
                if (select.value === 'other') otherInput.focus();
            });
        });
    }

    setupDynamicFields() {
        // Setup dynamic fields containers
        ['medications', 'allergies'].forEach(fieldType => {
            const container = document.getElementById(`${fieldType}-container`);
            if (container) {
                const addButton = document.createElement('button');
                addButton.type = 'button';
                addButton.className = 'add-field-btn';
                addButton.textContent = `Add ${fieldType.slice(0, -1)}`;
                addButton.setAttribute('aria-label', `Add new ${fieldType.slice(0, -1)}`);
                addButton.onclick = () => this.addDynamicField(container, fieldType);
                container.appendChild(addButton);
            }
        });
    }

    addDynamicField(container, fieldType) {
        const fieldWrapper = document.createElement('div');
        fieldWrapper.className = 'dynamic-field';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input';
        input.style.fontSize = '16px'; // Prevent iOS zoom
        input.placeholder = `Enter ${fieldType.slice(0, -1)}`;
        input.setAttribute('aria-label', `Enter ${fieldType.slice(0, -1)}`);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-field-btn';
        removeButton.textContent = '×';
        removeButton.setAttribute('aria-label', `Remove ${fieldType.slice(0, -1)}`);
        removeButton.onclick = () => fieldWrapper.remove();

        fieldWrapper.appendChild(input);
        fieldWrapper.appendChild(removeButton);
        container.insertBefore(fieldWrapper, container.lastChild);
        input.focus();
    }
}

// Initialize everything when DOM is loaded
console.log('Setting up DOMContentLoaded listener');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    window.tabManager = new TabManager();
    window.formInitializer = new FormInitializer();
});
