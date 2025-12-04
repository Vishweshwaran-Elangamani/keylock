FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY feedback_api.py .
EXPOSE 5111
CMD ["python", "feedback_api.py"]
