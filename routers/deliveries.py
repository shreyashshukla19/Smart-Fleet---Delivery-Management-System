from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/deliveries",
    tags=["Deliveries"]
)

# Pydantic schema for nested vehicle display in delivery response
class VehicleInfo(BaseModel):
    id: int
    license_plate: str
    model: str
    status: str

    class Config:
        from_attributes = True

class DeliveryCreate(BaseModel):
    item_name: str
    destination: str
    status: str = "Pending"
    vehicle_id: Optional[int] = None  # Optional vehicle assignment

class DeliveryResponse(BaseModel):
    id: int
    item_name: str
    destination: str
    status: str
    vehicle_id: Optional[int] = None
    vehicle: Optional[VehicleInfo] = None  # Automatically shows assigned vehicle details!

    class Config:
        from_attributes = True

@router.get("/", response_model=list[DeliveryResponse])
def get_deliveries(db: Session = Depends(get_db)):
    return db.query(models.DeliveryModel).all()

@router.post("/", response_model=DeliveryResponse)
def create_delivery(delivery: DeliveryCreate, db: Session = Depends(get_db)):
    # Optional check: if a vehicle_id is provided, make sure that vehicle actually exists!
    if delivery.vehicle_id:
        vehicle = db.query(models.VehicleModel).filter(models.VehicleModel.id == delivery.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail=f"Vehicle with ID {delivery.vehicle_id} not found")

    db_delivery = models.DeliveryModel(
        item_name=delivery.item_name,
        destination=delivery.destination,
        status=delivery.status,
        vehicle_id=delivery.vehicle_id
    )
    db.add(db_delivery)
    db.commit()
    db.refresh(db_delivery)
    return db_delivery

@router.patch("/{delivery_id}/status")
def update_delivery_status(delivery_id: int, status_update: dict, db: Session = Depends(get_db)):
    db_delivery = db.query(models.DeliveryModel).filter(models.DeliveryModel.id == delivery_id).first()
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    if "status" in status_update:
        db_delivery.status = status_update["status"]
        db.commit()
        db.refresh(db_delivery)
        
    return db_delivery

@router.put("/{delivery_id}")
def update_delivery(delivery_id: int, delivery_update: dict, db: Session = Depends(get_db)):
    db_delivery = db.query(models.DeliveryModel).filter(models.DeliveryModel.id == delivery_id).first()
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    if "item_name" in delivery_update:
        db_delivery.item_name = delivery_update["item_name"]
    if "destination" in delivery_update:
        db_delivery.destination = delivery_update["destination"]
    if "status" in delivery_update:
        db_delivery.status = delivery_update["status"]
    if "vehicle_id" in delivery_update:
        # Verify vehicle exists if updating it
        v_id = delivery_update["vehicle_id"]
        if v_id is not None:
            vehicle = db.query(models.VehicleModel).filter(models.VehicleModel.id == v_id).first()
            if not vehicle:
                raise HTTPException(status_code=404, detail=f"Vehicle with ID {v_id} not found")
        db_delivery.vehicle_id = v_id
    
    db.commit()
    db.refresh(db_delivery)
    return db_delivery

@router.delete("/{delivery_id}")
def delete_delivery(delivery_id: int, db: Session = Depends(get_db)):
    db_delivery = db.query(models.DeliveryModel).filter(models.DeliveryModel.id == delivery_id).first()
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    db.delete(db_delivery)
    db.commit()
    return {"message": f"Delivery with ID {delivery_id} successfully deleted"}