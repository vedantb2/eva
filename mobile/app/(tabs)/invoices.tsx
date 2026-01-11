import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import * as MediaLibrary from 'expo-media-library';
import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';


import {
  getTimeEntriesForMonth,
  getCompanyDetails,
  saveInvoice,
  getInvoices,
  Invoice,
} from '@/utils/storage';
import { generateInvoicePDF } from '@/utils/pdf';
import { FontAwesome } from '@expo/vector-icons';
import { ActionSheet } from '@/components/ActionSheet';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    const savedInvoices = await getInvoices();
    setInvoices(
      savedInvoices.sort((a, b) => {
        const dateA = new Date(a.year, getMonthNumber(a.month));
        const dateB = new Date(b.year, getMonthNumber(b.month));
        return dateB.getTime() - dateA.getTime();
      })
    );
  };

  const getMonthNumber = (monthName: string): number => {
    return new Date(Date.parse(`${monthName} 1, 2000`)).getMonth();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkForNewInvoice();
    await loadInvoices();
    setRefreshing(false);
  };

  const checkForNewInvoice = async () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Check if we already have an invoice for this month
    const existingInvoice = invoices.find(
      (inv) =>
        inv.month === currentDate.toLocaleString('default', { month: 'long' }) &&
        inv.year === currentYear
    );

    if (!existingInvoice) {
      const entries = await getTimeEntriesForMonth(currentMonth, currentYear);
      const details = await getCompanyDetails();

      if (entries.length > 0 && details) {
        const totalAmount = entries.reduce(
          (sum, entry) => sum + entry.hours * parseFloat(details.hourlyRate || '0'),
          0
        );

        const newInvoice: Invoice = {
          id: `${currentYear}-${currentMonth + 1}`,
          month: currentDate.toLocaleString('default', { month: 'long' }),
          year: currentYear,
          amount: totalAmount,
          status: 'Draft',
          timeEntries: entries,
        };

        await saveInvoice(newInvoice);
      }
    }
  };

  const handlePDFGeneration = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowActions(true);
  };

  const handleShare = async () => {
    if (!selectedInvoice) return;
    await generateAndHandlePDF(selectedInvoice, 'share');
  };

  const handleDownload = async () => {
    if (!selectedInvoice) return;
    await generateAndHandlePDF(selectedInvoice, 'download');
  };

  const generateAndHandlePDF = async (invoice: Invoice, action: 'share' | 'download') => {
    try {
      setLoading(true);
      const details = await getCompanyDetails();
      if (!details) {
        Alert.alert('Error', 'Please set up company details first');
        return;
      }

      // Generate PDF
      const pdfPath = await generateInvoicePDF(
        details,
        invoice.timeEntries,
        invoice.month,
        invoice.year
      );

      if (action === 'share') {
        await Sharing.shareAsync(pdfPath, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice - ${invoice.month} ${invoice.year}`,
        });
      } else {
        try {
          // Request permissions first
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Storage permission is required to save files');
            return;
          }

          const fileName = `invoice_${invoice.month}_${invoice.year}.pdf`;
          let finalUri: string;

          if (Platform.OS === 'ios') {
            // For iOS, use the generated PDF path directly
            finalUri = pdfPath;
          } else {
            // For Android, save to Downloads directory
            const downloadsDir = `${FileSystem.documentDirectory}Downloads/`;
            
            // Ensure Downloads directory exists
            const { exists } = await FileSystem.getInfoAsync(downloadsDir);
            if (!exists) {
              await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
            }

            const destinationUri = `${downloadsDir}${fileName}`;

            // Copy file to downloads
            await FileSystem.copyAsync({
              from: pdfPath,
              to: destinationUri
            });

            finalUri = destinationUri;
          }

          // Show success notification
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Invoice Downloaded',
              body: `${fileName} has been saved to your device`,
              data: { uri: finalUri },
            },
            trigger: null,
          });

          // Try to open the PDF
          if (Platform.OS === 'ios') {
            await Sharing.shareAsync(finalUri);
          } else {
            try {
              await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                data: finalUri,
                flags: 1,
                type: 'application/pdf',
              });
            } catch (openError) {
              console.error('Error opening PDF:', openError);
              // Fallback to sharing if no PDF viewer is installed
              await Sharing.shareAsync(finalUri);
            }
          }

          // Update invoice status
          const updatedInvoice: Invoice = {
            ...invoice,
            status: 'Generated',
            generatedDate: new Date().toISOString(),
            pdfUri: finalUri,
          };

          await saveInvoice(updatedInvoice);
          await loadInvoices();

          Alert.alert(
            'Success',
            Platform.OS === 'ios' 
              ? 'Invoice has been saved and opened'
              : 'Invoice has been saved to your Downloads folder',
            [{ text: 'OK' }]
          );

        } catch (downloadError: any) {
          console.error('Download error:', downloadError);
          Alert.alert('Error', 'Failed to save invoice to device. Error: ' + downloadError.message);
        }
      }
    } catch (error: any) {
      console.error('Error handling PDF:', error);
      Alert.alert('Error', 'Failed to handle invoice. Error: ' + error.message);
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

  return (
    <>
      <Stack.Screen options={{ title: 'Invoices' }} />
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Generating Invoice...</Text>
          </View>
        )}

        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No invoices available</Text>
              <Text style={styles.emptyStateSubtext}>Log some hours to generate an invoice</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View>
                  <Text style={styles.month}>{`${item.month} ${item.year}`}</Text>
                  <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                </View>
                <View style={styles.statusContainer}>
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'Generated' ? styles.statusGenerated : styles.statusDraft,
                    ]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.invoiceActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.generateButton]}
                  onPress={() => handlePDFGeneration(item)}>
                  <FontAwesome
                    name={item.status === 'Generated' ? 'refresh' : 'file-pdf-o'}
                    size={16}
                    color="#fff"
                    style={styles.actionIcon}
                  />
                  <Text style={styles.actionButtonText}>
                    {item.status === 'Generated' ? 'Regenerate' : 'Generate'} PDF
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        <ActionSheet
          visible={showActions}
          onClose={() => setShowActions(false)}
          actions={[
            {
              icon: 'share-square-o',
              label: 'Share PDF',
              onPress: handleShare,
            },
            {
              icon: 'download',
              label: 'Download PDF',
              onPress: handleDownload,
            },
          ]}
        />
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
  },
  invoiceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  month: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  invoiceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  generateButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  statusContainer: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusDraft: {
    color: '#FF9500',
  },
  statusGenerated: {
    color: '#34C759',
  },
  actionIcon: {
    marginRight: 8,
  },
});
