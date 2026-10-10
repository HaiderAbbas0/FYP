FROM python:3.12-slim
WORKDIR /srv/iomt
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/app backend/app
COPY agents /srv/iomt/agents
COPY pyproject.toml /srv/iomt/pyproject.toml
RUN pip install --no-deps -e /srv/iomt
COPY backend/migrations backend/migrations
COPY backend/data/cases.seed.json backend/data/cases.seed.json
COPY backend/data/cases.seed.json backend/data/cases.json
COPY backend/worker.py backend/worker.py
COPY backend/evaluate.py backend/evaluate.py
RUN useradd --uid 10001 --create-home runtime && chown -R runtime:runtime /srv/iomt
USER runtime
WORKDIR /srv/iomt/backend
EXPOSE 8099
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8099"]
