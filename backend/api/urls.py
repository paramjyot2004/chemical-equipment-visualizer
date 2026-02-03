
from django.urls import path
from .views import (
    CSVUploadView, SummaryStatsView, EquipmentListView, 
    HistoryListView, PDFReportView
)

urlpatterns = [
    path('upload/', CSVUploadView.as_view(), name='csv-upload'),
    path('summary/', SummaryStatsView.as_view(), name='summary-stats'),
    path('equipment/', EquipmentListView.as_view(), name='equipment-list'),
    path('history/', HistoryListView.as_view(), name='history-list'),
    path('report/', PDFReportView.as_view(), name='pdf-report'),
]
