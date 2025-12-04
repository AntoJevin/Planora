import { getDB } from '../database/db';

export interface Todo {
    id: string;
    title: string;
    completed: boolean;
    category: string;
    categoryColor: string;
}

export const TodoService = {
    getAllTodos: async (): Promise<Todo[]> => {
        const db = await getDB();
        const result = await db.getAllAsync('SELECT * FROM todos ORDER BY createdAt DESC');
        return result.map((row: any) => ({
            ...row,
            completed: !!row.completed,
        })) as Todo[];
    },

    addTodo: async (todo: Todo): Promise<void> => {
        const db = await getDB();
        await db.runAsync(
            `INSERT INTO todos (id, title, completed, category, categoryColor)
       VALUES (?, ?, ?, ?, ?)`,
            [todo.id, todo.title, todo.completed ? 1 : 0, todo.category, todo.categoryColor]
        );
    },

    toggleTodo: async (id: string, completed: boolean): Promise<void> => {
        const db = await getDB();
        await db.runAsync('UPDATE todos SET completed = ? WHERE id = ?', [completed ? 1 : 0, id]);
    },

    deleteTodo: async (id: string): Promise<void> => {
        const db = await getDB();
        await db.runAsync('DELETE FROM todos WHERE id = ?', [id]);
    },

    updateTodoOrder: async (todos: Todo[]): Promise<void> => {
        // In a real app with order persistence, we'd update an 'order' column.
        // For now, we'll just rely on createdAt or client-side reordering if needed,
        // but since the UI uses DraggableFlatList, we might want to persist the order.
        // For simplicity in this iteration, we won't persist custom drag order in DB yet
        // unless requested, as it requires schema changes (adding orderIndex).
        // We will just return for now.
        return;
    }
};
