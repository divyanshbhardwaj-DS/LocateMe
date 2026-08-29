FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# On container start: ensure tables exist + seed the first admin from env vars,
# then run the API on Render's $PORT.
CMD ["sh", "-c", "python create_admin.py || true && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
