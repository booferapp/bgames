# PowerShell script to fix storage buckets
# Get your service role key from: https://fvjdohkfaxomtosiibua.supabase.co/project/default/settings/api

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "Supabase Storage Bucket Fix Script" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for service role key
$SERVICE_KEY = Read-Host "Enter your Supabase SERVICE ROLE KEY (from Settings > API)"

if ([string]::IsNullOrWhiteSpace($SERVICE_KEY)) {
    Write-Host "❌ Service key is required!" -ForegroundColor Red
    Write-Host "Get it from: https://fvjdohkfaxomtosiibua.supabase.co/project/default/settings/api" -ForegroundColor Yellow
    exit 1
}

$BASE_URL = "https://fvjdohkfaxomtosiibua.supabase.co"
$HEADERS = @{
    "Authorization" = "Bearer $SERVICE_KEY"
    "Content-Type" = "application/json"
    "apikey" = $SERVICE_KEY
}

Write-Host "🗑️  Deleting existing buckets..." -ForegroundColor Yellow

# Delete existing buckets
try {
    Invoke-RestMethod -Uri "$BASE_URL/storage/v1/bucket/game-files" -Method Delete -Headers $HEADERS -ErrorAction SilentlyContinue
    Write-Host "  ✓ Deleted game-files bucket" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Could not delete game-files (might not exist): $($_.Exception.Message)" -ForegroundColor DarkYellow
}

try {
    Invoke-RestMethod -Uri "$BASE_URL/storage/v1/bucket/banners" -Method Delete -Headers $HEADERS -ErrorAction SilentlyContinue
    Write-Host "  ✓ Deleted banners bucket" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Could not delete banners (might not exist): $($_.Exception.Message)" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "🔨 Creating new buckets..." -ForegroundColor Cyan

# Create game-files bucket
$gameFilesBody = @{
    id = "game-files"
    name = "game-files"
    public = $true
    file_size_limit = 52428800
    allowed_mime_types = @("text/html", "application/javascript", "text/javascript", "application/json", "text/css")
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$BASE_URL/storage/v1/bucket" -Method Post -Headers $HEADERS -Body $gameFilesBody
    Write-Host "  ✅ Created game-files bucket successfully!" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed to create game-files: $($_.Exception.Message)" -ForegroundColor Red
}

# Create banners bucket
$bannersBody = @{
    id = "banners"
    name = "banners"
    public = $true
    file_size_limit = 5242880
    allowed_mime_types = @("image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml")
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$BASE_URL/storage/v1/bucket" -Method Post -Headers $HEADERS -Body $bannersBody
    Write-Host "  ✅ Created banners bucket successfully!" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed to create banners: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Listing all buckets..." -ForegroundColor Cyan

try {
    $buckets = Invoke-RestMethod -Uri "$BASE_URL/storage/v1/bucket" -Method Get -Headers $HEADERS
    Write-Host "  Found $($buckets.Count) buckets:" -ForegroundColor Green
    foreach ($bucket in $buckets) {
        $visibility = if ($bucket.public) { "Public" } else { "Private" }
        $sizeLimit = [math]::Round($bucket.file_size_limit / 1024 / 1024, 2)
        Write-Host "    - $($bucket.name) ($visibility, ${sizeLimit}MB limit)" -ForegroundColor White
    }
} catch {
    Write-Host "  ❌ Failed to list buckets: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "✅ Done! Check your Supabase dashboard:" -ForegroundColor Green
Write-Host "   https://fvjdohkfaxomtosiibua.supabase.co/project/default/storage/buckets" -ForegroundColor Blue
Write-Host "==================================================================" -ForegroundColor Cyan
