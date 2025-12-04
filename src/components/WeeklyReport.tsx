import { Feather } from '@expo/vector-icons';
import { eachDayOfInterval, endOfWeek, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { darkColors } from '../theme/darkTheme';
import { Task } from '../types';

interface WeeklyReportProps {
  tasks: Task[];
  onBack: () => void;
  selectedDate: Date;
}

export default function WeeklyReport({ tasks, onBack, selectedDate }: WeeklyReportProps) {
  const { darkMode } = useSettings();
  const colors = darkMode ? darkColors : {
    background: '#f8fafc',
    surface: 'white',
    primary: '#6366f1',
    onPrimary: '#111827',
    onSurface: '#111827',
    secondary: '#4b5563',
    onSecondary: '#111827',
    text: '#111827',
    subtext: '#6b7280',
    border: '#e5e7eb',
  };

  const { targetHours } = useSettings();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const safeDate = (date: Date | string) => {
    return typeof date === 'string' ? parseISO(date) : date;
  };

  const weeklyTasks = tasks.filter(task => {
    const taskDate = safeDate(task.date);
    return taskDate >= weekStart && taskDate <= weekEnd;
  });

  const totalHours = weeklyTasks.reduce((sum, task) => sum + (task.hoursSpent || task.hours || 0), 0);
  const completedTasks = weeklyTasks.filter(task => task.completed).length;
  const totalTasks = weeklyTasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const dailyStats = weekDays.map(day => {
    const dayTasks = weeklyTasks.filter(task => isSameDay(safeDate(task.date), day));
    const dayHours = dayTasks.reduce((sum, task) => sum + (task.hoursSpent || task.hours || 0), 0);
    const dayCompleted = dayTasks.filter(task => task.completed).length;

    return {
      date: day,
      hours: dayHours,
      tasks: dayTasks.length,
      completed: dayCompleted,
    };
  });

  const averageHours = totalHours / 7;

  const ProgressBar = ({ value }: { value: number }) => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${Math.min(Math.max(value, 0), 100)}%` }]} />
    </View>
  );

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
            <h1>Weekly Report</h1>
            <h2>${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}</h2>
            
            <div class="summary">
              <div class="card">
                <div class="value">${totalHours.toFixed(1)}h</div>
                <div class="label">Total Hours</div>
              </div>
              <div class="card">
                <div class="value">${completedTasks}</div>
                <div class="label">Completed Tasks</div>
              </div>
              <div class="card">
                <div class="value">${completionRate.toFixed(0)}%</div>
                <div class="label">Completion Rate</div>
              </div>
              <div class="card">
                <div class="value">${averageHours >= targetHours ? 'Met' : 'Missed'}</div>
                <div class="label">Weekly Target</div>
              </div>
            </div>

            <h3>Daily Breakdown</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Tasks</th>
                </tr>
              </thead>
              <tbody>
                ${dailyStats.map(day => `
                  <tr>
                    <td>${format(day.date, 'EEE, MMM d')}</td>
                    <td>${day.hours.toFixed(1)}h</td>
                    <td>${day.completed}/${day.tasks}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await printToFileAsync({ html });

      // Rename the file
      const fileName = `${format(weekStart, 'MMMM')}_${format(weekStart, 'd')}_to_${format(weekEnd, 'd')}.pdf`;
      const newUri = FileSystem.documentDirectory + fileName;

      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      await shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={16} color="#6366f1" />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Weekly Report</Text>
          <Text style={[styles.headerSubtitle, { color: colors.onSecondary }]}>
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </Text>
        </View>
        <TouchableOpacity onPress={generatePDF} style={{ marginLeft: 'auto' }}>
          <Feather name="download" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Feather name="clock" size={20} color="#6366f1" />
            </View>
          </View>
          <View>
            <Text style={[styles.summaryValue, { color: colors.onSurface }]}>{totalHours.toFixed(1)}h</Text>
            <Text style={[styles.summaryLabel, { color: colors.onSecondary }]}>Total Hours</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Feather name="check-circle" size={20} color="#22c55e" />
            </View>
          </View>
          <View>
            <Text style={[styles.summaryValue, { color: colors.onSurface }]}>{completedTasks}</Text>
            <Text style={[styles.summaryLabel, { color: colors.onSecondary }]}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Progress Overview */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Weekly Progress</Text>
          <View style={styles.trendingContainer}>
            <Feather name="trending-up" size={16} color="#6b7280" />
            <Text style={styles.trendingText}>{completionRate.toFixed(0)}% completed</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressLabel, { color: colors.text }]}>Task Completion</Text>
            <Text style={[styles.progressValue, { color: colors.text }]}>{completedTasks}/{totalTasks} tasks</Text>
          </View>
          <ProgressBar value={completionRate} />
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressLabel, { color: colors.text }]}>Daily Average</Text>
            <Text style={[styles.progressValue, { color: colors.text }]}>{averageHours.toFixed(1)}/{targetHours}h per day</Text>
          </View>
          <ProgressBar value={(averageHours / targetHours) * 100} />
        </View>
      </View>

      {/* Daily Breakdown */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Daily Breakdown</Text>
        <View style={styles.dailyList}>
          {dailyStats.map((day, index) => (
            <View key={index} style={[styles.dailyItem, { backgroundColor: colors.background }]}>
              <View style={styles.dailyLeft}>
                <View style={styles.dayLabel}>
                  <Text style={[styles.dayName, { color: colors.onSurface }]}>{format(day.date, 'EEE')}</Text>
                  <Text style={[styles.dayNumber, { color: colors.subtext }]}>{format(day.date, 'd')}</Text>
                </View>
                <View>
                  <Text style={[styles.dailyHours, { color: colors.onSurface }]}>{day.hours.toFixed(1)} hours</Text>
                  <Text style={[styles.dailyTasks, { color: colors.subtext }]}>
                    {day.completed}/{day.tasks} tasks completed
                  </Text>
                </View>
              </View>
              <View style={styles.dailyRight}>
                {day.hours > 0 && (
                  <View style={styles.miniProgressContainer}>
                    <View style={[styles.miniProgressBar, { width: `${(day.hours / targetHours) * 100}%` }]} />
                  </View>
                )}
                {day.completed === day.tasks && day.tasks > 0 && (
                  <Feather name="check-circle" size={16} color="#22c55e" />
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Insights */}
      <View style={[styles.card, { marginBottom: 40, backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Insights</Text>
        <View style={styles.insightsList}>
          {averageHours >= targetHours && (
            <View style={[styles.insightCard, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Feather name="trending-up" size={20} color="#22c55e" style={styles.insightIcon} />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: '#22c55e' }]}>Great productivity!</Text>
                <Text style={styles.insightText}>
                  You're meeting your daily hour targets this week.
                </Text>
              </View>
            </View>
          )}

          {completionRate >= 80 && (
            <View style={[styles.insightCard, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Feather name="target" size={20} color="#6366f1" style={styles.insightIcon} />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: '#6366f1' }]}>Excellent completion rate!</Text>
                <Text style={styles.insightText}>
                  You completed {completionRate.toFixed(0)}% of your planned tasks.
                </Text>
              </View>
            </View>
          )}

          {averageHours < targetHours && (
            <View style={[styles.insightCard, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
              <Feather name="clock" size={20} color="#eab308" style={styles.insightIcon} />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: '#eab308' }]}>Room for improvement</Text>
                <Text style={styles.insightText}>
                  Try to increase your daily hours to reach your {targetHours}h weekly target.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#111827',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 3,
  },
  summaryIconContainer: {
    // Empty for layout
  },
  iconBg: {
    padding: 8,
    borderRadius: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  trendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#374151',
  },
  progressValue: {
    fontSize: 14,
    color: '#374151',
  },
  progressContainer: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 6,
  },
  dailyList: {
    gap: 12,
  },
  dailyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(249, 250, 251, 0.3)',
    borderRadius: 8,
  },
  dailyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dayLabel: {
    alignItems: 'center',
    minWidth: 48,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  dayNumber: {
    fontSize: 12,
    color: '#6b7280',
  },
  dailyHours: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  dailyTasks: {
    fontSize: 12,
    color: '#6b7280',
  },
  dailyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniProgressContainer: {
    width: 64,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  miniProgressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  insightIcon: {
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 12,
    color: '#6b7280',
  },
});