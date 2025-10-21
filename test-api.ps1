# API Testing Script for Pathfinder
# This script tests the API endpoints after deployment

Write-Host "`n===== Testing Pathfinder API =====" -ForegroundColor Cyan

# Test 1: Check Providers
Write-Host "`n[1/2] Testing /api/providers..." -ForegroundColor Yellow
try {
    $providersResponse = Invoke-RestMethod -Uri "https://pathfinder-eight-rosy.vercel.app/api/providers" -Method GET
    Write-Host "✓ Providers endpoint working!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $providersResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Host "✗ Providers endpoint failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 2: Generate Learning Path
Write-Host "`n[2/2] Testing /api/generate-path..." -ForegroundColor Yellow
$body = @{
    topic = "Python"
    level = "beginner"
    duration = 2
    hoursPerWeek = 10
} | ConvertTo-Json

try {
    Write-Host "Sending request (this may take 5-10 seconds)..." -ForegroundColor Gray
    $pathResponse = Invoke-RestMethod -Uri "https://pathfinder-eight-rosy.vercel.app/api/generate-path" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✓ Generate-path endpoint working!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    if ($pathResponse.success) {
        Write-Host "Success: $($pathResponse.success)" -ForegroundColor Green
        Write-Host "Path Title: $($pathResponse.data.title)" -ForegroundColor Cyan
        Write-Host "Total Weeks: $($pathResponse.data.totalWeeks)" -ForegroundColor Cyan
    } else {
        $pathResponse | ConvertTo-Json -Depth 3
    }
} catch {
    Write-Host "✗ Generate-path endpoint failed!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n===== Tests Complete =====" -ForegroundColor Cyan
