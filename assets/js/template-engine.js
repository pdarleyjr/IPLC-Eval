// Simple template engine for form sections

class TemplateEngine {
    constructor() {
        this.templates = new Map();
        this.initializeTemplates();
    }

    // Initialize default templates
    initializeTemplates() {
        // Clinical Impressions template
        this.registerTemplate('clinicalImpressions', (data) => {
            const name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            const age = this.formatAge(data.age);
            let impression = `Based on the results of formal and informal assessment, as well as parent interview and clinical observation, ${name}`;

            if (age) {
                impression += ` (${age})`;
            }

            impression += ' presents with ';

            // Add assessment findings
            if (data.standardizedAssessment) {
                impression += this.getStandardizedAssessmentSummary(data);
            }

            // Add oral mechanism findings
            if (data.oralMechanism) {
                impression += this.getOralMechanismSummary(data);
            }

            // Add speech sound findings
            if (data.speechSound) {
                impression += this.getSpeechSoundSummary(data);
            }

            // Add prognosis
            impression += '\n\nBased on these results and with appropriate intervention and family support, prognosis for improved communication skills is favorable. Regular attendance and participation in therapy sessions, along with consistent home practice, will be essential for optimal progress.';

            return impression;
        });

        // Recommendations template
        this.registerTemplate('recommendations', (data) => {
            let recommendations = 'Based on the information obtained through the assessment tools and parent interview, the following recommendations are made:\n\n';

            const recs = new Set();

            // Process protocol section which contains selected recommendations
            if (Array.isArray(data.protocol)) {
                if (data.protocol.includes('backgroundInfo')) {
                    recs.add('Continued monitoring of developmental milestones');
                }
                if (data.protocol.includes('speechSound')) {
                    recs.add('Individual speech therapy focusing on sound production and phonological processes');
                }

                if (data.protocol.includes('oralMechanism')) {
                    recs.add('Oral motor exercises and activities to improve muscle strength and coordination');
                }

                if (data.protocol.includes('otherComponent') && data.otherComponentText) {
                    recs.add(data.otherComponentText);
                }
            }

            if (recs.size === 0) {
                recs.add('Continued monitoring of speech and language development');
            }

            // Add recommendations based on standardized assessment
            if (data.standardizedAssessment) {
                const { tl } = data.standardizedAssessment;
                if (tl && tl.standardScore) {
                    if (tl.standardScore < 85) {
                        recs.add('Regular speech-language therapy sessions');
                        recs.add('Home practice program to reinforce therapy goals');
                        recs.add('Reevaluation in 6 months to monitor progress');
                    }
                }
            }

            if (data.referral) {
                recs.add(`Referral to: ${data.referralDetails || ''}`);
            }

            if (data.otherRecommendations) {
                recs.add(data.otherRecommendations);
            }

            return recommendations + Array.from(recs).map(rec => `• ${rec}`).join('\n');
        });

        // Oral Mechanism Summary template
        this.registerTemplate('oralMechanismSummary', (data) => this.getOralMechanismSummary(data));

        // Speech Sound Summary template
        this.registerTemplate('speechSoundSummary', (data) => this.getSpeechSoundSummary(data));
    }

    // Helper methods for generating specific parts of the summary
    getStandardizedAssessmentSummary(data) {
        let summary = '';
        if (data.standardizedAssessment) {
            const { ac, ec, tl } = data.standardizedAssessment;
            
            if (tl && tl.standardScore) {
                const score = tl.standardScore;
                if (score >= 85) {
                    summary += 'overall speech-language skills that are developing within normal limits';
                } else if (score >= 78) {
                    summary += 'mild delays in overall speech and language development';
                } else if (score >= 71) {
                    summary += 'moderate delays in overall speech and language development';
                } else {
                    summary += 'severe delays in overall speech and language development';
                }
                
                if (ac && ac.standardScore) {
                    summary += `. Auditory comprehension skills are in the ${ac.severity.toLowerCase()} range`;
                }
                
                if (ec && ec.standardScore) {
                    summary += `, and expressive communication skills are in the ${ec.severity.toLowerCase()} range`;
                }
                
                summary += '. ';
            } else {
                summary += 'speech-language skills that require further assessment. ';
            }
        }
        return summary;
    }

