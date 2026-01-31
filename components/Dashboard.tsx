
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { SummaryStats } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface DashboardProps {
  summary: SummaryStats | null;
  loading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ summary, loading }) => {
  if (loading || !summary) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
        <i className="fas fa-circle-notch fa-spin text-3xl text-blue-500 mb-4"></i>
        <span className="text-slate-500 font-medium">Aggregating Process Data...</span>
      </div>
    );
  }

  const averagesData = {
    labels: ['Flowrate', 'Pressure', 'Temp'],
    datasets: [{
      label: 'Average Process Value',
      data: [summary.avg_flowrate, summary.avg_pressure, summary.avg_temperature],
      backgroundColor: [
        'rgba(59, 130, 246, 0.7)', 
        'rgba(16, 185, 129, 0.7)', 
        'rgba(245, 158, 11, 0.7)'
      ],
      hoverBackgroundColor: [
        'rgba(59, 130, 246, 1)', 
        'rgba(16, 185, 129, 1)', 
        'rgba(245, 158, 11, 1)'
      ],
      borderWidth: 0,
      borderRadius: 8,
      hoverBorderWidth: 2,
      hoverBorderColor: 'rgba(255, 255, 255, 0.5)',
    }],
  };

  const typeDistributionData = {
    labels: Object.keys(summary.type_distribution),
    datasets: [{
      label: 'Equipment Units',
      data: Object.values(summary.type_distribution),
      backgroundColor: 'rgba(99, 102, 241, 0.7)',
      hoverBackgroundColor: 'rgba(99, 102, 241, 1)',
      borderRadius: 6,
      borderWidth: 0,
    }],
  };

  const commonOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      intersect: true,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        events: ['click', 'mousemove', 'mouseout'],
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += context.parsed.y;
              if (context.chart.data.labels?.length === 3 && context.datasetIndex === 0) {
                const units = [' m³/h', ' Bar', ' °C'];
                label += units[context.dataIndex];
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9', drawTicks: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' }
      }
    },
    animation: {
      duration: 600,
      easing: 'easeOutQuart'
    }
  };

  const metrics = [
    { label: 'Total Units', value: summary.total_equipment, unit: 'Units', icon: 'fa-cubes', color: 'bg-indigo-500' },
    { label: 'Avg Flowrate', value: summary.avg_flowrate, unit: 'm³/h', icon: 'fa-gauge-high', color: 'bg-blue-500' },
    { label: 'Avg Pressure', value: summary.avg_pressure, unit: 'Bar', icon: 'fa-compress', color: 'bg-emerald-500' },
    { label: 'Avg Temp', value: summary.avg_temperature, unit: '°C', icon: 'fa-temperature-half', color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all group cursor-default">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{m.label}</span>
              <div className={`${m.color} w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <i className={`fas ${m.icon} text-xs`}></i>
              </div>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-black text-slate-800">{m.value}</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center">
              <i className="fas fa-chart-line text-blue-500 mr-2"></i>
              Parameter Averages
            </h4>
            <span className="text-[9px] text-slate-300 font-bold italic uppercase tracking-widest">Live Updates</span>
          </div>
          <div className="h-64">
            {/* Added key based on total equipment to force chart refresh */}
            <Bar key={`avg-${summary.total_equipment}`} data={averagesData} options={commonOptions} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center">
              <i className="fas fa-chart-pie text-indigo-500 mr-2"></i>
              Distribution by Type
            </h4>
            <span className="text-[9px] text-slate-300 font-bold italic uppercase tracking-widest">Asset Segmentation</span>
          </div>
          <div className="h-64">
            <Bar 
              key={`dist-${summary.total_equipment}`}
              data={typeDistributionData} 
              options={{
                ...commonOptions, 
                indexAxis: 'y',
                scales: {
                    ...commonOptions.scales,
                    x: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' },
                        ticks: { font: { size: 10 }, color: '#94a3b8' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 10 }, color: '#94a3b8' }
                    }
                }
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
