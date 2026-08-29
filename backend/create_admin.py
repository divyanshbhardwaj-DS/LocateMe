"""
Create the first admin user.

Usage:
    python create_admin.py <username> <password>

Username/password can also be supplied via the ADMIN_USERNAME / ADMIN_PASSWORD
environment variables (useful for seeding an admin at container startup).
"""
import os
import sys

import models
from auth import hash_password
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)


def main():
    username = sys.argv[1] if len(sys.argv) >= 2 else os.getenv("ADMIN_USERNAME", "")
    password = sys.argv[2] if len(sys.argv) >= 3 else os.getenv("ADMIN_PASSWORD", "")
    if not username or not password:
        print("Usage: python create_admin.py <username> <password>")
        print("       or set ADMIN_USERNAME / ADMIN_PASSWORD env vars")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(models.AdminUser).filter(models.AdminUser.username == username).first()
        if existing:
            print(f"Admin '{username}' already exists.")
            return
        admin = models.AdminUser(username=username, hashed_password=hash_password(password))
        db.add(admin)
        db.commit()
        print(f"Admin user '{username}' created.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
