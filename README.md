# 🌅 Realistic Nature Scene - Day/Night Cycle

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/Deextire/realistic-3d-scene?style=social)](https://github.com/Deextire/realistic-3d-scene)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)]()

An interactive 3D scene featuring realistic lighting, dynamic day/night cycles, and comprehensive graphics customization. Built with **Three.js** for modern web browsers.

## ✨ Features

### 🌍 Day/Night Cycle Modes
- **Simulated Mode:** Complete day cycle in 20 minutes with adjustable speed
- **Real-Time Mode:** Accurate sun position based on actual location and time
- **Smooth Transitions:** Sunrise → Noon → Sunset → Night → Sunrise
- **Geolocation Support:** Auto-detect your location for accurate lighting

### 🎨 Graphics Customization
- **5 Quality Presets:** Minimum, Low, Medium, High, Ultra
- **Auto-Detection:** Automatically recommends settings for your device
- **Individual Controls:**
  - Shadow quality and resolution
  - Bloom strength
  - Vegetation density
  - Custom color picker for sky, fog, sun
- **Persistent Storage:** Settings saved to browser localStorage

### 🎮 Interactive Controls
- **Mouse:** Drag to rotate, scroll to zoom
- **Touch:** Single finger rotate, two-finger pinch zoom
- **Keyboard Shortcuts:** G for graphics, H for help, R for reset
- **Mobile Optimized:** Responsive UI that adapts to screen size

### 📊 Advanced Features
- **Realistic Lighting:** ACES filmic tone mapping and PCF soft shadows
- **Atmospheric Effects:** Volumetric sun rays, fog, and bloom
- **Procedural Vegetation:** Grass and trees with LOD optimization
- **Performance Monitoring:** FPS indicators and memory usage
- **Open Source:** MIT licensed, community-friendly

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Deextire/realistic-3d-scene.git
cd realistic-3d-scene

# Start a local server
python -m http.server 8000
# Or if using Python 2:
python -m SimpleHTTPServer 8000

# Open in browser
# Visit: http://localhost:8000
```

### Alternative Server Options

**Node.js:**
```bash
npm install -g http-server
http-server
```

**Live Server (VS Code):**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

**Docker:**
```bash
docker run -p 8000:80 -v $(pwd):/usr/share/nginx/html nginx
```

## 📖 Documentation

### Complete Tutorial
For comprehensive guides on:
- Basic controls and navigation
- Graphics settings explanation
- Location and time configuration
- Troubleshooting and optimization

See **[TUTORIAL.md](./TUTORIAL.md)** for full documentation.

### Quick Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Rotate View | Drag Mouse | One Finger Drag |
| Zoom | Scroll Wheel | Pinch |
| Pause | Space or Button | Button |
| Graphics Panel | G Key or Button | Button |
| Reset Camera | R Key or Button | Button |
| Help | H Key or Button | Button |

## 🎛️ Graphics Settings Guide

### Quality Presets

```
Minimum  → Low → Medium ⭐ → High → Ultra
  (Mobile)               (Recommended)  (Desktop)
```

### Performance Tips

**If Running Slowly:**
- Lower quality preset
- Reduce vegetation density
- Disable shadows
- Lower bloom strength

**For Better Visuals:**
- Increase shadow resolution
- Higher vegetation density
- Enable bloom and rays
- Use Ultra preset on desktop

## 🌐 Location & Time

### Using Your Location
1. Select "Real World Time" mode
2. Click "Use My Location"
3. Grant permission when prompted
4. Scene updates with accurate sun position

### Manual Location Setup
- Adjust latitude and longitude sliders
- Or type values directly
- Scene updates in real-time

### Common Coordinates
- **Equator:** 0°, 0°
- **London:** 51.5°, -0.1°
- **Tokyo:** 35.7°, 139.7°
- **Sydney:** -33.9°, 151.2°
- **New York:** 40.7°, -74.0°

## 💻 System Requirements

### Minimum
- Browser: Chrome, Firefox, Safari, Edge (2020+)
- GPU: Integrated graphics
- RAM: 2GB
- CPU: Dual-core 2GHz

### Recommended
- Browser: Latest Chrome/Firefox
- GPU: Dedicated GPU
- RAM: 4GB+
- CPU: Quad-core 2.5GHz+
- Display: 1920x1080+

### Mobile
- iOS 12+ (iPhone 6s+)
- Android 5.0+ (Snapdragon 625+)
- RAM: 2-3GB
- Chrome, Firefox, Safari, Samsung Internet

## 📁 Project Structure

```
realistic-3d-scene/
├── index.html          # Main HTML file
├── style.css           # Complete styling
├── main.js             # Three.js scene & logic
├── README.md           # This file
├── TUTORIAL.md         # Comprehensive tutorial
├── LICENSE             # MIT License
├── CONTRIBUTING.md     # Contribution guide
└── docs/               # Additional documentation
```

## 🔧 Technologies

- **Three.js:** 3D rendering engine
- **Modern JavaScript:** ES6+ modules
- **CSS3:** Responsive design
- **WebGL:** GPU-accelerated rendering
- **HTML5:** Semantic markup

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Ways to Contribute
- Report bugs via GitHub Issues
- Suggest features in Discussions
- Submit pull requests
- Improve documentation
- Optimize performance
- Add translations
- Share your creations!

## 📝 License

MIT License - See [LICENSE](./LICENSE) file for details.

```
Copyright (c) 2024 Deextire

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

## 🙏 Acknowledgments

- **Three.js:** Amazing 3D graphics library
- **Community:** Thanks to all contributors and users
- **Inspiration:** Real-world lighting and atmospheric effects

## 📞 Support

### Getting Help
1. Read [TUTORIAL.md](./TUTORIAL.md) for comprehensive guide
2. Press `H` in the app for quick help
3. Check [GitHub Issues](https://github.com/Deextire/realistic-3d-scene/issues)
4. Start a [Discussion](https://github.com/Deextire/realistic-3d-scene/discussions)

### Report Bugs

Please use [GitHub Issues](https://github.com/Deextire/realistic-3d-scene/issues) with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos
- Browser and device info

## 🎯 Roadmap

### Planned Features
- [ ] Multiple weather systems (rain, snow, clouds)
- [ ] Seasonal variations
- [ ] Custom model import
- [ ] Texture upload system
- [ ] Animation keyframes
- [ ] Screenshot/video export
- [ ] VR support
- [ ] Multi-language support

## 📊 Performance Stats

- **Desktop (High-End):** 60 FPS at 1440p with Ultra settings
- **Desktop (Mid-Range):** 60 FPS at 1080p with High settings
- **Mobile (High-End):** 60 FPS with High settings
- **Mobile (Budget):** 30-60 FPS with Low/Medium settings

## 🌟 Star History

⭐ If you find this project useful, please consider giving it a star!

## 📚 Learning Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Open Source Guides](https://opensource.guide/)

## 🔗 Links

- [GitHub Repository](https://github.com/Deextire/realistic-3d-scene)
- [Live Demo](https://Deextire.github.io/realistic-3d-scene)
- [Issues & Bugs](https://github.com/Deextire/realistic-3d-scene/issues)
- [Discussions](https://github.com/Deextire/realistic-3d-scene/discussions)

---

**Made with ❤️ by the Open Source Community**

Happy exploring! 🌅✨