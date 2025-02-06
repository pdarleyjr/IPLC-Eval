// Dark mode handling
const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Custom template handling
const customTemplateInput = document.getElementById('customTemplateInput');
const customTemplateName = document.getElementById('customTemplateName');
const saveCustomTemplate = document.getElementById('saveCustomTemplate');
const templateOptions = document.querySelector('.template-options');

// Load custom templates from localStorage
function loadCustomTemplates() {
  const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
  customTemplates.forEach((template) => {
    addCustomTemplateOption(template);
  });
}

// Add custom template option to the list
function addCustomTemplateOption(templateName) {
  const label = document.createElement('label');
  label.className = 'template-option';
  label.innerHTML = `
    <input type="radio" name="templateType" value="${templateName}">
    <span class="template-label">
      <span class="template-icon">📝</span>
      ${templateName}
    </span>
  `;

  // Insert before the "Other" option
  const otherOption = document.querySelector('input[value="other"]').parentElement;
  templateOptions.insertBefore(label, otherOption);
}

// Sync evaluation type with template selection
const evaluationTypeSelect = document.getElementById('evaluationType');

// Update evaluation type dropdown options
function updateEvaluationTypeOptions() {
  // Get all template radio buttons
  const templateRadios = document.querySelectorAll('input[name="templateType"]');
  const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');

  // Clear existing options except the first one
  while (evaluationTypeSelect.options.length > 1) {
    evaluationTypeSelect.remove(1);
  }

  // Add options from template radios
  templateRadios.forEach((radio) => {
    if (radio.value !== 'other') {
      const label = radio.parentElement.querySelector('.template-label').textContent.trim();
      const option = new Option(label, label);
      evaluationTypeSelect.add(option);
    }
  });

  // Add custom templates
  customTemplates.forEach((template) => {
    const option = new Option(template, template);
    evaluationTypeSelect.add(option);
  });
}

// Handle template type selection
document.querySelectorAll('input[name="templateType"]').forEach((radio) => {
  radio.addEventListener('change', (e) => {
    customTemplateInput.style.display = e.target.value === 'other' ? 'block' : 'none';
    if (e.target.value !== 'other') {
      const label = e.target.parentElement.querySelector('.template-label').textContent.trim();
      evaluationTypeSelect.value = label;
    }
  });
});

// Handle saving custom template
saveCustomTemplate.addEventListener('click', () => {
  const templateName = customTemplateName.value.trim();
  if (templateName) {
    // Save to localStorage
    const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
    if (!customTemplates.includes(templateName)) {
      customTemplates.push(templateName);
      localStorage.setItem('customTemplates', JSON.stringify(customTemplates));

      // Add to options
      addCustomTemplateOption(templateName);

      // Update evaluation type dropdown
      updateEvaluationTypeOptions();

      // Select the new template and update evaluation type
      const newTemplateRadio = document.querySelector(`input[value="${templateName}"]`);
      if (newTemplateRadio) {
        newTemplateRadio.checked = true;
        evaluationTypeSelect.value = templateName;
      }

      // Clear and hide input
      customTemplateName.value = '';
      customTemplateInput.style.display = 'none';

      showMessage('Custom template added successfully!', 'success');
    } else {
      showMessage('This template name already exists', 'error');
    }
  } else {
    showMessage('Please enter a template name', 'error');
  }
});

// Initialize theme
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.dataset.theme = savedTheme;
  } else if (prefersDarkScheme.matches) {
    document.body.dataset.theme = 'dark';
  }
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  const isDark = document.body.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

themeToggle.addEventListener('click', () => {
  const isDark = document.body.dataset.theme === 'dark';
  document.body.dataset.theme = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', document.body.dataset.theme);
  updateThemeToggleIcon();
});

// Progress bar handling
const progressBar = document.querySelector('.progress');
let currentProgress = 0;
const sections = document.querySelectorAll('.section');
const totalSections = sections.length;

function updateProgress() {
  const filledSections = Array.from(sections).filter((section) => {
    const inputs = section.querySelectorAll('input, select, textarea');
    return Array.from(inputs).some((input) => input.value);
  }).length;

  currentProgress = (filledSections / totalSections) * 100;
  progressBar.style.width = `${currentProgress}%`;
}

// Tab handling with enhanced animations
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.section');

