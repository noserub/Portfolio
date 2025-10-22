# ThemeAwareLogo Component

## Overview
The `ThemeAwareLogo` component automatically switches between black and white logo variants based on the current theme (light/dark mode).

## Features
- **Automatic Theme Detection**: Uses `MutationObserver` to watch for theme changes
- **CSS Filter Fallback**: Applies `brightness(0) invert(1)` to black logos in dark mode
- **White Variant Support**: Can use a dedicated white logo variant for better quality
- **Smooth Transitions**: 0.3s ease-in-out transitions between theme changes
- **Performance Optimized**: Only applies filters when necessary

## Usage

### Basic Usage (CSS Filter)
```tsx
<ThemeAwareLogo 
  logoUrl="https://example.com/black-logo.png"
  alt="Logo"
  className="h-12 object-contain"
/>
```

### Advanced Usage (White Variant)
```tsx
<ThemeAwareLogo 
  logoUrl="https://example.com/black-logo.png"
  whiteVariantUrl="https://example.com/white-logo.png"
  alt="Logo"
  className="h-12 object-contain"
/>
```

## How It Works

1. **Theme Detection**: Watches for `dark` class on `document.documentElement`
2. **Logo Selection**: 
   - If `whiteVariantUrl` provided and dark mode → use white variant
   - Otherwise → use original logo with CSS filter
3. **CSS Filter**: `brightness(0) invert(1)` converts black logos to white
4. **Transitions**: Smooth 0.3s transitions when theme changes

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `logoUrl` | `string` | ✅ | URL of the main logo (typically black) |
| `whiteVariantUrl` | `string` | ❌ | URL of white variant for dark mode |
| `alt` | `string` | ❌ | Alt text for the image (default: "Logo") |
| `className` | `string` | ❌ | CSS classes for the image |
| `onLoad` | `() => void` | ❌ | Callback when image loads |
| `onError` | `() => void` | ❌ | Callback when image fails to load |

## Implementation Notes

- The component automatically detects theme changes without requiring props
- CSS filters work with any logo format (PNG, SVG, JPG, etc.)
- White variants provide better quality than CSS filters
- Component is lightweight and performant
- Works with any CSS framework or theme system
