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

| API | Purpose | Endpoint | Free Tier |
|-----|---------|----------|-----------|
| **Place Autocomplete** | Address suggestions | `/Place/AutoComplete` | 10,000/day |
| **Place Details** | Get coordinates from place_id | `/Place/Detail` | 10,000/day |
| **Geocoding** | Address → Coordinates | `/Geocode` | 10,000/day |
| **Reverse Geocoding** | Coordinates → Address | `/Geocode` | 10,000/day |
| **Directions** | Route calculation | `/Direction` | 10,000/day |
| **Distance Matrix** | Batch distance calculation | `/DistanceMatrix` | 10,000/day |
| **Map Tiles** | Display maps | `/tiles/{z}/{x}/{y}.png` | 30,000/month |

## Implementation

### Mobile (React Native) - CORRECT IMPLEMENTATION

**IMPORTANT:** Use `UrlTile` component, NOT `urlTemplate` prop:

```typescript
import MapView, { UrlTile, Marker, Polyline } from 'react-native-maps';

// Correct way to use Goong tiles
function DeliveryMap({ markers, route }) {
  return (
    <MapView
      initialRegion={{
        latitude: 10.762622,
        longitude: 106.660172,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      style={{ flex: 1 }}
    >
      {/* Goong Map Tiles - Use UrlTile component */}
      <UrlTile
        urlTemplate="https://tiles.goong.io/tiles/{z}/{x}/{y}.png?api_key={GOONG_MAPTILES_KEY}"
        maximumZ={19}
        minimumZ={1}
        flipY={false}
        tileSize={256}
      />
      
      {/* Markers */}
      {markers.map(marker => (
        <Marker
          key={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
        />
      ))}
      
      {/* Route */}
      {route && (
        <Polyline
          coordinates={route}
          strokeColor="#2196F3"
          strokeWidth={4}
        />
      )}
    </MapView>
  );
}
```

### Address Autocomplete Service

```typescript
// services/GeocodingService.ts
const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GOONG_BASE_URL = 'https://rsapi.goong.io';

export class GeocodingService {
  // Debounced autocomplete (300ms)
  static async autocomplete(input: string, location?: { lat: number; lng: number }) {
    if (!input || input.length < 3) return [];
    
    const params = new URLSearchParams({
      input,
      api_key: GOONG_API_KEY!,
      location: location ? `${location.lat},${location.lng}` : '10.762622,106.660172',
      radius: '50000', // 50km
    });
    
    const response = await fetch(`${GOONG_BASE_URL}/Place/AutoComplete?${params}`);
    const data = await response.json();
    
    return data.predictions.map(p => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text,
      secondaryText: p.structured_formatting?.secondary_text,
    }));
  }
  
  // Get coordinates from place_id
  static async getPlaceDetails(placeId: string) {
    const params = new URLSearchParams({
      place_id: placeId,
      api_key: GOONG_API_KEY!,
    });
    
    const response = await fetch(`${GOONG_BASE_URL}/Place/Detail?${params}`);
    const data = await response.json();
    
    return {
      lat: data.result.geometry.location.lat,
      lng: data.result.geometry.location.lng,
      formattedAddress: data.result.formatted_address,
    };
  }
}
```

### Route/Directions Service

```typescript
// services/RoutingService.ts
export class RoutingService {
  static async getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    vehicle: 'car' | 'bike' | 'taxi' = 'car'
  ) {
    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      vehicle,
      api_key: GOONG_API_KEY!,
    });
    
    const response = await fetch(`${GOONG_BASE_URL}/Direction?${params}`);
    const data = await response.json();
    
    if (data.routes.length === 0) return null;
    
    const route = data.routes[0];
    const leg = route.legs[0];
    
    return {
      distance: leg.distance, // { text: "5.2 km", value: 5200 }
      duration: leg.duration, // { text: "15 mins", value: 900 }
      polyline: route.overview_polyline.points,
      steps: leg.steps.map(step => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        distance: step.distance,
        duration: step.duration,
      })),
    };
  }
  
  // Decode Google polyline
  static decodePolyline(encoded: string) {
    // Implementation for decoding polyline
    // Returns: [{ latitude, longitude }, ...]
  }
}
```