function switchTab(targetTab) {
  const targetPanel = document.getElementById(targetTab);

  // Update tab buttons
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === targetTab;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', isActive);
  });

  // Animate out current panel
  const currentPanel = document.querySelector('.section.active');
  if (currentPanel) {
    currentPanel.style.animation = 'fadeOut 150ms ease forwards';
  }

  // Animate in new panel
  setTimeout(() => {
    tabPanels.forEach((panel) => panel.classList.remove('active'));
    targetPanel.classList.add('active');
    targetPanel.style.animation = 'fadeIn 150ms ease forwards';
  }, 150);
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    switchTab(button.dataset.tab);
  });
});

// Form handling with enhanced validation
const form = document.getElementById('evaluationForm');
const summaryPreview = document.getElementById('summaryPreview');
const generatedSummary = document.getElementById('generatedSummary');

// Age calculation with animation
const dobInput = document.getElementById('dob');
const ageInput = document.getElementById('age');

dobInput.addEventListener('change', () => {
  if (dobInput.value) {
    const dob = new Date(dobInput.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    // Animate age update
    ageInput.style.animation = 'none';
    ageInput.value = `${age} years`;
    ageInput.style.animation = 'fadeIn 300ms ease';
  }
});

// Enhanced form validation with visual feedback
function validateForm() {
  let isValid = true;
  const requiredInputs = form.querySelectorAll('[required]');

  requiredInputs.forEach((input) => {
    if (!input.value) {
      isValid = false;
      showError(input);
    } else {
      clearError(input);
    }
  });

  return isValid;
}

function showError(input) {
  input.classList.add('error');
  const errorMessage = document.createElement('div');
  errorMessage.className = 'error-message';
  errorMessage.textContent = 'This field is required';
  errorMessage.style.animation = 'slideInRight 300ms ease';

  // Remove existing error message if any
  const existingError = input.parentElement.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }

  input.parentElement.appendChild(errorMessage);

  // Cleanup after animation
  setTimeout(() => {
    errorMessage.remove();
  }, 3000);
}

function clearError(input) {
  input.classList.remove('error');
  const errorMessage = input.parentElement.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.remove();
  }
}

// Enhanced form submission with animation
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    showMessage('Please fill in all required fields', 'error');
    return;
  }

  // Show loading state
  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  submitButton.innerHTML = '<span class="spinner"></span> Saving...';
  submitButton.disabled = true;

  try {
    // Simulate API call
    await new Promise((resolve) => {
      setTimeout(() => resolve(), 1000);
    });

    showMessage('Evaluation saved successfully!', 'success');
    updateProgress();
  } catch (error) {
    showMessage('Error saving evaluation', 'error');
  } finally {
    submitButton.innerHTML = originalText;
    submitButton.disabled = false;
  }
});

// Enhanced message display
function showMessage(text, type = 'info') {
  const message = document.createElement('div');
  message.className = `${type}-message`;
  message.textContent = text;
  document.body.appendChild(message);

  // Animate in
  requestAnimationFrame(() => {
    message.style.animation = 'slideInRight 300ms ease';
  });

  // Animate out and remove
  setTimeout(() => {
    message.style.animation = 'slideOutRight 300ms ease';
    setTimeout(() => message.remove(), 300);
  }, 3000);
}

// Print and PDF functionality with preview
document.getElementById('printBtn').addEventListener('click', async () => {
  // Extract header information from form data
  const headerInfo = {
    name: document.getElementById('name')?.value || '',
    dob: document.getElementById('dob')?.value || '',
    age: document.getElementById('age')?.value || '',
    evaluationDate: document.getElementById('evaluationDate')?.value || '',
    examiner: document.getElementById('examiner')?.value || '',
    placeOfEvaluation: document.getElementById('placeOfEvaluation')?.value || '',
  };

  // Get evaluation type
  const selectedTemplate = document.querySelector('input[name="templateType"]:checked');
  const evaluationType = selectedTemplate
    ? selectedTemplate.parentElement.querySelector('.template-label').textContent.trim() : '';

  // Add header information to each section
  sections.forEach((section) => {
    const headerDiv = document.createElement('div');
    headerDiv.className = 'evaluation-header';
    headerDiv.innerHTML = `
      <h1>${evaluationType}</h1>
      <div class="header-info">
        <p><strong>Name:</strong> ${headerInfo.name}</p>
        <p><strong>Date of Birth:</strong> ${headerInfo.dob}</p>
        <p><strong>Age:</strong> ${headerInfo.age}</p>
        <p><strong>Evaluation Date:</strong> ${headerInfo.evaluationDate}</p>
        <p><strong>Examiner:</strong> ${headerInfo.examiner}</p>
        <p><strong>Place of Evaluation:</strong> ${headerInfo.placeOfEvaluation}</p>
      </div>
    `;

    // Insert header at the beginning of each section
    section.insertBefore(headerDiv, section.firstChild);
  });

  // Add print preview class
  document.body.classList.add('print-preview');

  // Show all sections for printing
  sections.forEach((section) => {
    section.style.display = 'block';
  });

  // Print/Save as PDF
  window.print();

  // Clean up after print
  document.body.classList.remove('print-preview');
  sections.forEach((section) => {
    section.style.display = '';
    // Remove the added headers
    const header = section.querySelector('.evaluation-header');
    if (header) {
      section.removeChild(header);
    }
  });
});

