// NLP and text analysis functionality
class NLPManager {
    constructor() {
        this.model = null;
        this.tokenizer = null;
        this.initialized = false;
        this.initializeTensorFlow();
    }

    async initializeTensorFlow() {
        try {
            // Load TensorFlow.js and required models
            await this.loadTensorFlowJS();
            this.initialized = true;
            console.log('TensorFlow.js initialized successfully');
        } catch (error) {
            console.error('Error initializing TensorFlow.js:', error);
            throw new Error('Failed to initialize TensorFlow.js: ' + error.message);
        }
    }

    async loadTensorFlowJS() {
        try {
            // Load TensorFlow.js Universal Sentence Encoder
            this.model = await tf.loadGraphModel('https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1', { fromTFHub: true });
            console.log('USE model loaded successfully');
            
            // Initialize tokenizer for text processing
            this.tokenizer = new TextEncoder();
        } catch (error) {
            console.error('Error loading USE model:', error);
            throw new Error('Failed to load Universal Sentence Encoder: ' + error.message);
        }
    }

    async analyzeSentiment(text) {
        if (!this.initialized || !this.model) {
            throw new Error('NLP Manager not properly initialized');
        }

        try {
            // Get embeddings using USE
            const embeddings = await this.model.embed([text]);
            const embeddingArray = await embeddings.array();
            
            // Simple sentiment analysis based on embeddings
            // This is a basic implementation - could be enhanced with a proper sentiment classifier
            const avgEmbedding = embeddingArray[0].reduce((a, b) => a + b, 0) / embeddingArray[0].length;
            
            return {
                score: avgEmbedding,
                label: avgEmbedding > 0 ? 'positive' : 'negative'
            };
        } catch (error) {
            console.error('Error analyzing sentiment:', error);
            return { score: 0, label: 'neutral' };
        }
    }

