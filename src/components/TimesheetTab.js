import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import { useSettings } from '../context/SettingsContext';
import { EmployerService } from '../services/EmployerService';
import { ProfileService } from '../services/ProfileService';
import { TaskService } from '../services/TaskService';
import { darkColors } from '../theme/darkTheme';
import EmployerForm from './EmployerForm';
import MonthlyReport from './MonthlyReport';
import WeeklyReport from './WeeklyReport';

const DateTimePicker = require('@react-native-community/datetimepicker').default;

const TaskEntryModal = ({
  visible,
  onClose,
  onSave,
  editingTask,
  newTask,
  setNewTask,
  showPunchInPicker,
  setShowPunchInPicker,
  showPunchOutPicker,
  setShowPunchOutPicker,
  onPunchInChange,
  onPunchOutChange,
  confirmPunchIn,
  confirmPunchOut,
  tempPunchIn,
  tempPunchOut,
  getDateTimeFromTime,
  colors,
  darkMode,
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="pageSheet"
    onRequestClose={onClose}
  >
    <View style={[styles.modalContainer, darkMode && { backgroundColor: '#0f172a' }]}>
      <View style={[styles.modalHeader, darkMode && { borderBottomColor: '#1e293b' }]}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={darkMode ? "#94a3b8" : "#374151"} />
        </TouchableOpacity>
        <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
          {editingTask ? 'Edit Task' : 'Add Task'}
        </Text>
        <TouchableOpacity onPress={onSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.subtext }]}>Task Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={newTask.title}
            onChangeText={(text) => setNewTask({ ...newTask, title: text })}
            placeholder="Enter task title"
            placeholderTextColor={colors.subtext}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.subtext }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={newTask.description}
            onChangeText={(text) => setNewTask({ ...newTask, description: text })}
            placeholder="Enter task description"
            placeholderTextColor={colors.subtext}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Punch In */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.subtext }]}>Punch In</Text>
          <TouchableOpacity
            style={[styles.timePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowPunchInPicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={darkMode ? "#64748b" : "#6b7280"} />
            <Text style={[
              styles.timePickerButtonText,
              { color: newTask.punchIn ? colors.text : colors.subtext }
            ]}>
              {newTask.punchIn || 'Select time'}
            </Text>
          </TouchableOpacity>
          {showPunchInPicker && (
            <View>
              {Platform.OS === 'ios' && (
                <View style={[styles.pickerActions, darkMode && { backgroundColor: '#1e293b', borderBottomColor: '#334155' }]}>
                  <TouchableOpacity
                    onPress={() => setShowPunchInPicker(false)}
                    style={styles.pickerButton}
                  >
                    <Text style={[styles.pickerActionCancel, darkMode && { color: '#94a3b8' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmPunchIn}
                    style={[styles.pickerButton, styles.confirmButtonBg]}
                  >
                    <Text style={styles.pickerActionConfirm}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              )}
              <DateTimePicker
                value={tempPunchIn || getDateTimeFromTime(newTask.punchIn)}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onPunchInChange}
              />
            </View>
          )}
        </View>

        {/* Punch Out */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.subtext }]}>Punch Out</Text>
          <TouchableOpacity
            style={[styles.timePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowPunchOutPicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={darkMode ? "#64748b" : "#6b7280"} />
            <Text style={[
              styles.timePickerButtonText,
              { color: newTask.punchOut ? colors.text : colors.subtext }
            ]}>
              {newTask.punchOut || 'Select time'}
            </Text>
          </TouchableOpacity>
          {showPunchOutPicker && (
            <View>
              {Platform.OS === 'ios' && (
                <View style={[styles.pickerActions, darkMode && { backgroundColor: '#1e293b', borderBottomColor: '#334155' }]}>
                  <TouchableOpacity
                    onPress={() => setShowPunchOutPicker(false)}
                    style={styles.pickerButton}
                  >
                    <Text style={[styles.pickerActionCancel, darkMode && { color: '#94a3b8' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmPunchOut}
                    style={[styles.pickerButton, styles.confirmButtonBg]}
                  >
                    <Text style={styles.pickerActionConfirm}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              )}
              <DateTimePicker
                value={tempPunchOut || getDateTimeFromTime(newTask.punchOut)}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onPunchOutChange}
              />
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.subtext }]}>Hours Spent (Auto-calculated)</Text>
          <TextInput
            style={[styles.input, styles.disabledInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.subtext }]}
            value={newTask.hoursSpent}
            placeholder="Auto-calculated"
            editable={false}
          />
        </View>
      </ScrollView>
    </View>
  </Modal>
);

const ReportSelectionSheet = ({ visible, onClose, onSelect, darkMode }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={[styles.bottomSheet, darkMode && { backgroundColor: '#1e293b' }]}>
        <View style={[styles.sheetIndicator, darkMode && { backgroundColor: '#334155' }]} />
        <Text style={[styles.sheetTitle, darkMode && { color: '#f1f5f9' }]}>Generate Report</Text>
        <View style={styles.sheetOptions}>
          <TouchableOpacity
            style={[styles.sheetOption, darkMode && { borderBottomColor: '#334155' }]}
            onPress={() => onSelect('weekly')}
          >
            <View style={[styles.sheetIconBg, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="calendar-outline" size={24} color="#6366f1" />
            </View>
            <View>
              <Text style={[styles.sheetOptionTitle, darkMode && { color: '#f1f5f9' }]}>Weekly Report</Text>
              <Text style={[styles.sheetOptionSub, darkMode && { color: '#94a3b8' }]}>Summary of the current week</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetOption}
            onPress={() => onSelect('monthly')}
          >
            <View style={[styles.sheetIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="list-outline" size={24} color="#10b981" />
            </View>
            <View>
              <Text style={[styles.sheetOptionTitle, darkMode && { color: '#f1f5f9' }]}>Monthly Report</Text>
              <Text style={[styles.sheetOptionSub, darkMode && { color: '#94a3b8' }]}>Full breakdown of the month</Text>
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.sheetCloseButton, darkMode && { backgroundColor: '#334155' }]}
          onPress={onClose}
        >
          <Text style={[styles.sheetCloseText, darkMode && { color: '#f1f5f9' }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

const TimesheetTab = () => {
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTaskEntry, setShowTaskEntry] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [reportType, setReportType] = useState('weekly');
  const [showSelectionSheet, setShowSelectionSheet] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showPunchInPicker, setShowPunchInPicker] = useState(false);
  const [showPunchOutPicker, setShowPunchOutPicker] = useState(false);
  const [tempPunchIn, setTempPunchIn] = useState(null);
  const [tempPunchOut, setTempPunchOut] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    employer: '',
    punchIn: '',
    punchOut: '',
    hoursSpent: '',
  });

  const [currentEmployer, setCurrentEmployer] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [showEmployerForm, setShowEmployerForm] = useState(false);


  useFocusEffect(
    useCallback(() => {
      loadTasks();
      loadEmployer();
      loadProfile();
    }, [])
  );

  const loadEmployer = async () => {
    try {
      const employer = await EmployerService.getEmployer();
      setCurrentEmployer(employer);
      if (employer) {
        setNewTask(prev => ({ ...prev, employer: employer.companyName }));
      }
    } catch (error) {
      console.error('Error loading employer:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const profile = await ProfileService.getProfile();
      setCurrentProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const loadedTasks = await TaskService.getAllTasks();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    }
  };

  const tasksForSelectedDate = tasks.filter(task =>
    task.date === selectedDate.toISOString().split('T')[0]
  );

  const addTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    // Validation for punch in/out
    if (newTask.punchIn && newTask.punchOut) {
      const start = getDateTimeFromTime(newTask.punchIn);
      const end = getDateTimeFromTime(newTask.punchOut);
      if (end <= start) {
        Alert.alert('Invalid Time', 'Punch out time must be later than punch in time.');
        return;
      }
    }

    try {
      if (editingTask) {
        // Update existing task
        const updatedTask = { ...newTask, id: editingTask.id, date: editingTask.date, completed: editingTask.completed };
        await TaskService.updateTask(updatedTask);
        setEditingTask(null);
      } else {
        // Add new task
        const task = {
          ...newTask,
          id: Date.now().toString(),
          date: selectedDate.toISOString().split('T')[0],
          completed: false,
        };
        await TaskService.addTask(task);
      }
      await loadTasks(); // Reload tasks to reflect changes
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task');
    }

    setNewTask({
      title: '',
      description: '',
      employer: '',
      punchIn: '',
      punchOut: '',
      hoursSpent: '',
    });
    setShowTaskEntry(false);
  };

  const editTask = (task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      employer: task.employer || (currentEmployer ? currentEmployer.companyName : ''),
      punchIn: task.punchIn || '',
      punchOut: task.punchOut || '',
      hoursSpent: task.hoursSpent || '',
    });
    setShowTaskEntry(true);
  };

  const deleteTask = async (id) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await TaskService.deleteTask(id);
              await loadTasks();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        },
      ]
    );
  };

  const toggleTaskCompletion = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      try {
        await TaskService.toggleTaskCompletion(id, !task.completed);
        await loadTasks();
      } catch (error) {
        console.error('Error toggling task:', error);
      }
    }
  };

  // Function to calculate hours between two 12-hour format times
  const calculateHours = (punchIn, punchOut) => {
    if (!punchIn || !punchOut) return '';

    try {
      // Parse 12-hour format time (e.g., "9:00 AM", "5:30 PM")
      const parseTime = (timeStr) => {
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return null;

        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return hours + minutes / 60;
      };

      const startTime = parseTime(punchIn);
      const endTime = parseTime(punchOut);

      if (startTime === null || endTime === null) return '';

      let diff = endTime - startTime;
      if (diff < 0) return ''; // Don't calculate if out < in

      return diff.toFixed(2);
    } catch (error) {
      return '';
    }
  };

  // Update hours when punch in/out changes
  const handlePunchInChange = (text) => {
    let updatedTask = { ...newTask, punchIn: text };
    
    if (newTask.punchOut) {
      const start = getDateTimeFromTime(text);
      const end = getDateTimeFromTime(newTask.punchOut);
      
      if (end <= start) {
        Alert.alert('Invalid Time', 'Punch in time must be earlier than punch out time.');
        updatedTask.punchOut = '';
        updatedTask.hoursSpent = '';
      } else {
        const hours = calculateHours(text, newTask.punchOut);
        updatedTask.hoursSpent = hours || '';
      }
    }
    
    setNewTask(updatedTask);
  };

  const handlePunchOutChange = (text) => {
    let updatedTask = { ...newTask, punchOut: text };
    
    if (newTask.punchIn) {
      const start = getDateTimeFromTime(newTask.punchIn);
      const end = getDateTimeFromTime(text);
      
      if (end <= start) {
        Alert.alert('Invalid Time', 'Punch out time must be later than punch in time.');
        updatedTask.punchOut = '';
        updatedTask.hoursSpent = '';
      } else {
        const hours = calculateHours(newTask.punchIn, text);
        updatedTask.hoursSpent = hours || '';
      }
    }
    
    setNewTask(updatedTask);
  };

  // Convert Date object from picker to 12-hour format string
  const formatTimeTo12Hour = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${period}`;
  };

  // Convert 12-hour format string to Date object for picker value
  const getDateTimeFromTime = (timeString) => {
    if (!timeString) return new Date(); // Default to current time if no time string

    const now = new Date();
    const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return now;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    now.setHours(hours, minutes, 0, 0);
    return now;
  };

  const onPunchInChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPunchInPicker(false);
      if (event.type === 'set' && selectedDate) {
        handlePunchInChange(formatTimeTo12Hour(selectedDate));
      }
    } else {
      // iOS: Just update temp state, don't close
      if (selectedDate) {
        setTempPunchIn(selectedDate);
      }
    }
  };

  const onPunchOutChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPunchOutPicker(false);
      if (event.type === 'set' && selectedDate) {
        handlePunchOutChange(formatTimeTo12Hour(selectedDate));
      }
    } else {
      // iOS: Just update temp state, don't close
      if (selectedDate) {
        setTempPunchOut(selectedDate);
      }
    }
  };

  const confirmPunchIn = () => {
    if (tempPunchIn) {
      handlePunchInChange(formatTimeTo12Hour(tempPunchIn));
    }
    setShowPunchInPicker(false);
    setTempPunchIn(null);
  };

  const confirmPunchOut = () => {
    if (tempPunchOut) {
      handlePunchOutChange(formatTimeTo12Hour(tempPunchOut));
    }
    setShowPunchOutPicker(false);
    setTempPunchOut(null);
  };

  const handleReportSelect = (type) => {
    setReportType(type);
    setShowSelectionSheet(false);
    setShowReports(true);
  };

  const handleSaveEmployer = async (employerData) => {
    try {
      await EmployerService.saveEmployer(employerData);
      setCurrentEmployer(employerData);
      setNewTask(prev => ({ ...prev, employer: employerData.companyName }));
      setShowEmployerForm(false);
      Alert.alert('Success', 'Employer details saved');
    } catch (error) {
      console.error('Error saving employer:', error);
      Alert.alert('Error', 'Failed to save employer details');
    }
  };

  // Helper for dates in Reports - Use parseISO or split to avoid timezone shifts
  const convertedTasks = tasks.map(task => {
    // task.date is 'YYYY-MM-DD', new Date('YYYY-MM-DD') can be interpreted as UTC
    // and shifted to the previous day in some timezones.
    const [year, month, day] = task.date.split('-').map(Number);
    return {
      ...task,
      date: new Date(year, month - 1, day),
      name: task.title,
      hours: parseFloat(task.hoursSpent || 0),
    };
  });

  if (showReports) {
    return reportType === 'weekly' ? (
      <WeeklyReport
        tasks={convertedTasks}
        onBack={() => setShowReports(false)}
        selectedDate={selectedDate}
        employer={currentEmployer}
        employee={currentProfile}
      />
    ) : (
      <MonthlyReport
        tasks={convertedTasks}
        onBack={() => setShowReports(false)}
        selectedDate={selectedDate}
        employer={currentEmployer}
        employee={currentProfile}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <Ionicons name="calendar" size={24} color="white" />
          <Text style={styles.headerTitle}>Timesheet</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowEmployerForm(true)}
          >
            <Ionicons name="business" size={16} color="white" />
            <Text style={styles.headerButtonText}>Employer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSelectionSheet(true)}
          >
            <Ionicons name="bar-chart" size={16} color="white" />
            <Text style={styles.headerButtonText}>Reports</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Calendar */}
        <View style={[styles.calendarContainer, { backgroundColor: colors.surface }, darkMode && { shadowColor: '#000', shadowOpacity: 0.3 }]}>
          <CalendarPicker
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            textStyle={[styles.calendarText, { color: colors.onSurface }]}
            selectedDayStyle={[styles.selectedDay, { backgroundColor: colors.primary }]}
            selectedDayTextStyle={styles.selectedDayText}
            previousComponent={<Ionicons name="chevron-back" size={20} color={colors.onSurface} />}
            nextComponent={<Ionicons name="chevron-forward" size={20} color={colors.onSurface} />}
            dayLabelsWrapper={styles.dayLabelsWrapper}
            width={340}
            scaleFactor={375}
          />
        </View>

        {/* Tasks for Selected Date */}
        <View style={[styles.tasksContainer, { backgroundColor: colors.surface }, darkMode && { shadowColor: '#000', shadowOpacity: 0.3 }]}>
          <View style={[styles.tasksHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tasksTitle, { color: colors.onSurface }]}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <TouchableOpacity
              style={styles.addTaskButton}
              onPress={() => setShowTaskEntry(true)}
            >
              <Ionicons name="add" size={16} color="white" />
              <Text style={styles.addTaskText}>Add Task</Text>
            </TouchableOpacity>
          </View>

          {tasksForSelectedDate.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No tasks for this day</Text>
              <Text style={styles.emptySubtext}>Tap "Add Task" to get started</Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {tasksForSelectedDate.map((task) => (
                <View key={task.id} style={[styles.taskItem, { backgroundColor: colors.surface }, darkMode && { backgroundColor: '#1e293b', borderLeftColor: '#6366f1', borderLeftWidth: 3 }]}>
                  <TouchableOpacity
                    style={styles.taskCheckbox}
                    onPress={() => toggleTaskCompletion(task.id)}
                  >
                    <Ionicons
                      name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={task.completed ? "#10b981" : "#d1d5db"}
                    />
                  </TouchableOpacity>

                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <Text style={[
                        styles.taskTitle,
                        { color: colors.onSurface },
                        task.completed && styles.completedTask
                      ]}>
                        {task.title}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        task.completed ? styles.completedBadge : styles.pendingBadge,
                        darkMode && task.completed && { backgroundColor: 'rgba(22, 101, 52, 0.2)' },
                        darkMode && !task.completed && { backgroundColor: 'rgba(146, 64, 14, 0.2)' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          task.completed ? styles.completedStatusText : styles.pendingStatusText,
                          darkMode && task.completed && { color: '#4ade80' },
                          darkMode && !task.completed && { color: '#fbbf24' }
                        ]}>
                          {task.completed ? 'Complete' : 'Pending'}
                        </Text>
                      </View>
                    </View>

                    {task.description && (
                      <Text style={[styles.taskDescription, darkMode && { color: '#94a3b8' }]}>{task.description}</Text>
                    )}

                    <View style={styles.taskDetails}>
                      {task.employer && (
                        <Text style={[styles.taskDetail, darkMode && { color: '#64748b' }]}>🏢 {task.employer}</Text>
                      )}
                      {task.punchIn && task.punchOut && (
                        <Text style={[styles.taskDetail, darkMode && { color: '#64748b' }]}>🕐 {task.punchIn} - {task.punchOut}</Text>
                      )}
                      <Text style={[styles.taskDetail, darkMode && { color: '#64748b' }]}>⏱️ {task.hoursSpent}h</Text>
                    </View>
                  </View>

                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => editTask(task)}
                    >
                      <Ionicons name="create-outline" size={20} color="#6366f1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteTask(task.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TaskEntryModal
        visible={showTaskEntry}
        onClose={() => {
          setShowTaskEntry(false);
          setEditingTask(null);
          setTempPunchIn(null); // Clear temp state on close
          setTempPunchOut(null); // Clear temp state on close
        }}
        onSave={addTask}
        editingTask={editingTask}
        newTask={newTask}
        setNewTask={setNewTask}
        showPunchInPicker={showPunchInPicker}
        setShowPunchInPicker={setShowPunchInPicker}
        showPunchOutPicker={showPunchOutPicker}
        setShowPunchOutPicker={setShowPunchOutPicker}
        onPunchInChange={onPunchInChange}
        onPunchOutChange={onPunchOutChange}
        confirmPunchIn={confirmPunchIn}
        confirmPunchOut={confirmPunchOut}
        tempPunchIn={tempPunchIn}
        tempPunchOut={tempPunchOut}
        getDateTimeFromTime={getDateTimeFromTime}
        colors={colors}
        darkMode={darkMode}
      />

      <EmployerForm
        visible={showEmployerForm}
        employer={currentEmployer}
        onSave={handleSaveEmployer}
        onCancel={() => setShowEmployerForm(false)}
        darkMode={darkMode}
      />

      <ReportSelectionSheet
        visible={showSelectionSheet}
        onClose={() => setShowSelectionSheet(false)}
        onSelect={handleReportSelect}
        darkMode={darkMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarText: {
    color: '#374151',
  },
  selectedDay: {
    backgroundColor: '#6366f1',
  },
  selectedDayText: {
    color: 'white',
  },
  dayLabelsWrapper: {
    paddingVertical: 8,
  },
  tasksContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tasksHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addTaskButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTaskText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  tasksList: {
    padding: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#dcfce7',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  completedStatusText: {
    color: '#166534',
  },
  pendingStatusText: {
    color: '#92400e',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  taskDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  taskDetail: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 16,
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  timePickerButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  bottomSheet: {
    backgroundColor: 'white',
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
  },
  sheetIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  sheetOptions: {
    gap: 12,
    marginBottom: 24,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
  },
  pickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmButtonBg: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  pickerActionConfirm: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 15,
  },
  pickerActionCancel: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 15,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sheetOptionSub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  sheetCloseButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
  },
});

export default TimesheetTab;
