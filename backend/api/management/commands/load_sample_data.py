from django.core.management.base import BaseCommand
from api.models import UploadSession, EquipmentItem

class Command(BaseCommand):
    help = 'Load sample equipment data for demonstration'

    def handle(self, *args, **options):
        # Clear existing data
        EquipmentItem.objects.all().delete()
        UploadSession.objects.all().delete()
        
        # Create a sample upload session
        session = UploadSession.objects.create(
            filename="sample_data.csv",
            item_count=8
        )
        
        # Sample equipment data
        sample_equipment = [
            {"equipment_name": "Pump-A01", "equipment_type": "Centrifugal", "flowrate": 50.5, "pressure": 3.2, "temperature": 72.4, "upload_session": session},
            {"equipment_name": "Pump-B02", "equipment_type": "Positive Displacement", "flowrate": 42.3, "pressure": 2.8, "temperature": 68.9, "upload_session": session},
            {"equipment_name": "Compressor-C01", "equipment_type": "Reciprocating", "flowrate": 45.2, "pressure": 3.5, "temperature": 75.1, "upload_session": session},
            {"equipment_name": "Blower-D01", "equipment_type": "Centrifugal", "flowrate": 48.9, "pressure": 3.1, "temperature": 71.2, "upload_session": session},
            {"equipment_name": "Fan-E01", "equipment_type": "Axial", "flowrate": 40.1, "pressure": 2.5, "temperature": 65.8, "upload_session": session},
            {"equipment_name": "Motor-F01", "equipment_type": "Centrifugal", "flowrate": 55.0, "pressure": 3.3, "temperature": 73.5, "upload_session": session},
            {"equipment_name": "Turbine-G01", "equipment_type": "Axial", "flowrate": 52.0, "pressure": 3.4, "temperature": 76.2, "upload_session": session},
            {"equipment_name": "Expander-H01", "equipment_type": "Positive Displacement", "flowrate": 38.5, "pressure": 2.6, "temperature": 67.3, "upload_session": session},
        ]
        
        for item in sample_equipment:
            EquipmentItem.objects.create(**item)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully loaded {len(sample_equipment)} equipment items'))
