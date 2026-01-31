
import sys
import json
import requests
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QPushButton, QLabel, QFileDialog, QTableWidget, QTableWidgetItem, 
    QMessageBox, QFrame, QHeaderView
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal
from PyQt5.QtGui import QFont, QColor, QPalette

# --- Configuration ---
API_BASE_URL = "http://localhost:8000/api"
WS_URL = "ws://localhost:8000/ws/updates/"
AUTH_CREDENTIALS = ('admin', 'password123')

class WebSocketThread(QThread):
    """
    Background worker that listens for WebSocket broadcast events from Django Channels.
    Emits a signal to the main thread to trigger data refreshes.
    """
    data_changed_signal = pyqtSignal()

    def run(self):
        try:
            import websocket
            def on_message(ws, message):
                msg_data = json.loads(message)
                if msg_data.get('message') == 'data_updated':
                    self.data_changed_signal.emit()

            # Maintain persistent connection
            ws = websocket.WebSocketApp(
                WS_URL,
                on_message=on_message,
                on_error=lambda ws, err: print(f"WS Error: {err}"),
                on_close=lambda ws, code, msg: print("WS Connection Closed")
            )
            ws.run_forever()
        except ImportError:
            print("websocket-client not installed. Real-time updates disabled.")
        except Exception as e:
            print(f"WebSocket Thread Exception: {e}")

