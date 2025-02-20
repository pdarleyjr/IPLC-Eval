// PDF Generation functionality for the Articulation Evaluation form

class PDFGenerator {
    constructor() {
        this.doc = null;
        this.pageHeight = 0;
        this.currentY = 0;
        this.margins = {
            top: 20,
            bottom: 20,
            left: 20,
            right: 20
        };
        this.lineHeight = 7;
        this.fontSize = 12;
        this.pageWidth = 0;
    }

    async generatePDF() {
        try {
            // Initialize jsPDF
            // Set up the document
            this.doc = new jspdf.jsPDF();
            this.pageHeight = this.doc.internal.pageSize.height;
            this.pageWidth = this.doc.internal.pageSize.width;
            this.currentY = this.margins.top;

            // Set default font
            this.doc.setFont('helvetica');
            this.doc.setFontSize(this.fontSize);

            // Add header with logo
            await this.addHeader();
            
            // Add form sections
            this.addPatientInfo();
            this.addProtocolSection();
            this.addStandardizedAssessmentSection();
            this.addBackgroundSection();
            this.addOralMechanismSection();
            this.addSpeechSoundSection();
            this.addSpeechSampleSection();
            this.addClinicalImpressionSection();
            this.addRecommendationsSection();
            
            // Add footer
            this.addFooter();
            
            // Save the PDF
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const date = new Date().toLocaleDateString().replace(/\//g, '-');
            this.doc.save(`${lastName}_${firstName}_Articulation_Evaluation_${date}.pdf`);
            
            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            window.formUtils.showNotification('Error generating PDF', 'error');
            return false;
        }
    }

    async addHeader() {
        // Add logo
        await this.addLogo();
        
        // Add contact information
        this.doc.setFontSize(10);
        const contactText = 'Phone: 786-622-2353 | Email: info@iplcmiami.com';
        const textWidth = this.doc.getStringUnitWidth(contactText) * 10 / this.doc.internal.scaleFactor;
        const textX = (this.pageWidth - textWidth) / 2;
        this.doc.text(contactText, textX, this.currentY);
        this.currentY += this.lineHeight * 2;
        this.doc.setFontSize(this.fontSize);
    }

    async addLogo() {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = 'assets/images/400dpiLogo.PNG';
            img.onload = () => {
                const imgWidth = 100;
                const imgHeight = (img.height * imgWidth) / img.width;
                const x = (this.pageWidth - imgWidth) / 2;
                this.doc.addImage(img, 'PNG', x, this.currentY, imgWidth, imgHeight);
                this.currentY += imgHeight + 10;
                resolve();
            };
            img.onerror = reject;
        });
    }

    addPatientInfo() {
        const fields = {
            'First Name:': document.getElementById('firstName').value,
            'Last Name:': document.getElementById('lastName').value,
            'Evaluation Date:': document.getElementById('evaluationDate').value,
            'Place of Evaluation:': document.getElementById('placeOfEvaluation').value,
            'Date of Birth:': document.getElementById('dob').value,
            'Examiner:': document.getElementById('examiner').value,
            'Age:': document.getElementById('age').value
        };

        const columnWidth = (this.pageWidth - this.margins.left - this.margins.right) / 2;
        let leftX = this.margins.left;
        let rightX = this.margins.left + columnWidth;
        let startY = this.currentY;

        Object.entries(fields).forEach(([label, value], index) => {
            const x = index % 2 === 0 ? leftX : rightX;
            const y = startY + Math.floor(index / 2) * this.lineHeight;
            
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(label, x, y);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(value, x + 40, y);
        });

        this.currentY = startY + (Math.ceil(Object.keys(fields).length / 2)) * this.lineHeight + 10;
    }

    addProtocolSection() {
        this.addSectionHeader('Articulation Evaluation Protocol');
        
        const protocol = document.querySelector('.protocol-description').textContent;
        this.addWrappedText(protocol);

        this.currentY += this.lineHeight;
        
        const components = Array.from(document.querySelectorAll('#evaluationComponents input[type="checkbox"]'));
        components.forEach(component => {
            this.addCheckbox(this.margins.left, this.currentY, component.checked);
            const label = document.querySelector(`label[for="${component.id}"]`).textContent;
            this.doc.text(label, this.margins.left + 6, this.currentY);
            this.currentY += this.lineHeight;
        });

        this.currentY += this.lineHeight;
    }

    addStandardizedAssessmentSection() {
        this.addSectionHeader('Standardized Assessment');

        // Add introduction text
        const introText = 'Formal standardized assessments were administered to evaluate speech and language skills. ' +
            'Results are interpreted based on standard scores with a mean of 100 and a standard deviation of ±15.';
        this.addWrappedText(introText);
        this.currentY += this.lineHeight;

        // Add score interpretation table
        this.addScoreInterpretationTable();
        this.currentY += this.lineHeight * 2;

        // Add PLS-5 section
        this.addPLS5Results();
        this.currentY += this.lineHeight * 2;

        // Add strengths and difficulties
        this.addStrengthsAndDifficulties();
    }

    addScoreInterpretationTable() {
        const interpretations = [
            ['Above 115', 'Above Average'],
            ['85-115', 'Average/Within Normal Limits'],
            ['78-84', 'Marginal/Below Average/Mild'],
            ['71-77', 'Low Range/Moderate'],
            ['70-50', 'Very Low Range/Severe'],
            ['Below 50', 'Profound']
        ];

        // Add table header
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Standard Score Range', this.margins.left, this.currentY);
        this.doc.text('Interpretation', this.margins.left + 60, this.currentY);
        this.currentY += this.lineHeight;

        // Add table rows
        this.doc.setFont('helvetica', 'normal');
        interpretations.forEach(([range, interpretation]) => {
            this.doc.text(range, this.margins.left, this.currentY);
            this.doc.text(interpretation, this.margins.left + 60, this.currentY);
            this.currentY += this.lineHeight;
        });
    }

    addPLS5Results() {
        // Add PLS-5 header
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Preschool Language Scale – Fifth Edition (PLS-5)', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 1.5;

        // Add description
        const description = 'The PLS-5 is designed to assess receptive and expressive language skills in children ' +
            'from birth through 7 years, 11 months of age.';
        this.doc.setFont('helvetica', 'normal');
        this.addWrappedText(description);
        this.currentY += this.lineHeight;

        // Add results table
        const subtests = [
            ['Auditory Comprehension', 'ac'],
            ['Expressive Communication', 'ec'],
            ['Total Language Score', 'tl']
        ];

        // Table headers
        const headers = ['Subtest', 'Standard Score', 'Confidence Interval', 'Percentile Rank', 'Age Equivalent', 'Severity'];
        const columnWidths = [50, 30, 35, 30, 30, 40];
        let currentX = this.margins.left;

        this.doc.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
            this.doc.text(header, currentX, this.currentY);
            currentX += columnWidths[index];
        });
        this.currentY += this.lineHeight * 1.5;

        // Table rows
        this.doc.setFont('helvetica', 'normal');
        subtests.forEach(([name, prefix]) => {
            currentX = this.margins.left;
            const score = document.getElementById(`${prefix}_standard_score`).value;
            const confidence = document.getElementById(`${prefix}_confidence_interval`).value;
            const percentile = document.getElementById(`${prefix}_percentile`).value;
            const age = document.getElementById(`${prefix}_age_equivalent`).value;
            const severity = document.getElementById(`${prefix}_severity`).value;

            const values = [name, score, confidence, percentile, age, severity];
            values.forEach((value, index) => {
                this.doc.text(value.toString(), currentX, this.currentY);
                currentX += columnWidths[index];
            });
            this.currentY += this.lineHeight;
        });
    }

    addStrengthsAndDifficulties() {
        // Add Relative Strengths
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Relative Strengths:', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 1.5;

        this.doc.setFont('helvetica', 'normal');
        const strengthCheckboxes = document.querySelectorAll('input[id^="strength_"]:checked');
        strengthCheckboxes.forEach(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`).textContent;
            this.addBulletPoint(label);
        });
        this.currentY += this.lineHeight;

        // Add Areas of Difficulty
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Areas of Difficulty:', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 1.5;

        this.doc.setFont('helvetica', 'normal');
        const difficultyCheckboxes = document.querySelectorAll('input[id^="difficulty_"]:checked');
        difficultyCheckboxes.forEach(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`).textContent;
            this.addBulletPoint(label);
        });

        const additionalDifficulties = document.getElementById('additional_difficulties').value;
        if (additionalDifficulties.trim()) {
            this.addWrappedText(additionalDifficulties);
        }
    }

    addBackgroundSection() {
        this.addSectionHeader('Relevant Background Information');
        
        // Birth History
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Birth History:', this.margins.left, this.currentY);
        this.currentY += this.lineHeight;
        
        const birthHistory = document.querySelector('input[name="birthHistory"]:checked');
        if (birthHistory) {
            this.addRadioSelection('Remarkable:', birthHistory.value === 'remarkable');
            this.addRadioSelection('Unremarkable:', birthHistory.value === 'unremarkable');
            
            if (birthHistory.value === 'remarkable') {
                this.addLabeledField('Length of pregnancy:', document.getElementById('pregnancyLength').value);
                this.addLabeledField('Type of delivery:', document.getElementById('deliveryType').value);
                this.addLabeledField('Notes:', document.getElementById('birthNotes').value);
            }
        }

        // Add other background sections similarly...
        this.currentY += this.lineHeight;
    }

    addOralMechanismSection() {
        this.addSectionHeader('Oral Mechanism Evaluation');
        
        const description = `Informal assessment of the oral speech mechanism was performed through observation to 
assess the adequacy of the structures and functions of the oral-motor mechanism. This includes evaluating the symmetry, strength, coordination, and range of motion of the oral structures, as well as breath support and motor control.`;
        this.addWrappedText(description);
        
        // Structure Assessment
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Structure Assessment:', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 1.5;

    // Face Structure
        this.addStructureAssessment('face', 'Face');

        // Mandible and Maxilla
        this.addStructureAssessment('mandible', 'Mandible and Maxilla');

        // Teeth and Dental Occlusion
        this.addStructureAssessment('teeth', 'Teeth and Dental Occlusion');

        // Palatal Arch
        this.addStructureAssessment('palatal', 'Palatal Arch');

        // Lips
        this.addStructureAssessment('lips', 'Lips');

        // Structure Notes
        const structureNotes = document.getElementById('structureNotes').value;
        if (structureNotes.trim()) {
            this.doc.setFont('helvetica', 'bold');
            this.doc.text('Structure Notes:', this.margins.left, this.currentY);
            this.currentY += this.lineHeight;
            this.doc.setFont('helvetica', 'normal');
            this.addWrappedText(structureNotes);
        }

        // Function Assessment
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Function Assessment:', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 1.5;

        // Jaw Function
        this.addFunctionAssessment('jaw', 'Jaw Function');

        // Velopharyngeal Closure
        this.addFunctionAssessment('velopharyngeal', 'Velopharyngeal Closure');

        // Phonation and Breath Support
        this.addFunctionAssessment('phonation', 'Phonation and Breath Support');

        // Oral Reflexes
        this.addFunctionAssessment('reflexes', 'Oral Reflexes');

        // Motor Speech Coordination
        this.addFunctionAssessment('motor', 'Motor Speech Coordination');

        // Function Notes
        const functionNotes = document.getElementById('functionNotes').value;
        if (functionNotes.trim()) {
            this.doc.setFont('helvetica', 'bold');
            this.doc.text('Function Notes:', this.margins.left, this.currentY);
            this.currentY += this.lineHeight;
            this.doc.setFont('helvetica', 'normal');
            this.addWrappedText(functionNotes);
        }
    }

    addStructureAssessment(type, label) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(label + ':', this.margins.left + 5, this.currentY);
        this.currentY += this.lineHeight;

        const radio = document.querySelector(`input[name="${type}Structure"]:checked`);
        if (radio) {
            this.doc.setFont('helvetica', 'normal');
            const label = document.querySelector(`label[for="${radio.id}"]`).textContent;
            this.addWrappedText(label, { indent: 10 });
        }
        this.currentY += this.lineHeight;
    }

    addFunctionAssessment(type, label) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(label + ':', this.margins.left + 5, this.currentY);
        this.currentY += this.lineHeight;

        const radio = document.querySelector(`input[name="${type}Function"]:checked`);
        if (radio) {
            this.doc.setFont('helvetica', 'normal');
            const label = document.querySelector(`label[for="${radio.id}"]`).textContent;
            this.addWrappedText(label, { indent: 10 });
        }
        this.currentY += this.lineHeight;
    }

    addSpeechSoundSection() {
        this.addSectionHeader('Speech Sound Assessment');
        
        const description = 'Speech Sound Assessment: The ability to produce speech sounds was assessed throughout ' +
            'the course of the evaluation in order to measure articulation of sounds and determine types of ' +
            'misarticulation. The Clinical Assessment of Articulation and Phonology - 2nd Edition ' +
            '(CAAP-2) was administered. Additionally, spontaneous speech was elicited both in words and ' +
            'connected speech. Data was collected and analyzed using the Age of Customary Consonant ' +
            'Production chart as recommended by The American Speech-Language-Hearing Association ' +
            '(ASHA).';
        this.addWrappedText(description);
        this.currentY += this.lineHeight;
    
        const soundRows = document.querySelectorAll('.sound-row');
        const columnWidths = [30, 30, 40, 40, 40];
        const startX = this.margins.left;
        
        // Add table headers
        const headers = ['Sound', 'Misarticulated', 'Position', 'Type', 'Detail'];
        headers.forEach((header, index) => {
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(header, startX + this.getColumnOffset(columnWidths, index), this.currentY);
        });
        
        this.currentY += this.lineHeight * 1.5;
        
        // Add table rows
        soundRows.forEach(row => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            const inputs = row.querySelectorAll('input[type="text"]');
            
            if (checkbox && checkbox.checked) {
                const values = [
                    row.dataset.sound,
                    'X',
                    inputs[0].value,
                    inputs[1].value,
                    inputs[2].value
                ];
                
                values.forEach((value, index) => {
                    this.doc.setFont('helvetica', 'normal');
                    this.doc.text(value, startX + this.getColumnOffset(columnWidths, index), this.currentY);
                });
                
                this.currentY += this.lineHeight;
            }
        });
    }

    addSpeechSampleSection() {
        this.addSectionHeader('Speech Sample Analysis');
        
        const description = 'A speech sample was collected during spontaneous conversation, play-based activities, and ' +
            'picture description tasks to assess articulation and intelligibility in connected speech.';
        this.addWrappedText(description);
        this.currentY += this.lineHeight * 1.5;

        // Sound Production
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Sound Production:', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 1.5;
        
        const soundProduction = document.querySelectorAll('.sound-production input[type="checkbox"]:checked');
        soundProduction.forEach(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`).textContent;
            this.addCheckbox(this.margins.left, this.currentY, true);
            this.doc.text(label, this.margins.left + 6, this.currentY);
            this.currentY += this.lineHeight;
        });
        
        // Phonological Patterns
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Phonological Patterns:', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 1.5;

        const patterns = document.querySelectorAll('[id^="pattern"]:checked');
        patterns.forEach(pattern => {
            const label = document.querySelector(`label[for="${pattern.id}"]`).textContent;
            this.addBulletPoint(label);
        });

        const otherPattern = document.getElementById('otherPatternText').value;
        if (otherPattern.trim()) {
            this.addBulletPoint(`Other: ${otherPattern}`);
        }

        const phonologicalNotes = document.getElementById('phonologicalNotes').value;
        if (phonologicalNotes.trim()) {
            this.doc.setFont('helvetica', 'normal');
            this.addWrappedText(phonologicalNotes, { indent: 5 });
        }

        this.currentY += this.lineHeight;

        // Speech Intelligibility
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Speech Intelligibility:', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 1.5;

        // Familiar Listeners
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Familiar Listeners:', this.margins.left + 5, this.currentY);
        this.currentY += this.lineHeight;

        const familiarRating = document.querySelector('input[name="familiarIntelligibility"]:checked');
        if (familiarRating) {
            this.doc.setFont('helvetica', 'normal');
            const label = document.querySelector(`label[for="${familiarRating.id}"]`).textContent;
            this.addWrappedText(label, { indent: 10 });
        }

        // Unfamiliar Listeners
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Unfamiliar Listeners:', this.margins.left + 5, this.currentY);
        this.currentY += this.lineHeight;

        const unfamiliarRating = document.querySelector('input[name="unfamiliarIntelligibility"]:checked');
        if (unfamiliarRating) {
            this.doc.setFont('helvetica', 'normal');
            const label = document.querySelector(`label[for="${unfamiliarRating.id}"]`).textContent;
            this.addWrappedText(label, { indent: 10 });
        }

        const intelligibilityNotes = document.getElementById('intelligibilityNotes').value;
        if (intelligibilityNotes.trim()) {
            this.currentY += this.lineHeight;
            this.addWrappedText(intelligibilityNotes, { indent: 5 });
        }

        this.currentY += this.lineHeight;

        // Connected Speech Characteristics
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Connected Speech Characteristics:', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 1.5;

        const characteristics = document.querySelectorAll('[id^="speech"]:checked');
        characteristics.forEach(characteristic => {
            const label = document.querySelector(`label[for="${characteristic.id}"]`).textContent;
            this.addBulletPoint(label);
        });

        const characteristicsNotes = document.getElementById('characteristicsNotes').value;
        if (characteristicsNotes.trim()) {
            this.addWrappedText(characteristicsNotes, { indent: 5 });
        }

        // Strengths Observed
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Strengths Observed:', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 1.5;

        const strengths = document.querySelectorAll('[id^="strength"]:checked');
        strengths.forEach(strength => {
            const label = document.querySelector(`label[for="${strength.id}"]`).textContent;
            this.addBulletPoint(label);
        });
    }

    addClinicalImpressionSection() {
        this.addSectionHeader('Clinical Impressions');
        
        const impressions = document.getElementById('clinicalImpressions').value;
        this.addWrappedText(impressions);
        
        this.currentY += this.lineHeight;
    }

    addRecommendationsSection() {
        this.addSectionHeader('Recommendations');
        
        const recommendations = document.querySelectorAll('.recommendation-checkbox:checked');
        recommendations.forEach(recommendation => {
            const label = document.querySelector(`label[for="${recommendation.id}"]`).textContent;
            this.addCheckbox(this.margins.left, this.currentY, true);
            this.doc.text(label, this.margins.left + 6, this.currentY);
            this.currentY += this.lineHeight;
        });
        
        // Add other recommendations...
        this.currentY += this.lineHeight * 2;
        
        // Add signature line
        this.doc.text('Sincerely,', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 3;
        this.doc.line(this.margins.left, this.currentY, this.margins.left + 80, this.currentY);
    }

    // Helper methods
    addSectionHeader(text) {
        this.checkAndAddPage();
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(14);
        this.doc.text(text, this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 1.5;
        this.doc.setFontSize(this.fontSize);
        this.doc.setFont('helvetica', 'normal');
    }

    addBulletPoint(text) {
        this.doc.text('•', this.margins.left, this.currentY);
        this.doc.text(text, this.margins.left + 10, this.currentY);
        this.currentY += this.lineHeight;
    }

    addWrappedText(text, options = {}) {
        const maxWidth = this.pageWidth - this.margins.left - this.margins.right;
        const indent = options.indent || 0;
        const lines = this.doc.splitTextToSize(text, maxWidth);
        
        lines.forEach(line => {
            this.checkAndAddPage();
            this.doc.text(line, this.margins.left + indent, this.currentY);
            this.currentY += this.lineHeight;
        });
    }

    addCheckbox(x, y, checked) {
        this.doc.rect(x, y - 3, 3, 3);
        if (checked) {
            this.doc.line(x, y - 3, x + 3, y);
            this.doc.line(x + 3, y - 3, x, y);
        }
    }

    addRadioSelection(label, checked) {
        this.doc.circle(this.margins.left + 2, this.currentY - 2, 1.5, 'S');
        if (checked) {
            this.doc.circle(this.margins.left + 2, this.currentY - 2, 0.8, 'F');
        }
        this.doc.text(label, this.margins.left + 6, this.currentY);
        this.currentY += this.lineHeight;
    }

    addLabeledField(label, value) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(label, this.margins.left + 10, this.currentY);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(value, this.margins.left + 50, this.currentY);
        this.currentY += this.lineHeight;
    }

    getColumnOffset(columnWidths, index) {
        return columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
    }

    checkAndAddPage() {
        if (this.currentY > this.pageHeight - this.margins.bottom) {
            this.doc.addPage();
            this.currentY = this.margins.top;
        }
    }

    addFooter() {
        const pageCount = this.doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            this.doc.setFontSize(10);
            this.doc.text(
                `Page ${i} of ${pageCount}`,
                this.pageWidth / 2,
                this.pageHeight - 10,
                { align: 'center' }
            );
        }
    }
}

// Initialize PDF generator when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pdfGenerator = new PDFGenerator();
});