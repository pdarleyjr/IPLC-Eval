document.addEventListener('DOMContentLoaded', () => {
    // File upload handling
    setupFileUpload();
    
    // Form animations
    setupFormAnimations();
    
    // Test score section animations
    setupTestScoreAnimations();
    
    // Tab switching animations
    setupTabAnimations();
});

function setupFileUpload() {
    const fileUpload = document.getElementById('fileUpload');
    if (fileUpload) {
        const fileInput = fileUpload.querySelector('input[type="file"]');
        const fileList = document.getElementById('uploadedFiles');

        if (fileInput && fileList) {
            fileUpload.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', () => {
                Array.from(fileInput.files).forEach(file => {
                    const item = document.createElement('div');
                    item.className = 'uploaded-file';
                    item.innerHTML = `
                        <span>${file.name}</span>
                        <button type="button" class="remove-file-btn">&times;</button>
                    `;

                    item.querySelector('.remove-file-btn').addEventListener('click', () => {
                        item.classList.add('removing');
                        setTimeout(() => item.remove(), 300);
                    });

                    item.style.opacity = '0';
                    fileList.appendChild(item);
                    requestAnimationFrame(() => item.style.opacity = '1');
                });
            });
        }
    }
}

function setupFormAnimations() {
    // Form field focus animations
    document.querySelectorAll('.form-input, select, textarea').forEach(field => {
        field.addEventListener('focus', () => {
            field.closest('.form-field')?.classList.add('focused');
        });
        
        field.addEventListener('blur', () => {
            field.closest('.form-field')?.classList.remove('focused');
        });
    });

    // Checkbox and radio animations
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
        input.addEventListener('change', () => {
            const label = input.closest('label');
            if (label) {
                label.classList.add('pulse');
                setTimeout(() => label.classList.remove('pulse'), 500);
            }
        });
    });
}

function setupTestScoreAnimations() {
    // Test score section transitions
    const testScoreSections = document.querySelectorAll('.test-score-section');
    
    function showSection(section) {
        section.style.display = 'block';
        section.style.opacity = '0';
        section.style.transform = 'translateY(10px)';
        
        requestAnimationFrame(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        });
    }
    
    function hideSection(section) {
        section.style.opacity = '0';
        section.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            section.style.display = 'none';
        }, 300);
    }

    // Observe assessment tool checkboxes
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const section = mutation.target;
                if (section.style.display === 'block') {
                    showSection(section);
                } else if (section.style.display === 'none') {
                    hideSection(section);
                }
            }
        });
    });

    testScoreSections.forEach(section => {
        observer.observe(section, { attributes: true });
    });
}

function setupTabAnimations() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    
    // Add ripple effect to tab buttons
    tabs.forEach(tab => {
        tab.addEventListener('click', e => {
            const rect = tab.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            tab.appendChild(ripple);
            setTimeout(() => ripple.remove(), 1000);
        });
    });

    // Smooth panel transitions
    function switchPanel(oldPanel, newPanel) {
        if (oldPanel) {
            oldPanel.style.opacity = '0';
            oldPanel.style.transform = 'translateY(10px)';
            setTimeout(() => {
                oldPanel.style.display = 'none';
                showNewPanel();
            }, 300);
        } else {
            showNewPanel();
        }

        function showNewPanel() {
            newPanel.style.display = 'block';
            newPanel.style.opacity = '0';
            newPanel.style.transform = 'translateY(10px)';
            
            requestAnimationFrame(() => {
                newPanel.style.opacity = '1';
                newPanel.style.transform = 'translateY(0)';
            });
        }
    }

    // Observe tab panel changes
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const panel = mutation.target;
                if (panel.classList.contains('active')) {
                    const oldPanel = Array.from(panels)
                        .find(p => p !== panel && p.style.display !== 'none');
                    switchPanel(oldPanel, panel);
                }
            }
        });
    });

    panels.forEach(panel => {
        observer.observe(panel, { attributes: true });
    });
}