// Generate summary functionality
const generateButtons = document.querySelectorAll('.btn-generate-summary');

generateButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const { section } = button.dataset;
    const sectionElement = document.querySelector(`#${section}`);

    // Show loading state
    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = '<span class="spinner"></span> Generating...';

    try {
      // Generate base summary
      const baseSummary = section === 'outcome' ? generateOutcomeSummary(section) : generateSectionSummary(section);

      // Show initial summary with loading indicator
      const summaryElement = sectionElement.querySelector('.section-summary');
      summaryElement.innerHTML = `
        <div class="summary-content">${baseSummary}</div>
        <div class="summary-enhancement">
          <span class="spinner"></span>
          <span>Enhancing summary with AI...</span>
        </div>
      `;
      summaryElement.style.display = 'block';

      // Update preview with base summary initially
      summaryPreview.classList.add('has-content');
      const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
      generatedSummary.textContent = generatedSummary.textContent.replace(new RegExp(`${sectionTitle}:.*(?:\n|$)`), '');
      generatedSummary.textContent += `\n${sectionTitle}: ${baseSummary}`;

      // Enhance summary with AI
      try {
        const enhancedSummary = await enhanceSummaryWithAI(baseSummary, section);

        // Update with enhanced summary
        summaryElement.innerHTML = `<div class="summary-content">${enhancedSummary}</div>`;

        // Update preview with enhanced version
        generatedSummary.textContent = generatedSummary.textContent.replace(new RegExp(`${sectionTitle}:.*(?:\n|$)`), '');
        generatedSummary.textContent += `\n${sectionTitle}: ${enhancedSummary}`;
      } catch (error) {
        // If AI enhancement fails, keep base summary
        summaryElement.innerHTML = `
          <div class="summary-content">${baseSummary}</div>
          <div class="summary-error">
            <small>AI enhancement unavailable. Showing base summary.</small>
          </div>
        `;
        showMessage('AI enhancement unavailable. Using base summary.', 'warning');
      }
    } catch (error) {
      showMessage('Error generating summary', 'error');
    } finally {
      button.innerHTML = originalText;
      button.disabled = false;
    }
  });
});

// Generate meaningful summaries
function generateSectionSummary(section) {
  const selectedTemplate = document.querySelector('input[name="templateType"]:checked').value;

  // Special handling for Impressions tab
  if (section === 'impressions') {
    return generateImpressionsSummary();
  }

  const summaryParts = [];

  // Collect all input values dynamically
  const inputs = document.querySelectorAll(`#${section} input:not([type="radio"]):not([type="submit"]), #${section} select, #${section} input[type="radio"]:checked, #${section} input[type="checkbox"]:checked`);
  inputs.forEach((input) => {
    if (input.value) {
      if (input.type === 'checkbox') {
        const label = input.parentElement.querySelector('.checkbox-label');
        if (label) {
          summaryParts.push(label.textContent);
        }
      } else {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) {
          // Special handling for educational background
          if (input.name === 'educationalBackground') {
            summaryParts.push(`Educational Status: ${input.value === 'specialEd' ? 'Special Education' : input.value}`);
          } else {
            summaryParts.push(`${label.textContent}: ${input.value}`);
          }
        }
      }
    }
  });

  // Group related information by category
  const summaryCategories = {
    'Medical History': [],
    'Birth History': [],
    Development: [],
    'Current Status': [],
  };

  // Categorize each part into appropriate category
  summaryParts.forEach((part) => {
    if (part.toLowerCase().includes('medical') || part.toLowerCase().includes('history')) {
      summaryCategories['Medical History'].push(part);
    } else if (part.toLowerCase().includes('birth') || part.toLowerCase().includes('nicu')) {
      summaryCategories['Birth History'].push(part);
    } else if (part.toLowerCase().includes('development') || part.toLowerCase().includes('delay')) {
      summaryCategories.Development.push(part);
    } else {
      summaryCategories['Current Status'].push(part);
    }
  });

  // Format each category
  const formattedSections = Object.entries(summaryCategories)
    .filter(([_, items]) => items.length > 0)
    .map(([title, items]) => `${title}: ${items.join('; ')}`)
    .join('. ');

  return formattedSections || 'No data entered';
}

