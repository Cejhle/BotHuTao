@echo off
echo Mengirim update ke GitHub...
git add .
git commit -m "update bot"
git push -u origin main
echo Berhasil dikirim ke GitHub!
pause