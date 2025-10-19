param(
  [int]$Days = 365,
  [string]$CommonName = "localhost"
)

if (-not (Test-Path -Path "certs")) {
  New-Item -ItemType Directory -Path "certs" | Out-Null
}

Write-Host "Generating self-signed certificate (CN=$CommonName, $Days days)"
& openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/server.key -out certs/server.crt -days $Days -subj "/CN=$CommonName"
Write-Host "Done: certs/server.crt, certs/server.key"


