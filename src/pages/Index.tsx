import React, { useState } from 'react';
import { TaskCalendar, Task } from '@/components/TaskCalendar';
import { TaskForm } from '@/components/TaskForm';
import { WeeklyReport } from '@/components/WeeklyReport';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { notificationService } from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';

type View = 'calendar' | 'form' | 'reports';

const Index = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('taskflow-tasks', []);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>('calendar');
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const { toast } = useToast();

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
      toast({
        title: "Task updated",
        description: `"${newTask.name}" has been updated successfully.`,
      });
    } else {
      // Add new task
      setTasks(prev => [...prev, newTask]);
      toast({
        title: "Task saved",
        description: `"${newTask.name}" has been added to your tasks.`,
      });
    }

    // Schedule notification if requested (this would be handled in the form)
    try {
      await notificationService.scheduleTaskReminder(newTask.name, newTask.date);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }

    setEditingTask(undefined);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-md">
        {currentView === 'calendar' && (
          <TaskCalendar
            tasks={tasks}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onViewReports={handleViewReports}
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
      </div>
    </div>
  );
};

export default Index;