    async recognizeEntities(text) {
        if (!this.initialized) {
            throw new Error('NLP Manager not properly initialized');
        }

        try {
            // Basic entity recognition for common patterns
            const entities = {
                dates: text.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g) || [],
                ages: text.match(/\b\d+\s+(?:year|month)s?\s+old\b/gi) || [],
                measurements: text.match(/\b\d+(?:\.\d+)?\s*(?:cm|mm|in|kg|lb|g|oz)\b/gi) || [],
                medical: text.match(/\b(?:diagnosis|treatment|therapy|medication)\b/gi) || []
            };

            return entities;
        } catch (error) {
            console.error('Error recognizing entities:', error);
            return {};
        }
    }

    checkGrammarAndPunctuation(text) {
        try {
            const corrections = [];
            
            // Basic grammar checks
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
            sentences.forEach(sentence => {
                // Check for capitalization at start of sentence
                if (!/^\s*[A-Z]/.test(sentence)) {
                    corrections.push({
                        type: 'capitalization',
                        text: sentence.trim(),
                        suggestion: sentence.trim().charAt(0).toUpperCase() + sentence.trim().slice(1)
                    });
                }
                
                // Check for double spaces
                if (/\s{2,}/.test(sentence)) {
                    corrections.push({
                        type: 'spacing',
                        text: sentence.trim(),
                        suggestion: sentence.trim().replace(/\s+/g, ' ')
                    });
                }
                
                // Check for missing spaces after punctuation
                if (/[.!?,][a-zA-Z]/.test(sentence)) {
                    corrections.push({
                        type: 'punctuation',
                        text: sentence.trim(),
                        suggestion: sentence.trim().replace(/([.!?,])([a-zA-Z])/g, '$1 $2')
                    });
                }
            });

            return corrections;
        } catch (error) {
            console.error('Error checking grammar:', error);
            return [];
        }
    }

    async analyzeText(text) {
        if (!this.initialized) {
            console.warn('NLP Manager not initialized');
            return text;
        }

        try {
            // Basic text cleanup
            text = text.trim()
                .replace(/\s+/g, ' ')
                .replace(/([.!?])\s*(?=[A-Z])/g, '$1 ');

            // Enhanced text analysis with sentiment and entity recognition
            const sentiment = await this.analyzeSentiment(text);
            const entities = await this.recognizeEntities(text);
            
            // Integrate grammar and punctuation checking
            const grammarCorrections = this.checkGrammarAndPunctuation(text);
            
            console.log('Analysis Results:', {
                sentiment,
                entities,
                grammarCorrections
            });
            
            // Get embeddings for potential future use
            const embeddings = await this.model.embed([text]);
            
            return {
                text,
                analysis: {
                    sentiment,
                    entities,
                    grammarCorrections
                }
            };
        } catch (error) {
            console.error('Error analyzing text:', error);
            return { text, analysis: null };
        }
    }

    generateEvaluation(formData) {
        const template = `Client Information:

[Client's first name], a [Age] [Gender], was seen for an initial [Evaluation Type: Speech-Language/Occupational Therapy] evaluation at [Place of Evaluation]. This evaluation was conducted to assess [Client's first name]'s strengths and challenges in areas crucial for their [speech/language/motor development, sensory processing, or other relevant domains] to support their daily functioning and overall growth.

Background Information:

Birth History: [Remarkable/Unremarkable]
    Length of Pregnancy: [Length of Pregnancy]
    Type of Delivery: [Type of Delivery]
    Additional Notes: [Additional Notes]

Medical History: [Remarkable/Unremarkable]
    Current Medical Conditions: [Insert selected conditions: Respiratory/Cardiac/Neurological/Gastrointestinal/Other]
    Additional Notes: [Additional Notes]

Developmental Milestones:
    Motor Development: [Within Normal Limits/Delayed]. Achieved milestones include: [Insert milestones checked: Rolling/Sitting/Crawling/Walking].
    Cognitive Development: [Within Normal Limits/Delayed]. Strengths observed include: [Insert milestones checked: Object Permanence/Symbolic Play/Problem Solving].
    Additional Notes: [Additional Notes]

Language Development:
    Receptive Language: [Within Normal Limits/Delayed]. Notable strengths include: [Insert selected areas: Follows Directions/Understands Questions/Identifies Objects].
    Expressive Language: [Within Normal Limits/Delayed]. Notable strengths include: [Insert selected areas: First Words/Word Combinations/Sentences].
    Additional Notes: [Additional Notes]

Behavioral Observations:
During the evaluation, [Client's first name] demonstrated [Insert observed behavioral traits: attending skills, cooperation, engagement level, etc.]. Observations included [specific examples related to task focus, social interaction, or environmental awareness].

Assessment Tools:
The evaluation utilized the following tools and methods: [Insert selected assessment tools].
Results of these assessments are considered reliable and provide a comprehensive understanding of [Client's first name]'s abilities.

Key Findings:
    Oral Mechanism Evaluation:
        Structure: [Within Normal Limits/Areas of Concern]. Observations included: [Insert specifics related to face, mandible, and maxilla].
        Function: [Insert findings on jaw function, phonation, etc.].

    Speech Sound/Feeding-Swallowing Assessment (if applicable):
        Speech Intelligibility: [Insert findings: Highly/Moderately/Poor/Very Poor]. Notable errors include: [Insert specific observations].
        Liquid/Solid Food Trials: [Insert specifics on presentation methods and observed challenges].

    Environmental Modifications:
        Recommended Modifications: [Insert selected modifications like Seating Modifications/Adaptive Equipment/Visual Supports, etc.].
        Additional Notes: [Additional Modification Notes].

    Parent/Caregiver Training:
        Recommended Areas: [Insert selected training areas like Communication Strategies/Feeding Techniques, etc.].

    Referral Options:
        Recommended Referrals: [Insert selected referrals like Audiologist/ENT Specialist/Psychologist, etc.].
        Additional Notes: [Additional Referral Notes].

Clinical Impressions:
Based on the assessments, [Client's first name] presents with [Insert findings on speech/language/motor delays, feeding challenges, or sensory concerns]. Strengths include [Insert observed strengths], while challenges were noted in [Insert observed challenges].

Recommendations:
    Initiate therapy focusing on [Insert selected areas like Speech Therapy/Language Therapy/Feeding Therapy/Occupational Therapy]. Frequency: [Recommended Frequency].
    Implement environmental modifications such as [Insert recommendations].
    Engage in parent/caregiver training for [Insert focus areas].
    Consider referrals to [Insert specialists].

Conclusion:
The findings from this evaluation provide valuable insights into [Client's first name]'s developmental profile. A tailored intervention plan focusing on their strengths and addressing areas of need will support their progress. Follow-up evaluations are recommended to monitor growth and adjust goals as needed.

Sincerely,
[Evaluator's Name]
[Title]`;

        let evaluation = this.processTemplate(template, formData);
        
        // Handle empty fields with placeholders
        evaluation = evaluation.replace(/\[([^\]]+)\]/g, (match, p1) => formData[p1.trim()] || 'Data not provided');
        // Clean up any remaining placeholders
        evaluation = evaluation.replace(/\[([^\]]+)\]/g, '___');
        
        return evaluation;
    }

    processTemplate(template, formData) {
        let result = template;

        // Basic client information
        const clientName = formData.clientName || '';
        const firstName = clientName.split(' ')[0];
        result = result.replace(/\[Client's first name\]/g, firstName);
        result = result.replace(/\[Age\]/g, formData.age || '___');
        result = result.replace(/\[Gender\]/g, formData.gender || '___');
        result = result.replace(/\[Place of Evaluation\]/g, formData.evaluationPlace || '___');

        // Birth history
        result = result.replace(/\[Length of Pregnancy\]/g, formData['pregnancy-length'] || '___');
        result = result.replace(/\[Type of Delivery\]/g, formData.birthType || '___');
        result = result.replace(/\[Additional Notes\]/g, formData['birth-notes'] || '___');

        // Medical history
        const medicalConditions = Object.entries(formData)
            .filter(([key, value]) => key.startsWith('medical-conditions') && value)
            .map(([key, value]) => value)
            .join(', ');
        result = result.replace(/\[Insert selected conditions:[^\]]+\]/g, medicalConditions || '___');

        // Assessment tools
        const assessmentTools = Object.entries(formData)
            .filter(([key, value]) => key.startsWith('assessment-tools') && value)
            .map(([key, value]) => value)
            .join(', ');
        result = result.replace(/\[Insert selected assessment tools\]/g, assessmentTools || '___');

        // Process other form data
        Object.entries(formData).forEach(([key, value]) => {
            const placeholder = new RegExp(`\\[${key}\\]`, 'g');
            result = result.replace(placeholder, value);
        });

        return result;
    }
}

// Initialize NLP manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nlpManager = new NLPManager();
});
