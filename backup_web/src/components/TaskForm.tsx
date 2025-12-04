import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { Task } from './TaskCalendar';

interface TaskFormProps {
  selectedDate: Date;
  onSave: (task: Omit<Task, 'id'>) => void;
  onBack: () => void;
  editingTask?: Task;
}

interface TaskFormData {
  name: string;
  hours: number;
  completed: boolean;
  reminder: boolean;
}

export function TaskForm({ selectedDate, onSave, onBack, editingTask }: TaskFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { isValid } } = useForm<TaskFormData>({
    defaultValues: {
      name: editingTask?.name || '',
      hours: editingTask?.hours || 1,
      completed: editingTask?.completed || false,
      reminder: false,
    }
  });

  const watchedHours = watch('hours');
  const watchedCompleted = watch('completed');
  const watchedReminder = watch('reminder');

  const onSubmit = (data: TaskFormData) => {
    onSave({
      date: selectedDate,
      name: data.name,
      hours: data.hours,
      completed: data.completed,
    });
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">
            {editingTask ? 'Edit Task' : 'New Task'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6 shadow-card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Task Name</Label>
            <Input
              id="name"
              placeholder="What did you work on?"
              {...register('name', { required: true })}
              className="text-base"
            />
          </div>

          {/* Hours Worked */}
          <div className="space-y-4">
            <Label>Hours Worked: {watchedHours}</Label>
            <Slider
              value={[watchedHours]}
              onValueChange={(value) => setValue('hours', value[0])}
              max={24}
              min={0.5}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>30 min</span>
              <span>12 hours</span>
              <span>24 hours</span>
            </div>
          </div>

          {/* Task Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="space-y-1">
              <Label htmlFor="completed">Mark as Completed</Label>
              <p className="text-sm text-muted-foreground">
                Track if this task is finished
              </p>
            </div>
            <Switch
              id="completed"
              checked={watchedCompleted}
              onCheckedChange={(checked) => setValue('completed', checked)}
            />
          </div>

          {/* Reminder */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="space-y-1 flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="reminder">Set Reminder</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified tomorrow at 9 AM
                </p>
              </div>
            </div>
            <Switch
              id="reminder"
              checked={watchedReminder}
              onCheckedChange={(checked) => setValue('reminder', checked)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid}
              className="flex-1 gap-2 bg-gradient-primary"
            >
              <Save className="h-4 w-4" />
              Save Task
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}