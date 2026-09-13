#!/bin/zsh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="Signal Desk"
APP_DIR="$PROJECT_DIR/dist/$APP_NAME.app"
CONTENTS="$APP_DIR/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
DESKTOP="$HOME/Desktop"

rm -rf "$APP_DIR"
mkdir -p "$MACOS" "$RESOURCES"

cat > "$CONTENTS/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleName</key><string>Signal Desk</string>
<key>CFBundleDisplayName</key><string>Signal Desk</string>
<key>CFBundleIdentifier</key><string>local.signaldesk.app</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleExecutable</key><string>Signal Desk</string>
<key>CFBundleVersion</key><string>0.1.0</string>
<key>CFBundleShortVersionString</key><string>0.1.0</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
</dict></plist>
EOF

cat > "$MACOS/Signal Desk" <<EOF
#!/bin/zsh
PROJECT_DIR="$PROJECT_DIR"
if ! curl -fsS http://127.0.0.1:5173/health >/dev/null 2>&1; then
  nohup /usr/bin/env npm run start --prefix "$PROJECT_DIR" >"$PROJECT_DIR/data/signal-desk.log" 2>&1 &
  for i in {1..30}; do
    curl -fsS http://127.0.0.1:5173/health >/dev/null 2>&1 && break
    sleep 0.2
  done
fi
/usr/bin/open "http://localhost:5173/"
EOF
chmod +x "$MACOS/Signal Desk"

mkdir -p "$DESKTOP"
ln -sfn "$APP_DIR" "$DESKTOP/$APP_NAME.app"
echo "Built: $APP_DIR"
echo "Desktop shortcut: $DESKTOP/$APP_NAME.app"
