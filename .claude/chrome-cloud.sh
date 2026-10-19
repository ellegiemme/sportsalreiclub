#!/bin/sh
# Chromium per le sessioni cloud di Claude Code (girano come root, serve --no-sandbox)
exec /opt/pw-browsers/chromium --no-sandbox "$@"
