import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTimeEntries, deleteTimeEntry, updateTimeEntry, TimeEntry } from '@/utils/storage';
import { FontAwesome } from '@expo/vector-icons';
import { useStyles } from '@/utils/useStyles';
import { AppTheme } from '@/utils/theme';

export default function TimeEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editDate, setEditDate] = useState(new Date());
  const [editHours, setEditHours] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const allEntries = await getTimeEntries();
    setEntries(allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleDelete = (entry: TimeEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this time entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteTimeEntry(entry.id);
            if (success) {
              loadEntries();
            } else {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  const startEditing = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditDate(new Date(entry.date));
    setEditHours(entry.hours.toString());
    setEditNotes(entry.notes);
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;

    const hoursFloat = parseFloat(editHours);
    if (isNaN(hoursFloat) || hoursFloat <= 0 || hoursFloat > 24) {
      Alert.alert('Error', 'Please enter a valid number of hours (between 0 and 24)');
      return;
    }

    const updatedEntry: TimeEntry = {
      ...editingEntry,
      date: editDate.toISOString().split('T')[0],
      hours: hoursFloat,
      notes: editNotes,
    };

    const success = await updateTimeEntry(updatedEntry);
    if (success) {
      setEditingEntry(null);
      loadEntries();
    } else {
      Alert.alert('Error', 'Failed to update entry');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const styles = useStyles((theme: AppTheme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    entryCard: {
      backgroundColor: theme.colors.card,
      padding: 16,
      margin: 8,
      borderRadius: 12,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    entryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    date: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    actions: {
      flexDirection: 'row',
      gap: 16,
    },
    actionButton: {
      padding: 4,
    },
    hours: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    notes: {
      color: theme.colors.subtext,
      fontSize: 14,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: '#fff',
      margin: 20,
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      color: '#007AFF',
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: '#333',
    },
    input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 8,
    },
    cancelButton: {
      backgroundColor: '#f8f8f8',
    },
    saveButton: {
      backgroundColor: '#007AFF',
    },
    cancelButtonText: {
      color: '#666',
      fontSize: 16,
      fontWeight: '600',
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    dateButton: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      backgroundColor: '#f8f8f8',
    },
    dateButtonText: {
      fontSize: 16,
      color: '#333',
    },
  }));

  return (
    <>
      <Stack.Screen options={{ title: 'Time Entries' }} />
      <View style={styles.container}>
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => startEditing(item)}
                  >
                    <FontAwesome name="edit" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(item)}
                  >
                    <FontAwesome name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.hours}>{item.hours} hours</Text>
              {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
            </View>
          )}
        />

        {/* Edit Modal */}
        <Modal
          visible={editingEntry !== null}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditingEntry(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Time Entry</Text>

              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {editDate.toLocaleDateString('en-AU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Hours</Text>
              <TextInput
                style={styles.input}
                value={editHours}
                onChangeText={setEditHours}
                keyboardType="decimal-pad"
                maxLength={4}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditingEntry(null)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleUpdate}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={editDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setEditDate(selectedDate);
              }
            }}
            maximumDate={new Date()}
          />
        )}
      </View>
    </>
  );
} 