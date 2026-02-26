import { Feather } from '@expo/vector-icons';
import { eachDayOfInterval, endOfWeek, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';

interface WeeklyReportProps {
  tasks: any[];
  onBack: () => void;
  selectedDate: Date;
  employer?: any;
  employee?: any;
}

export default function WeeklyReport({ tasks, onBack, selectedDate, employer, employee }: WeeklyReportProps) {
  const { darkMode } = useSettings();
  // ... existing colors ...
  const colors = {
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
  const completedHours = weeklyTasks.filter(task => task.completed).reduce((sum, task) => sum + (task.hoursSpent || task.hours || 0), 0);
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
      individualTasks: dayTasks
    };
  });

  const averageHours = totalHours / 7;

  const ProgressBar = ({ value }: { value: number }) => (
    <View style={[styles.progressContainer, darkMode && darkStyles.progressContainer]}>
      <View style={[styles.progressBar, { width: `${Math.min(Math.max(value, 0), 100)}%` }]} />
    </View>
  );

  const generatePDF = async () => {
    try {
      let logoBase64 = '';
      if (employer?.logoUri) {
        try {
          logoBase64 = await FileSystem.readAsStringAsync(employer.logoUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (e) {
          console.error('Error reading logo:', e);
        }
      }

      const html = `
        <html>
          <head>
            <style>
              @page { margin: 10mm; }
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 0; }
              
              /* Visual fixed header */
              .page-header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 160px;
                background: white;
                border-bottom: 2px solid #6366f1;
                z-index: 1000;
                padding: 10mm 15mm 10px 15mm;
              }

              .header-content { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
              .logo-container { width: 60px; height: 60px; }
              .logo { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
              .report-title-container { text-align: right; }
              h1 { margin: 0; color: #111827; font-size: 22px; }
              .date-range { color: #6b7280; font-size: 11px; margin-top: 4px; }
              
              .details-row { display: flex; gap: 20px; margin-top: 10px; }
              .details-column { flex: 1; }
              .details-label { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #6366f1; margin-bottom: 3px; }
              .details-name { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
              .details-info { font-size: 10px; color: #4b5563; margin: 1px 0; }

              /* Table structure for repeating header space */
              .report-wrapper { width: 100%; border-collapse: collapse; }
              .thead-ghost { height: 160px; } /* Must match fixed header height */
              
              .content-padding { padding: 0 15mm 15mm 15mm; }

              .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; margin-top: 10px; table-layout: fixed; }
              .card { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: left; }
              .value { font-size: 16px; font-weight: bold; color: #111827; }
              .label { font-size: 9px; color: #6b7280; margin-top: 2px; }

              h3 { font-size: 14px; margin-top: 20px; margin-bottom: 10px; color: #111827; border-bottom: 2px solid #6366f1; padding-bottom: 3px; display: inline-block; }
              .breakdown-table { width: 100%; border-collapse: collapse; }
              .breakdown-table th { text-align: left; padding: 8px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
              .breakdown-table td { text-align: left; padding: 8px; border-bottom: 1px solid #f1f5f9; font-size: 11px; vertical-align: top; }
              
              tr { page-break-inside: avoid; page-break-after: auto; }
              
              .task-title { font-weight: 500; color: #111827; }
              .not-completed { color: #ef4444; font-weight: bold; font-size: 10px; margin-left: 5px; }
              .task-desc { font-size: 10px; color: #6b7280; margin-top: 4px; }
              .date-cell { white-space: nowrap; width: 110px; color: #4b5563; }
              .hours-cell { text-align: right; font-weight: bold; width: 50px; }

              .signature-container { margin-top: 60px; page-break-inside: avoid; display: flex; flex-direction: column; align-items: flex-end; }
              .signature-line { border-bottom: 1px solid #111827; width: 250px; margin-bottom: 8px; }
              .signature-name { font-weight: bold; font-size: 12px; }
              .signature-label { font-size: 10px; color: #6b7280; font-style: italic; text-align: right; }
            </style>
          </head>
          <body>
            <!-- Visual header on every page -->
            <div class="page-header">
              <div class="header-content">
                <div class="logo-container">
                  ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" class="logo" />` : ''}
                </div>
                <div class="report-title-container">
                  <h1>Weekly Report</h1>
                  <div class="date-range">${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}</div>
                </div>
              </div>

              <div class="details-row">
                <div class="details-column">
                  <div class="details-label">Employer</div>
                  ${employer ? `
                    <div class="details-name">${employer.companyName}</div>
                    ${employer.address ? `<div class="details-info">${employer.address}</div>` : ''}
                    ${employer.ein ? `<div class="details-info">EIN: ${employer.ein}</div>` : ''}
                  ` : '<div class="details-info">No employer details</div>'}
                </div>
                <div class="details-column">
                  <div class="details-label">Employee</div>
                  ${employee ? `
                    <div class="details-name">${employee.name}</div>
                    ${employee.email ? `<div class="details-info">${employee.email}</div>` : ''}
                    ${employee.phone ? `<div class="details-info">${employee.phone}</div>` : ''}
                  ` : '<div class="details-info">No employee details</div>'}
                </div>
              </div>
            </div>

            <!-- Content within table to handle pagination -->
            <table class="report-wrapper">
              <thead>
                <tr>
                  <td>
                    <!-- Ghost space that repeats on every page metadata -->
                    <div class="thead-ghost"></div>
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="content-padding">
                    <h3>Summary</h3>
                    <table class="summary-table">
                      <tr>
                        <td style="padding-right: 6px;">
                          <div class="card">
                            <div class="value">${totalHours.toFixed(1)}h</div>
                            <div class="label">Total Hours</div>
                          </div>
                        </td>
                        <td style="padding: 0 6px;">
                          <div class="card">
                            <div class="value">${completedHours.toFixed(1)}h</div>
                            <div class="label">Completed Hours</div>
                          </div>
                        </td>
                        <td style="padding: 0 6px;">
                          <div class="card">
                            <div class="value">${completedTasks} of ${totalTasks}</div>
                            <div class="label">Tasks Completed</div>
                          </div>
                        </td>
                        <td style="padding-left: 6px;">
                          <div class="card">
                            <div class="value">${totalHours >= targetHours ? 'Met' : 'Missed'}</div>
                            <div class="label">Target Status (${targetHours}h)</div>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <h3>Daily Breakdown</h3>
                    <table class="breakdown-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Task Title</th>
                          <th style="text-align: right;">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${dailyStats.map(day => {
        if (day.individualTasks.length === 0) {
          return `
                              <tr>
                                <td class="date-cell">${format(day.date, 'EEE, MMM d')}</td>
                                <td style="color: #9ca3af; font-style: italic;">No tasks recorded</td>
                                <td class="hours-cell">0.0h</td>
                              </tr>
                            `;
        }
        return day.individualTasks.map((task, idx) => `
                            <tr>
                              <td class="date-cell">${idx === 0 ? format(day.date, 'EEE, MMM d') : ''}</td>
                              <td>
                                <div class="task-title">
                                  ${task.title || task.name}
                                  ${task.completed === false || task.completed === 0 ? '<span class="not-completed" style="color: #ef4444 !important;">(Not Completed)</span>' : ''}
                                </div>
                                ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
                              </td>
                              <td class="hours-cell">${(task.hoursSpent || task.hours || 0).toFixed(1)}h</td>
                            </tr>
                          `).join('');
      }).join('')}
                      </tbody>
                    </table>

                    <div class="signature-container">
                      <div class="signature-line"></div>
                      <div class="signature-name">${employer?.supervisorName || 'Supervisor'}</div>
                      <div class="signature-label">Supervisor Signature</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await printToFileAsync({ html });

      // Rename the file
      const fileName = `Weekly_Report_${format(weekStart, 'MMM_d')}_to_${format(weekEnd, 'MMM_d')}.pdf`;
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
    <ScrollView style={[styles.container, darkMode && darkStyles.container]}>
      {/* Header */}
      <View style={[styles.header, darkMode && darkStyles.header]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={16} color="#6366f1" />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, darkMode && darkStyles.text]}>Weekly Report</Text>
          <Text style={[styles.headerSubtitle, darkMode && darkStyles.subtext]}>
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </Text>
        </View>
        <TouchableOpacity onPress={generatePDF} style={{ marginLeft: 'auto' }}>
          <Feather name="download" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, darkMode && darkStyles.card]}>
          <View style={styles.summaryIconContainer}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Feather name="clock" size={20} color="#6366f1" />
            </View>
          </View>
          <View>
            <Text style={[styles.summaryValue, darkMode && darkStyles.text]}>{totalHours.toFixed(1)}h</Text>
            <Text style={[styles.summaryLabel, darkMode && darkStyles.subtext]}>Total Hours</Text>
          </View>
        </View>

        <View style={[styles.summaryCard, darkMode && darkStyles.card]}>
          <View style={styles.summaryIconContainer}>
            <View style={[styles.iconBg, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Feather name="check-circle" size={20} color="#22c55e" />
            </View>
          </View>
          <View>
            <Text style={[styles.summaryValue, darkMode && darkStyles.text]}>{completedTasks}</Text>
            <Text style={[styles.summaryLabel, darkMode && darkStyles.subtext]}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Progress Overview */}
      <View style={[styles.card, darkMode && darkStyles.card]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, darkMode && darkStyles.text]}>Weekly Progress</Text>
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
          <ProgressBar value={completionRate} />
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressLabel, darkMode && darkStyles.textSecondary]}>Daily Average</Text>
            <Text style={[styles.progressValue, darkMode && darkStyles.textSecondary]}>
              {averageHours.toFixed(1)}/{(targetHours / 7).toFixed(1)}h per day
            </Text>
          </View>
          <ProgressBar value={(averageHours / (targetHours / 7)) * 100} />
        </View>
      </View>

      {/* Daily Breakdown */}
      <View style={[styles.card, darkMode && darkStyles.card]}>
        <Text style={[styles.cardTitle, darkMode && darkStyles.text]}>Daily Breakdown</Text>
        <View style={styles.dailyList}>
          {dailyStats.map((day, index) => (
            <View key={index} style={[styles.dailyItem, darkMode && darkStyles.dailyItem]}>
              <View style={styles.dailyLeft}>
                <View style={styles.dayLabel}>
                  <Text style={[styles.dayName, darkMode && darkStyles.text]}>{format(day.date, 'EEE')}</Text>
                  <Text style={[styles.dayNumber, darkMode && darkStyles.subtext]}>{format(day.date, 'd')}</Text>
                </View>
                <View>
                  <Text style={[styles.dailyHours, darkMode && darkStyles.text]}>{day.hours.toFixed(1)} hours</Text>
                  <Text style={[styles.dailyTasks, darkMode && darkStyles.subtext]}>
                    {day.completed}/{day.tasks} tasks completed
                  </Text>
                </View>
              </View>
              <View style={styles.dailyRight}>
                <View style={[styles.miniProgressContainer, darkMode && darkStyles.progressContainer]}>
                  <View
                    style={[
                      styles.miniProgressBar,
                      {
                        width: `${day.tasks > 0 ? (day.completed / day.tasks) * 100 : 0}%`,
                        backgroundColor: day.completed === day.tasks && day.tasks > 0 ? '#22c55e' : '#6366f1'
                      }
                    ]}
                  />
                </View>
                {day.completed === day.tasks && day.tasks > 0 && (
                  <Feather name="check-circle" size={16} color="#22c55e" />
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Insights */}
      <View style={[styles.card, { marginBottom: 40 }, darkMode && darkStyles.card]}>
        <Text style={[styles.cardTitle, darkMode && darkStyles.text]}>Insights</Text>
        <View style={styles.insightsList}>
          {totalHours >= targetHours && (
            <View style={[styles.insightCard, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Feather name="trending-up" size={20} color="#22c55e" style={styles.insightIcon} />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: '#22c55e' }]}>Great productivity!</Text>
                <Text style={[styles.insightText, darkMode && { color: '#94a3b8' }]}>
                  You've met your {targetHours}h weekly goal. Keep it up!
                </Text>
              </View>
            </View>
          )}

          {completionRate >= 80 && (
            <View style={[styles.insightCard, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Feather name="target" size={20} color="#6366f1" style={styles.insightIcon} />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: '#6366f1' }]}>Excellent completion rate!</Text>
                <Text style={[styles.insightText, darkMode && { color: '#94a3b8' }]}>
                  You completed {completionRate.toFixed(0)}% of your planned tasks.
                </Text>
              </View>
            </View>
          )}

          {totalHours < targetHours && (
            <View style={[styles.insightCard, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
              <Feather name="clock" size={20} color="#eab308" style={styles.insightIcon} />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: '#eab308' }]}>Room for improvement</Text>
                <Text style={[styles.insightText, darkMode && { color: '#94a3b8' }]}>
                  You've logged {totalHours.toFixed(1)}h. Try to reach your {targetHours}h weekly target.
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
    width: 100,
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

const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#0f172a',
  },
  card: {
    backgroundColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  text: {
    color: '#f1f5f9',
  },
  textSecondary: {
    color: '#cbd5e1',
  },
  subtext: {
    color: '#94a3b8',
  },
  dailyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});