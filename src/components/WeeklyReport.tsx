import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, TrendingUp, Clock, Target, CheckCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Task } from './TaskCalendar';

interface WeeklyReportProps {
  tasks: Task[];
  onBack: () => void;
  selectedDate: Date;
}

export function WeeklyReport({ tasks, onBack, selectedDate }: WeeklyReportProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyTasks = tasks.filter(task => 
    task.date >= weekStart && task.date <= weekEnd
  );

  const totalHours = weeklyTasks.reduce((sum, task) => sum + task.hours, 0);
  const completedTasks = weeklyTasks.filter(task => task.completed).length;
  const totalTasks = weeklyTasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const dailyStats = weekDays.map(day => {
    const dayTasks = weeklyTasks.filter(task => isSameDay(task.date, day));
    const dayHours = dayTasks.reduce((sum, task) => sum + task.hours, 0);
    const dayCompleted = dayTasks.filter(task => task.completed).length;
    
    return {
      date: day,
      hours: dayHours,
      tasks: dayTasks.length,
      completed: dayCompleted,
    };
  });

  const averageHours = totalHours / 7;
  const targetHours = 8; // Example target

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">Weekly Report</h2>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTasks}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="p-6 shadow-card">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Weekly Progress</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>{completionRate.toFixed(0)}% completed</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Task Completion</span>
              <span>{completedTasks}/{totalTasks} tasks</span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Daily Average</span>
              <span>{averageHours.toFixed(1)}/{targetHours}h per day</span>
            </div>
            <Progress value={(averageHours / targetHours) * 100} className="h-3" />
          </div>
        </div>
      </Card>

      {/* Daily Breakdown */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4">Daily Breakdown</h3>
        <div className="space-y-3">
          {dailyStats.map((day, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className="text-center min-w-[3rem]">
                  <p className="text-sm font-medium">{format(day.date, 'EEE')}</p>
                  <p className="text-xs text-muted-foreground">{format(day.date, 'd')}</p>
                </div>
                <div>
                  <p className="font-medium">{day.hours.toFixed(1)} hours</p>
                  <p className="text-sm text-muted-foreground">
                    {day.completed}/{day.tasks} tasks completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {day.hours > 0 && (
                  <div className="w-16">
                    <Progress 
                      value={(day.hours / targetHours) * 100} 
                      className="h-2" 
                    />
                  </div>
                )}
                {day.completed === day.tasks && day.tasks > 0 && (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4">Insights</h3>
        <div className="space-y-3">
          {averageHours >= targetHours && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-success">Great productivity!</p>
                <p className="text-sm text-muted-foreground">
                  You're meeting your daily hour targets this week.
                </p>
              </div>
            </div>
          )}
          
          {completionRate >= 80 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-primary">Excellent completion rate!</p>
                <p className="text-sm text-muted-foreground">
                  You completed {completionRate.toFixed(0)}% of your planned tasks.
                </p>
              </div>
            </div>
          )}
          
          {averageHours < targetHours && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-warning">Room for improvement</p>
                <p className="text-sm text-muted-foreground">
                  Try to increase your daily hours to reach your {targetHours}h target.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}