import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get database URL from environment variable
# Default to a Docker Compose friendly URL if not set
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/library_db")

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create a SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative models
Base = declarative_base()

# This function will be called by main.py to create tables
def init_db():
    Base.metadata.create_all(bind=engine)
