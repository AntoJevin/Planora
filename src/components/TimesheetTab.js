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
import { TaskService } from '../services/TaskService';
import { darkColors } from '../theme/darkTheme';
import WeeklyReport from './WeeklyReport';

const DateTimePicker = require('@react-native-community/datetimepicker').default;
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
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showPunchInPicker, setShowPunchInPicker] = useState(false);
  const [showPunchOutPicker, setShowPunchOutPicker] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    employer: '',
    punchIn: '',
    punchOut: '',
    hoursSpent: '',
  });


  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

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
      employer: task.employer || '',
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
      if (diff < 0) diff += 24; // Handle overnight shifts

      return diff.toFixed(2);
    } catch (error) {
      return '';
    }
  };

  // Update hours when punch in/out changes
  const handlePunchInChange = (text) => {
    const updatedTask = { ...newTask, punchIn: text };
    const hours = calculateHours(text, newTask.punchOut);
    if (hours) updatedTask.hoursSpent = hours;
    setNewTask(updatedTask);
  };

  const handlePunchOutChange = (text) => {
    const updatedTask = { ...newTask, punchOut: text };
    const hours = calculateHours(newTask.punchIn, text);
    if (hours) updatedTask.hoursSpent = hours;
    setNewTask(updatedTask);
  };

  // Convert Date object from picker to 12-hour format string
  const formatTimeTo12Hour = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${period} `;
  };

  const onPunchInChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();

    if (Platform.OS === 'android') {
      setShowPunchInPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      const timeString = formatTimeTo12Hour(selectedDate);
      handlePunchInChange(timeString);
      if (Platform.OS === 'ios') {
        setShowPunchInPicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowPunchInPicker(false);
    }
  };

  const onPunchOutChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();

    if (Platform.OS === 'android') {
      setShowPunchOutPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      const timeString = formatTimeTo12Hour(selectedDate);
      handlePunchOutChange(timeString);
      if (Platform.OS === 'ios') {
        setShowPunchOutPicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowPunchOutPicker(false);
    }
  };

  const getCompletedHoursForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks
      .filter(task => task.date === dateStr && task.completed)
      .reduce((total, task) => total + parseFloat(task.hoursSpent || 0), 0);
  };

  const TaskEntryModal = () => (
    <Modal
      visible={showTaskEntry}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => {
            setShowTaskEntry(false);
            setEditingTask(null);
          }}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'Add Task'}</Text>
          <TouchableOpacity onPress={addTask}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Task Title *</Text>
            <TextInput
              style={styles.input}
              value={newTask.title}
              onChangeText={(text) => setNewTask({ ...newTask, title: text })}
              placeholder="Enter task title"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newTask.description}
              onChangeText={(text) => setNewTask({ ...newTask, description: text })}
              placeholder="Enter task description"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Employer</Text>
            <TextInput
              style={styles.input}
              value={newTask.employer}
              onChangeText={(text) => setNewTask({ ...newTask, employer: text })}
              placeholder="Enter employer name"
            />
          </View>

          {/* Punch In */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Punch In</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowPunchInPicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#6b7280" />
              <Text style={styles.timePickerButtonText}>
                {newTask.punchIn || 'Select time'}
              </Text>
            </TouchableOpacity>
            {showPunchInPicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onPunchInChange}
              />
            )}
          </View>

          {/* Punch Out */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Punch Out</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowPunchOutPicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#6b7280" />
              <Text style={styles.timePickerButtonText}>
                {newTask.punchOut || 'Select time'}
              </Text>
            </TouchableOpacity>
            {showPunchOutPicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onPunchOutChange}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hours Spent (Auto-calculated)</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={newTask.hoursSpent}
              placeholder="Auto-calculated"
              editable={false}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Convert tasks to match the Task interface expected by WeeklyReport
  const convertedTasks = tasks.map(task => ({
    id: task.id,
    date: new Date(task.date),
    name: task.title,
    hours: parseFloat(task.hoursSpent || 0),
    completed: task.completed,
  }));

  if (showReports) {
    return (
      <WeeklyReport
        tasks={convertedTasks}
        selectedDate={selectedDate}
        onBack={() => setShowReports(false)}
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
        <TouchableOpacity
          style={styles.reportsButton}
          onPress={() => setShowReports(true)}
        >
          <Ionicons name="bar-chart" size={16} color="white" />
          <Text style={styles.reportsText}>Reports</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Calendar */}
        <View style={[styles.calendarContainer, { backgroundColor: colors.surface }]}>
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
        <View style={[styles.tasksContainer, { backgroundColor: colors.surface }]}>
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
                <View key={task.id} style={[styles.taskItem, { backgroundColor: colors.surface }]}>
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
                        task.completed ? styles.completedBadge : styles.pendingBadge
                      ]}>
                        <Text style={[
                          styles.statusText,
                          task.completed ? styles.completedStatusText : styles.pendingStatusText
                        ]}>
                          {task.completed ? 'Complete' : 'Pending'}
                        </Text>
                      </View>
                    </View>

                    {task.description && (
                      <Text style={styles.taskDescription}>{task.description}</Text>
                    )}

                    <View style={styles.taskDetails}>
                      {task.employer && (
                        <Text style={styles.taskDetail}>👤 {task.employer}</Text>
                      )}
                      {task.punchIn && task.punchOut && (
                        <Text style={styles.taskDetail}>🕐 {task.punchIn} - {task.punchOut}</Text>
                      )}
                      <Text style={styles.taskDetail}>⏱️ {task.hoursSpent}h</Text>
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

      <TaskEntryModal />
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
  reportsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportsText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
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
  row: {
    flexDirection: 'row',
  },
});

export default TimesheetTab;
