@echo off
rem Abre o cronograma no seu computador (para testar). Precisa do Node instalado.
cd /d "%~dp0"
if not exist node_modules call npm install
start "" http://localhost:3000
npm start
