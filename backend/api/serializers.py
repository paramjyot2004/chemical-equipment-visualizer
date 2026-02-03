
from rest_framework import serializers
from .models import UploadSession, EquipmentItem

class EquipmentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentItem
        fields = '__all__'

class UploadSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadSession
        fields = '__all__'
