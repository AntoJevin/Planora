import { Feather } from '@expo/vector-icons';
import {
    eachWeekOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    startOfMonth
} from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSettings } from '../context/SettingsContext';

interface MonthlyReportProps {
    tasks: any[];
    onBack: () => void;
    selectedDate: Date;
    employer?: any;
}

export default function MonthlyReport({ tasks, onBack, selectedDate, employer }: MonthlyReportProps) {
    const { darkMode, targetHours } = useSettings();
    const colors = {
        background: '#f8fafc',
        surface: 'white',
        primary: '#10b981', // Using green for monthly
        onPrimary: '#111827',
        onSurface: '#111827',
        secondary: '#4b5563',
        onSecondary: '#111827',
        text: '#111827',
        subtext: '#6b7280',
        border: '#e5e7eb',
    };

    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const monthlyTasks = tasks.filter(task => {
        const taskDate = typeof task.date === 'string'
            ? new Date(task.date.split('-').map(Number)[0], task.date.split('-').map(Number)[1] - 1, task.date.split('-').map(Number)[2])
            : task.date;
        return isSameMonth(taskDate, selectedDate);
    });

    const totalHours = monthlyTasks.reduce((sum, task) => sum + (task.hoursSpent || task.hours || 0), 0);
    const completedTasks = monthlyTasks.filter(task => task.completed).length;
    const totalTasks = monthlyTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Group by weeks
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    const weeklyStats = weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekTasks = monthlyTasks.filter(task => {
            const taskDate = typeof task.date === 'string'
                ? new Date(task.date.split('-').map(Number)[0], task.date.split('-').map(Number)[1] - 1, task.date.split('-').map(Number)[2])
                : task.date;
            return taskDate >= weekStart && taskDate <= weekEnd;
        });

        const weekHours = weekTasks.reduce((sum, task) => sum + (task.hoursSpent || task.hours || 0), 0);
        const weekCompleted = weekTasks.filter(task => task.completed).length;

        return {
            start: weekStart,
            end: weekEnd,
            hours: weekHours,
            tasks: weekTasks.length,
            completed: weekCompleted,
        };
    });

    const averageHours = totalHours / (weeks.length * 7);

    const AnimatedProgressBar = ({ value, color = colors.primary }: { value: number; color?: string }) => {
        const width = useSharedValue(0);
        useEffect(() => {
            width.value = withTiming(Math.min(Math.max(value, 0), 100), { duration: 1000 });
        }, [value]);
        const animatedStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));
        return (
            <View style={[styles.progressContainer, darkMode && darkStyles.progressContainer]}>
                <Animated.View style={[styles.progressBar, { backgroundColor: color }, animatedStyle]} />
            </View>
        );
    };

    const DailyTaskBar = ({ total, completed }: { total: number; completed: number }) => {
        const fillWidth = useSharedValue(0);
        useEffect(() => {
            fillWidth.value = withTiming(total > 0 ? (completed / total) * 100 : 0, { duration: 1000 });
        }, [total, completed]);
        const animatedFillStyle = useAnimatedStyle(() => ({ width: `${fillWidth.value}%` }));
        return (
            <View style={styles.taskBarRow}>
                <View style={[styles.staticProgressBarContainer, darkMode && darkStyles.progressContainer]}>
                    <Animated.View style={[styles.miniProgressBar, animatedFillStyle]} />
                </View>
            </View>
        );
    };

    const generatePDF = async () => {
        try {
            const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
              h1 { color: #111827; }
              h2 { color: #4b5563; font-size: 16px; margin-bottom: 30px; }
              .summary { display: flex; gap: 20px; margin-bottom: 30px; }
              .card { background: #f3f4f6; padding: 15px; border-radius: 8px; flex: 1; }
              .value { font-size: 24px; font-weight: bold; color: #111827; }
              .label { font-size: 12px; color: #6b7280; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
              th { color: #6b7280; font-size: 12px; text-transform: uppercase; }
              td { color: #111827; }
            </style>
          </head>
          <body>
            <h1>Monthly Report</h1>
            ${employer ? `
              <div style="margin-bottom: 20px;">
                <h2 style="margin-bottom: 5px; color: #111827;">${employer.companyName}</h2>
                ${employer.address ? `<p style="margin: 0; color: #4b5563;">${employer.address}</p>` : ''}
                ${employer.ein ? `<p style="margin: 0; color: #4b5563;">EIN: ${employer.ein}</p>` : ''}
                ${employer.supervisorName ? `<p style="margin: 0; color: #4b5563;">Supervisor: ${employer.supervisorName}</p>` : ''}
              </div>
            ` : ''}
            <h2>${format(monthStart, 'MMMM yyyy')}</h2>
            <div class="summary">
              <div class="card"><div class="value">${totalHours.toFixed(1)}h</div><div class="label">Total Hours</div></div>
              <div class="card"><div class="value">${completedTasks}</div><div class="label">Completed</div></div>
              <div class="card"><div class="value">${completionRate.toFixed(0)}%</div><div class="label">Completion</div></div>
            </div>
            <h3>Weekly Breakdown</h3>
            <table>
              <thead><tr><th>Week</th><th>Hours</th><th>Tasks</th></tr></thead>
              <tbody>
                ${weeklyStats.map(week => `
                  <tr>
                    <td>${format(week.start, 'MMM d')} - ${format(week.end, 'MMM d')}</td>
                    <td>${week.hours.toFixed(1)}h</td>
                    <td>${week.completed}/${week.tasks}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
            const { uri } = await printToFileAsync({ html });
            const fileName = `Monthly_Report_${format(selectedDate, 'MMMM_yyyy')}.pdf`;
            const newUri = FileSystem.documentDirectory + fileName;
            await FileSystem.moveAsync({ from: uri, to: newUri });
            await shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate PDF report');
        }
    };

    return (
        <ScrollView style={[styles.container, darkMode && darkStyles.container]}>
            <View style={[styles.header, darkMode && darkStyles.header]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={18} color={colors.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, darkMode && darkStyles.text]}>Monthly Report</Text>
                    <Text style={[styles.headerSubtitle, darkMode && darkStyles.subtext]}>
                        {format(selectedDate, 'MMMM yyyy')}
                    </Text>
                </View>
                <TouchableOpacity onPress={generatePDF} style={styles.downloadButton}>
                    <Feather name="download" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, darkMode && darkStyles.card, !darkMode && { shadowColor: '#10b981' }]}>
                    <View style={[styles.iconBg, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                        <Feather name="clock" size={20} color="#10b981" />
                    </View>
                    <View>
                        <Text style={[styles.summaryValue, darkMode && darkStyles.text]}>{totalHours.toFixed(1)}h</Text>
                        <Text style={[styles.summaryLabel, darkMode && darkStyles.subtext]}>Total Hours</Text>
                    </View>
                </View>
                <View style={[styles.summaryCard, darkMode && darkStyles.card, !darkMode && { shadowColor: '#22c55e' }]}>
                    <View style={[styles.iconBg, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                        <Feather name="check-circle" size={20} color="#22c55e" />
                    </View>
                    <View>
                        <Text style={[styles.summaryValue, darkMode && darkStyles.text]}>{completedTasks}</Text>
                        <Text style={[styles.summaryLabel, darkMode && darkStyles.subtext]}>Completed</Text>
                    </View>
                </View>
            </View>

            <View style={[styles.card, darkMode && darkStyles.card, !darkMode && { shadowColor: colors.primary }]}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, darkMode && darkStyles.text]}>Monthly Progress</Text>
                    <View style={styles.trendingContainer}>
                        <Feather name="trending-up" size={16} color={darkMode ? '#94a3b8' : '#6b7280'} />
                        <Text style={[styles.trendingText, darkMode && darkStyles.subtext]}>{completionRate.toFixed(0)}% completed</Text>
                    </View>
                </View>

                <View style={styles.progressSection}>
                    <View style={styles.progressLabelRow}>
                        <Text style={[styles.progressLabel, darkMode && darkStyles.textSecondary]}>Task Completion</Text>
                        <Text style={[styles.progressValue, darkMode && darkStyles.textSecondary]}>{completedTasks}/{totalTasks} tasks</Text>
                    </View>
                    <AnimatedProgressBar value={completionRate} color={colors.primary} />
                </View>
            </View>

            <View style={[styles.card, darkMode && darkStyles.card, !darkMode && { shadowColor: colors.primary }]}>
                <Text style={[styles.cardTitle, darkMode && darkStyles.text]}>Weekly Breakdown</Text>
                <View style={styles.dailyList}>
                    {weeklyStats.map((week, index) => (
                        <View key={index} style={[styles.dailyItem, darkMode && darkStyles.dailyItem]}>
                            <View style={styles.dailyLeft}>
                                <View style={styles.dayLabel}>
                                    <Text style={[styles.dayName, darkMode && darkStyles.text]}>Week {index + 1}</Text>
                                    <Text style={[styles.dayNumber, darkMode && darkStyles.subtext]}>
                                        {format(week.start, 'MMM d')}
                                    </Text>
                                </View>
                                <View>
                                    <Text style={[styles.dailyHours, darkMode && darkStyles.text]}>{week.hours.toFixed(1)} hours</Text>
                                    <Text style={[styles.dailyTasks, darkMode && darkStyles.subtext]}>
                                        {week.completed}/{week.tasks} tasks completed
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.dailyRight}>
                                <DailyTaskBar total={week.tasks} completed={week.completed} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Insights */}
            <View style={[styles.card, { marginBottom: 40 }, darkMode && darkStyles.card]}>
                <Text style={[styles.cardTitle, darkMode && darkStyles.text]}>Insights</Text>
                <View style={styles.insightsList}>
                    {completionRate >= 80 && (
                        <View style={[styles.insightCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Feather name="target" size={20} color="#10b981" style={styles.insightIcon} />
                            <View style={styles.insightContent}>
                                <Text style={[styles.insightTitle, { color: '#10b981' }]}>Excellent month!</Text>
                                <Text style={[styles.insightText, darkMode && { color: '#94a3b8' }]}>
                                    You completed {completionRate.toFixed(0)}% of your tasks this month.
                                </Text>
                            </View>
                        </View>
                    )}

                    {totalHours >= (targetHours * (weeks.length)) && (
                        <View style={[styles.insightCard, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                            <Feather name="trending-up" size={20} color="#22c55e" style={styles.insightIcon} />
                            <View style={styles.insightContent}>
                                <Text style={[styles.insightTitle, { color: '#22c55e' }]}>Highly productive!</Text>
                                <Text style={[styles.insightText, darkMode && { color: '#94a3b8' }]}>
                                    You exceeded your average monthly hour targets.
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', gap: 16, paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    headerSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    downloadButton: { padding: 8 },
    summaryRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 20, shadowOpacity: 0.1 },
    iconBg: { padding: 8, borderRadius: 8 },
    summaryValue: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    summaryLabel: { fontSize: 12, color: '#6b7280' },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 24, marginHorizontal: 16, marginBottom: 16, elevation: 3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 20, shadowOpacity: 0.1 },
    cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: 20, color: '#111827' },
    progressSection: { marginBottom: 12 },
    progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressLabel: { fontSize: 14, color: '#374151' },
    progressValue: { fontSize: 14, color: '#374151' },
    progressContainer: { height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 6 },
    dailyList: { gap: 12 },
    dailyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: 'rgba(249, 250, 251, 0.3)', borderRadius: 8 },
    dailyLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
    dayLabel: { alignItems: 'flex-start', minWidth: 65 },
    dayName: { fontSize: 13, fontWeight: '600', color: '#111827' },
    dayNumber: { fontSize: 11, color: '#6b7280', marginTop: 1 },
    dailyHours: { fontSize: 14, fontWeight: '600', color: '#111827' },
    dailyTasks: { fontSize: 12, color: '#6b7280', marginTop: 1 },
    dailyRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    taskBarRow: { width: 90, alignItems: 'stretch' },
    staticProgressBarContainer: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden', width: '100%' },
    miniProgressBar: { height: '100%', backgroundColor: '#10b981', borderRadius: 4 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    trendingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    trendingText: { fontSize: 14, color: '#6b7280' },

    insightsList: { gap: 12 },
    insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 8 },
    insightIcon: { marginTop: 2 },
    insightContent: { flex: 1 },
    insightTitle: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
    insightText: { fontSize: 12, color: '#6b7280' },
});

const darkStyles = StyleSheet.create({
    container: { backgroundColor: '#0f172a' },
    header: { backgroundColor: '#0f172a' },
    card: { backgroundColor: '#1e293b', shadowColor: '#000', shadowOpacity: 0.3 },
    text: { color: '#f1f5f9' },
    textSecondary: { color: '#cbd5e1' },
    subtext: { color: '#94a3b8' },
    dailyItem: { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
    progressContainer: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
});
