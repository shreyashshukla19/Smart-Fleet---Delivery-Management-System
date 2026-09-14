from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session

# Import our database and model files
import models
from database import engine, get_db

# This command tells SQLAlchemy to create the SQLite tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Fleet & Delivery Management System")

# --- Pydantic Schemas (For validating incoming/outgoing data) ---
class VehicleCreate(BaseModel):
    license_plate: str
    model: str
    status: str = "Available"

class VehicleResponse(VehicleCreate):
    id: int

    class Config:
        from_attributes = True  # Allows SQLAlchemy models to convert to Pydantic

class DeliveryCreate(BaseModel):
    vehicle_id: int
    destination: str
    cargo_weight_kg: float
    status: str = "Pending"

class DeliveryResponse(DeliveryCreate):
    id: int

    class Config:
        from_attributes = True

# --- Root Endpoint ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Smart Fleet & Delivery Management System API with SQLite!"}

# --- Vehicle Endpoints ---
@app.post("/vehicles/", response_model=VehicleResponse)
def register_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    # Check if the license plate already exists in the database
    existing_vehicle = db.query(models.VehicleModel).filter(models.VehicleModel.license_plate == vehicle.license_plate).first()
    if existing_vehicle:
        raise HTTPException(status_code=400, detail="License plate already registered")
    
    # Create a new SQLAlchemy database model instance
    db_vehicle = models.VehicleModel(
        license_plate=vehicle.license_plate,
        model=vehicle.model,
        status=vehicle.status
    )
    
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)  # Refresh to get the auto-generated ID from SQLite
    return db_vehicle

@app.get("/vehicles/", response_model=List[VehicleResponse])
def get_vehicles(db: Session = Depends(get_db)):
    # Fetch all records from the vehicles table
    return db.query(models.VehicleModel).all()

# --- Delivery Endpoints ---
@app.post("/deliveries/", response_model=DeliveryResponse)
def create_delivery(delivery: DeliveryCreate, db: Session = Depends(get_db)):
    # Verify that the assigned vehicle actually exists in the database
    vehicle = db.query(models.VehicleModel).filter(models.VehicleModel.id == delivery.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Assigned vehicle not found. Register the vehicle first.")
    
    db_delivery = models.DeliveryModel(
        vehicle_id=delivery.vehicle_id,
        destination=delivery.destination,
        cargo_weight_kg=delivery.cargo_weight_kg,
        status=delivery.status
    )
    
    db.add(db_delivery)
    db.commit()
    db.refresh(db_delivery)
    return db_delivery

@app.get("/deliveries/", response_model=List[DeliveryResponse])
def get_deliveries(db: Session = Depends(get_db)):
    # Fetch all records from the deliveries table
    return db.query(models.DeliveryModel).all()

# --- Update Vehicle ---
@app.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, vehicle_update: VehicleCreate, db: Session = Depends(get_db)):
    # Find the vehicle by its ID in the database
    db_vehicle = db.query(models.VehicleModel).filter(models.VehicleModel.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Update the fields
    db_vehicle.license_plate = vehicle_update.license_plate
    db_vehicle.model = vehicle_update.model
    db_vehicle.status = vehicle_update.status
    
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

# --- Delete Vehicle ---
@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    db_vehicle = db.query(models.VehicleModel).filter(models.VehicleModel.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    db.delete(db_vehicle)
    db.commit()
    return {"message": f"Vehicle with ID {vehicle_id} successfully deleted"}