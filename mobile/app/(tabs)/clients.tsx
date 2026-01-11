import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  hourlyRate: string;
  notes: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Client>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    hourlyRate: '',
    notes: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const storedClients = await AsyncStorage.getItem('clients');
      if (storedClients) {
        setClients(JSON.parse(storedClients));
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const saveClients = async (updatedClients: Client[]) => {
    try {
      await AsyncStorage.setItem('clients', JSON.stringify(updatedClients));
    } catch (error) {
      console.error('Error saving clients:', error);
      Alert.alert('Error', 'Failed to save clients');
    }
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setFormData({
      id: Date.now().toString(),
      name: '',
      email: '',
      phone: '',
      address: '',
      hourlyRate: '',
      notes: '',
    });
    setModalVisible(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setModalVisible(true);
  };

  const handleDeleteClient = (client: Client) => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedClients = clients.filter(c => c.id !== client.id);
            setClients(updatedClients);
            await saveClients(updatedClients);
          },
        },
      ]
    );
  };

  const handleSaveClient = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Client name is required');
      return;
    }

    try {
      let updatedClients;
      if (editingClient) {
        updatedClients = clients.map(client =>
          client.id === editingClient.id ? formData : client
        );
      } else {
        updatedClients = [...clients, formData];
      }

      setClients(updatedClients);
      await saveClients(updatedClients);
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving client:', error);
      Alert.alert('Error', 'Failed to save client');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Clients...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Clients',
          headerRight: () => (
            <TouchableOpacity onPress={handleAddClient} style={styles.addButton}>
              <FontAwesome name="plus" size={20} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.clientCard}>
              <View style={styles.clientHeader}>
                <View>
                  <Text style={styles.clientName}>{item.name}</Text>
                  <Text style={styles.clientRate}>${item.hourlyRate}/hour</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => handleEditClient(item)}
                    style={styles.editButton}>
                    <FontAwesome name="pencil" size={16} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteClient(item)}
                    style={styles.deleteButton}>
                    <FontAwesome name="trash" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.clientDetails}>
                {item.email && (
                  <View style={styles.detailRow}>
                    <FontAwesome name="envelope" size={14} color="#666" />
                    <Text style={styles.detailText}>{item.email}</Text>
                  </View>
                )}
                {item.phone && (
                  <View style={styles.detailRow}>
                    <FontAwesome name="phone" size={14} color="#666" />
                    <Text style={styles.detailText}>{item.phone}</Text>
                  </View>
                )}
                {item.address && (
                  <View style={styles.detailRow}>
                    <FontAwesome name="map-marker" size={14} color="#666" />
                    <Text style={styles.detailText}>{item.address}</Text>
                  </View>
                )}
              </View>

              {item.notes && (
                <Text style={styles.notes}>{item.notes}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No clients added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button to add your first client
              </Text>
            </View>
          }
        />

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingClient ? 'Edit Client' : 'Add Client'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Client Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Address"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Hourly Rate"
                value={formData.hourlyRate}
                onChangeText={(text) => setFormData({ ...formData, hourlyRate: text })}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Notes"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveClient}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
  },
  addButton: {
    marginRight: 16,
  },
  clientCard: {
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
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clientRate: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  clientDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#666',
    flex: 1,
  },
  notes: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
}); 