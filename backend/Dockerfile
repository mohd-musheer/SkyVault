FROM python:3.11-slim

WORKDIR /app

# copy ONLY requirements first (for cache safety)
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# copy rest of backend
COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
