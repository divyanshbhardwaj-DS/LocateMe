from sqlalchemy import Column, Integer, Float, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    source = Column(String, nullable=True)
    captured_at = Column(DateTime(timezone=True), nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    # --- Google reverse-geocoding fields (additive) ---
    formatted_address = Column(Text, nullable=True)
    street_number = Column(String, nullable=True)
    street = Column(String, nullable=True)
    neighborhood = Column(String, nullable=True)
    locality = Column(String, nullable=True)
    district = Column(String, nullable=True)
    country_code = Column(String, nullable=True)
    place_id = Column(String, nullable=True)
    plus_code = Column(String, nullable=True)
    geocode_type = Column(String, nullable=True)
    geocode_source = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
