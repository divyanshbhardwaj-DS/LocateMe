from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class LocationCreate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = None
    source: Optional[str] = None
    captured_at: Optional[datetime] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    address: Optional[str] = None
    quality_class: Optional[str] = None
    acquisition_ms: Optional[int] = None
    readings_count: Optional[int] = None
    acquisition_status: Optional[str] = None


class LocationOut(BaseModel):
    id: int
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    source: Optional[str] = None
    captured_at: Optional[datetime] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    address: Optional[str] = None
    # Google reverse-geocoding fields
    formatted_address: Optional[str] = None
    street_number: Optional[str] = None
    street: Optional[str] = None
    neighborhood: Optional[str] = None
    locality: Optional[str] = None
    district: Optional[str] = None
    country_code: Optional[str] = None
    place_id: Optional[str] = None
    plus_code: Optional[str] = None
    geocode_type: Optional[str] = None
    geocode_source: Optional[str] = None
    quality_class: Optional[str] = None
    acquisition_ms: Optional[int] = None
    readings_count: Optional[int] = None
    acquisition_status: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LocationSubmitResponse(BaseModel):
    success: bool
    message: str


class AdminLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class StatsOut(BaseModel):
    total_locations: int
