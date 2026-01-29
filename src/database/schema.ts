import { getDB } from './db';

export const createTables = async () => {
  const db = await getDB();

  try {
    // Timesheet Tasks Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        employer TEXT,
        punchIn TEXT,
        punchOut TEXT,
        hoursSpent REAL,
        date TEXT NOT NULL,
        completed INTEGER DEFAULT 0
      );
    `);

    // Todo Items Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        category TEXT,
        categoryColor TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Vault Entries Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS vault_entries (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        username TEXT,
        password TEXT,
        notes TEXT,
        category TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Employers Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS employers (
        id TEXT PRIMARY KEY,
        companyName TEXT NOT NULL,
        address TEXT,
        ein TEXT,
        phoneNumber TEXT,
        logoUri TEXT,
        supervisorName TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User Profiles Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        email TEXT,
        phone TEXT,
        profilePictureUri TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};
