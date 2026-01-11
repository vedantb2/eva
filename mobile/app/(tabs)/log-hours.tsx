import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeEntry } from '@/utils/storage';

export default function LogHours() {
  const [date, setDate] = useState(new Date());
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const storedProjects = await AsyncStorage.getItem('projects');
      if (storedProjects) {
        const projectsList = JSON.parse(storedProjects);
        setProjects(projectsList.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!hours.trim()) {
      Alert.alert('Error', 'Please enter the number of hours');
      return;
    }

    const hoursFloat = parseFloat(hours);
    if (isNaN(hoursFloat) || hoursFloat <= 0) {
      Alert.alert('Error', 'Please enter a valid number of hours');
      return;
    }

    try {
      const timeEntry: TimeEntry = {
        id: Date.now().toString(),
        date: date.toISOString(),
        hours: hoursFloat,
        notes: notes.trim(),
        project: selectedProject || undefined,
      };

      const existingEntries = await AsyncStorage.getItem('timeEntries');
      const entries = existingEntries ? JSON.parse(existingEntries) : [];
      entries.push(timeEntry);
      await AsyncStorage.setItem('timeEntries', JSON.stringify(entries));

      setHours('');
      setNotes('');
      setSelectedProject('');
      Alert.alert('Success', 'Time entry saved successfully');
    } catch (error) {
      console.error('Error saving time entry:', error);
      Alert.alert('Error', 'Failed to save time entry');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Log Hours' }} />
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Log Hours</Text>

          <Text style={styles.sectionLabel}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Hours</Text>
          <TextInput
            style={styles.input}
            placeholder="Hours worked"
            value={hours}
            onChangeText={setHours}
            keyboardType="decimal-pad"
          />

          <View style={styles.projectSelector}>
            <Text style={styles.sectionLabel}>Project (optional)</Text>
            <View style={styles.projectButtons}>
              {projects.map(project => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectButton,
                    selectedProject === project.id && styles.projectButtonSelected,
                  ]}
                  onPress={() => setSelectedProject(project.id)}>
                  <Text
                    style={[
                      styles.projectButtonText,
                      selectedProject === project.id && styles.projectButtonTextSelected,
                    ]}>
                    {project.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Add any notes about the work done"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Save Time Entry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  sectionLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  projectSelector: {
    marginBottom: 16,
  },
  projectButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  projectButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
  },
  projectButtonSelected: {
    backgroundColor: '#007AFF',
  },
  projectButtonText: {
    color: '#666',
    fontSize: 14,
  },
  projectButtonTextSelected: {
    color: '#ffffff',
  },
});