class ChemVisDesktop(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("ChemVis Pro | Industrial Dashboard")
        self.setMinimumSize(1100, 750)
        self.setup_ui()
        
        # Start the real-time update listener
        self.ws_worker = WebSocketThread()
        self.ws_worker.data_changed_signal.connect(self.fetch_system_data)
        self.ws_worker.start()

        # Initial data load
        self.fetch_system_data()

    def setup_ui(self):
        """Builds the main layout and applies industrial styling."""
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(15)

        # Apply Global Styling (Dark/Industrial Theme)
        self.setStyleSheet("""
            QMainWindow { background-color: #0f172a; }
            QLabel { color: #f8fafc; font-family: 'Segoe UI', Arial; }
            QTableWidget { 
                background-color: #1e293b; 
                color: #f8fafc; 
                gridline-color: #334155; 
                border: 1px solid #334155;
                border-radius: 5px;
            }
            QHeaderView::section {
                background-color: #334155;
                color: #94a3b8;
                padding: 5px;
                border: none;
                font-weight: bold;
            }
            QPushButton { 
                background-color: #3b82f6; 
                color: white; 
                border-radius: 4px; 
                padding: 8px 15px; 
                font-weight: bold;
            }
            QPushButton:hover { background-color: #2563eb; }
            QPushButton#SecondaryBtn { background-color: #334155; }
            QPushButton#SecondaryBtn:hover { background-color: #475569; }
        """)

        # 1. Header Area
        header = QHBoxLayout()
        title_container = QVBoxLayout()
        main_title = QLabel("SYSTEM PARAMETER MONITOR")
        main_title.setFont(QFont("Segoe UI", 18, QFont.Bold))
        subtitle = QLabel("REAL-TIME ANALYTICS ENGINE v1.0")
        subtitle.setStyleSheet("color: #64748b; font-size: 10px; letter-spacing: 1px;")
        title_container.addWidget(main_title)
        title_container.addWidget(subtitle)
        header.addLayout(title_container)

        header.addStretch()
        
        self.status_label = QLabel("● CONNECTED")
        self.status_label.setStyleSheet("color: #10b981; font-weight: bold; font-size: 11px; margin-right: 15px;")
        header.addWidget(self.status_label)

        upload_btn = QPushButton("UPLOAD CSV")
        upload_btn.setCursor(Qt.PointingHandCursor)
        upload_btn.clicked.connect(self.handle_upload)
        header.addWidget(upload_btn)

        refresh_btn = QPushButton("REFRESH")
        refresh_btn.setObjectName("SecondaryBtn")
        refresh_btn.clicked.connect(self.fetch_system_data)
        header.addWidget(refresh_btn)
        
        main_layout.addLayout(header)

        # 2. KPI Cards Area
        self.kpi_layout = QHBoxLayout()
        self.kpi_widgets = {}
        metrics = [
            ("TOTAL UNITS", "units"),
            ("AVG FLOWRATE", "m³/h"),
            ("AVG PRESSURE", "Bar"),
            ("AVG TEMP", "°C")
        ]
        for name, unit in metrics:
            card = QFrame()
            card.setStyleSheet("background-color: #1e293b; border-radius: 8px; border: 1px solid #334155;")
            card_layout = QVBoxLayout(card)
            
            label = QLabel(name)
            label.setStyleSheet("color: #94a3b8; font-size: 10px; font-weight: bold;")
            val = QLabel("0.00")
            val.setFont(QFont("Consolas", 20, QFont.Bold))
            val.setStyleSheet("color: #3b82f6;")
            
            card_layout.addWidget(label)
            card_layout.addWidget(val)
            card_layout.addWidget(QLabel(unit, styleSheet="color: #475569; font-size: 9px;"))
            
            self.kpi_widgets[name] = val
            self.kpi_layout.addWidget(card)
        
        main_layout.addLayout(self.kpi_layout)

        # 3. Content Area (Table + Chart)
        content_layout = QHBoxLayout()
        
        # Table container
        table_container = QVBoxLayout()
        table_label = QLabel("DETAILED EQUIPMENT LOG")
        table_label.setStyleSheet("color: #94a3b8; font-size: 11px; font-weight: bold;")
        table_container.addWidget(table_label)
        
        self.data_table = QTableWidget()
        self.data_table.setColumnCount(5)
        self.data_table.setHorizontalHeaderLabels(["Name", "Type", "Flow", "Press", "Temp"])
        self.data_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        table_container.addWidget(self.data_table)
        content_layout.addLayout(table_container, 2)

        # Chart container
        chart_container = QVBoxLayout()
        chart_label = QLabel("DISTRIBUTION ANALYTICS")
        chart_label.setStyleSheet("color: #94a3b8; font-size: 11px; font-weight: bold;")
        chart_container.addWidget(chart_label)
        
        self.figure, self.ax = plt.subplots(figsize=(4, 4), facecolor='#1e293b')
        self.canvas = FigureCanvas(self.figure)
        chart_container.addWidget(self.canvas)
        content_layout.addLayout(chart_container, 1)

        main_layout.addLayout(content_layout)

    def fetch_system_data(self):
        """Fetches both summary and detailed list from REST APIs."""
        try:
            # 1. Fetch Summary Stats
            summary_res = requests.get(f"{API_BASE_URL}/summary/", auth=AUTH_CREDENTIALS, timeout=5)
            if summary_res.status_code == 200:
                s = summary_res.json()
                self.kpi_widgets["TOTAL UNITS"].setText(str(s['total_equipment']))
                self.kpi_widgets["AVG FLOWRATE"].setText(f"{s['avg_flowrate']:.2f}")
                self.kpi_widgets["AVG PRESSURE"].setText(f"{s['avg_pressure']:.2f}")
                self.kpi_widgets["AVG TEMP"].setText(f"{s['avg_temperature']:.2f}")
                self.update_distribution_chart(s['type_distribution'])

            # 2. Fetch Detailed List
            list_res = requests.get(f"{API_BASE_URL}/equipment/", auth=AUTH_CREDENTIALS, timeout=5)
            if list_res.status_code == 200:
                items = list_res.json()
                self.data_table.setRowCount(len(items))
                for i, item in enumerate(items):
                    self.data_table.setItem(i, 0, QTableWidgetItem(str(item['equipment_name'])))
                    self.data_table.setItem(i, 1, QTableWidgetItem(str(item['equipment_type'])))
                    self.data_table.setItem(i, 2, QTableWidgetItem(f"{item['flowrate']:.1f}"))
                    self.data_table.setItem(i, 3, QTableWidgetItem(f"{item['pressure']:.1f}"))
                    self.data_table.setItem(i, 4, QTableWidgetItem(f"{item['temperature']:.1f}"))
                
            self.status_label.setText("● SYSTEM ONLINE")
            self.status_label.setStyleSheet("color: #10b981; font-weight: bold; font-size: 11px; margin-right: 15px;")
        except Exception as e:
            self.status_label.setText("● OFFLINE")
            self.status_label.setStyleSheet("color: #ef4444; font-weight: bold; font-size: 11px; margin-right: 15px;")
            print(f"Data Fetch Error: {e}")

    def update_distribution_chart(self, distribution):
        """Redraws the Matplotlib pie chart based on current equipment distribution."""
        self.ax.clear()
        if not distribution:
            self.ax.text(0.5, 0.5, "No Data", color='white', ha='center')
        else:
            labels = list(distribution.keys())
            sizes = list(distribution.values())
            # Custom high-contrast color scheme for dark theme
            colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
            
            wedges, texts, autotexts = self.ax.pie(
                sizes, labels=labels, autopct='%1.1f%%', 
                startangle=140, colors=colors,
                textprops={'color': "w", 'fontsize': 8}
            )
            self.ax.set_title("Equipment Type Split", color='white', fontsize=10, fontweight='bold')
        
        self.canvas.draw()

    def handle_upload(self):
        """Native file selection and transmission logic."""
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Select Parameters CSV", "", "CSV Files (*.csv)"
        )
        if file_path:
            try:
                with open(file_path, 'rb') as f:
                    files = {'file': (file_path.split('/')[-1], f, 'text/csv')}
                    response = requests.post(
                        f"{API_BASE_URL}/upload/", 
                        files=files, 
                        auth=AUTH_CREDENTIALS,
                        timeout=10
                    )
                    
                    if response.status_code == 201:
                        QMessageBox.information(self, "Success", "Data synchronized with global database.")
                        # Local refresh (though WebSocket will also trigger it)
                        self.fetch_system_data()
                    else:
                        error_msg = response.json().get('error', 'Server validation failed.')
                        QMessageBox.warning(self, "Upload Rejected", error_msg)
            except Exception as e:
                QMessageBox.critical(self, "Network Error", f"Could not connect to server:\n{str(e)}")

if __name__ == "__main__":
    # Ensure high DPI scaling works on modern monitors
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling, True)
    QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps, True)
    
    app = QApplication(sys.argv)
    
    # Run the application
    window = ChemVisDesktop()
    window.show()
    sys.exit(app.exec_())
