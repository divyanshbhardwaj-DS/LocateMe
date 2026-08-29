from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from services.geocode import resolve_address

router = APIRouter(tags=["location"])


def _apply_geocode(record: models.Location, payload: schemas.LocationCreate):
    """Prefer resolved Google address components, always keeping coordinates."""
    resolved = resolve_address(payload.latitude, payload.longitude)

    # Keep whatever the client supplied as a baseline, but prefer geocoded values.
    if resolved.get("source") == "google":
        record.address = resolved.get("formatted_address") or payload.address
        record.formatted_address = resolved.get("formatted_address")
        record.street_number = resolved.get("street_number")
        record.street = resolved.get("street")
        record.neighborhood = resolved.get("neighborhood")
        record.locality = resolved.get("locality")
        record.city = resolved.get("locality") or resolved.get("neighborhood") or payload.city
        record.district = resolved.get("district")
        record.state = resolved.get("state") or payload.state
        record.country = resolved.get("country") or payload.country
        record.country_code = resolved.get("country_code")
        record.postal_code = resolved.get("postal_code") or payload.postal_code
        record.place_id = resolved.get("place_id")
        record.plus_code = resolved.get("plus_code")
        record.geocode_type = resolved.get("geocode_type")
        record.geocode_source = "google"
    else:
        # No Google key / failure — keep the client-supplied address unchanged.
        record.address = payload.address
        record.formatted_address = payload.address


@router.post("/location", response_model=schemas.LocationSubmitResponse)
def submit_location(payload: schemas.LocationCreate, db: Session = Depends(get_db)):
    record = models.Location(**payload.model_dump())
    _apply_geocode(record, payload)
    db.add(record)
    db.commit()
    db.refresh(record)
    # Never expose coordinates/address to the public caller — only a confirmation.
    return schemas.LocationSubmitResponse(
        success=True,
        message="Location received",
    )
