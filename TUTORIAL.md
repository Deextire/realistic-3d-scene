# 📖 Complete Tutorial Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Basic Controls](#basic-controls)
3. [Day/Night Cycle Modes](#daynight-cycle-modes)
4. [Graphics Settings](#graphics-settings)
5. [Location & Time Settings](#location--time-settings)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)
8. [System Requirements](#system-requirements)

---

## Getting Started

### Installation

1. **Clone or Download the Repository**
   ```bash
   git clone https://github.com/Deextire/realistic-3d-scene.git
   cd realistic-3d-scene
   ```

2. **Run a Local Server**
   
   **Python 3:**
   ```bash
   python -m http.server 8000
   ```
   
   **Python 2:**
   ```bash
   python -m SimpleHTTPServer 8000
   ```
   
   **Node.js (http-server):**
   ```bash
   npm install -g http-server
   http-server
   ```
   
   **Live Server (VS Code Extension):**
   - Install "Live Server" extension
   - Right-click index.html → "Open with Live Server"

3. **Open in Browser**
   - Navigate to `http://localhost:8000`
   - The scene should load automatically

---

## Basic Controls

### Mouse & Keyboard (Desktop)
- **Rotate:** Click and drag with mouse
- **Zoom:** Scroll wheel up/down
- **Pause:** Space bar or pause button
- **Reset Camera:** R key or camera button
- **Graphics Panel:** G key or settings button
- **Help:** H key or help button

### Touch (Mobile/Tablet)
- **Rotate:** One finger drag
- **Zoom:** Two finger pinch/spread
- **Tap Buttons:** All on-screen controls are touch-friendly
- **Auto-Rotate:** Enabled by default on mobile

---

## Day/Night Cycle Modes

### 🔄 Simulated Mode (20-Minute Cycle)

**Description:** Completes a full 24-hour day in 20 minutes.

**Features:**
- Fast visualization of lighting changes
- Great for demos and presentations
- Adjustable speed with time multiplier
- Smooth transitions: Sunrise → Noon → Sunset → Night → Sunrise

**How to Use:**
1. Select "20 Min Cycle" radio button
2. Watch the lighting change automatically
3. Use time speed slider to accelerate/slow down
4. Click pause to freeze at any moment

**Time Multiplier Guide:**
- `0.1x` - 200 minutes for full day (very slow)
- `1x` - 20 minutes for full day (default)
- `5x` - 4 minutes for full day (very fast)

### 🌍 Real World Time Mode

**Description:** Shows actual time-of-day lighting for your location.

**Features:**
- Matches real-world sun position
- Accurate lighting based on latitude/longitude
- Respects actual sunrise/sunset times
- Works with geolocation service

**How to Use:**
1. Select "Real World Time" radio button
2. Click "📍 Use My Location" (requires permission)
3. Or manually enter latitude/longitude
4. Scene updates to match actual conditions

**Setting Custom Location:**
- Latitude: -90 (South Pole) to 90 (North Pole)
- Longitude: -180 (West) to 180 (East)
- Example: New York = 40.7128°N, 74.0060°W

---

## Graphics Settings

### Opening Graphics Panel

**Desktop:**
- Press `G` key
- Click ⚙️ button (bottom left)

**Mobile:**
- Tap ⚙️ button
- Swipe up from bottom (if available)

### Quality Presets

The system automatically detects your device and recommends a preset:

#### Minimum (Mobile Low-End)
- Resolution: 0.5x
- Shadows: Disabled
- Grass: 200 instances
- Trees: 3
- Best for: Old phones, low RAM devices

#### Low
- Resolution: 0.75x
- Shadows: Basic
- Grass: 500 instances
- Trees: 5
- Best for: Budget phones, tablets

#### Medium (Recommended)
- Resolution: 1x
- Shadows: Standard
- Grass: 1000 instances
- Trees: 8
- Best for: Most devices, good balance

#### High
- Resolution: 1.5x
- Shadows: Detailed
- Grass: 1800 instances
- Trees: 12
- Best for: Modern phones, good GPUs

#### Ultra
- Resolution: 2x
- Shadows: Maximum quality
- Grass: 2600 instances
- Trees: 14
- Best for: Desktop, high-end devices

### Individual Settings

#### 🌟 Bloom Strength
- **Range:** 0 - 1.0
- **What it does:** Controls glow around bright objects
- **0 = No glow**, **1.0 = Maximum glow**
- **Recommendation:** 0.6 for balance

#### 🌑 Shadow Quality
- **Disabled:** No shadows (faster)
- **Low:** Basic shadows
- **Medium:** Standard quality
- **High:** Detailed, realistic shadows
- **Note:** Disabled on mobile by default

#### 🌿 Vegetation Density
- **Range:** 0 - 100%
- **What it does:** Controls number of grass blades
- **Lower = Better performance**
- **100% = Most realistic look**

#### 📐 Shadow Resolution
- **256x256:** Low resolution shadows (fast)
- **512x512:** Medium resolution
- **1024x1024:** High resolution (recommended)
- **2048x2048:** Ultra resolution (very slow)

### Color Customization

#### Day Sky
- Controls sky color during daytime
- Default: Bright blue (#9bb3cf)
- Try: Orange (#FFA500) for sunset feel

#### Night Sky
- Controls sky color during nighttime
- Default: Deep blue (#1a1a2e)
- Try: Purple (#2a1a3e) for twilight

#### Sun Color
- Controls sun and light glow color
- Default: Warm yellow (#fff1b5)
- Try: Orange (#FFB700) for sunset

#### Fog Color
- Controls atmospheric fog color
- Default: Light blue (#c0d3e5)
- Try: Gray (#a0a0a0) for realistic fog

### Saving Settings

**To Save Current Settings:**
1. Customize graphics as desired
2. Click "💾 Save Settings"
3. Settings saved to browser localStorage
4. Auto-loads next time you visit

**To Reset:**
- Click "↻ Reset to Recommended"
- Resets to device-optimal defaults

---

## Location & Time Settings

### Using Geolocation

**Requirements:**
- Modern browser with HTTPS or localhost
- Location permission granted
- Internet connection

**How to Enable:**
1. Open Advanced Settings panel
2. Click "📍 Use My Location"
3. Grant permission when prompted
4. Scene updates with accurate sun position

### Manual Location Input

**Latitude:**
- Positive = North of equator
- Negative = South of equator
- Range: -90 to 90
- Examples:
  - 0° = Equator
  - 51.5° = London
  - -33.9° = Sydney

**Longitude:**
- Positive = East of Prime Meridian
- Negative = West of Prime Meridian
- Range: -180 to 180
- Examples:
  - 0° = Prime Meridian
  - 139.7° = Tokyo
  - -87.6° = Chicago

### Common Locations

| Location | Latitude | Longitude |
|----------|----------|----------|
| Equator | 0° | 0° |
| North Pole | 90° | 0° |
| South Pole | -90° | 0° |
| London | 51.5° | -0.1° |
| Tokyo | 35.7° | 139.7° |
| Sydney | -33.9° | 151.2° |
| New York | 40.7° | -74.0° |
| Dubai | 25.2° | 55.3° |

---

## Advanced Features

### Performance Optimization

**If Scene Runs Slowly:**
1. Lower quality preset
2. Reduce vegetation density
3. Disable shadows
4. Lower bloom strength
5. Reduce shadow resolution

**If Running Smoothly:**
1. Try higher quality preset
2. Increase vegetation
3. Enable shadows
4. Increase bloom strength

### Browser LocalStorage

Your settings are automatically saved:
- Graphics quality
- Custom colors
- Location preferences
- Time settings

To clear saved data:
```javascript
localStorage.clear();
```

### Time Adjustments

**Speed Multiplier:**
- Changes how fast time flows
- Only affects simulated mode
- Real-time mode uses actual time

**Pause/Resume:**
- Freezes time at current moment
- Useful for photography or analysis
- Doesn't affect location or settings

---

## Troubleshooting

### Scene Won't Load

**Problem:** Black screen or blank canvas

**Solutions:**
1. Check browser console for errors (F12)
2. Ensure JavaScript is enabled
3. Try different browser
4. Clear browser cache
5. Check internet connection (for Three.js CDN)

### Poor Performance

**Problem:** Stuttering, low FPS

**Solutions:**
1. Select lower quality preset
2. Close other applications
3. Reduce browser tabs
4. Lower vegetation density
5. Disable shadows
6. Reduce bloom strength

### Geolocation Not Working

**Problem:** "Use My Location" doesn't work

**Solutions:**
1. Must be on HTTPS or localhost
2. Check location permissions
3. Try manual latitude/longitude
4. Restart browser
5. Check if location service is enabled

### Colors Look Wrong

**Problem:** Colors appear washed out or too bright

**Solutions:**
1. Adjust monitor brightness
2. Check browser color settings
3. Try different quality preset
4. Adjust tone mapping in advanced settings
5. Customize colors manually

### Mobile Auto-Rotation Jerky

**Problem:** Camera auto-rotation seems jerky

**Solutions:**
1. This is normal behavior
2. Disable auto-rotate if annoying
3. Manually rotate for smooth control
4. Update browser to latest version

---

## System Requirements

### Minimum Requirements
- Browser: Chrome, Firefox, Safari, Edge (2020+)
- GPU: Integrated graphics (Intel, AMD)
- RAM: 2GB minimum
- CPU: Dual-core 2GHz+

### Recommended
- Browser: Latest version of Chrome/Firefox
- GPU: Dedicated GPU (NVIDIA, AMD, Intel Arc)
- RAM: 4GB+
- CPU: Quad-core 2.5GHz+
- Display: 1920x1080 or higher

### Mobile Requirements
- iOS: iPhone 6s or newer, iOS 12+
- Android: Android 5.0+, Snapdragon 625 or better
- RAM: 2GB minimum (3GB+ recommended)
- Network: WiFi recommended for smooth experience

### Supported Browsers
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Samsung Internet 8+
- ✅ Opera 47+

### Not Supported
- ❌ Internet Explorer
- ❌ Opera Mini
- ❌ Very old mobile devices

---

## Tips & Tricks

### Best Viewing Experience
1. Use fullscreen mode (F11)
2. Set quality to "High" or "Ultra" on desktop
3. Use real-time mode for accurate lighting
4. Visit at sunrise/sunset for dramatic lighting
5. Adjust colors to match your preference

### Educational Uses
1. Study sun position and seasonal changes
2. Understand how latitude affects daylight
3. Learn about atmospheric lighting
4. Explore 3D graphics rendering
5. Analyze shadows and lighting techniques

### Creative Uses
1. Generate reference images for artwork
2. Study composition in different lighting
3. Create animations with cycles
4. Export screenshots for presentations
5. Test custom color schemes

---

## Getting Help

- 📚 Read this tutorial again
- ❓ Press H key for quick help
- 🐛 Report bugs on GitHub Issues
- 💬 Suggest features via Discussions
- 🔗 Check GitHub repository

---

## License

This project is open-source under the MIT License. See LICENSE file for details.

Happy exploring! 🌅