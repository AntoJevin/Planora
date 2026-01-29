import { getDB } from '../database/db';

export interface VaultEntry {
    id: string;
    title: string;
    username?: string;
    password?: string;
    notes?: string;
    category: string;
}

export const VaultService = {
    getAllEntries: async (): Promise<VaultEntry[]> => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM vault_entries ORDER BY createdAt DESC');
        return result as VaultEntry[];
    },

    addEntry: async (entry: VaultEntry): Promise<void> => {
        const db = await getDB();
        await db.runAsync(
            `INSERT INTO vault_entries (id, title, username, password, notes, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [entry.id, entry.title, entry.username || null, entry.password || null, entry.notes || null, entry.category]
        );
    },

    updateEntry: async (entry: VaultEntry): Promise<void> => {
        const db = await getDB();
        await db.runAsync(
            `UPDATE vault_entries SET title = ?, username = ?, password = ?, notes = ?, category = ? WHERE id = ?`,
            [entry.title, entry.username || null, entry.password || null, entry.notes || null, entry.category, entry.id]
        );
    },

    deleteEntry: async (id: string): Promise<void> => {
        const db = await getDB();
        await db.runAsync('DELETE FROM vault_entries WHERE id = ?', [id]);
    }
};
