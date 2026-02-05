# ADR-005: Use Goong Maps for Vietnam Market

## Status

- **Accepted**

## Context

We needed to choose a maps and location service for Logship-MVP. The app operates in **Vietnam**, which has specific requirements:
- Accurate geocoding and address search for Vietnamese addresses
- Local routing optimized for Vietnamese traffic conditions
- Cost-effective pricing for startup/MVP stage
- Support for Vietnamese language in place names
- Reliable service within Vietnam

The app needs maps for:
- Displaying pickup/dropoff locations
- Real-time driver tracking
- Route visualization
- Address autocomplete

## Decision

We will use **Goong Maps** as the primary maps service.

## Consequences

### Positive

- **Vietnam-Optimized**: Specifically designed for Vietnamese market
- **Accurate Geocoding**: Better address parsing for Vietnamese addresses
- **Competitive Pricing**: More affordable than Google Maps for high volume
- **Local Support**: Vietnamese company with local support
- **Mapbox GL Compatible**: Uses same API as Mapbox, easy to integrate
- **Vietnamese Language**: Native support for Vietnamese place names
- **Multiple APIs**: Geocoding, Directions, Places, Map Tiles

### Negative

- **Limited Global Coverage**: Primarily focused on Vietnam
- **Smaller Ecosystem**: Fewer resources compared to Google Maps
- **Newer Service**: Less mature than Google Maps
- **Documentation**: Documentation primarily in Vietnamese

### Neutral

- **API Key Required**: Separate API key from other services
- **Usage Limits**: Free tier available, paid tiers for higher volume

## Alternatives Considered

### Alternative 1: Google Maps Platform

- **Pros**: Global coverage, comprehensive features, excellent documentation
- **Cons**: Expensive for high volume, credit card required, billing complexity
- **Why Rejected**: Cost concerns for MVP stage, Goong offers better value for Vietnam

### Alternative 2: Mapbox

- **Pros**: Beautiful maps, powerful customization, good documentation
- **Cons**: Expensive for high volume, not optimized for Vietnam
- **Why Rejected**: Goong uses Mapbox GL compatible API but with Vietnam optimization

### Alternative 3: OpenStreetMap (OSM)

- **Pros**: Free, open-source, no API keys
- **Cons**: Requires self-hosting or third-party providers, less reliable
- **Why Rejected**: Need reliable managed service for production

### Alternative 4: Here Maps

- **Pros**: Enterprise-grade, good routing
- **Cons**: Complex pricing, not optimized for Vietnam
- **Why Rejected**: Overkill for MVP, Goong better suited for local market

## Goong APIs Used

| API | Purpose | Endpoint |
|-----|---------|----------|
| **Geocoding** | Convert address to coordinates | `/Place/AutoComplete` |
| **Directions** | Route calculation | `/Direction` |
| **Map Tiles** | Display maps | Map tiles URL |
| **Places** | Place search and details | `/Place/Detail` |

## Implementation

### Mobile (React Native)
```typescript
// Using react-native-maps with Goong tiles
<MapView
  provider={PROVIDER_DEFAULT}
  urlTemplate="https://tiles.goong.io/tiles/{z}/{x}/{y}.png?api_key=YOUR_KEY"
/>
```

### Web Admin (Next.js)
```typescript
// Using mapbox-gl with Goong tiles
mapboxgl.accessToken = 'YOUR_GOONG_MAPTILES_KEY';
```

### Backend (NestJS)
```typescript
// Goong API for geocoding
const response = await fetch(
  `https://rsapi.goong.io/Place/AutoComplete?api_key=${key}&input=${query}`
);
```

## API Keys Required

Two separate API keys from Goong:
1. **Goong API Key**: For geocoding, directions, places API
2. **Goong MapTiles Key**: For map tiles (used in map rendering)

## Related Decisions

- [ADR-004: Use Expo + React Native for Mobile](./ADR-004-expo-react-native.md)
- [04-Mobile-App-Technical-Spec.md](../04-Mobile-App-Technical-Spec.md)

## Notes

- Goong API is Vietnam-focused but supports other countries
- Free tier: 10,000 requests/day for most APIs
- Consider caching geocoding results to reduce API calls
- Use Goong's autocomplete for address search with Vietnamese language support

---

**Date**: 2025-02-03
**Author**: Solo Developer
**Stakeholders**: AI Development Assistant
