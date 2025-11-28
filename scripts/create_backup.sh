#!/bin/bash
# Database Backup Script for Provider-to-Creator Refactoring
# Created: 2025-01-27
# Purpose: Create full database backup before migration (CLOUD DATABASE)

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_pre_refactor_${TIMESTAMP}.sql"
PROJECT_REF="abtkockywyhvfpzaqdfi"

echo "========================================"
echo "Creating CLOUD database backup..."
echo "========================================"
echo "Project: ${PROJECT_REF}"
echo "Backup file: ${BACKUP_FILE}"
echo "========================================"
echo ""

# Method 1: Try using Supabase API to trigger backup
echo "Option 1: Using Supabase Dashboard (RECOMMENDED)"
echo "==========================================="
echo "1. Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/general"
echo "2. Scroll to 'Database Backups' section"
echo "3. Click 'Download backup' or 'Create backup'"
echo ""
echo "Option 2: Use pg_dump with your database password"
echo "==========================================="
echo "If you have PostgreSQL installed, run:"
echo ""
echo "pg_dump -h db.${PROJECT_REF}.supabase.co -U postgres -d postgres --clean --if-exists > ${BACKUP_FILE}"
echo ""
echo "You'll be prompted for your database password."
echo "Find it at: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database"
echo ""
echo "Option 3: Skip backup (NOT RECOMMENDED)"
echo "==========================================="
echo "Press Ctrl+C to cancel, or continue without backup at your own risk"
echo ""
read -p "Press Enter to try pg_dump backup (you'll need database password)..."

# Try pg_dump if available
if command -v pg_dump &> /dev/null; then
    echo ""
    echo "Running pg_dump..."
    echo "You'll be prompted for your database password"
    echo "(Find it in Supabase Dashboard > Settings > Database)"
    echo ""

    pg_dump -h db.${PROJECT_REF}.supabase.co \
            -U postgres \
            -d postgres \
            --clean \
            --if-exists \
            --no-owner \
            --no-acl \
            -f "${BACKUP_FILE}"

    if [ $? -eq 0 ]; then
        echo ""
        echo "========================================"
        echo "✅ Backup created successfully!"
        echo "File: ${BACKUP_FILE}"
        echo "Size: $(du -h ${BACKUP_FILE} 2>/dev/null | cut -f1)"
        echo "========================================"
    else
        echo ""
        echo "❌ pg_dump failed!"
        echo "Please use the Supabase Dashboard method instead."
        exit 1
    fi
else
    echo ""
    echo "❌ pg_dump not found on your system"
    echo ""
    echo "Please use the Supabase Dashboard to create a backup:"
    echo "https://supabase.com/dashboard/project/${PROJECT_REF}/settings/general"
    echo ""
    exit 1
fi