// Helper functions for outcome summary generation
function getPerformanceLevel(value) {
  const levels = ['Significantly Below Age Level', 'Below Age Level', 'Approaching Age Level', 'At Age Level', 'Above Age Level'];
  return levels[parseInt(value, 10) - 1] || 'Not Assessed';
}

function getTurnTakingRating(value) {
  const ratings = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Excellent',
  };
  const numericValue = parseInt(value, 10);
  return ratings[numericValue] || 'Not Assessed';
}

function getTestClassification(percentile) {
  const percent = parseInt(percentile, 10);
  if (isNaN(percent)) return 'Not Available';
  if (percent >= 90) return 'Above Average';
  if (percent >= 25) return 'Average';
  if (percent >= 10) return 'Below Average';
  return 'Significantly Below Average';
}

// Generate outcome summary with specified template
function generateOutcomeSummary(section) {
  // Get evaluation type from template selector
  const templateType = document.querySelector('input[name="templateType"]:checked');
  const evaluationType = templateType ? templateType.parentElement.querySelector('.template-label').textContent.trim() : '';

  // Get outcome based on diagnosis and severity
  const diagnosis = document.getElementById('diagnosis').value;
  const severityLabel = document.getElementById('severityLabel').textContent;
  const outcomeOfEvaluation = diagnosis ? `${severityLabel} ${diagnosis}` : 'Evaluation completed';

  // Get test information from instrumentation tab
  const selectedTests = Array.from(document.querySelectorAll('input[name="assessmentTools"]:checked'))
    .map((input) => input.parentElement.querySelector('.checkbox-label').textContent.trim());
  const testName = selectedTests.length > 0 ? selectedTests[0] : '';

  // Collect data from outcome tab and other sections
  const data = {
    evaluationType,
    outcomeOfEvaluation,
    standardScore: document.querySelector('#standardScore')?.value || 'Not Available',
    percentileRank: document.querySelector('#percentileRank')?.value || 'Not Available',
    receptiveLanguage: getPerformanceLevel(document.querySelector('input[name="receptiveLanguage"]')?.value),
    expressiveLanguage: getPerformanceLevel(document.querySelector('input[name="expressiveLanguage"]')?.value),
    mlu: document.querySelector('input[name="mlu"]')?.value || 'Not Available',
    ttr: document.querySelector('input[name="ttr"]')?.value || 'Not Available',
    turnTakingRating: getTurnTakingRating(document.querySelector('select[name="turnTaking"]')?.value),
    testName,
    testScore: document.querySelector('#standardScore')?.value || 'Not Available',
    testClassification: getTestClassification(document.querySelector('#percentileRank')?.value),
  };

  // Generate summary using template
  return `During this evaluation for ${data.evaluationType}, the primary outcome was identified as ${data.outcomeOfEvaluation}. A comprehensive battery of assessments—combining standardized measures and functional observations—was administered to determine the client's current level of functioning. Test scores indicated a Standard Score of ${data.standardScore} and a Percentile Rank of ${data.percentileRank}, suggesting how the client's performance compares to age-matched peers.

Performance Analysis revealed that the client's Receptive Language abilities are at a ${data.receptiveLanguage} level, while Expressive Language skills were observed to be at a ${data.expressiveLanguage} level. To gain further insight into the client's communication profile, a Language Sample Analysis was conducted. The client's Mean Length of Utterance (MLU) is ${data.mlu}, and the Type-Token Ratio (TTR) is ${data.ttr}, providing valuable information about syntactic complexity and lexical diversity.

Regarding pragmatic skills, the Turn-Taking rating was ${data.turnTakingRating}, indicating potential strengths or needs in social interaction. In addition, Standardized Test Results from ${data.testName} yielded a Score of ${data.testScore}, classified as ${data.testClassification}, helping further characterize the client's developmental profile.

Overall, these findings will guide the development of an individualized plan of care. Specific recommendations—based on the client's ${data.evaluationType} focus and test outcomes—may include targeted interventions, collaborative efforts with educational teams or caregivers, and ongoing progress monitoring. By addressing the areas of need identified in this assessment, the client can be supported in achieving functional goals across daily environments.`;
}

