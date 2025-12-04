import { getDB } from '../database/db';
import { Task } from '../types';

export const TaskService = {
    getAllTasks: async (): Promise<Task[]> => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM tasks ORDER BY date DESC');
        return result as Task[];
    },

    getTasksByDate: async (date: string): Promise<Task[]> => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM tasks WHERE date = ?', [date]);
        return result as Task[];
    },

    addTask: async (task: Task): Promise<void> => {
        const db = await getDB();
        await db.runAsync(
            `INSERT INTO tasks (id, title, description, employer, punchIn, punchOut, hoursSpent, date, completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                task.id,
                task.title,
                task.description || '',
                task.employer || '',
                task.punchIn || '',
                task.punchOut || '',
                task.hoursSpent || 0,
                task.date,
                task.completed ? 1 : 0
            ]
        );
    },

    updateTask: async (task: Task): Promise<void> => {
        const db = await getDB();
        await db.runAsync(
            `UPDATE tasks SET 
       title = ?, description = ?, employer = ?, punchIn = ?, punchOut = ?, hoursSpent = ?, date = ?, completed = ?
       WHERE id = ?`,
            [
                task.title,
                task.description || '',
                task.employer || '',
                task.punchIn || '',
                task.punchOut || '',
                task.hoursSpent || 0,
                task.date,
                task.completed ? 1 : 0,
                task.id
            ]
        );
    },

    deleteTask: async (id: string): Promise<void> => {
        const db = await getDB();
        await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
    },

    toggleTaskCompletion: async (id: string, completed: boolean): Promise<void> => {
        const db = await getDB();
        await db.runAsync('UPDATE tasks SET completed = ? WHERE id = ?', [completed ? 1 : 0, id]);
    }
};
