import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('timesheet.db');
    }
    return db;
};

export const initDB = async () => {
    const database = await getDB();
    // Foreign keys are enabled by default in expo-sqlite for new databases, 
    // but good to be aware of.
    await database.execAsync('PRAGMA foreign_keys = ON;');
};

export const clearAllData = async () => {
    const database = await getDB();
    try {
        await database.execAsync('DELETE FROM tasks');
        await database.execAsync('DELETE FROM todos');
        await database.execAsync('DELETE FROM vault_entries');
        console.log('All data cleared successfully');
    } catch (error) {
        console.error('Error clearing data:', error);
        throw error;
    }
};
