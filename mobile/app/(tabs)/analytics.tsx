import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { getInvoices, getTimeEntries, getCompanyDetails } from '@/utils/storage';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { FontAwesome } from '@expo/vector-icons';

interface MonthlyStats {
  month: string;
  earnings: number;
  hours: number;
}

interface WeeklyStats {
  weekNumber: number;
  startDate: string;
  endDate: string;
  earnings: number;
  hours: number;
  daysWorked: number;
}

interface YearlyStats {
  totalEarnings: number;
  totalHours: number;
  averageHourlyRate: number;
  monthlyStats: MonthlyStats[];
  weeklyStats: WeeklyStats[];
  previousYearEarnings: number;
  previousYearHours: number;
  yearOverYearGrowth: number;
  averageHoursPerDay: number;
  mostProductiveDay: string;
  goalProgress: {
    earnings: number;
    hours: number;
  };
}

const EARNINGS_GOAL = 100000; // $100,000 yearly goal
const HOURS_GOAL = 2000; // 2000 hours yearly goal

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [yearlyStats, setYearlyStats] = useState<YearlyStats>({
    totalEarnings: 0,
    totalHours: 0,
    averageHourlyRate: 0,
    monthlyStats: [],
    weeklyStats: [],
    previousYearEarnings: 0,
    previousYearHours: 0,
    yearOverYearGrowth: 0,
    averageHoursPerDay: 0,
    mostProductiveDay: '',
    goalProgress: {
      earnings: 0,
      hours: 0,
    },
  });
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const timeEntries = await getTimeEntries();
      const invoices = await getInvoices();
      const companyDetails = await getCompanyDetails();
      
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      
      // Calculate monthly stats
      const monthlyData: { [key: string]: MonthlyStats } = {};
      const weeklyData: { [key: number]: WeeklyStats } = {};
      const dailyHours: { [key: string]: number } = {};
      let previousYearEarnings = 0;
      let previousYearHours = 0;
      
      timeEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const entryYear = entryDate.getFullYear();
        const hourlyRate = parseFloat(companyDetails?.hourlyRate || '0');
        
        if (entryYear === currentYear) {
          // Monthly stats
          const monthKey = entryDate.toLocaleString('default', { month: 'short' });
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: monthKey,
              earnings: 0,
              hours: 0,
            };
          }
          monthlyData[monthKey].hours += entry.hours;
          monthlyData[monthKey].earnings += entry.hours * hourlyRate;

          // Weekly stats
          const weekNumber = getWeekNumber(entryDate);
          if (!weeklyData[weekNumber]) {
            const weekStart = new Date(entryDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            weeklyData[weekNumber] = {
              weekNumber,
              startDate: weekStart.toLocaleDateString(),
              endDate: weekEnd.toLocaleDateString(),
              earnings: 0,
              hours: 0,
              daysWorked: 0,
            };
          }
          weeklyData[weekNumber].hours += entry.hours;
          weeklyData[weekNumber].earnings += entry.hours * hourlyRate;
          weeklyData[weekNumber].daysWorked += 1;

          // Daily stats
          const dayKey = entryDate.toLocaleDateString('en-US', { weekday: 'long' });
          dailyHours[dayKey] = (dailyHours[dayKey] || 0) + entry.hours;
        } else if (entryYear === previousYear) {
          previousYearEarnings += entry.hours * hourlyRate;
          previousYearHours += entry.hours;
        }
      });

      // Convert to array and sort by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyStats = months.map(month => monthlyData[month] || {
        month,
        earnings: 0,
        hours: 0,
      });

      // Convert weekly data to sorted array
      const weeklyStats = Object.values(weeklyData).sort((a, b) => a.weekNumber - b.weekNumber);

      // Calculate yearly totals
      const totalEarnings = monthlyStats.reduce((sum, month) => sum + month.earnings, 0);
      const totalHours = monthlyStats.reduce((sum, month) => sum + month.hours, 0);
      const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;
      
      // Calculate year over year growth
      const yearOverYearGrowth = previousYearEarnings > 0 
        ? ((totalEarnings - previousYearEarnings) / previousYearEarnings) * 100 
        : 0;

      // Calculate productivity metrics
      const totalDaysWorked = Object.values(weeklyData).reduce((sum, week) => sum + week.daysWorked, 0);
      const averageHoursPerDay = totalDaysWorked > 0 ? totalHours / totalDaysWorked : 0;
      
      // Find most productive day
      const mostProductiveDay = Object.entries(dailyHours)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

      setYearlyStats({
        totalEarnings,
        totalHours,
        averageHourlyRate,
        monthlyStats,
        weeklyStats,
        previousYearEarnings,
        previousYearHours,
        yearOverYearGrowth,
        averageHoursPerDay,
        mostProductiveDay,
        goalProgress: {
          earnings: (totalEarnings / EARNINGS_GOAL) * 100,
          hours: (totalHours / HOURS_GOAL) * 100,
        },
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-AU', {
      style: 'currency',
      currency: 'AUD',
    });
  };

  const handleExport = async () => {
    try {
      const exportData = {
        year: new Date().getFullYear(),
        totalEarnings: formatCurrency(yearlyStats.totalEarnings),
        totalHours: yearlyStats.totalHours.toFixed(1),
        averageRate: formatCurrency(yearlyStats.averageHourlyRate),
        yearOverYearGrowth: `${yearlyStats.yearOverYearGrowth.toFixed(1)}%`,
        monthlyBreakdown: yearlyStats.monthlyStats,
        weeklyBreakdown: yearlyStats.weeklyStats,
      };

      const exportString = JSON.stringify(exportData, null, 2);
      await Share.share({
        message: exportString,
        title: `Analytics Export - ${new Date().getFullYear()}`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export analytics data');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Analytics',
          headerRight: () => (
            <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
              <FontAwesome name="download" size={20} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      <ScrollView style={styles.container}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Earnings</Text>
            <Text style={styles.summaryValue}>{formatCurrency(yearlyStats.totalEarnings)}</Text>
            <Text style={[
              styles.growthIndicator,
              yearlyStats.yearOverYearGrowth >= 0 ? styles.positiveGrowth : styles.negativeGrowth
            ]}>
              {yearlyStats.yearOverYearGrowth >= 0 ? '↑' : '↓'} {Math.abs(yearlyStats.yearOverYearGrowth).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Hours</Text>
            <Text style={styles.summaryValue}>{yearlyStats.totalHours.toFixed(1)}h</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Avg. Rate</Text>
            <Text style={styles.summaryValue}>{formatCurrency(yearlyStats.averageHourlyRate)}/h</Text>
          </View>
        </View>

        {/* Goal Progress */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Goal Progress</Text>
          <View style={styles.goalContainer}>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>Earnings Goal</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(yearlyStats.goalProgress.earnings, 100)}%` }]} />
              </View>
              <Text style={styles.goalText}>{yearlyStats.goalProgress.earnings.toFixed(1)}%</Text>
            </View>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>Hours Goal</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(yearlyStats.goalProgress.hours, 100)}%` }]} />
              </View>
              <Text style={styles.goalText}>{yearlyStats.goalProgress.hours.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Productivity Metrics */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Productivity Metrics</Text>
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Average Hours/Day</Text>
              <Text style={styles.metricValue}>{yearlyStats.averageHoursPerDay.toFixed(1)}h</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Most Productive Day</Text>
              <Text style={styles.metricValue}>{yearlyStats.mostProductiveDay}</Text>
            </View>
          </View>
        </View>

        {/* View Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'monthly' && styles.toggleButtonActive]}
            onPress={() => setViewMode('monthly')}>
            <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'weekly' && styles.toggleButtonActive]}
            onPress={() => setViewMode('weekly')}>
            <Text style={[styles.toggleText, viewMode === 'weekly' && styles.toggleTextActive]}>Weekly</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'monthly' ? (
          <>
            {/* Monthly Charts */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Monthly Earnings</Text>
              <LineChart
                data={{
                  labels: yearlyStats.monthlyStats.map(stat => stat.month),
                  datasets: [{
                    data: yearlyStats.monthlyStats.map(stat => stat.earnings)
                  }]
                }}
                width={Dimensions.get('window').width - 32}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Monthly Hours</Text>
              <LineChart
                data={{
                  labels: yearlyStats.monthlyStats.map(stat => stat.month),
                  datasets: [{
                    data: yearlyStats.monthlyStats.map(stat => stat.hours)
                  }]
                }}
                width={Dimensions.get('window').width - 32}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>

            {/* Monthly Breakdown */}
            <View style={styles.tableContainer}>
              <Text style={styles.chartTitle}>Monthly Breakdown</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.tableMonth]}>Month</Text>
                <Text style={[styles.tableHeaderText, styles.tableHours]}>Hours</Text>
                <Text style={[styles.tableHeaderText, styles.tableEarnings]}>Earnings</Text>
              </View>
              {yearlyStats.monthlyStats.map((stat, index) => (
                <View key={stat.month} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  <Text style={[styles.tableCell, styles.tableMonth]}>{stat.month}</Text>
                  <Text style={[styles.tableCell, styles.tableHours]}>{stat.hours.toFixed(1)}h</Text>
                  <Text style={[styles.tableCell, styles.tableEarnings]}>{formatCurrency(stat.earnings)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Weekly Charts */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Weekly Earnings</Text>
              <BarChart
                data={{
                  labels: yearlyStats.weeklyStats.map(stat => `W${stat.weekNumber}`),
                  datasets: [{
                    data: yearlyStats.weeklyStats.map(stat => stat.earnings)
                  }]
                }}
                width={Dimensions.get('window').width - 32}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            </View>

            {/* Weekly Breakdown */}
            <View style={styles.tableContainer}>
              <Text style={styles.chartTitle}>Weekly Breakdown</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.tableWeek]}>Week</Text>
                <Text style={[styles.tableHeaderText, styles.tableDays]}>Days</Text>
                <Text style={[styles.tableHeaderText, styles.tableHours]}>Hours</Text>
                <Text style={[styles.tableHeaderText, styles.tableEarnings]}>Earnings</Text>
              </View>
              {yearlyStats.weeklyStats.map((stat, index) => (
                <View key={stat.weekNumber} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  <Text style={[styles.tableCell, styles.tableWeek]}>Week {stat.weekNumber}</Text>
                  <Text style={[styles.tableCell, styles.tableDays]}>{stat.daysWorked}</Text>
                  <Text style={[styles.tableCell, styles.tableHours]}>{stat.hours.toFixed(1)}h</Text>
                  <Text style={[styles.tableCell, styles.tableEarnings]}>{formatCurrency(stat.earnings)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Year over Year Comparison */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Year over Year Comparison</Text>
          <BarChart
            data={{
              labels: ['Previous Year', 'Current Year'],
              datasets: [{
                data: [yearlyStats.previousYearEarnings, yearlyStats.totalEarnings]
              }]
            }}
            width={Dimensions.get('window').width - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </View>
      </ScrollView>
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
  exportButton: {
    marginRight: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  growthIndicator: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  positiveGrowth: {
    color: '#34C759',
  },
  negativeGrowth: {
    color: '#FF3B30',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  goalContainer: {
    marginTop: 8,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  goalText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f9f9f9',
  },
  tableCell: {
    color: '#333',
  },
  tableMonth: {
    flex: 1,
  },
  tableWeek: {
    flex: 1.5,
  },
  tableDays: {
    flex: 0.5,
    textAlign: 'center',
  },
  tableHours: {
    flex: 1,
    textAlign: 'center',
  },
  tableEarnings: {
    flex: 1,
    textAlign: 'right',
  },
}); 