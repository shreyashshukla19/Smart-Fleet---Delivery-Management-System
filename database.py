from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# This creates a local SQLite file named 'fleet.db' in your project folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./fleet.db"

# Create the SQLite engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create a session maker (this is how our API talks to the database)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our database models to inherit from
Base = declarative_base()

# Dependency to get a database session for our routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()