#!/bin/bash

# Script to identify and create a plan for replacing Tailwind CSS with regular CSS

echo "=== TAILWIND CSS REMOVAL PLAN FOR DEHN FRONTEND ==="
echo ""

# Function to extract Tailwind classes from files
extract_tailwind_classes() {
    local file="$1"
    echo "File: $file"
    grep -n "className=" "$file" | grep -E "(bg-|text-|p-|m-|w-|h-|flex|grid|space-|gap-|rounded-|border-|hover:|focus:|shadow-|justify-|items-)" | head -10
    echo ""
}

# Check each TSX file for Tailwind usage
echo "1. FILES WITH SIGNIFICANT TAILWIND USAGE:"
echo "=========================================="

find frontend/src -name "*.tsx" -type f | while read -r file; do
    tailwind_count=$(grep -c "className=" "$file" | grep -E "(bg-|text-|p-|m-|w-|h-|flex|grid)" 2>/dev/null || echo "0")
    if [ "$tailwind_count" -gt 0 ]; then
        echo "- $file (estimated $tailwind_count Tailwind class usages)"
    fi
done

echo ""
echo "2. MOST COMMON TAILWIND PATTERNS FOUND:"
echo "======================================"

# Find most common Tailwind patterns
find frontend/src -name "*.tsx" -type f -exec grep -h "className=" {} \; | \
    grep -oE "(bg-[a-z0-9-]+|text-[a-z0-9-]+|p-[0-9]+|m-[0-9]+|w-[a-z0-9-]+|h-[a-z0-9-]+|flex|grid|space-[xy]-[0-9]+|gap-[0-9]+|rounded-[a-z]*|border-[a-z0-9-]*)" | \
    sort | uniq -c | sort -nr | head -20

echo ""
echo "3. REPLACEMENT STRATEGY:"
echo "======================"
echo "✓ App.tsx - Already started (nav-icon class created)"
echo "⚠️  DocumentDetail.tsx - Large file, needs comprehensive CSS replacement"
echo "⚠️  DashboardPage.tsx - Needs CSS replacement for stats cards and grid layouts"
echo "⚠️  TranslationPage.tsx - Has some Tailwind form classes"
echo "⚠️  Other admin pages - Minimal Tailwind usage detected"

echo ""
echo "4. CSS FILES TO CREATE/UPDATE:"
echo "============================"
echo "✓ DocumentDetail.css - Created (needs integration)"
echo "✓ DashboardPage.css - Created (needs integration)"
echo "⚠️  Common utility classes needed for icons, layouts, forms"
echo "⚠️  AdminPages.css - May need updates for consistency"

echo ""
echo "5. RECOMMENDED APPROACH:"
echo "======================"
echo "1. Create common utility CSS classes for:"
echo "   - Icon sizing (w-4 h-4, w-5 h-5, etc.)"
echo "   - Spacing utilities (mr-2, ml-2, mb-4, etc.)"
echo "   - Flexbox utilities (flex, items-center, justify-between)"
echo "   - Grid utilities (grid, grid-cols-1, grid-cols-2, etc.)"
echo ""
echo "2. Replace files in order of complexity:"
echo "   - Simple files first (fewer Tailwind classes)"
echo "   - Complex files like DocumentDetail.tsx last"
echo ""
echo "3. Test each file after replacement to ensure styling is preserved"

echo ""
echo "ANALYSIS COMPLETE"
