cd src/basilisk

$wc = New-Object System.Net.WebClient
$wc.DownloadFile($env:DISK_URL, "$(Resolve-Path .)\disk.zip")

7z x disk.zip -y -aoa
Remove-Item disk.zip
cd ../..
Tree ./src/basilisk /F
