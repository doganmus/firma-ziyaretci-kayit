param(
  [string]$File = "backups/backup.sql"
)

if (-not (Test-Path -Path $File)) {
  Write-Error "Backup file not found: $File"
  exit 1
}

Write-Host "Restoring database from $File ..."
Get-Content $File | & "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose exec -T db psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB
Write-Host "Restore completed."


