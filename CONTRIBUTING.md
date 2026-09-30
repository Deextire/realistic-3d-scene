# Contributing to Realistic Nature Scene

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- No harassment or discrimination
- Focus on constructive feedback
- Respect others' time and effort

## Ways to Contribute

### 🐛 Report Bugs
1. Use GitHub Issues
2. Clear description of the problem
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshot/video if possible
6. Browser and device information

### 💡 Suggest Features
1. Check existing Issues/Discussions first
2. Clear description of the feature
3. Why it would be useful
4. Example use cases
5. Implementation ideas (optional)

### 📝 Improve Documentation
1. Fix typos and errors
2. Clarify confusing sections
3. Add examples
4. Improve formatting
5. Add missing information

### 💻 Code Contributions
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Update documentation
6. Submit pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/realistic-3d-scene.git
cd realistic-3d-scene

# Create feature branch
git checkout -b feature/your-feature-name

# Start local server
python -m http.server 8000

# Make changes and test
# Commit and push
git add .
git commit -m "Description of changes"
git push origin feature/your-feature-name
```

## Pull Request Process

1. Fork the repository
2. Create feature branch from `main`
3. Make clear, focused commits
4. Update README/TUTORIAL if needed
5. Ensure code works on multiple browsers
6. Test on mobile if applicable
7. Submit PR with clear description
8. Respond to review feedback
9. Keep PR updated with main branch

## Code Style

### JavaScript
- Use ES6+ syntax
- Clear variable names
- Comments for complex logic
- Consistent indentation (2 spaces)
- No console errors/warnings

```javascript
// ✅ Good
function calculateSunPosition(latitude, time) {
  // Clear logic with comments
  const angle = time * Math.PI * 2;
  return angle;
}

// ❌ Bad
function calcSun(lat,t){return t*Math.PI*2;}
```

### CSS
- Mobile-first approach
- Responsive breakpoints
- Clear class names
- Grouped related styles

```css
/* ✅ Good */
.button {
  padding: 8px 12px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .button {
    padding: 6px 10px;
  }
}

/* ❌ Bad */
.btn{padding:8px;}
.btn-mobile{padding:6px;}
```

### HTML
- Semantic markup
- Accessibility (aria labels)
- Proper nesting
- Clear structure

```html
<!-- ✅ Good -->
<button aria-label="Settings" title="Open settings">⚙️</button>

<!-- ❌ Bad -->
<div onclick="openSettings()">Settings</div>
```

## Testing Checklist

Before submitting PR, test:

- [ ] Works on Chrome
- [ ] Works on Firefox
- [ ] Works on Safari
- [ ] Works on mobile
- [ ] Graphics settings apply correctly
- [ ] Day/night cycle works
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Responsive design intact
- [ ] Help tutorial displays
- [ ] Color picker works
- [ ] Geolocation works (if applicable)

## Performance Guidelines

- Maintain 60 FPS on recommended devices
- Mobile performance acceptable at 30+ FPS
- Don't add unnecessary geometry
- Optimize texture sizes
- Use instancing for repeated objects
- Profile before/after changes

## Documentation

Update documentation if you:
- Add new features
- Change existing behavior
- Modify settings
- Add keyboard shortcuts
- Update system requirements

## Commit Messages

```
# Format: [Type] Description

# Good
[Feature] Add time multiplier control
[Bug] Fix geolocation permission prompt
[Docs] Update tutorial with new settings
[Performance] Optimize grass rendering
[Style] Improve mobile UI responsiveness

# With body for detailed changes
[Feature] Add time multiplier control

- Add slider to adjust simulation speed
- Range from 0.1x to 5x
- Saves to localStorage
- Works in simulated mode only

Closes #123
```

## Questions?

- Ask in Discussions
- Comment on issues
- Email: [contact info if available]
- Check existing documentation first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Acknowledgment

Your name will be added to the contributors list! Thank you for helping improve this project.

---

Happy contributing! 🚀