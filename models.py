from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String, unique=True, index=True)
    model = Column(String)
    status = Column(String, default="Active")

    deliveries = relationship("Delivery", back_populates="vehicle")

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    license_number = Column(String, unique=True)

    deliveries = relationship("Delivery", back_populates="driver")

class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String)
    destination = Column(String)
    status = Column(String, default="Pending")
    
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    vehicle = relationship("Vehicle", back_populates="deliveries")

    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    driver = relationship("Driver", back_populates="deliveries")

    class VehicleLog(Base):
    __tablename__ = "vehicle_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    log_type = Column(String)  # "Maintenance" or "Fuel"
    cost = Column(Float)
    description = Column(String)
    date = Column(String)
    
    vehicle = relationship("Vehicle")