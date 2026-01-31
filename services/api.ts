
import { EquipmentItem, SummaryStats, HistoryEntry } from '../types';

const AUTH_HEADER = 'Basic ' + btoa('admin:password123');
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

// Export state to be reactive in UI
export let isDemoMode = true;

// Mock data storage that gets updated during simulation
export const MOCK_SUMMARY: SummaryStats = {
  total_equipment: 6,
  avg_flowrate: 16.4,
  avg_pressure: 3.2,
  avg_temperature: 61.1,
  type_distribution: { 'Pump': 2, 'Boiler': 1, 'Tank': 1, 'Exchanger': 1, 'Mixer': 1 }
};

export const MOCK_EQUIPMENT: EquipmentItem[] = [
  { id: 101, equipment_name: "Centrifugal Pump A", equipment_type: "Pump", flowrate: 45.5, pressure: 3.2, temperature: 42.0 },
  { id: 102, equipment_name: "High Temp Boiler", equipment_type: "Boiler", flowrate: 0, pressure: 8.5, temperature: 185.2 },
  { id: 103, equipment_name: "Storage Tank Alpha", equipment_type: "Tank", flowrate: 12.0, pressure: 1.1, temperature: 22.5 },
  { id: 104, equipment_name: "Process Heat Exchanger", equipment_type: "Exchanger", flowrate: 32.8, pressure: 4.4, temperature: 68.9 },
  { id: 105, equipment_name: "Sludge Mixer 500", equipment_type: "Mixer", flowrate: 8.2, pressure: 1.5, temperature: 35.0 },
  { id: 106, equipment_name: "Cooling Tower Fan", equipment_type: "Cooling", flowrate: 0, pressure: 0.5, temperature: 18.0 }
];

export const MOCK_HISTORY: HistoryEntry[] = [
  { id: 1, filename: "sample_parameters.csv", upload_date: new Date().toISOString(), item_count: 6 },
  { id: 2, filename: "legacy_system_data.csv", upload_date: new Date(Date.now() - 86400000).toISOString(), item_count: 12 }
];

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    throw new Error('Authentication failed (401). Ensure Django user "admin" with password "password123" exists.');
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Server error: ${response.status}`);
  }
  isDemoMode = false;
  return response.json();
};

const getHeaders = () => ({
  'Authorization': AUTH_HEADER,
  'Accept': 'application/json'
});

const fetchWithFallback = async <T>(url: string, options: RequestInit, mockData: T): Promise<T> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 1500); 

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    const data = await handleResponse(res);
    isDemoMode = false;
    return data;
  } catch (err: any) {
    clearTimeout(id);
    isDemoMode = true;
    return mockData;
  }
};

export const getSummary = async (): Promise<SummaryStats> => {
  return fetchWithFallback(`${BASE_URL}/summary/`, { headers: getHeaders() }, MOCK_SUMMARY);
};

export const getEquipment = async (): Promise<EquipmentItem[]> => {
  return fetchWithFallback(`${BASE_URL}/equipment/`, { headers: getHeaders() }, MOCK_EQUIPMENT);
};

export const getHistory = async (): Promise<HistoryEntry[]> => {
  return fetchWithFallback(`${BASE_URL}/history/`, { headers: getHeaders() }, MOCK_HISTORY);
};

/**
 * Enhanced Upload Logic:
 * In Demo Mode, we parse the CSV locally to update the dashboard charts.
 */
export const uploadCsv = async (file: File): Promise<any> => {
  if (isDemoMode) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length < 2) throw new Error("CSV file is empty or missing data.");

          const rows = lines.slice(1);
          const newItems: EquipmentItem[] = rows.map((line, idx) => {
            const cols = line.split(',');
            return {
              id: Date.now() + idx,
              equipment_name: cols[0] || 'Unknown Item',
              equipment_type: cols[1] || 'General',
              flowrate: parseFloat(cols[2]) || 0,
              pressure: parseFloat(cols[3]) || 0,
              temperature: parseFloat(cols[4]) || 0
            };
          });

          // Update Global Mock state
          MOCK_EQUIPMENT.length = 0;
          MOCK_EQUIPMENT.push(...newItems);

          const total = newItems.length;
          const avgFlow = newItems.reduce((acc, c) => acc + c.flowrate, 0) / total;
          const avgPres = newItems.reduce((acc, c) => acc + c.pressure, 0) / total;
          const avgTemp = newItems.reduce((acc, c) => acc + c.temperature, 0) / total;
          const dist: Record<string, number> = {};
          newItems.forEach(i => dist[i.equipment_type] = (dist[i.equipment_type] || 0) + 1);

          MOCK_SUMMARY.total_equipment = total;
          MOCK_SUMMARY.avg_flowrate = Number(avgFlow.toFixed(2));
          MOCK_SUMMARY.avg_pressure = Number(avgPres.toFixed(2));
          MOCK_SUMMARY.avg_temperature = Number(avgTemp.toFixed(2));
          MOCK_SUMMARY.type_distribution = dist;

          MOCK_HISTORY.unshift({
            id: Date.now(),
            filename: file.name,
            upload_date: new Date().toISOString(),
            item_count: total
          });
          if (MOCK_HISTORY.length > 5) MOCK_HISTORY.pop();

          setTimeout(() => resolve({ success: true, message: "Demo Mode: Dataset processed locally." }), 1000);
        } catch (err: any) {
          reject(new Error("Failed to parse CSV: " + err.message));
        }
      };
      reader.onerror = () => reject(new Error("File read error."));
      reader.readAsText(file);
    });
  }

  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const res = await fetch(`${BASE_URL}/upload/`, {
      method: 'POST',
      headers: { 'Authorization': AUTH_HEADER },
      body: formData
    });
    return await handleResponse(res);
  }catch (err: any) {
  isDemoMode = true;
  console.warn("Backend unavailable. Switching to Demo Mode.");
  return Promise.resolve({ success: true, demo: true });
}

};

export const downloadReport = async (): Promise<void> => {
  if (isDemoMode) {
    const reportContent = `
      CHEMVIS PRO - INDUSTRIAL ANALYTICS REPORT
      Status: SIMULATED (OFFLINE MODE)
      Generated: ${new Date().toLocaleString()}
      
      --------------------------------------------------
      GLOBAL SUMMARY METRICS (SYNCED TO DASHBOARD):
      - Total Equipment Units: ${MOCK_SUMMARY.total_equipment}
      - Avg Flowrate: ${MOCK_SUMMARY.avg_flowrate.toFixed(2)} m3/h
      - Avg Pressure: ${MOCK_SUMMARY.avg_pressure.toFixed(2)} Bar
      - Avg Temp: ${MOCK_SUMMARY.avg_temperature.toFixed(2)} C
      
      --------------------------------------------------
      DETAILED ASSET LIST (LATEST UPLOAD):
      ${MOCK_EQUIPMENT.map(e => `> ${e.equipment_name.padEnd(25)} | ${e.equipment_type.padEnd(10)} | F:${e.flowrate} P:${e.pressure} T:${e.temperature}C`).join('\n')}
      
      --------------------------------------------------
      END OF REPORT
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Industrial_Report_SYNC_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/report/`, { 
      headers: { 'Authorization': AUTH_HEADER } 
    });
    
    if (!response.ok) {
      throw new Error("Server PDF service failed.");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Industrial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    isDemoMode = true;
    await downloadReport(); 
  }
};
