FROM python:3.12-slim
WORKDIR /app
COPY . .
EXPOSE ${PORT:-8765}
CMD ["python3", "server.py"]