// Initialize Universal Sentence Encoder
let useModel = null;

// Function to load USE model
async function loadUSE() {
  try {
    if (typeof window.tf === 'undefined') {
      throw new Error('TensorFlow.js is not loaded');
    }
    useModel = await window.use.load();
    console.log('Universal Sentence Encoder loaded successfully');
  } catch (error) {
    console.error('Error loading Universal Sentence Encoder:', error);
  }
}

// Function to preprocess text using USE
async function preprocessText(text) {
  if (!useModel) {
    console.warn('USE model not loaded yet');
    return text;
  }
  try {
    const embeddings = await useModel.embed([text]);
    return embeddings.arraySync()[0];
  } catch (error) {
    console.error('Error preprocessing text:', error);
    return text;
  }
}

// Split text into chunks using array methods
function splitIntoChunks(text, maxLength = 500) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.reduce((chunks, sentence) => {
    const lastChunk = chunks[chunks.length - 1] || '';
    if ((lastChunk + sentence).length <= maxLength) {
      chunks[chunks.length - 1] = (lastChunk + sentence).trim();
    } else {
      chunks.push(sentence.trim());
    }
    return chunks;
  }, ['']);
}

// Initialize USE and custom templates when scripts are loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme
  initializeTheme();

  // Initialize custom templates and evaluation types
  loadCustomTemplates();
  updateEvaluationTypeOptions();

  // Initialize USE
  const maxWaitTime = 10000; // 10 seconds
  const checkInterval = 100; // 100ms
  let elapsed = 0;

  const checkScripts = setInterval(() => {
    if (window.tf && window.use) {
      clearInterval(checkScripts);
      loadUSE();
    }
    elapsed += checkInterval;
    if (elapsed >= maxWaitTime) {
      clearInterval(checkScripts);
      console.warn('Timeout waiting for TensorFlow.js and USE to load');
    }
  }, checkInterval);
});

// Merge summaries using USE embeddings for coherence
async function mergeSummaries(summaries) {
  // Get embeddings for all summaries
  const embeddings = await useModel.embed(summaries);
  const vectors = embeddings.arraySync();

  // Sort summaries by similarity to maintain flow
  const orderedSummaries = summaries.map((text, i) => ({
    text,
    vector: vectors[i],
  }));

  // Order summaries by similarity
  orderedSummaries.sort((a, b) => {
    const similarityA = cosineSimilarity(vectors[0], a.vector);
    const similarityB = cosineSimilarity(vectors[0], b.vector);
    return similarityB - similarityA;
  });

  // Join ordered summaries with proper transitions
  return orderedSummaries.map((s) => s.text).join(' ');
}

