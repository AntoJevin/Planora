import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSettings } from '../context/SettingsContext';
import { TodoService } from '../services/TodoService';
import { darkColors } from '../theme/darkTheme';

const TodoTab = () => {
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
  const [todos, setTodos] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadTodos();
    }, [])
  );

  const loadTodos = async () => {
    try {
      const loadedTodos = await TodoService.getAllTodos();
      setTodos(loadedTodos);
    } catch (error) {
      console.error('Error loading todos:', error);
      Alert.alert('Error', 'Failed to load todos');
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [newTodo, setNewTodo] = useState({
    title: '',
    category: 'Work',
    categoryColor: '#3b82f6',
  });

  const categories = Array.from(new Set(todos.map(todo => todo.category)));
  const categoryColors = {
    'Work': '#3b82f6',
    'Personal': '#10b981',
    'Health': '#ef4444',
    'Finance': '#f59e0b',
    'Shopping': '#8b5cf6',
  };

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || todo.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const completedCount = todos.filter(todo => todo.completed).length;

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      try {
        await TodoService.toggleTodo(id, !todo.completed);
        await loadTodos();
      } catch (error) {
        console.error('Error toggling todo:', error);
      }
    }
  };

  const deleteTodo = (id) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await TodoService.deleteTodo(id);
              await loadTodos();
            } catch (error) {
              console.error('Error deleting todo:', error);
              Alert.alert('Error', 'Failed to delete todo');
            }
          }
        },
      ]
    );
  };

  const addTodo = async () => {
    if (!newTodo.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (newTodo.category === 'Other' && !customCategory.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const finalCategory = newTodo.category === 'Other' ? customCategory : newTodo.category;
    const finalColor = newTodo.category === 'Other' ? '#6b7280' : newTodo.categoryColor;

    const todo = {
      ...newTodo,
      id: Date.now().toString(),
      category: finalCategory,
      categoryColor: finalColor,
      completed: false,
    };

    try {
      await TodoService.addTodo(todo);
      await loadTodos();
      setNewTodo({
        title: '',
        category: 'Work',
        categoryColor: '#3b82f6',
      });
      setCustomCategory('');
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding todo:', error);
      Alert.alert('Error', 'Failed to add todo');
    }
  };

  const TodoItem = ({ item: todo, drag, isActive }) => (
    <View style={[
      styles.todoItem,
      { backgroundColor: colors.surface },
      isActive && styles.todoItemDragging
    ]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleTodo(todo.id)}
      >
        <Ionicons
          name={todo.completed ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={todo.completed ? "#10b981" : "#d1d5db"}
        />
      </TouchableOpacity>

      <View style={styles.todoContent}>
        <Text style={[
          styles.todoTitle,
          { color: colors.onSurface },
          todo.completed && styles.completedTodo
        ]}>
          {todo.title}
        </Text>
        <View style={styles.todoFooter}>
          <View style={[
            styles.categoryBadge,
            { backgroundColor: todo.categoryColor + '20' }
          ]}>
            <Text style={[
              styles.categoryText,
              { color: todo.categoryColor }
            ]}>
              {todo.category}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTodo(todo.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dragHandle}
        onLongPress={drag}
        delayLongPress={100}
      >
        <Ionicons name="reorder-three" size={24} color="#9ca3af" />
      </TouchableOpacity>
    </View>
  );

  const CategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
    >
      <TouchableOpacity
        style={[
          styles.categoryChip,
          { backgroundColor: colors.surface, borderColor: colors.border },
          !selectedCategory && styles.selectedCategoryChip
        ]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text style={[
          styles.categoryChipText,
          !selectedCategory && styles.selectedCategoryChipText
        ]}>
          All ({todos.length})
        </Text>
      </TouchableOpacity>

      {categories.map((category) => {
        const count = todos.filter(todo => todo.category === category).length;
        const color = categoryColors[category] || '#6b7280';
        return (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedCategory === category && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <View style={[
              styles.categoryColorDot,
              { backgroundColor: color }
            ]} />
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category && styles.selectedCategoryChipText
            ]}>
              {category} ({count})
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const AddTodoModal = () => (
    <Modal
      visible={showAddDialog}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowAddDialog(false)}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Add Task</Text>
          <TouchableOpacity onPress={addTodo}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Task Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={newTodo.title}
              onChangeText={(text) => setNewTodo({ ...newTodo, title: text })}
              placeholder="Enter task title"
              placeholderTextColor={colors.subtext}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.keys(categoryColors).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    newTodo.category === category && styles.selectedCategoryOption,
                    { borderColor: categoryColors[category], backgroundColor: colors.surface }
                  ]}
                  onPress={() => setNewTodo({
                    ...newTodo,
                    category,
                    categoryColor: categoryColors[category]
                  })}
                >
                  <View style={[
                    styles.categoryColorIndicator,
                    { backgroundColor: categoryColors[category] }
                  ]} />
                  <Text style={[
                    styles.categoryOptionText,
                    { color: colors.subtext },
                    newTodo.category === category && styles.selectedCategoryOptionText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Other Category Option */}
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  newTodo.category === 'Other' && styles.selectedCategoryOption,
                  { borderColor: '#6b7280', backgroundColor: colors.surface }
                ]}
                onPress={() => setNewTodo({
                  ...newTodo,
                  category: 'Other',
                  categoryColor: '#6b7280'
                })}
              >
                <View style={[
                  styles.categoryColorIndicator,
                  { backgroundColor: '#6b7280' }
                ]} />
                <Text style={[
                  styles.categoryOptionText,
                  { color: colors.subtext },
                  newTodo.category === 'Other' && styles.selectedCategoryOptionText
                ]}>
                  Other
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Custom Category Input (shown when Other is selected) */}
          {newTodo.category === 'Other' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.subtext }]}>Custom Category Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={customCategory}
                onChangeText={setCustomCategory}
                placeholder="Enter category name"
                placeholderTextColor={colors.subtext}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <Ionicons name="checkbox" size={24} color="white" />
          <View>
            <Text style={styles.headerTitle}>To-Do List</Text>
            <Text style={styles.headerSubtitle}>
              {completedCount} of {todos.length} completed
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddDialog(true)}
        >
          <Ionicons name="add" size={16} color="white" />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      {filteredTodos.length === 0 ? (
        <View style={styles.content}>
          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search tasks..."
              placeholderTextColor={colors.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Category Filter */}
          <CategoryFilter />

          {/* Empty State */}
          <View style={[styles.todosContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.todosHeader, { borderBottomColor: colors.border }]}>
              <Text style={styles.todosTitle}>
                {selectedCategory ? `${selectedCategory} Tasks` : 'All Tasks'}
              </Text>
            </View>
            <View style={styles.emptyState}>
              <Ionicons name="checkbox" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No tasks found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or add a new task</Text>
            </View>
          </View>
        </View>
      ) : (
        <DraggableFlatList
          data={filteredTodos}
          onDragEnd={({ data }) => {
            // Update the main todos array with the new order
            const updatedTodos = [...todos];
            // Replace filtered items with reordered ones
            filteredTodos.forEach((oldItem, index) => {
              const todoIndex = updatedTodos.findIndex(t => t.id === oldItem.id);
              if (todoIndex !== -1) {
                updatedTodos[todoIndex] = data[index];
              }
            });
            setTodos(updatedTodos);
          }}
          keyExtractor={(item) => item.id}
          renderItem={({ item, drag, isActive }) => (
            <TodoItem item={item} drag={drag} isActive={isActive} />
          )}
          ListHeaderComponent={
            <View style={styles.content}>
              {/* Search */}
              <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search tasks..."
                  placeholderTextColor={colors.subtext}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Category Filter */}
              <CategoryFilter />
            </View>
          }
          contentContainerStyle={styles.todosListContainer}
        />
      )}

      <AddTodoModal />
    </GestureHandlerRootView>
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
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginLeft: 8,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 20,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  categoryFilter: {
    marginTop: 16,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  selectedCategoryChip: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedCategoryChipText: {
    color: 'white',
  },
  todosContainer: {
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
  todosHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  todosTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
  todosListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  checkbox: {
    marginRight: 12,
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  completedTodo: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  todoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  dragHandle: {
    padding: 8,
    marginLeft: 4,
  },
  todoItemDragging: {
    backgroundColor: '#f0f9ff',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'white',
  },
  selectedCategoryOption: {
    backgroundColor: '#f0f9ff',
  },
  categoryColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedCategoryOptionText: {
    color: '#6366f1',
    fontWeight: '500',
  },
});

export default TodoTab;
