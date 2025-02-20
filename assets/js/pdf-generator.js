// PDF Generation functionality for the Articulation Evaluation form

class PDFGenerator {
    constructor() {
        this.doc = null;
        this.pageHeight = 0;
        this.currentY = 0;
        this.margins = {
            top: 25,
            bottom: 45,
            left: 20,
            right: 20
        };
        this.lineHeight = 10;
        this.smallLineHeight = 10;
        this.fontSize = 12;
        this.sectionSpacing = 15;  // Reduced spacing between sections
        this.indent = 15;
    }

    async generatePDF() {
        console.log('Starting PDF generation...');
        try {
            if (!window.jsPDF) {
                throw new Error('jsPDF is not properly initialized');
            }
            
            this.doc = new window.jsPDF();
            this.pageHeight = this.doc.internal.pageSize.height;
            this.pageWidth = this.doc.internal.pageSize.width;
            this.currentY = this.margins.top;

            this.doc.setFont('helvetica');
            this.doc.setFontSize(this.fontSize);

            await this.addHeader();
            await this.addPatientInfo();
            await this.addProtocolSection();
            await this.addStandardizedAssessmentSection();
            await this.addBackgroundSection();
            await this.addOralMechanismSection();
            await this.addSpeechSoundSection();
            await this.addSpeechSampleSection();
            await this.addClinicalImpressionSection();
            await this.addRecommendationsSection();
            this.addFooter();
            
            const firstName = document.getElementById('firstName')?.value || '';
            const lastName = document.getElementById('lastName')?.value || '';
            
            if (!firstName || !lastName) {
                throw new Error('First name and last name are required');
            }

            const date = new Date().toLocaleDateString().replace(/\//g, '-');
            console.log('Saving PDF...');
            this.doc.save(`${lastName}_${firstName}_Articulation_Evaluation_${date}.pdf`);
            console.log('PDF saved successfully');
            
            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF: ' + error.message);
            return false;
        }
    }

    async addHeader() {
        try {
            await this.addLogo();

            // Add subtle divider line
            this.currentY += this.lineHeight * 0.8;  // Reduced spacing
            this.doc.setDrawColor(200, 200, 200);
            this.doc.setLineWidth(0.2);
            this.doc.line(this.margins.left, this.currentY, this.pageWidth - this.margins.right, this.currentY);
            
            // Reset font settings
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(this.fontSize);
            this.doc.setDrawColor(0);
            this.currentY += this.lineHeight * 1.5;  // Reduced double spacing
        } catch (error) {
            console.error('Error adding header:', error);
            throw error;
        }
    }

    async addLogo() {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = 'assets/images/400dpiLogo.PNG';
            img.onload = () => {
                try {
                    const imgWidth = 82.5; // Increased from 65 (15% larger)
                    const imgHeight = (img.height * imgWidth) / img.width;
                    // Position logo in top-left corner
                    const x = this.margins.left;
                    this.doc.addImage(img, 'PNG', x, this.currentY, imgWidth, imgHeight);
                    this.currentY += imgHeight + 8; // Reduced spacing after logo
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = reject;
        });
    }

    async addPatientInfo() {
        // Add patient name in larger font
        const firstName = document.getElementById('firstName')?.value || '';
        const lastName = document.getElementById('lastName')?.value || '';
        if (firstName && lastName) {
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(16);
            const patientName = `${firstName} ${lastName}`;
            this.doc.text(patientName, this.margins.left, this.currentY);
            this.currentY += this.lineHeight * 1.5;  // Reduced double spacing
        }
        
        // Create two columns for patient information
        const fields = [
            ['Date of Birth', 'dob'],
            ['Age', 'age'],
            ['Evaluation Date', 'evaluationDate'],
            ['Place of Evaluation', 'placeOfEvaluation'],
            ['Examiner', 'examiner']
        ];

        
        const columnWidth = (this.pageWidth - this.margins.left - this.margins.right) / 2;
        let leftX = this.margins.left;
        let rightX = this.margins.left + columnWidth;
        let startY = this.currentY;

        this.doc.setFontSize(this.fontSize);
        
        fields.forEach(([label, id], index) => {
            const x = index % 2 === 0 ? leftX : rightX;
            const y = startY + Math.floor(index / 2) * (this.lineHeight * 1.3);
            
            // Label in bold
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(`${label}:`, x, y);
            
            // Value in normal font
            this.doc.setFont('helvetica', 'normal');
            const value = document.getElementById(id)?.value || '';
            const labelWidth = this.doc.getStringUnitWidth(`${label}:`) * this.fontSize / this.doc.internal.scaleFactor;
            this.doc.text(value, x + labelWidth + 5, y);
        });

        this.currentY = startY + (Math.ceil(fields.length / 2)) * (this.lineHeight * 1.3) + this.lineHeight * 2;
    }

    async addProtocolSection() {
        this.addSectionHeader('Protocol');
        
        const protocolDesc = document.querySelector('.protocol-description');
        if (protocolDesc) {
            this.addWrappedText(protocolDesc.textContent);
            this.currentY += this.lineHeight * 0.8;  // Reduced spacing
        }

        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Evaluation Components:', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 1.5;
        this.doc.setFont('helvetica', 'normal');

        const components = document.querySelectorAll('#protocol .form-check');
        components.forEach(component => {
            const checkbox = component.querySelector('input[type="checkbox"]');
            const label = component.querySelector('label');
            if (checkbox && label) {
                this.addCheckboxWithLabel(checkbox.checked, label.textContent);
            }
        });
    }

    async addStandardizedAssessmentSection() {
        this.addSectionHeader('Standardized Assessment');
        
        const introText = 'Formal standardized assessments were administered to evaluate speech and language skills. Results are interpreted based on standard scores with a mean of 100 and a standard deviation of ±15.';
        this.addWrappedText(introText);
        this.currentY += this.lineHeight * 0.8;  // Reduced spacing

        this.addScoreInterpretationTable();
        this.currentY += this.lineHeight * 1.5;  // Reduced double spacing

        this.addPLS5Table();
    }

    addScoreInterpretationTable() {
        const data = [
            ['Standard Score Range', 'Interpretation'],
            ['Above 115', 'Above Average'],
            ['85-115', 'Average/Within Normal Limits'],
            ['78-84', 'Marginal/Below Average/Mild'],
            ['71-77', 'Low Range/Moderate'],
            ['70-50', 'Very Low Range/Severe'],
            ['Below 50', 'Profound']
        ];

        this.addTable(data, ['Score Range', 'Interpretation']);
    }

    addPLS5Table() {
        const headers = ['Subtest', 'Standard Score', 'Confidence Interval', 'Percentile Rank', 'Age Equivalent', 'Severity'];
        const subtests = ['ac', 'ec', 'tl'];
        const subtestNames = {
            ac: 'Auditory Comprehension',
            ec: 'Expressive Communication',
            tl: 'Total Language Score'
        };

        const data = [headers];
        subtests.forEach(subtest => {
            const row = [
                subtestNames[subtest],
                document.getElementById(`${subtest}_standard_score`)?.value || '',
                document.getElementById(`${subtest}_confidence_interval`)?.value || '',
                document.getElementById(`${subtest}_percentile`)?.value || '',
                document.getElementById(`${subtest}_age_equivalent`)?.value || '',
                document.getElementById(`${subtest}_severity`)?.value || ''
            ];
            data.push(row);
        });

        this.addTable(data);
    }

    async addBackgroundSection() {
        this.addSectionHeader('Background Information');
        
        // Birth History
        this.addSubsectionHeader('Birth History');
        const birthHistory = document.querySelector('input[name="birthHistory"]:checked');
        if (birthHistory) {
            this.addRadioWithLabel(birthHistory.value === 'remarkable', 'Remarkable');
            this.addRadioWithLabel(birthHistory.value === 'unremarkable', 'Unremarkable');
            
            if (birthHistory.value === 'remarkable') {
                const pregnancyLength = document.getElementById('pregnancyLength')?.value;
                const deliveryType = document.getElementById('deliveryType')?.value;
                const birthNotes = document.getElementById('birthNotes')?.value;
                
                if (pregnancyLength) this.addWrappedText(`Length of pregnancy: ${pregnancyLength}`, this.indent);
                if (deliveryType) this.addWrappedText(`Type of delivery: ${deliveryType}`, this.indent);
                if (birthNotes) this.addWrappedText(`Notes: ${birthNotes}`, this.indent);
            }
        }

        // Medical History
        this.addSubsectionHeader('Medical History');
        const medicalHistory = document.querySelector('input[name="medicalHistory"]:checked');
        if (medicalHistory) {
            this.addRadioWithLabel(medicalHistory.value === 'remarkable', 'Remarkable');
            this.addRadioWithLabel(medicalHistory.value === 'unremarkable', 'Unremarkable');
            
            const medicalNotes = document.getElementById('medicalNotes')?.value;
            if (medicalNotes) this.addWrappedText(`Notes: ${medicalNotes}`, this.indent);
        }

        // Development & Language
        this.addSubsectionHeader('Developmental Milestones');
        const devMilestones = document.querySelector('input[name="developmentalMilestones"]:checked');
        if (devMilestones) {
            this.addRadioWithLabel(devMilestones.value === 'WNL', 'WNL');
            this.addRadioWithLabel(devMilestones.value === 'Delayed', 'Delayed');
            
            const devNotes = document.getElementById('developmentalNotes')?.value;
            if (devNotes) this.addWrappedText(`Notes: ${devNotes}`, this.indent);
        }

        this.addSubsectionHeader('Language Milestones');
        const langMilestones = document.querySelector('input[name="languageMilestones"]:checked');
        if (langMilestones) {
            this.addRadioWithLabel(langMilestones.value === 'WNL', 'WNL');
            this.addRadioWithLabel(langMilestones.value === 'Delayed', 'Delayed');
            
            const langNotes = document.getElementById('languageNotes')?.value;
            if (langNotes) this.addWrappedText(`Notes: ${langNotes}`, this.indent);
        }
    }

    async addOralMechanismSection() {
        this.addSectionHeader('Oral Mechanism Evaluation');
        
        const description = `Informal assessment of the oral speech mechanism was performed through observation to assess the adequacy of the structures and functions of the oral-motor mechanism. This includes evaluating the symmetry, strength, coordination, and range of motion of the oral structures, as well as breath support and motor control.`;
        this.addWrappedText(description);

        // Structure Assessment
        this.addSubsectionHeader('Structure Assessment');
        const structures = [
            ['face', 'Face'],
            ['mandible', 'Mandible and Maxilla'],
            ['teeth', 'Teeth and Dental Occlusion'],
            ['palatal', 'Palatal Arch'],
            ['lips', 'Lips']
        ];

        structures.forEach(([id, label]) => {
            const radio = document.querySelector(`input[name="${id}Structure"]:checked`);
            if (radio) {
                this.currentY += this.lineHeight * 0.5;
                const radioLabel = document.querySelector(`label[for="${radio.id}"]`)?.textContent;
                this.addSubsectionHeader(label, this.indent);
                this.addWrappedText(radioLabel, this.indent * 1.5);
            }
        });

        // Function Assessment
        this.addSubsectionHeader('Function Assessment');
        const functions = [
            ['jaw', 'Jaw Function'],
            ['velopharyngeal', 'Velopharyngeal Closure'],
            ['phonation', 'Phonation and Breath Support'],
            ['reflexes', 'Oral Reflexes'],
            ['motor', 'Motor Speech Coordination']
        ];

        functions.forEach(([id, label]) => {
            const radio = document.querySelector(`input[name="${id}Function"]:checked`);
            if (radio) {
                this.currentY += this.lineHeight * 0.5;
                const radioLabel = document.querySelector(`label[for="${radio.id}"]`)?.textContent;
                this.addSubsectionHeader(label, this.indent);
                this.addWrappedText(radioLabel, this.indent * 1.5);
            }
        });
    }

    async addSpeechSoundSection() {
        this.addSectionHeader('Speech Sound Assessment');
        
        const description = `The ability to produce speech sounds was assessed throughout the course of the evaluation in order to measure articulation of sounds and determine types of misarticulation. The Clinical Assessment of Articulation and Phonology - 2nd Edition (CAAP-2) was administered. Additionally, spontaneous speech was elicited both in words and connected speech.`;
        this.addWrappedText(description);

        // Add sound production table
        const soundRows = document.querySelectorAll('.sound-row');
        if (soundRows.length > 0) {
            const tableData = [['Sound', 'Misarticulated', 'Position', 'Type', 'Detail']];
            
            soundRows.forEach(row => {
                const checkbox = row.querySelector('input[type="checkbox"]');
                if (checkbox?.checked) {
                    const inputs = row.querySelectorAll('input[type="text"]');
                    tableData.push([
                        row.dataset.sound || '',
                        'X',
                        inputs[0]?.value || '',
                        inputs[1]?.value || '',
                        inputs[2]?.value || ''
                    ]);
                }
            });

            if (tableData.length > 1) {
                this.addTable(tableData);
            }
        }
    }

    async addSpeechSampleSection() {
        this.addSectionHeader('Speech Sample Analysis');
        
        const description = `A speech sample was collected during spontaneous conversation, play-based activities, and picture description tasks to assess articulation and intelligibility in connected speech.`;
        this.addWrappedText(description);

        // Sound Production
        this.addSubsectionHeader('Sound Production');
        document.querySelectorAll('.sound-production input[type="checkbox"]:checked').forEach(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`)?.textContent;
            if (label) this.addCheckboxWithLabel(true, label);
        });

        // Speech Intelligibility
        this.addSubsectionHeader('Speech Intelligibility');
        
        // Familiar Listeners
        this.addSubsectionHeader('Familiar Listeners', this.indent);
        const familiarRating = document.querySelector('input[name="familiarIntelligibility"]:checked');
        if (familiarRating) {
            const label = document.querySelector(`label[for="${familiarRating.id}"]`)?.textContent;
            if (label) this.addWrappedText(label, this.indent * 2);
        }

        // Unfamiliar Listeners
        this.addSubsectionHeader('Unfamiliar Listeners', this.indent);
        const unfamiliarRating = document.querySelector('input[name="unfamiliarIntelligibility"]:checked');
        if (unfamiliarRating) {
            const label = document.querySelector(`label[for="${unfamiliarRating.id}"]`)?.textContent;
            if (label) this.addWrappedText(label, this.indent * 2);
        }
    }

    async addClinicalImpressionSection() {
        this.addSectionHeader('Clinical Impressions');
        
        const impressions = document.getElementById('clinicalImpressions')?.value;
        if (impressions) {
            // Calculate available space before footer
            const footerSpace = 50; // Space needed for footer
            const availableHeight = this.pageHeight - this.margins.bottom - footerSpace;
            
            // Split text into lines that fit within margins
            const lines = this.doc.splitTextToSize(impressions, this.pageWidth - this.margins.left - this.margins.right);
            
            // Calculate if we need a new page
            const estimatedHeight = lines.length * this.lineHeight;
            if (this.currentY + estimatedHeight > availableHeight) {
                this.doc.addPage();
                this.currentY = this.margins.top;
            }
            
            // Render each line, checking for page overflow
            lines.forEach(line => {
                if (this.currentY + this.lineHeight > availableHeight) {
                    this.doc.addPage();
                    this.currentY = this.margins.top;
                }
                this.doc.text(line, this.margins.left, this.currentY);
                this.currentY += this.lineHeight;
            });
            
            // Add spacing after the section
            this.currentY += this.lineHeight * 0.8;  // Reduced spacing
        }


    }

    async addRecommendationsSection() {
        this.addSectionHeader('Recommendations');
        
        this.addWrappedText('Based on the information obtained through the assessment tools and parent interview, the following recommendations are made:');
        this.currentY += this.lineHeight * 0.8;  // Reduced spacing
        
        document.querySelectorAll('.recommendation-checkbox:checked').forEach(recommendation => {
            const label = document.querySelector(`label[for="${recommendation.id}"]`)?.textContent;
            if (label) this.addCheckboxWithLabel(true, label);
        });

        const otherRecs = document.getElementById('otherRecommendations')?.value;
        if (otherRecs) {
            this.addWrappedText(otherRecs);
            this.currentY += this.lineHeight * 0.8;  // Reduced spacing
        }

        // Add closing text
        this.currentY += this.lineHeight * 1.5;  // Reduced double spacing
        this.addWrappedText('It has been a pleasure meeting and working with you. If you have any questions and/or concerns, feel free to contact us directly via telephone at 786-622-2353 or via email at info@iplcmiami.com.');
        
        // Add signature
        this.currentY += this.lineHeight * 3;
        this.doc.text('Sincerely,', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 4;
        
        // Add examiner credentials
        const examiner = document.getElementById('examiner')?.value || '';
        if (examiner) {
            this.doc.setFont('aptos', 'bold');
            this.doc.text(examiner + ',', this.margins.left, this.currentY);
            this.currentY += this.lineHeight * 0.8;  // Reduced spacing
            this.doc.setFont('aptos', 'normal');
            
            // Add subtle line above credentials
            const credWidth = this.doc.getStringUnitWidth(examiner + ',') * this.fontSize / this.doc.internal.scaleFactor;
            this.doc.setDrawColor(200, 200, 200);
            this.doc.setLineWidth(0.2);
            this.doc.line(this.margins.left, this.currentY - this.lineHeight * 1.8, this.margins.left + credWidth, this.currentY - this.lineHeight * 1.8);
            this.doc.text('Speech-Language Pathologist', this.margins.left, this.currentY);
        }
    }

    addTable(data, headers = null) {
        if (!data || data.length === 0) return;

        // Check if we need to add a page before starting the table
        const estimatedTableHeight = data.length * (this.lineHeight * 1.4) + this.lineHeight * 2;
        if (this.currentY + estimatedTableHeight > this.pageHeight - (this.margins.bottom + 30)) {
            this.doc.addPage();
            this.currentY = this.margins.top;
        }

        const startX = this.margins.left;
        const columnCount = data[0].length;
        
        // Calculate optimal column widths based on content
        const columnWidths = Array(columnCount).fill(0);
        data.forEach(row => {
            row.forEach((cell, colIndex) => {
                const cellText = cell.toString();
                const width = this.doc.getStringUnitWidth(cellText) * this.fontSize / this.doc.internal.scaleFactor + 15; // Increased cell padding
                columnWidths[colIndex] = Math.max(columnWidths[colIndex], width);
            });
        });
        
        // Ensure table fits within margins by scaling column widths
        const totalWidth = this.pageWidth - this.margins.left - this.margins.right - 10; // 10px buffer
        const sumWidth = columnWidths.reduce((a, b) => a + b, 0);
        const scaleFactor = totalWidth / sumWidth;
        columnWidths.forEach((width, index) => {
            columnWidths[index] = width * scaleFactor;
        });

        // Add a small buffer to prevent edge cases
        const tableWidth = columnWidths.reduce((a, b) => a + b, 0);

        const rowHeight = this.lineHeight * 1.3; // Slightly reduced row height

        // Add headers if provided separately
        if (headers) {
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(this.fontSize - 1);  // Slightly smaller font for headers
            headers.forEach((header, index) => {
                const x = startX + columnWidths.slice(0, index).reduce((a, b) => a + b, 0);
                this.doc.text(header, x + 5, this.currentY);
                this.doc.setFillColor(245, 245, 245);
                this.doc.rect(x, this.currentY - rowHeight + 3, columnWidths[index], rowHeight, 'FD');
            });
            this.doc.setFontSize(this.fontSize);  // Reset font size
        }

        this.doc.setDrawColor(150, 150, 150);
        this.doc.setLineWidth(0.2);

        // Add data rows
        data.forEach((row, rowIndex) => {
            // Skip header row if headers were provided separately
            if (headers && rowIndex === 0) return;

            // Set bold for header row if headers were not provided separately
            if (!headers && rowIndex === 0) {
                this.doc.setFont('helvetica', 'bold');
            } else {
                this.doc.setFont('helvetica', 'normal');
            }

            // Draw cell borders
            const isHeaderRow = !headers && rowIndex === 0;
            row.forEach((_, columnIndex) => {
                const x = startX + columnWidths.slice(0, columnIndex).reduce((a, b) => a + b, 0);
                if (isHeaderRow) {
                    this.doc.setFillColor(245, 245, 245);
                } else {
                    this.doc.setFillColor(rowIndex % 2 === 0 ? 255 : 248, rowIndex % 2 === 0 ? 255 : 248, rowIndex % 2 === 0 ? 255 : 248);
                }
                
                this.doc.rect(
                    x,
                    this.currentY - rowHeight + 3,
                    columnWidths[columnIndex],
                    rowHeight,
                    'FD'
                );
            });

            row.forEach((cell, columnIndex) => {
                const cellText = cell.toString();
                const x = startX + columnWidths.slice(0, columnIndex).reduce((a, b) => a + b, 0);
                const cellX = x + 5;
                const textWidth = this.doc.getStringUnitWidth(cellText) * this.fontSize / this.doc.internal.scaleFactor;
                if (textWidth > columnWidths[columnIndex] - 10) {
                    const lines = this.doc.splitTextToSize(cellText, columnWidths[columnIndex] - 10);
                    this.doc.text(lines[0], cellX, this.currentY);
                } else {
                    this.doc.text(cellText, cellX, this.currentY);
                }
            });
            
            this.currentY += rowHeight;
        });

        this.currentY += this.lineHeight * 1.1;  // Slightly reduced spacing
        this.doc.setFont('helvetica', 'normal');
        this.doc.setDrawColor(0);
        this.doc.setLineWidth(0.4);
    }

    addCheckboxWithLabel(checked, label) {
        this.doc.rect(this.margins.left, this.currentY - 3, 3, 3);
        if (checked) {
            this.doc.line(this.margins.left, this.currentY - 3, this.margins.left + 3, this.currentY);
            this.doc.line(this.margins.left + 3, this.currentY - 3, this.margins.left, this.currentY);
        }
        this.doc.text(label, this.margins.left + 6, this.currentY);
        this.currentY += this.lineHeight * 0.8;  // Reduced spacing
    }

    addRadioWithLabel(checked, label) {
        this.doc.circle(this.margins.left + 1.5, this.currentY - 1.5, 1.5, 'S');
        if (checked) {
            this.doc.circle(this.margins.left + 1.5, this.currentY - 1.5, 0.8, 'F');
        }
        this.doc.text(label, this.margins.left + 6, this.currentY);
        this.currentY += this.lineHeight * 0.8;  // Reduced spacing
    }

    addSectionHeader(text) {
        this.checkAndAddPage();
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(14);
        
        // Add section header
        this.currentY += this.lineHeight * 0.8;  // Reduced spacing
        
        // Add text
        this.doc.text(text, this.margins.left, this.currentY);
        
        // Add divider line
        this.currentY += 4;
        this.doc.setDrawColor(100, 100, 100);
        this.doc.setLineWidth(0.4);
        this.doc.line(
            this.margins.left,
            this.currentY,
            this.pageWidth - this.margins.right,
            this.currentY
        );
        
        // Reset font settings and move cursor
        this.currentY += this.lineHeight * 0.5;
        this.doc.setFontSize(this.fontSize);
        this.doc.setFont('helvetica', 'normal');
    }

    addSubsectionHeader(text, indent = 0) {
        this.checkAndAddPage();
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(13);
        
        this.doc.text(text.trim(), this.margins.left + indent, this.currentY);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(this.fontSize);
        this.currentY += this.lineHeight * 1.1;  // Slightly reduced spacing
    }

    addWrappedText(text, indent = 0) {
        if (!text) return;
        const maxWidth = this.pageWidth - this.margins.left - this.margins.right - indent - 5;  // Added small buffer
        const lines = this.doc.splitTextToSize(text, maxWidth);
        lines.forEach(line => {
            this.checkAndAddPage();
            this.doc.text(line.trim(), this.margins.left + indent, this.currentY);
            this.currentY += this.lineHeight * 1.1;  // Slightly reduced spacing
        });
    }

    checkAndAddPage() {
        // Add extra space for footer
        const footerSpace = 50;

        if (this.currentY > this.pageHeight - (this.margins.bottom + 30)) {
            this.doc.addPage();
            this.currentY = this.margins.top;
        }
    }

    addFooter() {
        const pageCount = this.doc.internal.getNumberOfPages();
        const contactText = 'Phone: 786-622-2353 | Email: info@iplcmiami.com';
        this.doc.setFont('helvetica', 'normal');
        
        for (let i = 1; i <= pageCount; i++) {
            const footerY = this.pageHeight - 20;
            this.doc.setPage(i);
            
            // Add subtle line above footer
            this.doc.setDrawColor(200, 200, 200);
            this.doc.setLineWidth(0.2);
            this.doc.line(this.margins.left, footerY - 12, this.pageWidth - this.margins.right, footerY - 8);
            
            // Add contact info on all pages
            this.doc.setFontSize(10);
            this.doc.setTextColor(100, 100, 100);
            const contactWidth = this.doc.getStringUnitWidth(contactText) * 10 / this.doc.internal.scaleFactor;
            const contactX = (this.pageWidth - contactWidth) / 2;
            this.doc.text(contactText, contactX, footerY - 14);

            // Add page numbers
            this.doc.setFontSize(8);
            this.doc.setTextColor(150, 150, 150);
            this.doc.text(
                `Page ${i} of ${pageCount}`,
                this.pageWidth / 2,
                footerY,
                { align: 'center' }
            );
        }
    }
}

// Initialize PDF generator when document is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.pdfGenerator = new PDFGenerator();
        console.log('PDF Generator initialized successfully');
    } catch (error) {
        console.error('Failed to initialize PDF Generator:', error);
    }
});
