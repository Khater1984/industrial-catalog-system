FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    CATALOG_WORKER_OCR_LANGUAGES=ara+eng \
    CATALOG_WORKER_EXTRACT_IMAGES=1

# OCR is a production capability: install both trained data sets and fail the
# image build if either language is missing. Image extraction is enabled in the
# Cloud Run container; local/test runs remain opt-in unless explicitly enabled.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       fonts-dejavu-core \
       tesseract-ocr \
       tesseract-ocr-eng \
       tesseract-ocr-ara \
    && tesseract --list-langs 2>&1 | grep -qx 'ara' \
    && tesseract --list-langs 2>&1 | grep -qx 'eng' \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install --no-cache-dir .
CMD ["sh", "-c", "gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 1800 catalog_worker.service:app"]
