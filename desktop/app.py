
import sys
import json
import requests
from datetime import datetime
from io import BytesIO
import matplotlib.pyplot as plt
from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QPushButton, QLabel, QFileDialog, QTableWidget, QTableWidgetItem, 
    QMessageBox, QFrame, QHeaderView
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal
from PyQt5.QtGui import QFont, QColor, QPalette
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.pdfgen import canvas

# --- Configuration ---
API_BASE_URL = "http://localhost:8000/api"
WS_URL = "ws://localhost:8000/ws/updates/"
AUTH_CREDENTIALS = ('admin', 'password123')

class DataFetchThread(QThread):
    """
    Background worker for fetching data without blocking the UI.
    """
    data_ready = pyqtSignal(dict)
    
    def run(self):
        try:
            # Quick timeout for responsive UI
            summary_res = requests.get(f"{API_BASE_URL}/summary/", auth=AUTH_CREDENTIALS, timeout=2)
            list_res = requests.get(f"{API_BASE_URL}/equipment/", auth=AUTH_CREDENTIALS, timeout=2)
            
            if summary_res.status_code == 200 and list_res.status_code == 200:
                self.data_ready.emit({
                    'success': True,
                    'summary': summary_res.json(),
                    'equipment': list_res.json()
                })
            else:
                self.data_ready.emit({'success': False})
        except Exception:
            self.data_ready.emit({'success': False})


class WebSocketThread(QThread):
    """
    Background worker that listens for WebSocket broadcast events from Django Channels.
    Emits a signal to the main thread to trigger data refreshes.
    Gracefully handles connection failures.
    """
    data_changed_signal = pyqtSignal()

    def run(self):
        try:
            import websocket
            def on_message(ws, message):
                try:
                    msg_data = json.loads(message)
                    if msg_data.get('message') == 'data_updated':
                        self.data_changed_signal.emit()
                except:
                    pass

            # Attempt persistent connection with timeout
            ws = websocket.WebSocketApp(
                WS_URL,
                on_message=on_message,
                on_error=lambda ws, err: None,
                on_close=lambda ws, code, msg: None
            )
            ws.run_forever(ping_interval=30, ping_timeout=10)
        except Exception:
            # WebSocket not available - app will work with manual refresh
            pass

