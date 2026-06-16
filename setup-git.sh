#!/bin/bash
git config --global user.email "kotya1984alina2004@gmail.com"
git config --global user.name "kotya1984alina2004-web"
git remote add origin https://github.com/kotya1984alina2004-web/planer.git
git add .
git commit -m "первый коммит"
git branch -M main
git push -u origin main
echo "Готово! Открой GitHub и проверь репозиторий."
