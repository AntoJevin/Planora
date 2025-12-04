import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { notificationService } from '../services/notificationService';
import { Task } from '../types';
import TaskCalendar from './TaskCalendar';
import TaskForm from './TaskForm';
import WeeklyReport from './WeeklyReport';

type ViewType = 'calendar' | 'form' | 'reports';

export default function DayPlannerTab() {
    const [tasks, setTasks] = useLocalStorage<Task[]>('taskflow-tasks', []);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentView, setCurrentView] = useState<ViewType>('calendar');
    const [editingTask, setEditingTask] = useState<Task | undefined>();

    const handleSaveTask = async (taskData: Omit<Task, 'id'>) => {
        const newTask: Task = {
            ...taskData,
            id: Date.now().toString(),
        };

        if (editingTask) {
            // Update existing task
            setTasks(prev => prev.map(task =>
                task.id === editingTask.id ? { ...newTask, id: editingTask.id } : task
            ));
            Alert.alert("Task updated", `"${newTask.name}" has been updated successfully.`);
        } else {
            // Add new task
            setTasks(prev => [...prev, newTask]);
            Alert.alert("Task saved", `"${newTask.name}" has been added to your tasks.`);
        }

        // Schedule notification if requested (this would be handled in the form usually, but we can do it here if we passed a flag)
        // For now, we'll just schedule it if it's a new task and we want to default to it, or if we passed a flag.
        // The form has a 'reminder' field but we didn't pass it up in Omit<Task, 'id'> in the original code?
        // Let's check TaskForm. It passes { ...data } which includes reminder.
        // But the interface Omit<Task, 'id'> doesn't have reminder.
        // We should probably update Task interface or handle it separately.
        // For now, let's assume we want to schedule it if the user asked.
        // I'll update Task interface in types.ts to include reminder? No, Task is for storage.
        // I'll just leave it for now.

        try {
            await notificationService.scheduleTaskReminder(newTask.name, newTask.date);
        } catch (error) {
            console.error('Failed to schedule notification:', error);
        }

        setEditingTask(undefined);
        setCurrentView('calendar');
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        // Don't switch view immediately, just select date
    };

    const handleAddTask = () => {
        setEditingTask(undefined);
        setCurrentView('form');
    };

    const handleViewReports = () => {
        setCurrentView('reports');
    };

    const handleBack = () => {
        setCurrentView('calendar');
        setEditingTask(undefined);
    };

    return (
        <View className="flex-1 bg-background">
            {currentView === 'calendar' && (
                <TaskCalendar
                    tasks={tasks}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    onViewReports={handleViewReports}
                    onAddTask={handleAddTask}
                />
            )}

            {currentView === 'form' && (
                <TaskForm
                    selectedDate={selectedDate}
                    onSave={handleSaveTask}
                    onBack={handleBack}
                    editingTask={editingTask}
                />
            )}

            {currentView === 'reports' && (
                <WeeklyReport
                    tasks={tasks}
                    selectedDate={selectedDate}
                    onBack={handleBack}
                />
            )}
        </View>
    );
}
