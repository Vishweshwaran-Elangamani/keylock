#!/bin/bash
# Auto-configures Keycloak Frontend URL with correct host IP

echo "🚀 Auto-configuring Keycloak for local dev..."

# Wait for Keycloak to be ready
until curl -s http://localhost:9090/health/ready > /dev/null; do
  echo "⏳ Waiting for Keycloak..."
  sleep 2
done

# Get local IP
IP=$(ip route get 1 | awk '{print $NF;exit}')

# Get admin token
TOKEN=$(curl -s -X POST http://localhost:9090/realms/master/protocol/openid-connect/token \
  -d 'grant_type=password' \
  -d 'client_id=admin-cli' \
  -d 'username=admin' \
  -d 'password=admin' | jq -r .access_token)

# Set Frontend URL for eepz-realm
curl -s -X PUT "http://localhost:9090/admin/realms/eepz-realm" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"frontendUrl\":\"http://$IP:9090\"}" > /dev/null

echo "✅ Frontend URL set to http://$IP:9090"
echo "📧 Keycloak ready at http://localhost:9090"
echo "🔗 Reset links will use http://$IP:9090 — works on phone!"
