from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import models
import schemas
from auth import create_access_token, get_current_admin, verify_password
from database import get_db

router = APIRouter(tags=["admin"])


@router.post("/admin/login", response_model=schemas.Token)
def admin_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.AdminUser).filter(models.AdminUser.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token({"sub": user.username})
    return schemas.Token(access_token=token)


@router.get("/locations", response_model=List[schemas.LocationOut])
def list_locations(
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    return db.query(models.Location).order_by(models.Location.created_at.desc()).all()


@router.get("/locations/{location_id}", response_model=schemas.LocationOut)
def get_location(
    location_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    record = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Location not found")
    return record


@router.get("/stats", response_model=schemas.StatsOut)
def get_stats(
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    total = db.query(models.Location).count()
    return schemas.StatsOut(total_locations=total)
