
export interface EquipmentItem {
  id: number;
  equipment_name: string;
  equipment_type: string;
  flowrate: number;
  pressure: number;
  temperature: number;
}

export interface SummaryStats {
  total_equipment: number;
  avg_flowrate: number;
  avg_pressure: number;
  avg_temperature: number;
  type_distribution: Record<string, number>;
}

export interface HistoryEntry {
  id: number;
  filename: string;
  upload_date: string;
  item_count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
