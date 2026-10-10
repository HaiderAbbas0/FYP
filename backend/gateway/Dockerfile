FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends nftables && rm -rf /var/lib/apt/lists/*
WORKDIR /srv/backend
RUN pip install --no-cache-dir fastapi uvicorn httpx pydantic
COPY backend/app ./app
COPY backend/gateway ./gateway
ENV PYTHONDONTWRITEBYTECODE=1
CMD ["uvicorn", "gateway.agent:create_app", "--factory", "--host", "0.0.0.0", "--port", "8100", "--workers", "1"]
