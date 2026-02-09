# ADR-004: Use Expo + React Native for Mobile

## Status

- **Accepted**

## Context

We needed to choose a mobile development approach for Logship-MVP. The app needs to:
- Support both iOS and Android
- Access device features (GPS, camera, notifications)
- Support background location tracking for drivers
- Allow over-the-air (OTA) updates
- Have good developer experience for rapid iteration

The project is developed by a solo developer, so efficiency and ease of development are critical.

## Decision

We will use **Expo SDK 54** with **React Native 0.81** for mobile development.

## Consequences

### Positive

- **Cross-Platform**: Single codebase for iOS and Android
- **Expo SDK 54**: Latest stable release with modern features
- **Expo Router v3**: File-based routing with deep linking support
- **OTA Updates**: EAS Update for over-the-air updates without app store review
- **Managed Workflow**: Simplified build process with EAS Build
- **Rich Ecosystem**: Access to Expo's library of native modules
- **Development Client**: `expo-dev-client` for development builds
- **Background Location**: `expo-location` + `expo-task-manager` for driver tracking
- **Hot Reload**: Fast refresh for rapid development

### Negative

- **Binary Size**: Larger app size than pure native
- **Limited Native Access**: Some native modules require ejecting or development builds
- **Performance**: Slightly slower than pure native for complex animations
- **Background Location Complexity**: Requires development builds, not supported in Expo Go
- **iOS Restrictions**: Apple review process for App Store submissions

### Neutral

- **JavaScript Bridge**: Communication between JS and native code
- **Metro Bundler**: Standard React Native bundler

## Alternatives Considered

### Alternative 1: Flutter

- **Pros**: High performance, beautiful UI, single codebase
- **Cons**: Dart language (learning curve), smaller ecosystem than React Native
- **Why Rejected**: React Native has larger community, easier to find resources

### Alternative 2: Native Development (Swift/Kotlin)

- **Pros**: Best performance, full access to platform features
- **Cons**: Two separate codebases, longer development time
- **Why Rejected**: Too time-consuming for solo developer, MVP scope

### Alternative 3: Ionic/Capacitor

- **Pros**: Web technologies, easy to learn
- **Cons**: WebView-based, limited native performance
- **Why Rejected**: Need native performance for maps and location tracking

### Alternative 4: PWA (Progressive Web App)

- **Pros**: No app store submission, easy updates
- **Cons**: Limited native features, no background location on iOS
- **Why Rejected**: Background location tracking is essential for driver app

## Key Expo Features Used

| Feature | Package | Purpose |
|---------|---------|---------|
| **Routing** | `expo-router` | File-based navigation |
| **Location** | `expo-location` | GPS tracking |
| **Background Tasks** | `expo-task-manager` | Background location updates |
| **Storage** | `expo-secure-store` | Secure token storage |
| **Notifications** | `expo-notifications` | Push notifications |
| **Images** | `expo-image` | Optimized image loading |
| **Updates** | `expo-updates` | OTA updates |

## Important Note: Expo SDK Version

**We use Expo SDK 54**, the latest stable release as of September 2025 with React Native 0.81 and React 19.

## Development Build Requirement

**Critical**: Background location tracking requires a **development build** or **production build**. It does NOT work in Expo Go.

```bash
# Create development build
bunx eas build --profile development
```

## Related Decisions

- [04-Mobile-App-Technical-Spec.md](../04-Mobile-App-Technical-Spec.md)
- [ADR-005: Use Goong Maps for Vietnam Market](./ADR-005-goong-maps.md)

## Notes

- React 19.0 is used (Expo SDK 54 with React Native 0.81)
- Latest React features available
- Use `expo-dev-client` for development builds
- Test background location on physical devices, not simulators

---

**Date**: 2026-02-09
**Author**: Solo Developer
**Stakeholders**: AI Development Assistant
