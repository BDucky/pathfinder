# Quick API Check Script
Write-Host "`n=== Checking API Status ===" -ForegroundColor Cyan

# Test 1: Check providers (shows if API keys are configured)
Write-Host "`n[1] Checking API Keys Configuration..." -ForegroundColor Yellow
try {
    $providers = Invoke-RestMethod -Uri "https://pathfinder-eight-rosy.vercel.app/api/providers" -Method GET
    Write-Host "✓ API Keys Status:" -ForegroundColor Green
    Write-Host "  Gemini: $($providers.data.providers.gemini)" -ForegroundColor $(if ($providers.data.providers.gemini) { "Green" } else { "Red" })
    Write-Host "  Groq: $($providers.data.providers.groq)" -ForegroundColor Gray
    Write-Host "  YouTube: $($providers.data.providers.youtube)" -ForegroundColor Gray
    
    if (-not $providers.data.providers.gemini) {
        Write-Host "`n⚠️  PROBLEM FOUND: Gemini API key is NOT configured on Vercel!" -ForegroundColor Red
        Write-Host "   Fix: Add GEMINI_API_KEY to Vercel environment variables" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Failed to check providers!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 2: Try generate path and see actual error
Write-Host "`n[2] Testing Generate Path to see actual error..." -ForegroundColor Yellow
$body = @{
    topic = "Python"
    level = "beginner"  
    duration = 2
    hoursPerWeek = 10
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://pathfinder-eight-rosy.vercel.app/api/generate-path" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    Write-Host "✓ Success!" -ForegroundColor Green
} catch {
    Write-Host "✗ Error occurred - this is expected if API key is missing:" -ForegroundColor Red
    
    # Try to get the response body
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "`nActual Error Message: $($errorObj.error)" -ForegroundColor Yellow
        Write-Host "Success: $($errorObj.success)" -ForegroundColor Gray
    } else {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Check Complete ===" -ForegroundColor Cyan
