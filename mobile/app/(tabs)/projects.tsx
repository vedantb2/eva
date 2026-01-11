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
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTimeEntries, TimeEntry } from '@/utils/storage';
import { ProgressBar } from '@/components/ProgressBar';

interface Project {
  id: string;
  name: string;
  client: string;
  description: string;
  startDate: string;
  deadline: string;
  estimatedHours: string;
  hourlyRate: string;
  status: 'active' | 'completed' | 'on-hold';
}

interface ProjectWithStats extends Project {
  totalHours: number;
  totalEarnings: number;
  progress: number;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsWithStats, setProjectsWithStats] = useState<ProjectWithStats[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Project>({
    id: '',
    name: '',
    client: '',
    description: '',
    startDate: '',
    deadline: '',
    estimatedHours: '',
    hourlyRate: '',
    status: 'active',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const storedProjects = await AsyncStorage.getItem('projects');
      const timeEntries = await getTimeEntries();
      let projectsList: Project[] = [];
      
      if (storedProjects) {
        projectsList = JSON.parse(storedProjects);
      }

      // Calculate stats for each project
      const projectStats = projectsList.map(project => {
        const projectEntries = timeEntries.filter(entry => entry.project === project.id);
        const totalHours = projectEntries.reduce((sum, entry) => sum + entry.hours, 0);
        const totalEarnings = totalHours * parseFloat(project.hourlyRate || '0');
        const progress = parseFloat(project.estimatedHours) > 0 
          ? (totalHours / parseFloat(project.estimatedHours)) * 100 
          : 0;

        return {
          ...project,
          totalHours,
          totalEarnings,
          progress: Math.min(progress, 100),
        };
      });

      setProjects(projectsList);
      setProjectsWithStats(projectStats);
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const saveProjects = async (updatedProjects: Project[]) => {
    try {
      await AsyncStorage.setItem('projects', JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Error saving projects:', error);
      Alert.alert('Error', 'Failed to save projects');
    }
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setFormData({
      id: Date.now().toString(),
      name: '',
      client: '',
      description: '',
      startDate: '',
      deadline: '',
      estimatedHours: '',
      hourlyRate: '',
      status: 'active',
    });
    setModalVisible(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setFormData(project);
    setModalVisible(true);
  };

  const handleDeleteProject = (project: Project) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete ${project.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedProjects = projects.filter(p => p.id !== project.id);
            setProjects(updatedProjects);
            await saveProjects(updatedProjects);
            loadProjects();
          },
        },
      ]
    );
  };

  const handleSaveProject = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }

    try {
      let updatedProjects;
      if (editingProject) {
        updatedProjects = projects.map(project =>
          project.id === editingProject.id ? formData : project
        );
      } else {
        updatedProjects = [...projects, formData];
      }

      setProjects(updatedProjects);
      await saveProjects(updatedProjects);
      setModalVisible(false);
      loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      Alert.alert('Error', 'Failed to save project');
    }
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return '#34C759';
      case 'completed':
        return '#007AFF';
      case 'on-hold':
        return '#FF9500';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Projects...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Projects',
          headerRight: () => (
            <TouchableOpacity onPress={handleAddProject} style={styles.addButton}>
              <FontAwesome name="plus" size={20} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        <FlatList
          data={projectsWithStats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.projectCard}>
              <View style={styles.projectHeader}>
                <View style={styles.projectTitleContainer}>
                  <Text style={styles.projectName}>{item.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => handleEditProject(item)}
                    style={styles.editButton}>
                    <FontAwesome name="pencil" size={16} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteProject(item)}
                    style={styles.deleteButton}>
                    <FontAwesome name="trash" size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>

              {item.client && (
                <Text style={styles.clientName}>Client: {item.client}</Text>
              )}

              {item.description && (
                <Text style={styles.description}>{item.description}</Text>
              )}

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Hours</Text>
                  <Text style={styles.statValue}>
                    {item.totalHours.toFixed(1)} / {item.estimatedHours || '∞'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Earnings</Text>
                  <Text style={styles.statValue}>
                    ${item.totalEarnings.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Rate</Text>
                  <Text style={styles.statValue}>${item.hourlyRate}/h</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Progress</Text>
                <ProgressBar progress={item.progress} />
                <Text style={styles.progressText}>{item.progress.toFixed(1)}%</Text>
              </View>

              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>
                  Start: {new Date(item.startDate).toLocaleDateString()}
                </Text>
                <Text style={styles.dateText}>
                  Deadline: {new Date(item.deadline).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No projects added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button to add your first project
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
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingProject ? 'Edit Project' : 'Add Project'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Project Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Client"
                value={formData.client}
                onChangeText={(text) => setFormData({ ...formData, client: text })}
              />

              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Description"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />

              <TextInput
                style={styles.input}
                placeholder="Start Date (YYYY-MM-DD)"
                value={formData.startDate}
                onChangeText={(text) => setFormData({ ...formData, startDate: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Deadline (YYYY-MM-DD)"
                value={formData.deadline}
                onChangeText={(text) => setFormData({ ...formData, deadline: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Estimated Hours"
                value={formData.estimatedHours}
                onChangeText={(text) => setFormData({ ...formData, estimatedHours: text })}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Hourly Rate"
                value={formData.hourlyRate}
                onChangeText={(text) => setFormData({ ...formData, hourlyRate: text })}
                keyboardType="decimal-pad"
              />

              <View style={styles.statusSelector}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={styles.statusButtons}>
                  {(['active', 'completed', 'on-hold'] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusButton,
                        formData.status === status && styles.statusButtonActive,
                        { backgroundColor: getStatusColor(status) },
                      ]}
                      onPress={() => setFormData({ ...formData, status })}>
                      <Text style={styles.statusButtonText}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveProject}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  projectCard: {
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
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
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
  clientName: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
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
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusSelector: {
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statusButtonActive: {
    opacity: 1,
  },
  statusButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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