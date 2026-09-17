from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from pydantic import BaseModel

router = APIRouter(
    prefix="/vehicles",
    tags=["Vehicles"]
)

class VehicleCreate(BaseModel):
    license_plate: str
    model: str
    status: str

class VehicleResponse(VehicleCreate):
    id: int
    class Config:
        from_attributes = True

@router.get("/", response_model=list[VehicleResponse])
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(models.VehicleModel).all()

@router.post("/", response_model=VehicleResponse)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    db_vehicle = models.VehicleModel(
        license_plate=vehicle.license_plate,
        model=vehicle.model,
        status=vehicle.status
    )
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, vehicle_update: VehicleCreate, db: Session = Depends(get_db)):
    db_vehicle = db.query(models.VehicleModel).filter(models.VehicleModel.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    db_vehicle.license_plate = vehicle_update.license_plate
    db_vehicle.model = vehicle_update.model
    db_vehicle.status = vehicle_update.status
    
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    db_vehicle = db.query(models.VehicleModel).filter(models.VehicleModel.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    db.delete(db_vehicle)
    db.commit()
    return {"message": f"Vehicle with ID {vehicle_id} successfully deleted"}