// Cosine similarity helper
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Generate impressions summary using the provided template
function generateImpressionsSummary() {
  // Get evaluation type from template selector
  const templateType = document.querySelector('input[name="templateType"]:checked');
  const evaluationType = templateType ? templateType.parentElement.querySelector('.template-label').textContent.trim() : '';

  // Get areas of strength and need from checkboxes
  const strengthAreas = Array.from(document.querySelectorAll('input[name="strengths"]:checked'))
    .map((input) => input.parentElement.querySelector('.checkbox-label').textContent.trim())
    .join(', ');

  const needAreas = Array.from(document.querySelectorAll('input[name="needs"]:checked'))
    .map((input) => input.parentElement.querySelector('.checkbox-label').textContent.trim())
    .join(', ');

  // Get clinical diagnosis
  const diagnosis = document.getElementById('diagnosis')?.value || '';
  const severityLevel = document.getElementById('severityLevel')?.value || '';

  // Get impact ratings
  const academicImpact = document.getElementById('academicImpact')?.value || '';
  const socialImpact = document.getElementById('socialImpact')?.value || '';

  // Apply the template
  return `This evaluation, focusing on ${evaluationType}, highlights the client's strengths in ${strengthAreas} and identifies notable needs in ${needAreas}. These findings suggest a pattern of strengths in specific skill areas, while concurrently indicating targeted domains that warrant intervention or continued monitoring.

A Clinical Diagnosis of ${diagnosis} has been selected based on both formal and informal assessment data. The Severity Level of these identified needs is rated as ${severityLevel}, reflecting the degree to which skill deficits may impact overall functioning.

In terms of Impact on Daily Function, the Academic Impact is described as ${academicImpact}, while the Social Impact is rated as ${socialImpact}. These ratings provide an indication of how the client's areas of need may affect participation and success in educational, social, or other daily contexts.

Overall, these clinical impressions confirm that while the client demonstrates notable strengths in ${strengthAreas}, intervention strategies should focus on improving ${needAreas} to support functional growth. The severity rating of ${severityLevel} and the subsequent impact levels will guide the development of an individualized care plan, which may involve additional assessment, consultation, or collaborative efforts with the educational team and caregivers. By addressing these identified domains, the client can build upon existing strengths and work toward achieving greater independence and success.`;
}

// Enhanced AI summary generation
async function enhanceSummaryWithAI(baseSummary) {
  try {
    // Get evaluation type
    const selectedTemplate = document.querySelector('input[name="templateType"]:checked');
    const evaluationType = selectedTemplate ? selectedTemplate.parentElement.querySelector('.template-label').textContent.trim() : '';

    // Get medical history
    const medicalHistorySelect = document.getElementById('medicalHistory');
    const medicalHistory = medicalHistorySelect ? medicalHistorySelect.value : '';

    // Get educational background
    const educationalBackgroundSelect = document.getElementById('educationalBackground');
    const educationalBackground = educationalBackgroundSelect ? educationalBackgroundSelect.value : '';

    // Get birth history
    const birthHistoryChecks = document.querySelectorAll('input[name="birthHistory"]:checked');
    const birthHistory = Array.from(birthHistoryChecks).map((check) => check.parentElement.querySelector('.checkbox-label').textContent).join(', ');

    // Get family history
    const familyHistoryRadio = document.querySelector('input[name="familyHistorySpeech"]:checked');
    const familyHistory = familyHistoryRadio ? familyHistoryRadio.value : '';

    // Get previous services
    const previousServicesChecks = document.querySelectorAll('input[name="previousServices"]:checked');
    const previousServices = Array.from(previousServicesChecks).map((check) => check.parentElement.querySelector('.checkbox-label').textContent).join(', ');

    // Get current concerns
    const currentConcernsSelect = document.getElementById('currentConcerns');
    const currentConcerns = Array.from(currentConcernsSelect.selectedOptions).map((option) => option.text).join(', ');

    // Get parent input
    const parentInput = document.getElementById('parentInput').value;

    // Apply the template
    return `This ${evaluationType} evaluation was initiated to gather comprehensive background information about the client's developmental, educational, and medical history. According to the records provided, the client's Medical History is described as ${medicalHistory}. Educationally, the client is noted to have a background in ${educationalBackground || 'mainstream education'}.

Regarding birth and early development, the client's history includes ${birthHistory || 'no reported complications'}, which may have implications for current functional or developmental abilities. Family history indicates ${familyHistory === 'yes' ? 'a positive history' : 'no history'} for speech-language disorders, suggesting potential genetic or environmental factors that could contribute to the client's current presentation.

Previous services and evaluations include ${previousServices || 'no previous therapeutic interventions'}, reflecting a history of interventions designed to address developmental or functional concerns. At present, the client's Current Concerns focus on ${currentConcerns || 'areas to be determined through comprehensive evaluation'}. Further input from the parent or caregiver indicates ${parentInput || 'no additional concerns were reported'}, which provides additional context about the client's daily experiences and perceived challenges.

These background details help inform a holistic perspective on the client's developmental profile, guiding the selection of appropriate assessments and interventions. By considering medical, educational, familial, and therapeutic factors, the evaluation process can be tailored to effectively address the client's needs and support meaningful progress across domains of functioning.`;
  } catch (error) {
    console.error('AI enhancement error:', error);
    throw error;
  }
}

// Handle system theme changes
