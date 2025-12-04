import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Clock, BarChart3 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

export interface Task {
  id: string;
  date: Date;
  name: string;
  hours: number;
  completed: boolean;
}

interface TaskCalendarProps {
  tasks: Task[];
  onDateSelect: (date: Date) => void;
  onViewReports: () => void;
  selectedDate: Date;
}

export function TaskCalendar({ tasks, onDateSelect, onViewReports, selectedDate }: TaskCalendarProps) {
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => isSameDay(task.date, date));
  };

  const getTotalHoursForDate = (date: Date) => {
    return getTasksForDate(date).reduce((total, task) => total + task.hours, 0);
  };

  const modifiers = {
    hasTask: (date: Date) => getTasksForDate(date).length > 0,
  };

  const modifiersStyles = {
    hasTask: {
      position: 'relative' as const,
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            TaskFlow
          </h1>
          <p className="text-muted-foreground">Track your daily productivity</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onViewReports}
          className="gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Reports
        </Button>
      </div>

      {/* Calendar Card */}
      <Card className="p-6 shadow-card">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="rounded-md"
          components={{
            DayContent: ({ date }) => {
              const dayTasks = getTasksForDate(date);
              const totalHours = getTotalHoursForDate(date);
              
              return (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <span>{format(date, 'd')}</span>
                  {dayTasks.length > 0 && (
                    <div className="absolute -bottom-1 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-xs text-primary font-medium">
                        {totalHours}h
                      </span>
                    </div>
                  )}
                </div>
              );
            }
          }}
        />
      </Card>

      {/* Selected Date Tasks */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h3>
          <Button size="sm" className="gap-2 bg-gradient-primary">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>

        <div className="space-y-3">
          {getTasksForDate(selectedDate).map((task) => (
            <div 
              key={task.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 transition-smooth hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-success' : 'bg-warning'}`} />
                <span className="font-medium">{task.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{task.hours}h</span>
              </div>
            </div>
          ))}
          
          {getTasksForDate(selectedDate).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No tasks for this day</p>
              <p className="text-sm">Tap "Add Task" to get started</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}