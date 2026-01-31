# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**keep-alert** is a React Native mobile application built with Expo 54, using modern development tools including Expo Router for file-based routing, NativeWind for Tailwind CSS styling, and React Native Reanimated for animations. The app supports iOS, Android, and Web platforms with Expo's new architecture enabled.

## Development Commands

### Starting the Development Server
```bash
npm start              # Start Expo development server
npm run android        # Build and run on Android
npm run ios            # Build and run on iOS
npm run web            # Run in web browser
```

### Code Quality
The project uses ESLint and Prettier for code quality:
```bash
# ESLint is configured via eslint.config.js (flat config format)
# Prettier is configured via prettier.config.js with Tailwind plugin
```

Note: There are no test scripts configured yet in package.json.

## Architecture

### Routing - Expo Router (File-Based)

This project uses **Expo Router** with file-based routing similar to Next.js. Routes are defined by the file structure in the `app/` directory:

- `app/_layout.tsx` - Root layout component that wraps all routes
  - Configures Stack navigation
  - Applies ThemeProvider with light/dark mode support
  - Includes PortalHost for modals/popovers
  - Manages StatusBar appearance

- `app/index.tsx` - Home screen (root route `/`)

To add new screens, create new files in the `app/` directory. The file name determines the route path.

### Styling System - NativeWind + Tailwind CSS

The project uses **NativeWind** to bring Tailwind CSS utility classes to React Native:

- **global.css** - Defines Tailwind layers and CSS variables for theming
- **tailwind.config.js** - Configures Tailwind with dark mode support, custom colors, and animations
- **metro.config.js** - Wrapped with `withNativeWind` for CSS processing
- **babel.config.js** - Configured with NativeWind preset

**Theme System:**
- `lib/theme.ts` - Exports `THEME` and `NAV_THEME` objects with light/dark mode colors
- Uses HSL color format for consistency with Tailwind CSS variables
- Colors are defined as CSS variables in global.css (`:root` and `.dark:root`)
- Dark mode uses class-based strategy (`class` in tailwind.config.js)

### Utilities

- `lib/utils.ts` - Contains the `cn()` function for merging Tailwind classes using clsx and tailwind-merge

### Path Aliases

TypeScript is configured with path aliases for clean imports:
```typescript
@/lib/*        → ./lib/*
@/components/* → ./components/*
@/hooks/*      → ./hooks/*
@/ui/*         → ./components/ui/*
```

These aliases are defined in `tsconfig.json` and `components.json`.

## Configuration Files

### Expo Configuration (app.json)
- Package name: `com.rafaelzf.keepalert`
- New Architecture: enabled
- Edge-to-edge enabled for Android
- Predictive back gesture disabled

### Component Configuration (components.json)
Ready for shadcn/ui-style component CLI integration with predefined aliases and the "new-york" style.

### Code Style
- **Prettier**: 100 character line width, 2 space indents, single quotes
- **ESLint**: Uses expo flat config, `react/display-name` rule disabled
- **TypeScript**: Strict mode enabled

## Important Notes

1. **New Architecture**: This project uses React Native's new architecture (enabled in app.json). Be mindful of compatibility when adding third-party libraries.

2. **Expo Router**: Navigation uses file-based routing. To create new routes, add files to the `app/` directory. Use `Link` from `expo-router` for navigation, not React Navigation's navigation prop directly.

3. **Styling**: Always use NativeWind/Tailwind classes instead of StyleSheet. The `cn()` utility from `@/lib/utils` should be used to merge conditional classes.

4. **Theme Colors**: When adding new UI components, reference theme colors via CSS variables or the `THEME` object from `@/lib/theme`. This ensures proper light/dark mode support.

5. **Entry Points**:
   - `index.ts` (root) - Registers the app with Expo, imports from `./app/`
   - `app/_layout.tsx` - Root layout that wraps all routes (ThemeProvider, Stack navigation, StatusBar, PortalHost)
   - `app/index.tsx` - Home screen (imports global.css, serves as the `/` route)

   The Expo Router structure means all application code lives inside the `app/` directory.
