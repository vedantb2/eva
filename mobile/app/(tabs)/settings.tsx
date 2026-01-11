import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { setupDailyReminder } from '@/utils/notifications';

interface CompanyDetails {
  name: string;
  address: string;
  email: string;
  phone: string;
  abn: string;
  bankName: string;
  bankBSB: string;
  bankAccount: string;
  hourlyRate: string;
}

export default function Settings() {
  const [details, setDetails] = useState<CompanyDetails>({
    name: '',
    address: '',
    email: '',
    phone: '',
    abn: '',
    bankName: '',
    bankBSB: '',
    bankAccount: '',
    hourlyRate: '',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    loadCompanyDetails();
    checkNotificationStatus();
  }, []);

  const loadCompanyDetails = async () => {
    try {
      const savedDetails = await AsyncStorage.getItem('companyDetails');
      if (savedDetails) {
        setDetails(JSON.parse(savedDetails));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load company details');
    }
  };

  const saveCompanyDetails = async () => {
    try {
      await AsyncStorage.setItem('companyDetails', JSON.stringify(details));
      Alert.alert('Success', 'Company details saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save company details');
    }
  };

  const checkNotificationStatus = async () => {
    const settings = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(settings.granted);
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotificationsEnabled(false);
    } else {
      await setupDailyReminder();
      const settings = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(settings.granted);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Company Details</Text>

          <Text style={styles.label}>Company Name</Text>
          <TextInput
            style={styles.input}
            value={details.name}
            onChangeText={(text) => setDetails({ ...details, name: text })}
            placeholder="Enter company name"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={details.address}
            onChangeText={(text) => setDetails({ ...details, address: text })}
            multiline
            numberOfLines={3}
            placeholder="Enter company address"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={details.email}
            onChangeText={(text) => setDetails({ ...details, email: text })}
            keyboardType="email-address"
            placeholder="Enter email"
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={details.phone}
            onChangeText={(text) => setDetails({ ...details, phone: text })}
            keyboardType="phone-pad"
            placeholder="Enter phone number"
          />

          <Text style={styles.label}>ABN</Text>
          <TextInput
            style={styles.input}
            value={details.abn}
            onChangeText={(text) => setDetails({ ...details, abn: text })}
            placeholder="Enter ABN"
          />

          <Text style={styles.sectionTitle}>Banking Details</Text>

          <Text style={styles.label}>Bank Name</Text>
          <TextInput
            style={styles.input}
            value={details.bankName}
            onChangeText={(text) => setDetails({ ...details, bankName: text })}
            placeholder="Enter bank name"
          />

          <Text style={styles.label}>BSB</Text>
          <TextInput
            style={styles.input}
            value={details.bankBSB}
            onChangeText={(text) => setDetails({ ...details, bankBSB: text })}
            placeholder="Enter BSB"
          />

          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            value={details.bankAccount}
            onChangeText={(text) => setDetails({ ...details, bankAccount: text })}
            placeholder="Enter account number"
          />

          <Text style={styles.sectionTitle}>Billing</Text>

          <Text style={styles.label}>Hourly Rate ($)</Text>
          <TextInput
            style={styles.input}
            value={details.hourlyRate}
            onChangeText={(text) => setDetails({ ...details, hourlyRate: text })}
            keyboardType="decimal-pad"
            placeholder="Enter hourly rate"
          />

          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <Text style={styles.label}>Daily Reminder</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notificationsEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.settingDescription}>
            Receive a daily reminder at 5 PM to log your hours
          </Text>

          <TouchableOpacity style={styles.saveButton} onPress={saveCompanyDetails}>
            <Text style={styles.saveButtonText}>Save Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
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
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
});
