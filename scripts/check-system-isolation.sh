#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail=0

# 1. No marketing component imports anything under /system
if rg -n "from ['\"]@/components/system" \
     "$ROOT/frontend/src/app/(marketing)" \
     "$ROOT/frontend/src/components/home" \
     "$ROOT/frontend/src/components/course" \
     "$ROOT/frontend/src/components/layout" \
     "$ROOT/frontend/src/components/pricing" \
     "$ROOT/frontend/src/components/seo" \
     "$ROOT/frontend/src/components/forms" \
     2>/dev/null | grep -v "components/system/primitives/.*shared"; then
  echo "❌ Marketing code imports system component"
  fail=1
fi

# 2. No marketing code imports lib/system
if rg -n "from ['\"]@/lib/system" \
     "$ROOT/frontend/src/app/(marketing)" \
     "$ROOT/frontend/src/components/home" \
     "$ROOT/frontend/src/components/course" \
     "$ROOT/frontend/src/components/layout" \
     "$ROOT/frontend/src/components/pricing" \
     "$ROOT/frontend/src/components/seo" \
     "$ROOT/frontend/src/components/forms" \
     2>/dev/null; then
  echo "❌ Marketing code imports lib/system"
  fail=1
fi

# 3. No public API controller references System namespace
if rg -n "use App\\\\Http\\\\Controllers\\\\System" \
     "$ROOT/backend/app/Http/Controllers/Api" \
     2>/dev/null; then
  echo "❌ Public API controller imports System namespace"
  fail=1
fi

# 4. Every model under app/Models/System uses the correct namespace
if [ -d "$ROOT/backend/app/Models/System" ]; then
  miss=$(find "$ROOT/backend/app/Models/System" -name '*.php' \
    -exec grep -L "namespace App\\\\Models\\\\System" {} \;)
  if [[ -n "$miss" ]]; then
    echo "❌ Files under Models/System without correct namespace:"
    echo "$miss"
    fail=1
  fi
fi

# 5. System migrations (2026_06_*) must create sys_ tables (with documented exceptions)
ALLOW_NON_SYS='create_permission_tables|add_system_columns_to_users_table|seed_system_baseline|create_activity_log_table'
for f in "$ROOT"/backend/database/migrations/2026_06_*; do
  [ -f "$f" ] || continue
  if ! grep -qE "Schema::create\('sys_" "$f"; then
    base=$(basename "$f")
    if ! echo "$base" | grep -qE "$ALLOW_NON_SYS"; then
      echo "❌ System migration without sys_ prefix: $f"
      fail=1
    fi
  fi
done

# 6. routes/system.php must not import Api controllers
if [ -f "$ROOT/backend/routes/system.php" ]; then
  if rg -n "App\\\\Http\\\\Controllers\\\\Api" \
       "$ROOT/backend/routes/system.php" 2>/dev/null; then
    echo "❌ system.php imports Api controllers"
    fail=1
  fi
fi

if [[ "$fail" == "0" ]]; then
  echo "✓ System isolation checks passed"
fi

exit $fail
