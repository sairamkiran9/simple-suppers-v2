# Setup script for dev container (PowerShell)

Write-Host "🚀 Setting up Simple Suppers development environment..." -ForegroundColor Green

# Check if .env.local exists
if (-not (Test-Path .env.local)) {
    Write-Host "📝 Creating .env.local from example..." -ForegroundColor Yellow
    Copy-Item .env.local.example .env.local
    Write-Host "⚠️  Please update .env.local with your actual values" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "✨ Setup complete! You can now:" -ForegroundColor Green
Write-Host "   - Run 'npm run dev' to start the development server"
Write-Host "   - Run 'npm test' to run tests"
Write-Host "   - Run 'make docker-test' to run tests in Docker"
Write-Host ""
