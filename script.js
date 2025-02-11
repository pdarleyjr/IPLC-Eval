import APILLMHub from 'https://amanpriyanshu.github.io/API-LLM-Hub/unified-llm-api.js';

// URL of the PDF file
const pdfUrl = 'Articulation Evaluation Results Template.pdf';

// Loaded via <script> tag, create shortcut to access PDF.js exports.
const pdfjsLib = window['pdfjs-dist/build/pdf'];

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1.5;

const renderPage = (num)  =>{
    pageRendering = true;
    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({scale: scale});
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match the viewport
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        // Wait for rendering to finish
        renderTask.promise.then(function() {
            pageRendering = false;
            if (pageNumPending !== null) {
                // New page rendering is pending
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });

        // Append the canvas to the viewer
        const viewer = document.getElementById('pdf-viewer');
        viewer.innerHTML = '';
        viewer.appendChild(canvas);

        // Embed the actual PDF for form interactivity
        const embed = document.createElement('embed');
        embed.src = pdfUrl + '#toolbar=1&navpanes=0&scrollbar=0';
        embed.type = 'application/pdf';
        embed.style.width = '100%';
        embed.style.height = '100%';
        embed.style.position = 'absolute';
        embed.style.top = '0';
        embed.style.left = '0';
        viewer.appendChild(embed);
    });
}

const loadPDF = async () => {
    try {
        pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
        renderPage(pageNum);
    } catch (error) {
        console.error('Error loading PDF:', error);
        const viewer = document.getElementById('pdf-viewer');
        viewer.innerHTML = '<p>Error loading PDF. Please try again later.</p>';
    }
};

// Add favicon
const link = document.createElement('link');
link.rel = 'icon';
link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📄</text></svg>';
document.head.appendChild(link);

// AI Narrative Generation
const generateButton = document.getElementById('generate-ai-narrative');
const aiOutput = document.getElementById('ai-output');
const aiSummary = document.getElementById('ai-summary');

let ai;
const API_KEY_STORAGE_KEY = 'openai_api_key';

const sanitizeString = (str) => {
    return str.replace(/[^\x00-\x7F]/g, "");
}

const handleApiError = (error) => {
    console.error('API Error:', error);
    if (error.message.includes('API key')) {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        alert('Invalid API key. Please try again with a valid OpenAI API key.');
    } else {
        alert(`Failed to initialize AI: ${error.message}. Please check the console for more details and try again.`);
    }
}

const initializeAI = async () => {
    try {
        let apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        
        if (!apiKey) {
            apiKey = prompt("Please enter your OpenAI API key:");
            if (apiKey) {
                localStorage.setItem(API_KEY_STORAGE_KEY, sanitizeString(apiKey));
            } else {
                throw new Error('API key is required');
            }
        }
        
        ai = new APILLMHub({
            provider: 'openai',
            apiKey: sanitizeString(apiKey),
            model: 'gpt-3.5-turbo-0125'
        });
        
        await ai.initialize();
        console.log("AI initialized successfully");
    } catch (error) {
        handleApiError(error);
        
        // Retry initialization
        const retry = confirm('Would you like to try initializing AI again?');
        if (retry) {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
            ai = null;
            await initializeAI();
        }
    }
}

const handleGenerateClick = () => {
    if (!ai) {
        initializeAI().then(generateAINarrative).catch(error => console.error('Failed to initialize AI:', error));
    } else {
        generateAINarrative();
    }
};

const generateAINarrative = async () => {
    try {
        const formData = await getFormData();
        const prompt = `Summarize the following articulation evaluation data:\n\n${JSON.stringify(formData, null, 2)}\n\nProvide a concise summary of the patient's articulation abilities based on this data.`;

        const response = await ai.sendMessage(sanitizeString(prompt));
        const summary = response.trim();
        
        if (!summary) {
            throw new Error('No response received from AI');
        }
        console.log('AI response received:', summary);

        aiSummary.value = summary;
        aiOutput.style.display = 'block';
    } catch (error) {
        handleApiError(error);
        await initializeAI();
    }
}



const getFormData = async () => {
    const formData = {};
    try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
   
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); // Assuming form fields are on the first page
        const annotations = await page.getAnnotations();
        
        for (const annotation of annotations) {
            if (annotation.fieldType === 'Tx' || annotation.fieldType === 'Ch' || annotation.fieldType === 'Btn') {
                formData[annotation.fieldName] = annotation.fieldValue;
            }
        }
    } catch (error) {
        console.error('Error extracting form data:', error);
    }
    return formData;
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadPDF();
    generateButton.addEventListener('click', handleGenerateClick);
});