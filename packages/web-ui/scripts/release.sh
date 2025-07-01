#!/bin/bash

# Trailhead UI Release Script
# Prepares a clean distribution package for the UI component library

# Exit on any error
set -e

# Initialize variables
SILENT_MODE=false
VERBOSE_MODE=false
USE_COLORS=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -s|--silent)
      SILENT_MODE=true
      USE_COLORS=false
      shift
      ;;
    --verbose)
      VERBOSE_MODE=true
      shift
      ;;
    --no-colors)
      USE_COLORS=false
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  -s, --silent     Silent mode (no colors, minimal output)"
      echo "  --verbose        Verbose debugging output"
      echo "  --no-colors      Disable colored output"
      echo "  -h, --help       Show this help message"
      exit 0
      ;;
    *)
      VERSION="$1"
      shift
      ;;
  esac
done

#get the tag version the script params
if [ -z "$VERSION" ]; then
  echo "Error: No version tag provided"
  exit 1
fi

# Color definitions (only if colors are enabled)
if [ "$USE_COLORS" = true ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  MAGENTA='\033[0;35m'
  CYAN='\033[0;36m'
  NC='\033[0m' # No Color
else
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  MAGENTA=''
  CYAN=''
  NC=''
fi

# Logging functions
log() {
  if [ "$SILENT_MODE" = false ]; then
    echo "${NC} $1"
  fi
}

log_info() {
  if [ "$SILENT_MODE" = false ]; then
    echo "${GREEN}[INFO]${NC} $1"
  fi
}
log_warn() {
  if [ "$SILENT_MODE" = false ]; then
    echo "${YELLOW}[WARN]${NC} $1"
  fi
}

log_error() {
  echo "${RED}[ERROR]${NC} $1" >&2
}

log_success() {
  if [ "$SILENT_MODE" = false ]; then
    echo "${CYAN}[SUCCESS]${NC} $1"
  fi
}

log_debug() {
  if [ "$VERBOSE_MODE" = true ]; then
    echo "${MAGENTA}[DEBUG]${NC} $1"
  fi
}

log_step() {
  if [ "$SILENT_MODE" = false ]; then
    echo "${BLUE}[STEP]${NC} $1"
  fi
}

# Function to check if directory exists and log accordingly
check_directory() {
  local dir="$1"
  local purpose="$2"
  
  if [ -d "$dir" ]; then
    log_debug "Directory '$dir' exists ($purpose)"
    return 0
  else
    log_debug "Directory '$dir' does not exist ($purpose)"
    return 1
  fi
}

# Function to safely remove directory contents
safe_remove_contents() {
  local dir="$1"
  local description="$2"
  
  if [ -d "$dir" ]; then
    log_debug "Removing contents of '$dir' ($description)"
    find "$dir" -mindepth 1 -delete || {
      log_error "Failed to clean '$dir' directory"
      exit 1
    }
    log_debug "Successfully cleaned '$dir'"
  else
    log_debug "Directory '$dir' does not exist, skipping removal"
  fi
}

# Function to safely copy files
safe_copy() {
  local src="$1"
  local dest="$2"
  local description="$3"
  
  if [ -e "$src" ]; then
    log_debug "Copying '$src' to '$dest' ($description)"
    cp -r "$src"/* "$dest"/ || {
      log_error "Failed to copy '$src' to '$dest'"
      exit 1
    }
    log_debug "Successfully copied '$src' to '$dest'"
  else
    log_error "'$src' does not exist ($description)"
    exit 1
  fi
}

# Start the release process
log "${GREEN}"
log "╔══════════════════════════════════════════════╗"
log "║         Trailhead UI Release Process         ║"
log "╚══════════════════════════════════════════════╝"
log "${NC}"

log_info "Starting Trailhead UI Release Process..."
log_debug "Silent mode: $SILENT_MODE, Verbose mode: $VERBOSE_MODE, Colors: $USE_COLORS"

# Step 1: Clean and prepare temporary directory
log_step "Cleaning and preparing temporary directory..."

if [ -d "release-temp" ]; then
  log_info "Found existing release-temp/ directory, cleaning contents..."
  safe_remove_contents "release-temp" "temporary release directory"
else
  log_info "Creating release-temp/ directory..."
  mkdir -p release-temp || {
    log_error "Failed to create release-temp directory"
    exit 1
  }
fi

# Step 2: Prepare subdirectories
log_step "Creating necessary subdirectories..."

log_info "Creating release-temp/demo/src/components/..."
mkdir -p release-temp/demo/src/components/ || {
  log_error "Failed to create demo components directory"
  exit 1
}

log_info "Creating release-temp/th/..."
mkdir -p release-temp/th/ || {
  log_error "Failed to create th directory"
  exit 1
}

log_debug "Subdirectories created successfully"

# Step 3: Clean up demo components
log_step "Cleaning up demo source components..."

safe_remove_contents "demo/src/components" "demo components directory"
safe_remove_contents "demo/node_modules" "demo node_modules"
safe_remove_contents "demo/.next" "demo Next.js build cache"

# Step 4: Copy files
log_step "Copying project files..."

# Copy demo files
log_info "Copying demo/ directory to release-temp/demo/..."
if [ -d "demo" ]; then
  safe_copy "demo" "release-temp/demo" "demo application files"
else
  log_error "demo/ directory does not exist"
  exit 1
fi

# Remove TypeScript alias from copied tsconfig.json
log_info "Processing TypeScript configuration..."
if [ -f "release-temp/demo/tsconfig.json" ]; then
  if grep -q '"@/components/\*"' release-temp/demo/tsconfig.json; then
    log_debug "Removing @/components/* alias from tsconfig.json"
    sed -i.bak '/"@\/components\/\*"/d' release-temp/demo/tsconfig.json
    rm -f release-temp/demo/tsconfig.json.bak
    log_info "Removed @/components/* alias from tsconfig.json"
  else
    log_debug "No @/components/* alias found in tsconfig.json"
  fi
else
  log_warn "tsconfig.json not found in release-temp/demo/"
fi

# Copy source files to both locations
log_info "Copying src/ to release-temp/demo/src/components/..."
if [ -d "src" ]; then
  safe_copy "src" "release-temp/demo/src/components" "source files to demo components"
else
  log_error "src/ directory does not exist"
  exit 1
fi

log_info "Copying src/ to release-temp/th/..."
safe_copy "src" "release-temp/th" "source files to library directory"

# Step 5: Copy documentation
log_step "Copying documentation..."

if [ -f "RELEASE.md" ]; then
  cp RELEASE.md release-temp/README.md
else
  log "Warning: RELEASE.md file not found, skipping copy."
fi

# Step 6: Success messages
log_step "Finalizing release preparation..."

log_success "Release preparation completed successfully!"
log_success "Release files are ready in: release-temp/"

if [ "$VERBOSE_MODE" = true ]; then
  echo
  log_debug "Release directory structure:"
  if command -v tree >/dev/null 2>&1; then
    tree release-temp/ -L 3
  else
    find release-temp/ -type d | head -20
  fi
fi

ZIP_FILENAME="trailhead-ui-${VERSION}.zip"
# Step 7: Create release ZIP file
log_step "Creating release ZIP file..."
if command -v zip >/dev/null 2>&1; then
  log_info "Creating ${ZIP_FILENAME} in the current directory..."
  (cd release-temp && zip -qr "../${ZIP_FILENAME}" .) || {
    log_error "Failed to create ${ZIP_FILENAME}"
    exit 1
  }
  # Verify ZIP file was created
  if [ -f "${ZIP_FILENAME}" ]; then
    ZIP_SIZE=$(ls -lh "${ZIP_FILENAME}" | awk '{print $5}')
    log_success "ZIP file created successfully: ${ZIP_FILENAME} (${ZIP_SIZE})"
  else
    log_error "ZIP file was not created"
    exit 1
  fi
else
  log_error "zip command not found, cannot create ZIP file"
  exit 1
fi



echo
log "${GREEN}"
log "╔══════════════════════════════════════════════╗"
log "║           Release Process Complete           ║"
log "╚══════════════════════════════════════════════╝"
log "${NC}"

if [ "$SILENT_MODE" = false ]; then
  log "${CYAN}Next steps:${NC}"
  log "  • Review files in release-temp/ directory"
  log "  • Test the demo application"
  log "  • Create distribution package"
fi

log_debug "Script execution completed successfully"