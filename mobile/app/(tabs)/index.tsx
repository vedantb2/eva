import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { getTimeEntriesForMonth, getCompanyDetails, TimeEntry } from '@/utils/storage';

export default function Home() {
  const [currentMonth] = useState(new Date());
  const [monthlyHours, setMonthlyHours] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [hourlyRate, setHourlyRate] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load company details for hourly rate
    const details = await getCompanyDetails();
    const rate = details?.hourlyRate ? parseFloat(details.hourlyRate) : 0;
    setHourlyRate(rate);

    // Load time entries for current month
    const entries = await getTimeEntriesForMonth(
      currentMonth.getMonth(),
      currentMonth.getFullYear()
    );

    // Calculate total hours and earnings
    const totalHours = entries.reduce((sum: number, entry: TimeEntry) => sum + entry.hours, 0);
    setMonthlyHours(totalHours);
    setMonthlyEarnings(totalHours * rate);

    // Get recent entries (last 5)
    setRecentEntries(entries.slice(-5).reverse());
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-AU', {
      style: 'currency',
      currency: 'AUD',
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Invoice Generator' }} />
      <ScrollView style={styles.container}>
        {/* Current Month Summary */}
        <View style={styles.monthSummary}>
          <Text style={styles.monthTitle}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{monthlyHours.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Hours</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{formatCurrency(monthlyEarnings)}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/log-hours')}>
            <Text style={styles.buttonText}>Log Hours</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/invoices')}>
            <Text style={styles.buttonText}>View Invoices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/settings')}>
            <Text style={styles.buttonText}>Company Details</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentEntries.length === 0 ? (
            <View style={styles.activityItem}>
              <Text>No recent activity</Text>
            </View>
          ) : (
            recentEntries.map((entry) => (
              <View key={entry.id} style={styles.activityItem}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityDate}>{formatDate(entry.date)}</Text>
                  <Text style={styles.activityHours}>{entry.hours} hours</Text>
                </View>
                {entry.notes && <Text style={styles.activityNotes}>{entry.notes}</Text>}
              </View>
            ))
          )}
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
  monthSummary: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recentActivity: {
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  activityItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityHours: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  activityNotes: {
    color: '#666',
    fontSize: 14,
  },
});
