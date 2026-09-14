from sqlalchemy import Column, Integer, String, Float, ForeignKey
from database import Base

class VehicleModel(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String, unique=True, index=True)
    model = Column(String)
    status = Column(String, default="Available")

class DeliveryModel(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    destination = Column(String)
    cargo_weight_kg = Column(Float)
    status = Column(String, default="Pending")