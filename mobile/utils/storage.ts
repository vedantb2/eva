import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  notes: string;
  project?: string;
}

export interface CompanyDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  abn: string;
  bankName: string;
  bankBSB: string;
  bankAccount: string;
  hourlyRate: string;
}

export interface Invoice {
  id: string;
  month: string;
  year: number;
  amount: number;
  status: 'Draft' | 'Generated';
  timeEntries: TimeEntry[];
  generatedDate?: string;
  pdfUri?: string;
}

export const saveTimeEntry = async (entry: TimeEntry) => {
  try {
    const existingEntriesJson = await AsyncStorage.getItem('timeEntries');
    const existingEntries: TimeEntry[] = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];
    
    existingEntries.push(entry);
    await AsyncStorage.setItem('timeEntries', JSON.stringify(existingEntries));
    return true;
  } catch (error) {
    console.error('Error saving time entry:', error);
    return false;
  }
};

export const getTimeEntries = async (): Promise<TimeEntry[]> => {
  try {
    const entriesJson = await AsyncStorage.getItem('timeEntries');
    return entriesJson ? JSON.parse(entriesJson) : [];
  } catch (error) {
    console.error('Error getting time entries:', error);
    return [];
  }
};

export const getTimeEntriesForMonth = async (month: number, year: number): Promise<TimeEntry[]> => {
  const entries = await getTimeEntries();
  return entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === month && entryDate.getFullYear() === year;
  });
};

export const getCompanyDetails = async (): Promise<CompanyDetails | null> => {
  try {
    const detailsJson = await AsyncStorage.getItem('companyDetails');
    return detailsJson ? JSON.parse(detailsJson) : null;
  } catch (error) {
    console.error('Error getting company details:', error);
    return null;
  }
};

export const deleteTimeEntry = async (id: string): Promise<boolean> => {
  try {
    const entries = await getTimeEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    await AsyncStorage.setItem('timeEntries', JSON.stringify(filteredEntries));
    return true;
  } catch (error) {
    console.error('Error deleting time entry:', error);
    return false;
  }
};

export const updateTimeEntry = async (updatedEntry: TimeEntry): Promise<boolean> => {
  try {
    const entries = await getTimeEntries();
    const updatedEntries = entries.map(entry =>
      entry.id === updatedEntry.id ? updatedEntry : entry
    );
    await AsyncStorage.setItem('timeEntries', JSON.stringify(updatedEntries));
    return true;
  } catch (error) {
    console.error('Error updating time entry:', error);
    return false;
  }
};

export const saveInvoice = async (invoice: Invoice): Promise<boolean> => {
  try {
    const existingInvoicesJson = await AsyncStorage.getItem('invoices');
    const existingInvoices: Invoice[] = existingInvoicesJson ? JSON.parse(existingInvoicesJson) : [];
    
    // Update if exists, otherwise add new
    const index = existingInvoices.findIndex(inv => inv.id === invoice.id);
    if (index !== -1) {
      existingInvoices[index] = invoice;
    } else {
      existingInvoices.push(invoice);
    }
    
    await AsyncStorage.setItem('invoices', JSON.stringify(existingInvoices));
    return true;
  } catch (error) {
    console.error('Error saving invoice:', error);
    return false;
  }
};

export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const invoicesJson = await AsyncStorage.getItem('invoices');
    return invoicesJson ? JSON.parse(invoicesJson) : [];
  } catch (error) {
    console.error('Error getting invoices:', error);
    return [];
  }
};

export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  try {
    const invoices = await getInvoices();
    return invoices.find(invoice => invoice.id === id) || null;
  } catch (error) {
    console.error('Error getting invoice:', error);
    return null;
  }
};

export const deleteInvoice = async (id: string): Promise<boolean> => {
  try {
    const invoices = await getInvoices();
    const filteredInvoices = invoices.filter(invoice => invoice.id !== id);
    await AsyncStorage.setItem('invoices', JSON.stringify(filteredInvoices));
    return true;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return false;
  }
}; 