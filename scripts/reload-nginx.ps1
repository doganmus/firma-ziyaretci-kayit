Write-Host "Reloading nginx in frontend container..."
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose exec frontend nginx -s reload
Write-Host "Reload signal sent."


