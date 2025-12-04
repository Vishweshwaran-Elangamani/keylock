# Clean everything
 docker-compose down -v
 docker system prune -af

# Create folders
 mkdir logs\service-logs,logs\business-logs,mysql-init -Force

# Start ALL services
 docker-compose up --build -d

# Check status
 docker-compose ps
