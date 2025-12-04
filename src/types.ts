export interface Task {
    id: string;
    title: string;
    description?: string;
    employer?: string;
    punchIn?: string;
    punchOut?: string;
    hoursSpent?: number;
    date: string;
    completed: boolean;
    // Legacy support if needed for other components not yet updated
    name?: string;
    hours?: number;
}
