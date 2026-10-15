import { getDB } from '../database/db';
import { Employer } from '../types/employer';

export const EmployerService = {
    // Get all employer records
    getAllEmployers: async (): Promise<Employer[]> => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM employers ORDER BY createdAt DESC');
        return result as Employer[];
    },

    // Save or update an employer record
    saveEmployer: async (employer: Employer): Promise<void> => {
        const db = await getDB();

        // Check if employer exists
        const existing = await db.getAllAsync('SELECT * FROM employers WHERE id = ?', [employer.id]);

        if (existing.length > 0) {
            // Update existing record
            await db.runAsync(
                `UPDATE employers SET 
           companyName = ?, address = ?, ein = ?, phoneNumber = ?, logoUri = ?, supervisorName = ?
           WHERE id = ?`,
                [
                    employer.companyName,
                    employer.address || '',
                    employer.ein || '',
                    employer.phoneNumber || '',
                    employer.logoUri || '',
                    employer.supervisorName || '',
                    employer.id
                ]
            );
        } else {
            // Insert new record
            await db.runAsync(
                `INSERT INTO employers (id, companyName, address, ein, phoneNumber, logoUri, supervisorName, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    employer.id,
                    employer.companyName,
                    employer.address || '',
                    employer.ein || '',
                    employer.phoneNumber || '',
                    employer.logoUri || '',
                    employer.supervisorName || '',
                    new Date().toISOString()
                ]
            );
        }
    },

    // Delete the employer record by ID
    deleteEmployer: async (id: string): Promise<void> => {
        const db = await getDB();
        await db.runAsync('DELETE FROM employers WHERE id = ?', [id]);
    },

    // Legacy methods for compatibility (deprecated)
    getEmployer: async (): Promise<Employer | null> => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM employers ORDER BY createdAt ASC LIMIT 1');
        return result.length > 0 ? (result[0] as Employer) : null;
    },

    getEmployerById: async (id: string): Promise<Employer | null> => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM employers WHERE id = ?', [id]);
        return result.length > 0 ? (result[0] as Employer) : null;
    },

    addEmployer: async (employer: Employer): Promise<void> => {
        return EmployerService.saveEmployer(employer);
    },

    updateEmployer: async (employer: Employer): Promise<void> => {
        return EmployerService.saveEmployer(employer);
    }
};


