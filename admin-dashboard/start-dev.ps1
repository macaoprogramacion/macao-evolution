# Script para iniciar el servidor de desarrollo MOR Dashboard
$env:Path = "C:\Program Files\nodejs;" + $env:Path
Set-Location $PSScriptRoot
npm run dev
