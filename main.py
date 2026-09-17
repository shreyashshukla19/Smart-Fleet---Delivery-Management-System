import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

# Absolute path configuration for permanent data persistence
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'fleet.db')}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy Models
class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String, unique=True, index=True)
    model = Column(String)
    status = Column(String, default="Active")

class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String)
    license_number = Column(String)

class Delivery(Base):
    __tablename__ = "deliveries"
    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String)
    destination = Column(String)
    status = Column(String, default="Pending")
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)

    vehicle = relationship("Vehicle")
    driver = relationship("Driver")

class VehicleLog(Base):
    __tablename__ = "vehicle_logs"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    log_type = Column(String)
    cost = Column(Float)
    description = Column(String)
    date = Column(String)

    vehicle = relationship("Vehicle")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Fleet & Delivery Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class VehicleCreate(BaseModel):
    license_plate: str
    model: str
    status: str = "Active"

class DriverCreate(BaseModel):
    name: str
    phone: str
    license_number: str

class DeliveryCreate(BaseModel):
    item_name: str
    destination: str
    vehicle_id: int | None = None
    driver_id: int | None = None

class StatusUpdate(BaseModel):
    status: str

class LogCreate(BaseModel):
    vehicle_id: int
    log_type: str
    cost: float
    description: str
    date: str

@app.post("/vehicles/")
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    db_vehicle = Vehicle(**vehicle.dict())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@app.get("/vehicles/")
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(Vehicle).all()

@app.post("/drivers/")
def create_driver(driver: DriverCreate, db: Session = Depends(get_db)):
    db_driver = Driver(**driver.dict())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

@app.get("/drivers/")
def get_drivers(db: Session = Depends(get_db)):
    return db.query(Driver).all()

@app.post("/deliveries/")
def create_delivery(delivery: DeliveryCreate, db: Session = Depends(get_db)):
    db_delivery = Delivery(**delivery.dict(), status="Pending")
    db.add(db_delivery)
    db.commit()
    db.refresh(db_delivery)
    return db_delivery

@app.get("/deliveries/")
def get_deliveries(db: Session = Depends(get_db)):
    return db.query(Delivery).all()

@app.patch("/deliveries/{delivery_id}/status")
def update_delivery_status(delivery_id: int, update: StatusUpdate, db: Session = Depends(get_db)):
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    delivery.status = update.status
    db.commit()
    db.refresh(delivery)
    return delivery

@app.post("/logs/")
def create_vehicle_log(log: LogCreate, db: Session = Depends(get_db)):
    db_log = VehicleLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/logs/")
def get_vehicle_logs(db: Session = Depends(get_db)):
    return db.query(VehicleLog).all()