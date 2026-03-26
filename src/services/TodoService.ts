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
        const result = await db.getAllAsync('SELECT * FROM todos ORDER BY orderIndex DESC, createdAt DESC');
        return result.map((row: any) => ({
            ...row,
            completed: !!row.completed,
        })) as Todo[];
    },

    addTodo: async (todo: Todo): Promise<void> => {
        const db = await getDB();
        await db.runAsync(
            `INSERT INTO todos (id, title, completed, category, categoryColor, orderIndex)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [todo.id, todo.title, todo.completed ? 1 : 0, todo.category, todo.categoryColor, Date.now()]
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

    updateTodo: async (todo: Todo): Promise<void> => {
        const db = await getDB();
        await db.runAsync(
            `UPDATE todos SET title = ?, completed = ?, category = ?, categoryColor = ? WHERE id = ?`,
            [todo.title, todo.completed ? 1 : 0, todo.category, todo.categoryColor, todo.id]
        );
    },

    updateTodoOrder: async (todos: Todo[]): Promise<void> => {
        const db = await getDB();
        for (let i = 0; i < todos.length; i++) {
            const newOrderIndex = todos.length - i;
            await db.runAsync('UPDATE todos SET orderIndex = ? WHERE id = ?', [newOrderIndex, todos[i].id]);
        }
    }
};
