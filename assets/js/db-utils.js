// Database utilities for managing evaluation data

class DatabaseManager {
    constructor() {
        this.dbName = 'evaluationDB';
        this.dbVersion = 1;
        this.db = null;
    }

    // Initialize the database
    async init() {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create stores if they don't exist
                if (!db.objectStoreNames.contains('evaluations')) {
                    const store = db.createObjectStore('evaluations', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('dateCreated', 'dateCreated');
                    store.createIndex('patientName', 'patientName');
                }
            };
        });
    }

    // Store evaluation data
    async storeEvaluation(data) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['evaluations'], 'readwrite');
            const store = transaction.objectStore('evaluations');

            const evaluation = {
                ...data,
                dateCreated: new Date(),
                lastModified: new Date()
            };

            const request = store.add(evaluation);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Retrieve evaluation by ID
    async getEvaluation(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['evaluations'], 'readonly');
            const store = transaction.objectStore('evaluations');
            const request = store.get(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Update existing evaluation
    async updateEvaluation(id, data) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['evaluations'], 'readwrite');
            const store = transaction.objectStore('evaluations');

            const getRequest = store.get(id);
            getRequest.onerror = () => reject(getRequest.error);
            getRequest.onsuccess = () => {
                const evaluation = getRequest.result;
                if (!evaluation) {
                    reject(new Error('Evaluation not found'));
                    return;
                }

                const updatedEvaluation = {
                    ...evaluation,
                    ...data,
                    lastModified: new Date()
                };

                const putRequest = store.put(updatedEvaluation);
                putRequest.onerror = () => reject(putRequest.error);
                putRequest.onsuccess = () => resolve(putRequest.result);
            };
        });
    }

    // Delete evaluation
    async deleteEvaluation(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['evaluations'], 'readwrite');
            const store = transaction.objectStore('evaluations');
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    // Get all evaluations
    async getAllEvaluations() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['evaluations'], 'readonly');
            const store = transaction.objectStore('evaluations');
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Close the database connection
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Create and export singleton instance
export const dbManager = new DatabaseManager();