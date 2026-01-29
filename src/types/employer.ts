export interface Task {
    id: string;
    title: string;
    description?: string;
    employer?: string;
    employerId?: string;
    punchIn?: string;
    punchOut?: string;
    hoursSpent?: number | string;
    date: string | Date;
    completed: boolean;
    hours?: number;
    name?: string;
}

export interface Employer {
    id: string;
    companyName: string;
    address?: string;
    ein?: string;
    phoneNumber?: string;
    logoUri?: string;
    supervisorName?: string;
    createdAt?: string;
}
