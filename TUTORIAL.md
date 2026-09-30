# Beginner tutorial

## What this project is

This is a browser-based 3D scene. You do not install a game engine. A modern browser renders the scene with WebGL, while a small local web server supplies the files safely.

## First run

### Windows, macOS, and Linux

1. Install Git (optional) and Python 3.
2. Download or clone the repository.
3. Open a terminal inside the project folder.
4. Run `python3 -m http.server 8000` (Windows may use `python -m http.server 8000`).
5. Visit `http://localhost:8000`.

### VS Code

Install VS Code and the **Live Server** extension, open the folder, right-click `index.html`, and select **Open with Live Server**.

### Android

Install Termux from F-Droid/GitHub Releases, then run:

```bash
pkg update
pkg install git python
git clone https://github.com/Deextire/realistic-3d-scene.git
cd realistic-3d-scene
python -m http.server 8000
```

Open `http://127.0.0.1:8000` in the phone browser. Termux hosts the files; Chrome/Firefox does the rendering.

### iPhone/iPad

Use a hosted copy, GitHub Codespaces, or a local HTTP-server app. Safari can render the scene, but iOS does not provide the same terminal workflow as Android Termux.

## What a new visitor should know

- The page may take a few seconds to create grass and geometry.
- Drag to look around; pinch or wheel to zoom.
- Use **Day, Sunrise, Sunset, Night** for instant lighting snapshots.
- Use **20 Min Cycle** for the animated day; pause safely at any time.
- Use **Real World Time** for the browser's local clock. GPS improves the sun estimate but is optional.
- The gear button opens graphics settings. Start at Medium, then raise quality only if motion remains smooth.

## Hardware recommendations

| Level | CPU/RAM | GPU and expected setting |
|---|---|---|
| Minimum | 2 cores / 2 GB | Integrated GPU; Minimum or Low |
| Comfortable mobile | 4 cores / 3–4 GB | Recent Snapdragon/Apple GPU; Low/Medium |
| Comfortable desktop | 4 cores / 4 GB | Modern integrated or dedicated GPU; Medium/High |
| High quality | 6–8 cores / 8 GB | Dedicated GPU; Ultra/Realistic |

Performance depends on browser, resolution, battery mode, thermals, and other tabs. A device can always choose a lower preset.

## Graphics settings

- **Minimum/Low:** use these when the horizon or vegetation stutters.
- **Ultra:** increases pixel ratio, shadows, grass, trees, rays, and clouds.
- **Cinematic:** prioritizes bloom and sun rays.
- **Realistic:** prioritizes geometry and shadows.
- **Aurora Borealis:** enable only at night; disable it on low-end devices.

The automatic recommendation uses optional memory/core information and screen size. It is a starting point, not a hardware benchmark.

## Troubleshooting

### Nothing appears
Use `http://localhost:8000`, not a `file://` URL. Then reload with DevTools open and inspect Console.

### The scene is slow
Choose Minimum or Low, disable shadows and Aurora, reduce bloom, close tabs, plug in the device, and disable aggressive battery saver.

### GPS does not work
Grant permission and use HTTPS/localhost. Otherwise enter latitude/longitude manually; the project does not require GPS.

### Zoom feels different
Desktop uses the wheel; mobile uses two-finger pinch. Damping intentionally makes the camera settle smoothly. Reset the camera if it gets too close.

### Reporting a bug
Include browser version, device/GPU, preset, orientation, steps to reproduce, console error, and a screenshot. See `CONTRIBUTING.md`.

## Developer notes

The project is dependency-light and uses Three.js from jsDelivr. Repeated grass is instanced, animation delta is capped, quality is applied without rebuilding the horizon every frame, and expensive effects are controlled by presets. Changes to geometry counts should be tested on a low-end phone before release.
