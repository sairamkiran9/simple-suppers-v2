# Quick Docker test runner for Windows
# Usage: .\test-docker.ps1

Write-Host "🧪 Running Docker tests..." -ForegroundColor Cyan
Write-Host ""

# Clean up any existing containers
Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml down -v 2>$null

# Run tests
Write-Host "🚀 Starting tests..." -ForegroundColor Green
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Capture exit code
$exitCode = $LASTEXITCODE

# Clean up
Write-Host ""
Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml down

# Report results
Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ Tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Tests failed with exit code: $exitCode" -ForegroundColor Red
}

exit $exitCode
