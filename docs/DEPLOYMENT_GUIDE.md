# FoodShare Deployment Guide

This guide covers deploying the FoodShare application using Docker containers for both development and production environments.

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (4.0+) or Docker Engine (20.10+)
- Docker Compose (2.0+)
- Git
- At least 4GB RAM available for containers

### Development Deployment

1. **Clone the repository:**
```bash
git clone <repository-url>
cd FoodShare
```

2. **Set up environment variables:**
```bash
# Copy environment template
cp backend/env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit the files with your configuration
nano backend/.env
nano frontend/.env
```

3. **Start development environment:**
```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

4. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Production Deployment

1. **Set up production environment:**
```bash
# Create production environment file
cp backend/env.example backend/.env.production
nano backend/.env.production
```

2. **Start production environment:**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

3. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://admin:password123@mongo:27017/foodshare?authSource=admin

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/google-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Mapbox
MAPBOX_ACCESS_TOKEN=your-mapbox-access-token
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000
REACT_APP_MAPBOX_ACCESS_TOKEN=your-mapbox-access-token
```

### Service Configuration

#### MongoDB
- **Port:** 27017
- **Database:** foodshare
- **Username:** admin
- **Password:** password123 (change in production)
- **Data Volume:** mongo_data

#### Backend API
- **Port:** 5000
- **Health Check:** /health
- **Dependencies:** MongoDB
- **Logs:** backend_logs volume

#### Frontend
- **Port:** 3000 (dev) / 80 (prod)
- **Health Check:** /health
- **Dependencies:** Backend API
- **Static Files:** Nginx served

## 🐳 Docker Commands

### Development Commands

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Start specific service
docker-compose -f docker-compose.dev.yml up -d backend

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Execute command in container
docker-compose -f docker-compose.dev.yml exec backend sh

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up -d --build

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker-compose -f docker-compose.dev.yml down -v
```

### Production Commands

```bash
# Start all services
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=3

# View logs
docker-compose logs -f

# Update services
docker-compose pull
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 🔍 Monitoring & Debugging

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# View health check logs
docker inspect foodshare-backend | grep -A 10 Health
```

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongo

# Follow logs in real-time
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Debugging

```bash
# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec mongo mongosh

# Check container resources
docker stats

# Inspect container configuration
docker inspect foodshare-backend
```

## 🚀 Production Deployment

### AWS ECS Deployment

1. **Create ECS cluster:**
```bash
aws ecs create-cluster --cluster-name foodshare-cluster
```

2. **Create task definition:**
```json
{
  "family": "foodshare-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/foodshare-backend:latest",
      "portMappings": [{"containerPort": 5000}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "MONGODB_URI", "value": "mongodb://..."}
      ]
    }
  ]
}
```

3. **Create service:**
```bash
aws ecs create-service \
  --cluster foodshare-cluster \
  --service-name foodshare-service \
  --task-definition foodshare-task \
  --desired-count 2
```

### Kubernetes Deployment

1. **Create namespace:**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: foodshare
```

2. **Deploy MongoDB:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongo
  namespace: foodshare
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongo
  template:
    metadata:
      labels:
        app: mongo
    spec:
      containers:
      - name: mongo
        image: mongo:6.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: "admin"
        - name: MONGO_INITDB_ROOT_PASSWORD
          value: "password123"
```

3. **Deploy Backend:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: foodshare
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/foodshare-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          value: "mongodb://mongo:27017/foodshare"
```

## 🔒 Security Considerations

### Production Security

1. **Change default passwords:**
```bash
# Generate strong passwords
openssl rand -base64 32
```

2. **Use secrets management:**
```yaml
# Docker Compose with secrets
version: '3.8'
services:
  backend:
    image: foodshare-backend
    secrets:
      - jwt_secret
      - mongo_password
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      MONGO_PASSWORD_FILE: /run/secrets/mongo_password

secrets:
  jwt_secret:
    external: true
  mongo_password:
    external: true
```

3. **Enable SSL/TLS:**
```yaml
# Nginx SSL configuration
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
}
```

### Network Security

1. **Use internal networks:**
```yaml
networks:
  foodshare-internal:
    driver: bridge
    internal: true
```

2. **Limit exposed ports:**
```yaml
services:
  mongo:
    ports:
      - "127.0.0.1:27017:27017"  # Only localhost access
```

## 📊 Monitoring & Observability

### Prometheus Metrics

Add Prometheus metrics to backend:

```javascript
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});
```

### Grafana Dashboard

Create dashboard for:
- Request rates and latency
- Error rates
- Database performance
- Container resource usage

### Log Aggregation

Use ELK Stack or similar:
- **Elasticsearch:** Log storage
- **Logstash:** Log processing
- **Kibana:** Log visualization

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build and push images
        run: |
          docker build -t foodshare-backend ./backend
          docker build -t foodshare-frontend ./frontend
          
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.prod.yml up -d
```

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts:**
```bash
# Check port usage
netstat -tulpn | grep :5000
lsof -i :5000
```

2. **Container won't start:**
```bash
# Check container logs
docker logs foodshare-backend

# Check container status
docker ps -a
```

3. **Database connection issues:**
```bash
# Test MongoDB connection
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"
```

4. **Memory issues:**
```bash
# Check container memory usage
docker stats

# Increase memory limits
docker-compose up -d --scale backend=2
```

### Performance Tuning

1. **Database optimization:**
```javascript
// Add indexes
db.donations.createIndex({ location: "2dsphere" })
db.donations.createIndex({ status: 1, createdAt: -1 })
```

2. **Container resource limits:**
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

This deployment guide provides comprehensive instructions for deploying the FoodShare application in both development and production environments using Docker containers.
