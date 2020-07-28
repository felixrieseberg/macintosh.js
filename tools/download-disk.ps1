cd src/basilisk
Start-FileDownload $env:DISK_URL -FileName disk.zip -Timeout 600000
7z x disk.zip -y -aoa
Remove-Item disk.zip
cd ../..
Tree ./src/basilisk /F
