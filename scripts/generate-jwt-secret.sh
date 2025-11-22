#!/bin/bash
# Generate a secure random JWT_SECRET and update .env file
# This script creates a cryptographically secure random string (64+ characters)
# and updates the JWT_SECRET in .env file with backup

LENGTH=${1:-64}

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "ERROR: .env file not found in current directory" >&2
  echo "Please run this script from the project root directory" >&2
  exit 1
fi

# Generate cryptographically secure random bytes and convert to Base64 (URL-safe)
# Using openssl for better compatibility
if command -v openssl &> /dev/null; then
  NEW_SECRET=$(openssl rand -base64 $LENGTH | tr -d '\n' | tr '+/' '-_' | tr -d '=')
elif command -v /dev/urandom &> /dev/null; then
  NEW_SECRET=$(head -c $LENGTH /dev/urandom | base64 | tr -d '\n' | tr '+/' '-_' | tr -d '=')
else
  echo "ERROR: Neither openssl nor /dev/urandom available" >&2
  exit 1
fi

# Ensure minimum length
if [ ${#NEW_SECRET} -lt 32 ]; then
  echo "WARNING: Generated secret is shorter than expected. Generating longer one..." >&2
  if command -v openssl &> /dev/null; then
    NEW_SECRET=$(openssl rand -base64 48 | tr -d '\n' | tr '+/' '-_' | tr -d '=')
  else
    NEW_SECRET=$(head -c 48 /dev/urandom | base64 | tr -d '\n' | tr '+/' '-_' | tr -d '=')
  fi
fi

echo "Generated new JWT_SECRET (length: ${#NEW_SECRET} characters)"

# Create backup of .env file
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_PATH=".env.backup.$TIMESTAMP"
cp ".env" "$BACKUP_PATH"
echo "Backup created: $BACKUP_PATH"

# Check if JWT_SECRET exists and update or add it
if grep -q "^JWT_SECRET=" ".env"; then
  # Replace existing JWT_SECRET (works on both Linux and Mac)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=$NEW_SECRET|" ".env"
  else
    # Linux
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$NEW_SECRET|" ".env"
  fi
  echo "Updated existing JWT_SECRET in .env"
else
  # Add new JWT_SECRET at the end
  echo "" >> ".env"
  echo "JWT_SECRET=$NEW_SECRET" >> ".env"
  echo "Added new JWT_SECRET to .env"
fi

# Show first 8 characters for verification (security: don't show full secret)
PREVIEW="${NEW_SECRET:0:8}"
echo ""
echo "New JWT_SECRET preview: $PREVIEW..."
echo "Full secret saved to .env file"
echo ""
echo "IMPORTANT:"
echo "  - All active user sessions will be invalidated"
echo "  - Users will need to log in again"
echo "  - Restart backend container after updating .env"
echo "  - Backup saved to: $BACKUP_PATH"