    getOralMechanismSummary(data) {
        let summary = '\n\nOral mechanism examination revealed:\n';
        if (data.oralMechanism) {
            const structure = data.oralMechanism.structure || {};
            const functionData = data.oralMechanism.function || {};
            const overallNotes = data.oralMechanism.overallNotes;

            summary += `\nStructure Assessment:\n`;
            if (Object.keys(structure).length > 0) {
                summary += `- Face: ${structure.faceWNL ? 'Within Normal Limits' : structure.faceConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Mandible: ${structure.mandibleWNL ? 'Within Normal Limits' : structure.mandibleConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Teeth: ${structure.teethWNL ? 'Within Normal Limits' : structure.teethConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Palatal: ${structure.palatalWNL ? 'Within Normal Limits' : structure.palatalConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Lips: ${structure.lipsWNL ? 'Within Normal Limits' : structure.lipsConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                
                if (structure.structureNotes) {
                    summary += `\nStructure Notes: ${structure.structureNotes}\n`;
                }
            }

            summary += `\nFunction Assessment:\n`;
            if (Object.keys(functionData).length > 0) {
                summary += `- Jaw Movement: ${functionData.jawWNL ? 'Within Normal Limits' : functionData.jawConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Velopharyngeal Function: ${functionData.velopharyngealWNL ? 'Within Normal Limits' : functionData.velopharyngealConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Phonation: ${functionData.phonationWNL ? 'Within Normal Limits' : functionData.phonationConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Oral Reflexes: ${functionData.reflexesWNL ? 'Within Normal Limits' : functionData.reflexesConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                summary += `- Motor Coordination: ${functionData.motorWNL ? 'Within Normal Limits' : functionData.motorConcern ? 'Area of Concern' : 'Not assessed'}\n`;
                
                if (functionData.functionNotes) {
                    summary += `\nFunction Notes: ${functionData.functionNotes}\n`;
                }
            }
            
            if (overallNotes) {
                summary += `\nOverall Notes: ${overallNotes}\n`;
            }
        }
        return summary;
    }

    getSpeechSoundSummary(data) {
        let summary = '\n\nSpeech sound assessment revealed:\n';
        if (data.speechSound) {
            const articulation = data.speechSound.articulation;
            const intelligibility = data.speechSound.intelligibility || {};
            const overallNotes = data.speechSound.overallNotes;

            if (articulation && articulation.errorPatterns && articulation.errorPatterns.length) {
                summary += `\nError Patterns:\n`;
                articulation.errorPatterns.forEach(pattern => {
                    summary += `- Substitution of ${pattern.substitution} for ${pattern.sound} in ${pattern.positions.join(', ')} positions.\n`;
                });
            }

            if (articulation && articulation.developmentallyAppropriateErrors && articulation.developmentallyAppropriateErrors.length) {
                summary += `\nDevelopmentally Appropriate Errors (to monitor):\n`;
                articulation.developmentallyAppropriateErrors.forEach(error => {
                    summary += `- Substitution of ${error.substitution} for ${error.sound} (e.g., ${error.example})\n`;
                });
            }

            if (articulation && articulation.phonemeInventory && articulation.phonemeInventory.length) {
                summary += `\nPhoneme Inventory (partial):\n- ${articulation.phonemeInventory.join(', ')}\n`;
            }
            if (articulation && articulation.stimulability) {
                summary += `\nStimulability: ${articulation.stimulability}\n`;
            }
            if (articulation && articulation.consistency) {
                summary += `\nConsistency of Errors: ${articulation.consistency}\n`;
            }

            summary += `\nIntelligibility:\n`;
            if (Object.keys(intelligibility).length > 0) {
                summary += `- Familiar Listeners: ${intelligibility.familiarHigh ? 'High' : intelligibility.familiarModerate ? 'Moderate' : intelligibility.familiarPoor ? 'Poor' : intelligibility.familiarVeryPoor ? 'Very Poor' : 'Not assessed'}\n`;
                summary += `- Unfamiliar Listeners: ${intelligibility.unfamiliarHigh ? 'High' : intelligibility.unfamiliarModerate ? 'Moderate' : intelligibility.unfamiliarPoor ? 'Poor' : intelligibility.unfamiliarVeryPoor ? 'Very Poor' : 'Not assessed'}\n`;
                summary += intelligibility.intelligibilityNotes ? `\nNotes: ${intelligibility.intelligibilityNotes}\n` : '';
            }

            if (overallNotes) {
                summary += `\nOverall Notes: ${overallNotes}\n`;
            }
        }
        return summary;
    }


    // Register a template
    registerTemplate(name, template) {
        this.templates.set(name, template);
    }

    // Render a template with data
    render(name, data = {}) {
        const template = this.templates.get(name);
        if (!template) {
            throw new Error(`Template "${name}" not found`);
        }

        return template(data);
    }

    // Helper method to escape HTML
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Helper method to format dates
    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString();
    }

    // Helper method to format age
    formatAge(age) {
        if (!age) return '';

        // If age is already in the format "X years, Y months"
        if (typeof age === 'string' && age.includes('years')) {
            return age;
        }

        // If age is an object with years and months
        if (typeof age === 'object' && age !== null) {
            const years = age.years || 0;
            const months = age.months || 0;
            if (years === 0) {
                return `${months} month${months !== 1 ? 's' : ''} old`;
            }
            if (months === 0) {
                return `${years} year${years !== 1 ? 's' : ''} old`;
            }
            return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''} old`;
        }

        // If age is a number (assumed to be years)
        const years = parseInt(age);
        if (!isNaN(years)) {
            return `${years} year${years !== 1 ? 's' : ''} old`;
        }

        return '';
    }

    // Generate complete summary
    generateSummary(formData) {
        try {
            // Generate clinical impressions
            const impressions = this.render('clinicalImpressions', formData);

            // Generate recommendations
            const recommendations = this.render('recommendations', formData);

            // Combine sections
            return `${impressions}\n\n${recommendations}`;
        } catch (error) {
            console.error('Error generating summary:', error);
            return 'Error generating summary. Please try again.';
        }
    }
}

// Create and export singleton instance
export const templateEngine = new TemplateEngine();