### Web Admin (Next.js)

```typescript
// Using mapbox-gl with Goong tiles
import mapboxgl from 'mapbox-gl';

// Set Goong token (Mapbox-compatible)
mapboxgl.accessToken = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY!;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'https://tiles.goong.io/assets/goong_light_v2.json',
  center: [106.660172, 10.762622], // [lng, lat]
  zoom: 12,
});
```

### Backend (NestJS)

```typescript
// services/GoongService.ts
@Injectable()
export class GoongService {
  private readonly baseUrl = 'https://rsapi.goong.io';
  
  constructor(private config: ConfigService) {}
  
  async geocode(address: string) {
    const response = await fetch(
      `${this.baseUrl}/Geocode?address=${encodeURIComponent(address)}&api_key=${this.apiKey}`
    );
    return response.json();
  }
  
  async calculateDistance(origins: string[], destinations: string[]) {
    const response = await fetch(
      `${this.baseUrl}/DistanceMatrix?origins=${origins.join('|')}&destinations=${destinations.join('|')}&api_key=${this.apiKey}`
    );
    return response.json();
  }
}
```

## API Keys Required

Two separate API keys from Goong (get from https://goong.io/):

1. **Goong API Key** (`EXPO_PUBLIC_GOONG_API_KEY`):
   - Purpose: Geocoding, Directions, Places API
   - Used in: Backend API calls, Mobile service calls
   - Endpoint: `rsapi.goong.io`

2. **Goong MapTiles Key** (`EXPO_PUBLIC_GOONG_MAPTILES_KEY`):
   - Purpose: Map tiles rendering
   - Used in: Mobile maps, Web maps
   - Endpoint: `tiles.goong.io`

## Environment Variables

```bash
# Mobile (.env)
EXPO_PUBLIC_GOONG_API_KEY=your_goong_api_key
EXPO_PUBLIC_GOONG_MAPTILES_KEY=your_goong_maptiles_key

# Web Admin (.env.local)
NEXT_PUBLIC_GOONG_API_KEY=your_goong_api_key
NEXT_PUBLIC_GOONG_MAPTILES_KEY=your_goong_maptiles_key

# Backend (.env)
GOONG_API_KEY=your_goong_api_key
```

## Caching Strategy

To reduce API calls and improve performance:

```typescript
// Cache geocoding results (1 hour TTL)
const geocodeCache = new Map();

async function geocodeWithCache(address: string) {
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address);
  }
  
  const result = await geocode(address);
  geocodeCache.set(address, result);
  
  // Auto-expire after 1 hour
  setTimeout(() => geocodeCache.delete(address), 3600000);
  
  return result;
}
```

## Related Decisions

- [ADR-004: Use Expo + React Native for Mobile](./ADR-004-expo-react-native.md)
- [04-Mobile-App-Technical-Spec.md](../04-Mobile-App-Technical-Spec.md)

## Notes

- Goong API is Vietnam-focused but supports other countries
- Free tier: 10,000 requests/day for most APIs (equivalent to ~$2100/month savings vs Google Maps)
- **IMPORTANT**: Use `UrlTile` component for map tiles, NOT `urlTemplate` prop
- Consider caching geocoding results to reduce API calls (1-hour TTL recommended)
- Use Goong's autocomplete for address search with Vietnamese language support
- **Common Mistake**: Don't forget to add `flipY={false}` prop to UrlTile for correct tile orientation

## Limitations

1. **Documentation**: Primarily in Vietnamese, limited English resources
2. **Real-time Traffic**: Not as accurate as Google Maps
3. **Global Coverage**: Limited outside Vietnam (not an issue for this project)
4. **API Stability**: No published SLA, monitor for downtime

## Related Documentation

- [04-Mobile-App-Technical-Spec.md](../04-Mobile-App-Technical-Spec.md) - Mobile implementation details
- [Location Services Guide](../guides/location-services.md) - Background tracking setup
- [Goong Documentation](https://document.goong.io/) - Official API docs

---

**Date**: 2026-02-09  
**Last Updated**: 2026-02-09  
**Author**: Solo Developer  
**Stakeholders**: AI Development Assistant
