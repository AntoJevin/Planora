import { getDB } from '../database/db';
import { Employer } from '../types/employer';

const SINGLE_EMPLOYER_ID = 'employer_primary';

export const EmployerService = {
    // Get the single employer record
    getEmployer: async (): Promise<Employer | null> => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM employers WHERE id = ?', [SINGLE_EMPLOYER_ID]);
        return result.length > 0 ? (result[0] as Employer) : null;
    },

    // Save or update the single employer record
    saveEmployer: async (employer: Employer): Promise<void> => {
        const db = await getDB();

        // Check if employer exists
        const existing = await EmployerService.getEmployer();

        if (existing) {
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
                    SINGLE_EMPLOYER_ID
                ]
            );
        } else {
            // Insert new record with fixed ID
            await db.runAsync(
                `INSERT INTO employers (id, companyName, address, ein, phoneNumber, logoUri, supervisorName, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    SINGLE_EMPLOYER_ID,
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

    // Delete the employer record
    deleteEmployer: async (): Promise<void> => {
        const db = await getDB();
        await db.runAsync('DELETE FROM employers WHERE id = ?', [SINGLE_EMPLOYER_ID]);
    },

    // Legacy methods for compatibility (deprecated)
    getAllEmployers: async (): Promise<Employer[]> => {
        const employer = await EmployerService.getEmployer();
        return employer ? [employer] : [];
    },

    getEmployerById: async (id: string): Promise<Employer | null> => {
        return EmployerService.getEmployer();
    },

    addEmployer: async (employer: Employer): Promise<void> => {
        return EmployerService.saveEmployer(employer);
    },

    updateEmployer: async (employer: Employer): Promise<void> => {
        return EmployerService.saveEmployer(employer);
    }
};

