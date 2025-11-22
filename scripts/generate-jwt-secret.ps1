# Generate a secure random JWT_SECRET and update .env file
# This script creates a cryptographically secure random string (64+ characters)
# and updates the JWT_SECRET in .env file with backup

param(
  [int]$Length = 64
)

$ErrorActionPreference = "Stop"

# Check if .env file exists
if (-not (Test-Path -Path ".env")) {
  Write-Host "ERROR: .env file not found in current directory" -ForegroundColor Red
  Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
  exit 1
}

# Generate cryptographically secure random bytes
$bytes = New-Object byte[] $Length
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()

# Convert to Base64 string (URL-safe, no padding)
$newSecret = [Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').Replace('=', '')

# Ensure minimum length (if somehow shorter, pad it)
if ($newSecret.Length -lt 32) {
  Write-Host "WARNING: Generated secret is shorter than expected. Generating longer one..." -ForegroundColor Yellow
  $bytes = New-Object byte[] 48
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
  $rng.Dispose()
  $newSecret = [Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').Replace('=', '')
}

Write-Host "Generated new JWT_SECRET (length: $($newSecret.Length) characters)" -ForegroundColor Green

# Create backup of .env file
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = ".env.backup.$timestamp"
Copy-Item -Path ".env" -Destination $backupPath
Write-Host "Backup created: $backupPath" -ForegroundColor Cyan

# Read .env file
$envContent = Get-Content -Path ".env" -Raw

# Check if JWT_SECRET exists
if ($envContent -match "(?m)^JWT_SECRET\s*=") {
  # Replace existing JWT_SECRET
  $envContent = $envContent -replace "(?m)^JWT_SECRET\s*=.*", "JWT_SECRET=$newSecret"
  Write-Host "Updated existing JWT_SECRET in .env" -ForegroundColor Green
} else {
  # Add new JWT_SECRET at the end
  if (-not $envContent.EndsWith("`n") -and -not $envContent.EndsWith("`r`n")) {
    $envContent += "`n"
  }
  $envContent += "JWT_SECRET=$newSecret`n"
  Write-Host "Added new JWT_SECRET to .env" -ForegroundColor Green
}

# Write updated content
Set-Content -Path ".env" -Value $envContent -NoNewline

# Show first 8 characters for verification (security: don't show full secret)
$preview = $newSecret.Substring(0, [Math]::Min(8, $newSecret.Length))
Write-Host "`nNew JWT_SECRET preview: $preview..." -ForegroundColor Yellow
Write-Host "Full secret saved to .env file" -ForegroundColor Green
Write-Host "`nIMPORTANT:" -ForegroundColor Red
Write-Host "  - All active user sessions will be invalidated" -ForegroundColor Yellow
Write-Host "  - Users will need to log in again" -ForegroundColor Yellow
Write-Host "  - Restart backend container after updating .env" -ForegroundColor Yellow
Write-Host "  - Backup saved to: $backupPath" -ForegroundColor Cyan

