import { getDB } from '../database/db';
import { UserProfile } from '../types/userProfile';

const SINGLE_USER_ID = 'user_primary';

export const ProfileService = {
    // Get the single profile record
    getProfile: async (): Promise<UserProfile | null> => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM user_profiles WHERE id = ?', [SINGLE_USER_ID]);
        return result.length > 0 ? (result[0] as UserProfile) : null;
    },

    // Save or update the single profile record
    saveProfile: async (profile: UserProfile): Promise<void> => {
        const db = await getDB();

        // Check if profile exists
        const existing = await ProfileService.getProfile();

        if (existing) {
            // Update existing record
            await db.runAsync(
                `UPDATE user_profiles SET 
           name = ?, address = ?, email = ?, phone = ?, profilePictureUri = ?
           WHERE id = ?`,
                [
                    profile.name,
                    profile.address || '',
                    profile.email || '',
                    profile.phone || '',
                    profile.profilePictureUri || '',
                    SINGLE_USER_ID
                ]
            );
        } else {
            // Insert new record with fixed ID
            await db.runAsync(
                `INSERT INTO user_profiles (id, name, address, email, phone, profilePictureUri, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    SINGLE_USER_ID,
                    profile.name,
                    profile.address || '',
                    profile.email || '',
                    profile.phone || '',
                    profile.profilePictureUri || '',
                    new Date().toISOString()
                ]
            );
        }
    },

    // Delete the profile record
    deleteProfile: async (): Promise<void> => {
        const db = await getDB();
        await db.runAsync('DELETE FROM user_profiles WHERE id = ?', [SINGLE_USER_ID]);
    }
};
