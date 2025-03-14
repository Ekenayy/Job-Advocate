#!/bin/bash

# Script to build Chrome extension for production and package it for upload
# Created: $(date)

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   Building Job Advocate for Chrome Web Store   ${NC}"
echo -e "${GREEN}=========================================${NC}"

# Navigate to project root
PROJECT_ROOT="$(pwd)"
FRONTEND_DIR="$PROJECT_ROOT/apps/frontend"
DIST_DIR="$FRONTEND_DIR/dist"
BUILD_DATE=$(date +"%Y%m%d_%H%M%S")
ZIP_NAME="job-advocate-chrome-extension-$BUILD_DATE.zip"

# Check if we're in the right directory
if [ ! -d "$FRONTEND_DIR" ]; then
  echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR${NC}"
  echo -e "${YELLOW}Please run this script from the project root directory${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 1: Backing up environment files...${NC}"
# Backup .env.local if it exists
if [ -f "$FRONTEND_DIR/.env.local" ]; then
  echo "Backing up .env.local..."
  cp "$FRONTEND_DIR/.env.local" "$FRONTEND_DIR/.env.local.bak"
fi

echo -e "${YELLOW}Step 2: Ensuring production environment...${NC}"
# Check if .env.production exists, create it if not
if [ ! -f "$FRONTEND_DIR/.env.production" ]; then
  echo "Creating .env.production from .env..."
  cp "$FRONTEND_DIR/.env" "$FRONTEND_DIR/.env.production"
  echo "Please verify the contents of .env.production before continuing."
  echo "Press Enter to continue or Ctrl+C to abort..."
  read
fi

# Make sure VITE_ENVIRONMENT is set to production in .env.production
if grep -q "VITE_ENVIRONMENT=" "$FRONTEND_DIR/.env.production"; then
  sed -i.bak 's/VITE_ENVIRONMENT=.*/VITE_ENVIRONMENT="production"/' "$FRONTEND_DIR/.env.production"
  rm "$FRONTEND_DIR/.env.production.bak" 2>/dev/null
else
  echo 'VITE_ENVIRONMENT="production"' >> "$FRONTEND_DIR/.env.production"
fi

echo -e "${YELLOW}Step 3: Building extension...${NC}"
# Navigate to frontend directory
cd "$FRONTEND_DIR"

# Clean previous build
if [ -d "dist" ]; then
  echo "Cleaning previous build..."
  rm -rf dist
fi

# Run the production build
echo "Running production build..."
npm run build:prod

# Check if build was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed!${NC}"
  
  # Restore .env.local if it was backed up
  if [ -f "$FRONTEND_DIR/.env.local.bak" ]; then
    echo "Restoring .env.local from backup..."
    mv "$FRONTEND_DIR/.env.local.bak" "$FRONTEND_DIR/.env.local"
  fi
  
  exit 1
fi

echo -e "${YELLOW}Step 4: Creating zip file for Chrome Web Store...${NC}"
# Create zip file for Chrome Web Store
cd "$DIST_DIR"
zip -r "$PROJECT_ROOT/$ZIP_NAME" .

# Check if zip was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create zip file!${NC}"
  exit 1
fi

# Restore .env.local if it was backed up
if [ -f "$FRONTEND_DIR/.env.local.bak" ]; then
  echo "Restoring .env.local from backup..."
  mv "$FRONTEND_DIR/.env.local.bak" "$FRONTEND_DIR/.env.local"
fi

echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${GREEN}Zip file created: $PROJECT_ROOT/$ZIP_NAME${NC}"
echo -e "${GREEN}You can now upload this file to the Chrome Web Store.${NC}"

# Return to project root
cd "$PROJECT_ROOT"