
from django.db import models

class UploadSession(models.Model):
    filename = models.CharField(max_length=255)
    upload_date = models.DateTimeField(auto_now_add=True)
    item_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-upload_date']

    def __str__(self):
        return f"{self.filename} - {self.upload_date}"

class EquipmentItem(models.Model):
    upload_session = models.ForeignKey(UploadSession, related_name='items', on_delete=models.CASCADE)
    equipment_name = models.CharField(max_length=255)
    equipment_type = models.CharField(max_length=100)
    flowrate = models.FloatField()
    pressure = models.FloatField()
    temperature = models.FloatField()

    def __str__(self):
        return self.equipment_name
