import { Feather } from '@expo/vector-icons';
import { format, isSameDay, parseISO } from 'date-fns';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import { Task } from '../types';

interface TaskCalendarProps {
    tasks: Task[];
    onDateSelect: (date: Date) => void;
    onViewReports: () => void;
    selectedDate: Date;
    onAddTask: () => void;
}

export default function TaskCalendar({ tasks, onDateSelect, onViewReports, selectedDate, onAddTask }: TaskCalendarProps) {
    // Helper to safely handle dates that might be strings from AsyncStorage
    const safeDate = (date: Date | string) => {
        return typeof date === 'string' ? parseISO(date) : date;
    };

    const getTasksForDate = (date: Date) => {
        return tasks.filter(task => isSameDay(safeDate(task.date), date));
    };

    const getTotalHoursForDate = (date: Date) => {
        return getTasksForDate(date).reduce((total, task) => total + task.hours, 0);
    };

    const customDatesStyles = tasks.map(task => ({
        date: safeDate(task.date),
        style: {
            // You can add styles here if needed, but CalendarPicker customDatesStyles is limited
        },
        textStyle: {
            // color: 'black',
        },
        containerStyle: {
            backgroundColor: 'rgba(99, 102, 241, 0.1)', // primary/10
        }
    }));

    const selectedTasks = getTasksForDate(selectedDate);

    return (
        <ScrollView className="flex-1 bg-background p-4">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
                <View>
                    <Text className="text-2xl font-bold text-primary">
                        TaskFlow
                    </Text>
                    <Text className="text-muted-foreground">Track your daily productivity</Text>
                </View>
                <TouchableOpacity
                    onPress={onViewReports}
                    className="flex-row items-center gap-2 bg-secondary px-3 py-2 rounded-md"
                >
                    <Feather name="bar-chart-2" size={16} color="#4b5563" />
                    <Text className="text-foreground font-medium">Reports</Text>
                </TouchableOpacity>
            </View>

            {/* Calendar Card */}
            <View className="bg-card rounded-xl p-4 shadow-sm mb-6 border border-border">
                <CalendarPicker
                    onDateChange={onDateSelect}
                    selectedStartDate={selectedDate}
                    width={340}
                    textStyle={{ color: '#000000' }} // Adjust for dark mode later
                    todayBackgroundColor="transparent"
                    todayTextStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                    selectedDayColor="#6366f1"
                    selectedDayTextColor="#ffffff"
                    customDatesStyles={customDatesStyles}
                />
            </View>

            {/* Selected Date Tasks */}
            <View className="bg-card rounded-xl p-4 shadow-sm border border-border mb-20">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-semibold text-foreground">
                        {format(selectedDate, 'EEEE, MMMM d')}
                    </Text>
                    <TouchableOpacity
                        onPress={onAddTask}
                        className="flex-row items-center gap-2 bg-primary px-3 py-2 rounded-md"
                    >
                        <Feather name="plus" size={16} color="#ffffff" />
                        <Text className="text-primary-foreground font-medium">Add Task</Text>
                    </TouchableOpacity>
                </View>

                <View className="gap-3">
                    {selectedTasks.map((task) => (
                        <View
                            key={task.id}
                            className="flex-row items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                            <View className="flex-row items-center gap-3">
                                <View className={`w-2 h-2 rounded-full ${task.completed ? 'bg-success' : 'bg-warning'}`} />
                                <Text className="font-medium text-foreground">{task.name}</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                <Feather name="clock" size={14} color="#6b7280" />
                                <Text className="text-sm text-muted-foreground">{task.hours}h</Text>
                            </View>
                        </View>
                    ))}

                    {selectedTasks.length === 0 && (
                        <View className="items-center py-8">
                            <Feather name="clock" size={32} color="#9ca3af" style={{ marginBottom: 8, opacity: 0.5 }} />
                            <Text className="text-muted-foreground">No tasks for this day</Text>
                            <Text className="text-sm text-muted-foreground">Tap "Add Task" to get started</Text>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}