class ChemVisDesktop(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("ChemVis Pro | Industrial Dashboard")
        self.setMinimumSize(1100, 750)
        self.data_fetch_thread = None
        self.setup_ui()
        
        # Load demo data immediately for instant display
        self.use_mock_data()
        
        # Start the real-time update listener
        self.ws_worker = WebSocketThread()
        self.ws_worker.data_changed_signal.connect(self.fetch_system_data)
        self.ws_worker.start()

        # Try to fetch real data in background
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
        
        pdf_btn = QPushButton("GENERATE PDF")
        pdf_btn.setCursor(Qt.PointingHandCursor)
        pdf_btn.clicked.connect(self.generate_pdf_report)
        header.addWidget(pdf_btn)
        
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
        """Fetches data in background without blocking UI."""
        # Show loading state
        self.status_label.setText("⟳ LOADING...")
        self.status_label.setStyleSheet("color: #64748b; font-weight: bold; font-size: 11px; margin-right: 15px;")
        
        # Cancel previous fetch if still running
        if self.data_fetch_thread and self.data_fetch_thread.isRunning():
            self.data_fetch_thread.quit()
            self.data_fetch_thread.wait()
        
        # Start new fetch in background
        self.data_fetch_thread = DataFetchThread()
        self.data_fetch_thread.data_ready.connect(self.handle_data_response)
        self.data_fetch_thread.start()
    
    def handle_data_response(self, data):
        """Handle data from background thread."""
        if data.get('success'):
            # Update with real data
            s = data['summary']
            self.kpi_widgets["TOTAL UNITS"].setText(str(s.get('total_equipment', 0)))
            self.kpi_widgets["AVG FLOWRATE"].setText(f"{s.get('avg_flowrate', 0):.2f}")
            self.kpi_widgets["AVG PRESSURE"].setText(f"{s.get('avg_pressure', 0):.2f}")
            self.kpi_widgets["AVG TEMP"].setText(f"{s.get('avg_temperature', 0):.2f}")
            self.update_distribution_chart(s.get('type_distribution', {}))
            
            # Update table
            items = data['equipment']
            self.data_table.setRowCount(len(items))
            for i, item in enumerate(items):
                self.data_table.setItem(i, 0, QTableWidgetItem(str(item.get('equipment_name', ''))))
                self.data_table.setItem(i, 1, QTableWidgetItem(str(item.get('equipment_type', ''))))
                self.data_table.setItem(i, 2, QTableWidgetItem(f"{item.get('flowrate', 0):.1f}"))
                self.data_table.setItem(i, 3, QTableWidgetItem(f"{item.get('pressure', 0):.1f}"))
                self.data_table.setItem(i, 4, QTableWidgetItem(f"{item.get('temperature', 0):.1f}"))
            
            self.status_label.setText("● SYSTEM ONLINE")
            self.status_label.setStyleSheet("color: #10b981; font-weight: bold; font-size: 11px; margin-right: 15px;")
        else:
            # Keep using mock data
            self.status_label.setText("● DEMO MODE")
            self.status_label.setStyleSheet("color: #f59e0b; font-weight: bold; font-size: 11px; margin-right: 15px;")

    def use_mock_data(self):
        """Uses mock data for demonstration when backend is unavailable."""
        # Mock KPI data
        self.kpi_widgets["TOTAL UNITS"].setText("12")
        self.kpi_widgets["AVG FLOWRATE"].setText("45.50")
        self.kpi_widgets["AVG PRESSURE"].setText("3.20")
        self.kpi_widgets["AVG TEMP"].setText("72.40")
        
        # Mock equipment data
        mock_equipment = [
            {"name": "Pump-A01", "type": "Centrifugal", "flow": 50.5, "pressure": 3.2, "temp": 72.4},
            {"name": "Pump-B02", "type": "Positive Displacement", "flow": 42.3, "pressure": 2.8, "temp": 68.9},
            {"name": "Compressor-C01", "type": "Reciprocating", "flow": 45.2, "pressure": 3.5, "temp": 75.1},
            {"name": "Blower-D01", "type": "Centrifugal", "flow": 48.9, "pressure": 3.1, "temp": 71.2},
            {"name": "Fan-E01", "type": "Axial", "flow": 40.1, "pressure": 2.5, "temp": 65.8},
        ]
        
        self.data_table.setRowCount(len(mock_equipment))
        for i, item in enumerate(mock_equipment):
            self.data_table.setItem(i, 0, QTableWidgetItem(item['name']))
            self.data_table.setItem(i, 1, QTableWidgetItem(item['type']))
            self.data_table.setItem(i, 2, QTableWidgetItem(f"{item['flow']:.1f}"))
            self.data_table.setItem(i, 3, QTableWidgetItem(f"{item['pressure']:.1f}"))
            self.data_table.setItem(i, 4, QTableWidgetItem(f"{item['temp']:.1f}"))
        
        # Mock distribution
        distribution = {
            "Centrifugal": 4,
            "Positive Displacement": 2,
            "Reciprocating": 3,
            "Axial": 2,
            "Other": 1
        }
        self.update_distribution_chart(distribution)

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

    def validate_csv(self, file_path):
        """Validate CSV file format and content."""
        try:
            import pandas as pd
            df = pd.read_csv(file_path)
            
            # Check required columns
            required_cols = ['Equipment Name', 'Type', 'Flowrate', 'Pressure', 'Temperature']
            missing_cols = [col for col in required_cols if col not in df.columns]
            
            if missing_cols:
                return False, f"Missing required columns: {', '.join(missing_cols)}\n\nRequired: {', '.join(required_cols)}"
            
            # Check for empty data
            if len(df) == 0:
                return False, "CSV file is empty. Please add equipment data."
            
            # Check data types
            try:
                df['Flowrate'] = pd.to_numeric(df['Flowrate'])
                df['Pressure'] = pd.to_numeric(df['Pressure'])
                df['Temperature'] = pd.to_numeric(df['Temperature'])
            except:
                return False, "Invalid data format. Flowrate, Pressure, and Temperature must be numeric values."
            
            return True, df
        except Exception as e:
            return False, f"Error reading CSV file: {str(e)}"
    
    def process_csv_locally(self, df):
        """Process CSV data and display it locally when server is unavailable."""
        try:
            # Update KPI cards
            total = len(df)
            avg_flow = df['Flowrate'].mean()
            avg_pressure = df['Pressure'].mean()
            avg_temp = df['Temperature'].mean()
            
            self.kpi_widgets["TOTAL UNITS"].setText(str(total))
            self.kpi_widgets["AVG FLOWRATE"].setText(f"{avg_flow:.2f}")
            self.kpi_widgets["AVG PRESSURE"].setText(f"{avg_pressure:.2f}")
            self.kpi_widgets["AVG TEMP"].setText(f"{avg_temp:.2f}")
            
            # Update table
            self.data_table.setRowCount(len(df))
            for i, row in df.iterrows():
                self.data_table.setItem(i, 0, QTableWidgetItem(str(row['Equipment Name'])))
                self.data_table.setItem(i, 1, QTableWidgetItem(str(row['Type'])))
                self.data_table.setItem(i, 2, QTableWidgetItem(f"{float(row['Flowrate']):.1f}"))
                self.data_table.setItem(i, 3, QTableWidgetItem(f"{float(row['Pressure']):.1f}"))
                self.data_table.setItem(i, 4, QTableWidgetItem(f"{float(row['Temperature']):.1f}"))
            
            # Update distribution chart
            type_counts = df['Type'].value_counts().to_dict()
            self.update_distribution_chart(type_counts)
            
            return True
        except Exception as e:
            QMessageBox.warning(self, "Processing Error", f"Error processing CSV data:\n{str(e)}")
            return False

    def handle_upload(self):
        """Enhanced file upload with validation and local processing fallback."""
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Select Parameters CSV", "", "CSV Files (*.csv);;All Files (*.*)"
        )
        if not file_path:
            return
        
        # Validate CSV first
        self.status_label.setText("⟳ VALIDATING...")
        self.status_label.setStyleSheet("color: #3b82f6; font-weight: bold; font-size: 11px; margin-right: 15px;")
        QApplication.processEvents()
        
        is_valid, result = self.validate_csv(file_path)
        
        if not is_valid:
            QMessageBox.critical(self, "Invalid CSV File", f"The selected file is not valid:\n\n{result}\n\nPlease check your CSV file format.")
            self.status_label.setText("● DEMO MODE")
            self.status_label.setStyleSheet("color: #f59e0b; font-weight: bold; font-size: 11px; margin-right: 15px;")
            return
        
        df = result  # DataFrame from validation
        
        # Try uploading to server
        self.status_label.setText("⟳ UPLOADING...")
        QApplication.processEvents()
        
        try:
            with open(file_path, 'rb') as f:
                import os
                filename = os.path.basename(file_path)
                files = {'file': (filename, f, 'text/csv')}
                
                response = requests.post(
                    f"{API_BASE_URL}/upload/", 
                    files=files, 
                    auth=AUTH_CREDENTIALS,
                    timeout=8
                )
                
                if response.status_code == 201:
                    msg = response.json().get('message', 'Upload successful')
                    QMessageBox.information(
                        self, 
                        "✓ Upload Successful", 
                        f"Data uploaded to server successfully!\n\n{msg}\n\nRecords: {len(df)}"
                    )
                    self.fetch_system_data()
                    return
                else:
                    error_msg = response.json().get('error', 'Server validation failed')
                    # Ask if user wants to process locally
                    reply = QMessageBox.question(
                        self, 
                        "Server Error",
                        f"Server upload failed: {error_msg}\n\nWould you like to process the CSV locally instead?",
                        QMessageBox.Yes | QMessageBox.No
                    )
                    if reply == QMessageBox.Yes:
                        if self.process_csv_locally(df):
                            QMessageBox.information(self, "Local Processing", f"CSV data loaded successfully!\n\nRecords: {len(df)}\n\nNote: Data is local only (not synced to server)")
                            self.status_label.setText("● LOCAL DATA")
                            self.status_label.setStyleSheet("color: #8b5cf6; font-weight: bold; font-size: 11px; margin-right: 15px;")
                    else:
                        self.status_label.setText("● DEMO MODE")
                        self.status_label.setStyleSheet("color: #f59e0b; font-weight: bold; font-size: 11px; margin-right: 15px;")
                        
        except requests.exceptions.Timeout:
            # Offer local processing on timeout
            reply = QMessageBox.question(
                self, 
                "Connection Timeout",
                "Server connection timed out. The backend may not be running.\n\nWould you like to process the CSV locally instead?",
                QMessageBox.Yes | QMessageBox.No
            )
            if reply == QMessageBox.Yes:
                if self.process_csv_locally(df):
                    QMessageBox.information(self, "Local Processing", f"CSV data loaded successfully!\n\nRecords: {len(df)}\n\nNote: Data is local only (not synced to server)")
                    self.status_label.setText("● LOCAL DATA")
                    self.status_label.setStyleSheet("color: #8b5cf6; font-weight: bold; font-size: 11px; margin-right: 15px;")
            else:
                self.status_label.setText("● DEMO MODE")
                self.status_label.setStyleSheet("color: #f59e0b; font-weight: bold; font-size: 11px; margin-right: 15px;")
                
        except requests.exceptions.ConnectionError:
            # Offer local processing on connection error
            reply = QMessageBox.question(
                self, 
                "Server Unavailable",
                "Cannot connect to server. The backend may not be running.\n\nWould you like to process the CSV locally instead?",
                QMessageBox.Yes | QMessageBox.No
            )
            if reply == QMessageBox.Yes:
                if self.process_csv_locally(df):
                    QMessageBox.information(self, "Local Processing", f"CSV data loaded successfully!\n\nRecords: {len(df)}\n\nNote: Data is local only (not synced to server)")
                    self.status_label.setText("● LOCAL DATA")
                    self.status_label.setStyleSheet("color: #8b5cf6; font-weight: bold; font-size: 11px; margin-right: 15px;")
            else:
                self.status_label.setText("● DEMO MODE")
                self.status_label.setStyleSheet("color: #f59e0b; font-weight: bold; font-size: 11px; margin-right: 15px;")
                
        except Exception as e:
            # Offer local processing on any error
            reply = QMessageBox.question(
                self, 
                "Upload Error",
                f"Upload failed: {str(e)[:150]}\n\nWould you like to process the CSV locally instead?",
                QMessageBox.Yes | QMessageBox.No
            )
            if reply == QMessageBox.Yes:
                if self.process_csv_locally(df):
                    QMessageBox.information(self, "Local Processing", f"CSV data loaded successfully!\n\nRecords: {len(df)}\n\nNote: Data is local only (not synced to server)")
                    self.status_label.setText("● LOCAL DATA")
                    self.status_label.setStyleSheet("color: #8b5cf6; font-weight: bold; font-size: 11px; margin-right: 15px;")
            else:
                self.status_label.setText("● DEMO MODE")
                self.status_label.setStyleSheet("color: #f59e0b; font-weight: bold; font-size: 11px; margin-right: 15px;")

    def generate_pdf_report(self):
        """Generate a comprehensive PDF report with charts and equipment data."""
        try:
            save_path, _ = QFileDialog.getSaveFileName(
                self, "Save PDF Report", "", "PDF Files (*.pdf)"
            )
            if not save_path:
                return
            
            # Create PDF document
            doc = SimpleDocTemplate(save_path, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
            elements = []
            styles = getSampleStyleSheet()
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#0f172a'),
                spaceAfter=6,
                alignment=1,
                fontName='Helvetica-Bold'
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#334155'),
                spaceAfter=12,
                fontName='Helvetica-Bold'
            )
            
            normal_style = ParagraphStyle(
                'CustomNormal',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.HexColor('#1e293b'),
                spaceAfter=6
            )
            
            # 1. Title and Timestamp
            elements.append(Paragraph("CHEMVIS PRO | SYSTEM REPORT", title_style))
            elements.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y - %H:%M:%S')}", normal_style))
            elements.append(Spacer(1, 0.3*inch))
            
            # 2. KPI Summary Section
            elements.append(Paragraph("SYSTEM OVERVIEW - KEY PERFORMANCE INDICATORS", heading_style))
            
            kpi_data = [
                ["METRIC", "VALUE", "UNIT"],
                ["Total Equipment Units", self.kpi_widgets["TOTAL UNITS"].text(), "units"],
                ["Average Flow Rate", self.kpi_widgets["AVG FLOWRATE"].text(), "m³/h"],
                ["Average Pressure", self.kpi_widgets["AVG PRESSURE"].text(), "Bar"],
                ["Average Temperature", self.kpi_widgets["AVG TEMP"].text(), "°C"]
            ]
            
            kpi_table = Table(kpi_data, colWidths=[3*inch, 1.5*inch, 1.2*inch])
            kpi_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f1f5f9')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
            ]))
            elements.append(kpi_table)
            elements.append(Spacer(1, 0.3*inch))
            
            # 3. Equipment Distribution Chart
            elements.append(Paragraph("EQUIPMENT TYPE DISTRIBUTION", heading_style))
            
            # Save current chart to temporary image
            img_buffer = BytesIO()
            self.figure.savefig(img_buffer, format='png', facecolor='white', dpi=100)
            img_buffer.seek(0)
            
            chart_img = Image(img_buffer, width=4*inch, height=3*inch)
            elements.append(chart_img)
            elements.append(Spacer(1, 0.2*inch))
            
            # Add page break before detailed equipment list
            elements.append(PageBreak())
            
            # 4. Detailed Equipment List
            elements.append(Paragraph("DETAILED EQUIPMENT LOG", heading_style))
            
            # Build table data from current table
            table_data = [["Equipment Name", "Type", "Flow (m³/h)", "Pressure (Bar)", "Temp (°C)"]]
            for row in range(self.data_table.rowCount()):
                row_data = []
                for col in range(self.data_table.columnCount()):
                    item = self.data_table.item(row, col)
                    row_data.append(item.text() if item else "")
                table_data.append(row_data)
            
            equipment_table = Table(table_data, colWidths=[2.2*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch])
            equipment_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f1f5f9')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
            ]))
            elements.append(equipment_table)
            elements.append(Spacer(1, 0.2*inch))
            
            # 5. Footer
            elements.append(Spacer(1, 0.3*inch))
            footer_style = ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=8,
                textColor=colors.HexColor('#94a3b8'),
                alignment=1
            )
            elements.append(Paragraph("This report is automatically generated by ChemVis Pro Industrial Dashboard", footer_style))
            elements.append(Paragraph("Confidential - For Authorized Users Only", footer_style))
            
            # Build PDF
            doc.build(elements)
            
            QMessageBox.information(self, "Success", f"PDF Report Generated Successfully!\n\nSaved to: {save_path}")
            
        except Exception as e:
            QMessageBox.critical(self, "PDF Generation Error", f"Failed to generate report:\n{str(e)}")

if __name__ == "__main__":
    # Ensure high DPI scaling works on modern monitors
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling, True)
    QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps, True)
    
    app = QApplication(sys.argv)
    
    # Run the application
    window = ChemVisDesktop()
    window.show()
    sys.exit(app.exec_())
