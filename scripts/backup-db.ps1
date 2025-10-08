param(
  [string]$File = "backups/backup.sql"
)

if (-not (Test-Path -Path "backups")) {
  New-Item -ItemType Directory -Path "backups" | Out-Null
}

Write-Host "Creating database backup to $File ..."
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose exec db pg_dump -U $env:POSTGRES_USER -d $env:POSTGRES_DB | Out-File -FilePath $File -Encoding ascii
Write-Host "Backup created: $File"


