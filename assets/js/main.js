// Main application entry point

import FormHandler from './form-handler.js';
import { templateEngine } from './template-engine.js';
import { dbManager } from './db-utils.js';

class ApplicationManager {
    constructor() {
        this.initialized = false;
        this.formHandler = null;
        this.debug = false;
        this.templateEngine = templateEngine;
        
        // Bind methods
        this.handleError = this.handleError.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);
    }

    // Initialize the application
    async initialize() {
        try {
            // Hide error boundary first
            this.initializeErrorHandling();

            console.log('Initializing application...');
            
            // Set up error handling
            window.addEventListener('error', this.handleError);
            window.addEventListener('unhandledrejection', this.handleError);

            // Initialize database first
            await dbManager.init();
            console.log('Database initialized');

            // Initialize form handler
            this.formHandler = new FormHandler();
            
            // Expose app instance for other modules
            if (!window.app) {
                window.app = this;
                window.app.templateEngine = this.templateEngine;
                window.app.formHandler = this.formHandler; // Add this line
                console.log('Form handler initialized');
            }
            
            // Set up state change listeners
            this.setupStateListeners();

            // Set up keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Set up Generate Report button
            this.setupGenerateReport();

            this.initialized = true;
            console.log('Application initialization complete');

            // Dispatch initialization event
            window.dispatchEvent(new CustomEvent('app-initialized'));
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    // Set up state change listeners
    setupStateListeners() {
        // Listen for form changes
        document.getElementById('evaluationForm')?.addEventListener('change', this.handleStateChange);
        
        // Listen for database changes
        window.addEventListener('storage', (event) => {
            if (event.key === 'evaluationFormData') {
                this.handleStorageChange(event);
            }
        });

        // Listen for template updates
        document.getElementById('clinicalImpressions')?.addEventListener('input', this.handleTemplateEdit);
    }

    // Set up Generate Report button
    setupGenerateReport() {
        const generateButton = document.getElementById('generateReport');
        if (generateButton) {
            generateButton.addEventListener('click', async (event) => {
                event.preventDefault();
                
                try {
                    const formData = this.formHandler.collectFormData();
                    const impressionsField = document.querySelector('#clinicalImpressions textarea');
                    
                    if (impressionsField) {
                        // Generate summary using template engine
                        const summary = await this.templateEngine.generateSummary(formData);
                        impressionsField.value = summary;
                        impressionsField.dispatchEvent(new Event('input')); // Trigger input event to update form state

                        // Store in database
                        await dbManager.storeEvaluation({
                            formData,
                            impression: summary,
                            dateCreated: new Date()
                        });
                    }
                } catch (error) {
                    this.handleError(error);
                }
            });
        }
    }

    // Handle state changes
    handleStateChange(event) {
        if (!this.initialized) return;

        try {
            const element = event.target;
            const sectionId = this.getSectionId(element);

            if (sectionId) {
                this.log(`State change in section: ${sectionId}`);
                this.updateRelatedFields(element);
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    // Update fields related to a change
    updateRelatedFields(changedElement) {
        const relatedFields = this.getRelatedFields(changedElement);
        
        relatedFields.forEach(field => {
            try {
                this.formHandler.handleFieldChange(field);
            } catch (error) {
                this.handleError(error);
            }
        });
    }

    // Get fields related to a changed element
    getRelatedFields(element) {
        const related = new Set();
        const id = element.id;

        // Check for known relationships
        if (id.includes('standard_score')) {
            // Add related severity and percentile fields
            const base = id.split('_')[0];
            related.add(document.getElementById(`${base}_severity`));
            related.add(document.getElementById(`${base}_percentile`));
        }

        return Array.from(related).filter(Boolean);
    }

    // Handle template edits for pattern learning
    handleTemplateEdit = async (event) => {
        try {
            const element = event.target;
            const newContent = element.value;
            const formData = this.formHandler.collectFormData();

            // Store edit for pattern learning
            await dbManager.storeEvaluation({
                formData,
                impression: newContent,
                isUserEdit: true
            });

            this.log('Template edit stored for pattern learning');
        } catch (error) {
            this.handleError(error);
        }
    }

    // Handle storage changes
    handleStorageChange(event) {
        try {
            const newData = JSON.parse(event.newValue);
            if (newData && this.formHandler) {
                this.formHandler.populateForm(newData);
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    // Set up keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + S to save
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                this.formHandler.handleFormSubmission();
            }

            // Ctrl/Cmd + D to toggle debug mode
            if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
                event.preventDefault();
                this.toggleDebug();
            }
        });
    }

    // Toggle debug mode
    toggleDebug() {
        this.debug = !this.debug;
        console.log(`Debug mode: ${this.debug ? 'enabled' : 'disabled'}`);
    }

    // Get section ID for an element
    getSectionId(element) {
        return element.closest('section')?.id;
    }

    // Error handling
    handleError(error) {
        const errorBoundary = document.getElementById('errorBoundary');
        const errorMessage = document.getElementById('errorMessage');
        
        let message;
        
        if (error instanceof Error) {
            message = this.debug ? 
                `Error: ${error.message}\n\nStack: ${error.stack}` :
                'An error occurred. Please try again or contact support if the problem persists.';
        } else if (error instanceof Event && error.reason) {
            message = this.debug ?
                `Error: ${error.reason.message}\n\nStack: ${error.reason.stack}` :
                'An error occurred. Please try again or contact support if the problem persists.';
        } else {
            message = 'An unknown error occurred. Please try again.';
        }

        if (errorBoundary && errorMessage) {
            console.error('Application error:', error);
            errorMessage.textContent = message;
            errorBoundary.classList.add('show');
        } else {
            // Fallback if error boundary elements not found
            alert(message);
        }
        
        // Prevent error from propagating
        if (error instanceof Event) {
            error.preventDefault();
        }
    }

    // Initialize error handling
    initializeErrorHandling() {
        const errorBoundary = document.getElementById('errorBoundary');
        if (errorBoundary) {
            // Hide error boundary on initialization
            errorBoundary.classList.remove('show');
            
            // Add click handler to reload button
            const reloadButton = errorBoundary.querySelector('button');
            if (reloadButton) {
                reloadButton.addEventListener('click', () => {
                    errorBoundary.classList.remove('show');
                    location.reload();
                });
            }
        }
    }

    // Logging utility
    log(message) {
        if (this.debug) {
            console.log(`[${new Date().toISOString()}] ${message}`);
        }
    }
}

// Initialize application when DOM is ready
let app;

function initApp() {
    if (!app) {
        app = new ApplicationManager();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => app.initialize());
        } else {
            app.initialize();
        }
    }
}

initApp();

// Export for use in other modules
export default app;