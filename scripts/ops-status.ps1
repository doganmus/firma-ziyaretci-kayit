Write-Host "Compose services status:" -ForegroundColor Cyan
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose ps
Write-Host "\nGrafana: http://localhost:3001  Prometheus: http://localhost:9090" -ForegroundColor DarkGray


