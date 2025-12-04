import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { format } from 'date-fns';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Task } from '../types';

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

export default function TaskForm({ selectedDate, onSave, onBack, editingTask }: TaskFormProps) {
    const { control, handleSubmit, watch, formState: { isValid } } = useForm<TaskFormData>({
        defaultValues: {
            name: editingTask?.name || '',
            hours: editingTask?.hours || 1,
            completed: editingTask?.completed || false,
            reminder: false,
        }
    });

    const watchedHours = watch('hours');

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
        <ScrollView className="flex-1 bg-background p-4">
            {/* Header */}
            <View className="flex-row items-center gap-4 mb-6">
                <TouchableOpacity onPress={onBack} className="p-2">
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <View>
                    <Text className="text-xl font-bold text-foreground">
                        {editingTask ? 'Edit Task' : 'New Task'}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Text>
                </View>
            </View>

            {/* Form */}
            <View className="bg-card rounded-xl p-6 shadow-sm border border-border gap-6">
                {/* Task Name */}
                <View className="gap-2">
                    <Text className="font-medium text-foreground">Task Name</Text>
                    <Controller
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { onChange, onBlur, value } }) => (
                            <TextInput
                                className="border border-input rounded-md p-3 text-foreground bg-background"
                                placeholder="What did you work on?"
                                placeholderTextColor="#9ca3af"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                        )}
                        name="name"
                    />
                </View>

                {/* Hours Worked */}
                <View className="gap-4">
                    <Text className="font-medium text-foreground">Hours Worked: {watchedHours}</Text>
                    <Controller
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <Slider
                                style={{ width: '100%', height: 40 }}
                                minimumValue={0.5}
                                maximumValue={24}
                                step={0.5}
                                value={value}
                                onValueChange={onChange}
                                minimumTrackTintColor="#6366f1"
                                maximumTrackTintColor="#e5e7eb"
                                thumbTintColor="#6366f1"
                            />
                        )}
                        name="hours"
                    />
                    <View className="flex-row justify-between">
                        <Text className="text-xs text-muted-foreground">30 min</Text>
                        <Text className="text-xs text-muted-foreground">12 hours</Text>
                        <Text className="text-xs text-muted-foreground">24 hours</Text>
                    </View>
                </View>

                {/* Task Status */}
                <View className="flex-row items-center justify-between p-4 rounded-lg bg-muted/30">
                    <View className="gap-1">
                        <Text className="font-medium text-foreground">Mark as Completed</Text>
                        <Text className="text-sm text-muted-foreground">Track if this task is finished</Text>
                    </View>
                    <Controller
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <Switch
                                value={value}
                                onValueChange={onChange}
                                trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                                thumbColor={'#ffffff'}
                            />
                        )}
                        name="completed"
                    />
                </View>

                {/* Reminder */}
                <View className="flex-row items-center justify-between p-4 rounded-lg bg-muted/30">
                    <View className="flex-row items-center gap-2">
                        <Feather name="bell" size={16} color="#6b7280" />
                        <View>
                            <Text className="font-medium text-foreground">Set Reminder</Text>
                            <Text className="text-sm text-muted-foreground">Get notified tomorrow at 9 AM</Text>
                        </View>
                    </View>
                    <Controller
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <Switch
                                value={value}
                                onValueChange={onChange}
                                trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                                thumbColor={'#ffffff'}
                            />
                        )}
                        name="reminder"
                    />
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3 pt-4">
                    <TouchableOpacity
                        onPress={onBack}
                        className="flex-1 items-center justify-center p-3 rounded-md border border-input"
                    >
                        <Text className="font-medium text-foreground">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleSubmit(onSubmit)}
                        className="flex-1 flex-row items-center justify-center gap-2 bg-primary p-3 rounded-md"
                    >
                        <Feather name="save" size={16} color="#ffffff" />
                        <Text className="font-medium text-primary-foreground">Save Task</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
