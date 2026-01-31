
import io
import pandas as pd
from datetime import datetime
from django.db.models import Avg, Count
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated

# ReportLab Core Imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

# ReportLab Graphics Imports for Charts
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.legends import Legend

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import UploadSession, EquipmentItem
from .serializers import EquipmentItemSerializer, UploadSessionSerializer

class CSVUploadView(APIView):
    authentication_classes = [BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        csv_file = request.FILES['file']
        try:
            df = pd.read_csv(csv_file)
            
            # Validate columns
            required_cols = ['Equipment Name', 'Type', 'Flowrate', 'Pressure', 'Temperature']
            if not all(col in df.columns for col in required_cols):
                return Response({"error": f"Missing required columns. Needed: {required_cols}"}, status=status.HTTP_400_BAD_REQUEST)

            # Create session
            session = UploadSession.objects.create(
                filename=csv_file.name,
                item_count=len(df)
            )

            # Store items
            items = []
            for _, row in df.iterrows():
                items.append(EquipmentItem(
                    upload_session=session,
                    equipment_name=row['Equipment Name'],
                    equipment_type=row['Type'],
                    flowrate=float(row['Flowrate']),
                    pressure=float(row['Pressure']),
                    temperature=float(row['Temperature'])
                ))
            EquipmentItem.objects.bulk_create(items)

            # Maintenance: keep only last 5 uploads
            all_sessions = UploadSession.objects.all().order_by('-upload_date')
            if all_sessions.count() > 5:
                ids_to_keep = list(all_sessions.values_list('id', flat=True)[:5])
                UploadSession.objects.exclude(id__in=ids_to_keep).delete()

            # --- Real-time Notification ---
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    'equipment_updates',
                    {
                        'type': 'data_update',
                    }
                )

            return Response({"success": True, "message": f"Processed {len(items)} items"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SummaryStatsView(APIView):
    authentication_classes = [BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = EquipmentItem.objects.all()
        if not items.exists():
            return Response({
                "total_equipment": 0, "avg_flowrate": 0, "avg_pressure": 0, 
                "avg_temperature": 0, "type_distribution": {}
            })

        summary = items.aggregate(
            avg_flowrate=Avg('flowrate'),
            avg_pressure=Avg('pressure'),
            avg_temperature=Avg('temperature'),
            count=Count('id')
        )

        dist = items.values('equipment_type').annotate(count=Count('id'))
        type_distribution = {d['equipment_type']: d['count'] for d in dist}

        return Response({
            "total_equipment": summary['count'],
            "avg_flowrate": round(summary['avg_flowrate'] or 0, 2),
            "avg_pressure": round(summary['avg_pressure'] or 0, 2),
            "avg_temperature": round(summary['avg_temperature'] or 0, 2),
            "type_distribution": type_distribution
        })

class EquipmentListView(APIView):
    authentication_classes = [BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = EquipmentItem.objects.all().order_by('-id')
        serializer = EquipmentItemSerializer(items, many=True)
        return Response(serializer.data)

class HistoryListView(APIView):
    authentication_classes = [BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = UploadSession.objects.all().order_by('-upload_date')
        serializer = UploadSessionSerializer(history, many=True)
        return Response(serializer.data)

class PDFReportView(APIView):
    authentication_classes = [BasicAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = EquipmentItem.objects.all()
        if not items.exists():
            return Response({"error": "No data available for report generation."}, status=status.HTTP_404_NOT_FOUND)

        summary = items.aggregate(
            flow=Avg('flowrate'), 
            press=Avg('pressure'), 
            temp=Avg('temperature'), 
            count=Count('id')
        )
        dist_queryset = items.values('equipment_type').annotate(count=Count('id')).order_by('-count')

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=36)
        styles = getSampleStyleSheet()
        elements = []

        # Styles
        title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=20, spaceAfter=20, textColor=colors.HexColor("#1e293b"))
        subtitle_style = ParagraphStyle('SubStyle', parent=styles['Normal'], alignment=TA_CENTER, fontSize=10, spaceAfter=30, textColor=colors.gray)
        section_style = ParagraphStyle('SectionStyle', parent=styles['Heading2'], fontSize=14, fontName='Helvetica-Bold', spaceBefore=20, spaceAfter=12, textColor=colors.HexColor("#3b82f6"))

        # 1. Title Section
        elements.append(Paragraph("ChemVis Pro Industrial Report", title_style))
        elements.append(Paragraph(f"System Analytics Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')}", subtitle_style))
        
        # 2. Global Metrics Table
        elements.append(Paragraph("I. Global Summary Metrics", section_style))
        summary_data = [
            ['Metric', 'Calculated Average / Total'],
            ['Total Equipment Units', f"{summary['count']}"],
            ['Average Flowrate', f"{summary['flow']:.2f} m³/h"],
            ['Average Pressure', f"{summary['press']:.2f} Bar"],
            ['Average Temperature', f"{summary['temp']:.2f} °C"]
        ]
        
        summary_table = Table(summary_data, colWidths=[200, 200])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor("#1e293b")),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('PADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 30))

        # 3. Visual Analytics (Chart)
        elements.append(Paragraph("II. Equipment Distribution Analytics", section_style))
        
        chart_drawing = Drawing(400, 200)
        bc = VerticalBarChart()
        bc.x = 50
        bc.y = 50
        bc.height = 125
        bc.width = 300
        
        chart_labels = [d['equipment_type'] for d in dist_queryset]
        chart_values = [d['count'] for d in dist_queryset]
        
        bc.data = [tuple(chart_values)]
        bc.strokeColor = colors.white
        bc.valueAxis.valueMin = 0
        bc.valueAxis.valueMax = max(chart_values) + 1
        bc.valueAxis.valueStep = 1
        bc.categoryAxis.labels.boxAnchor = 'ne'
        bc.categoryAxis.labels.dx = 8
        bc.categoryAxis.labels.dy = -2
        bc.categoryAxis.labels.angle = 30
        bc.categoryAxis.categoryNames = chart_labels
        bc.bars[0].fillColor = colors.HexColor("#3b82f6")
        bc.bars.roundedLabels = 1
        
        chart_drawing.add(bc)
        elements.append(chart_drawing)
        elements.append(Spacer(1, 20))

        # 4. Distribution Details Table
        elements.append(Paragraph("III. Tabular Distribution", section_style))
        dist_data = [['Equipment Type', 'Unit Count', 'Percentage']]
        total_count = summary['count']
        
        for d in dist_queryset:
            percentage = (d['count'] / total_count * 100) if total_count > 0 else 0
            dist_data.append([d['equipment_type'], str(d['count']), f"{percentage:.1f}%"])

        dist_table = Table(dist_data, colWidths=[150, 125, 125])
        dist_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(dist_table)

        doc.build(elements)
        
        pdf_content = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(pdf_content, content_type='application/pdf')
        filename = f"Industrial_Report_{datetime.now().strftime('%Y%m%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        
        return response
