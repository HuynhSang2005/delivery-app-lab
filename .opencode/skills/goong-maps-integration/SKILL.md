---
name: goong-maps-integration
description: Use when integrating Goong Maps for Vietnam market, including place autocomplete, geocoding, directions API, and map tiles for React Native and web applications.
---

# Goong Maps Integration

## Overview

Production-ready patterns for integrating Goong Maps in Vietnam market. Covers place autocomplete, geocoding, directions API, and map tiles for both React Native and web applications.

## When to Use

**Use this skill when:**
- Building apps for Vietnam market (Goong Maps has better local data)
- Google Maps billing is blocked in your region
- Need Vietnamese address format support
- Building delivery/logistics apps with Vietnam-specific routing

**Don't use when:**
- Targeting global markets (use Google Maps or Mapbox)
- Need advanced GIS features (use PostGIS)

## Why Goong Maps?

| Feature | Goong Maps | Google Maps |
|---------|------------|-------------|
| **Vietnam Support** | Native, optimized | Limited |
| **Billing** | VND payments, local bank | Often blocked in VN |
| **Data Quality** | Excellent in Vietnam | Good, some gaps |
| **Pricing** | Competitive for VN market | Expensive |
| **Geocoding** | Vietnamese address format | Mixed results |
| **Routing** | Vietnam road network | Good |

## Core Patterns

### Pattern 1: Goong Service Setup

```typescript
// src/services/goong.service.ts
const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GOONG_BASE_URL = 'https://rsapi.goong.io';

interface GoongPlace {
  place_id: string;
  description: string;
  structured_formatting: { main_text: string; secondary_text: string };
  geometry: { location: { lat: number; lng: number } };
}

interface GoongRoute {
  legs: Array{
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    steps: Array{ polyline: { points: string } };
  };
  overview_polyline: { points: string };
}

export const goongService = {
  async autocomplete(
    input: string, 
    location?: { lat: number; lng: number }
  ): Promise{
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY!,
      input,
      radius: '50000',
      more_compound: 'true',
    });
    if (location) params.append('location', `${location.lat},${location.lng}`);

    const response = await fetch(
      `${GOONG_BASE_URL}/Place/AutoComplete?${params}`
    );
    const data = await response.json();
    return data.predictions || [];
  },

  async getPlaceDetail(placeId: string): Promise{
    const params = new URLSearchParams({ api_key: GOONG_API_KEY!, place_id: placeId });
    const response = await fetch(`${GOONG_BASE_URL}/Place/Detail?${params}`);
    const data = await response.json();
    return data.result || null;
  },

  async reverseGeocode(lat: number, lng: number): Promise{
    const params = new URLSearchParams({ api_key: GOONG_API_KEY!, latlng: `${lat},${lng}` });
    const response = await fetch(`${GOONG_BASE_URL}/Geocode?${params}`);
    const data = await response.json();
    return data.results?.[0]?.formatted_address || 'Unknown location';
  },

  async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    vehicle: 'bike' | 'car' | 'taxi' = 'bike'
  ): Promise{
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY!,
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      vehicle,
    });
    const response = await fetch(`${GOONG_BASE_URL}/Direction?${params}`);
    const data = await response.json();
    return data.routes?.[0] || null;
  },

  decodePolyline(encoded: string): Array{
    const points: Array = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let shift = 0, result = 0, byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0; result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  },
};
```

### Pattern 2: Place Autocomplete Component

```typescript
// src/components/maps/GoongPlaceAutocomplete.tsx
import { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { goongService } from '@/services/goong.service';

interface Props {
  placeholder?: string;
  onPlaceSelect: (place: { address: string; lat: number; lng: number }) => void;
  currentLocation?: { lat: number; lng: number };
}

export function GoongPlaceAutocomplete({ 
  placeholder = 'Nhập địa chỉ...', 
  onPlaceSelect,
  currentLocation 
}: Props) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) { setPredictions([]); return; }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await goongService.autocomplete(query, currentLocation);
        setPredictions(results);
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentLocation]);

  const handleSelect = async (prediction: any) => {
    setQuery(prediction.description);
    setPredictions([]);
    const detail = await goongService.getPlaceDetail(prediction.place_id);
    if (detail?.geometry?.location) {
      onPlaceSelect({
        address: prediction.description,
        lat: detail.geometry.location.lat,
        lng: detail.geometry.location.lng,
      });
    }
  };

  return (
    <View className="relative">
      <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4">
        <TextInput
          className="flex-1 py-3 text-base"
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
        />
        {isLoading && <ActivityIndicator size="small" color="#6366F1" />}
      </View>

      {predictions.length > 0 && (
        <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-2 shadow-lg z-50 max-h-60">
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="px-4 py-3 border-b border-gray-100"
                onPress={() => handleSelect(item)}
              >
                <Text className="font-medium text-gray-900">
                  {item.structured_formatting.main_text}
                </Text>
                <Text className="text-sm text-gray-500" numberOfLines={1}>
                  {item.structured_formatting.secondary_text}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}
```

### Pattern 3: Directions with Route Display

```typescript
// src/components/maps/RouteMap.tsx
import { useEffect, useState } from 'react';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { goongService } from '@/services/goong.service';

interface Props {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}

export function RouteMap({ origin, destination }: Props) {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    fetchRoute();
  }, [origin, destination]);

  const fetchRoute = async () => {
    const route = await goongService.getDirections(origin, destination, 'bike');
    if (route) {
      const coordinates = goongService.decodePolyline(route.overview_polyline.points);
      setRouteCoordinates(coordinates);
      const leg = route.legs[0];
      setDistance(leg.distance.text);
      setDuration(leg.duration.text);
    }
  };

  return (
    <View className="flex-1">
      <MapView
        className="flex-1"
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: origin.lat,
          longitude: origin.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={{ latitude: origin.lat, longitude: origin.lng }} title="Điểm đi" pinColor="green" />
        <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }} title="Điểm đến" pinColor="red" />
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeColor="#4F46E5" strokeWidth={4} />
        )}
      </MapView>

      <View className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-lg">
        <Text className="text-lg font-bold">Thông tin tuyến đường</Text>
        <Text className="text-gray-600">Khoảng cách: {distance}</Text>
        <Text className="text-gray-600">Thờigian: {duration}</Text>
      </View>
    </View>
  );
}
```

## Quick Reference

| API | Endpoint | Use Case |
|-----|----------|----------|
| Autocomplete | `/Place/AutoComplete` | Address search |
| Place Detail | `/Place/Detail` | Get coordinates from place_id |
| Geocode | `/Geocode` | Reverse geocoding |
| Directions | `/Direction` | Route calculation |
| Map Tiles | `/tiles/goong_map_web.json` | Web map display |

## Environment Variables

```bash
# React Native (.env)
EXPO_PUBLIC_GOONG_API_KEY=your_api_key

# Web/Next.js (.env.local)
NEXT_PUBLIC_GOONG_API_KEY=your_api_key
NEXT_PUBLIC_GOONG_MAPTILES_KEY=your_maptiles_key
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Wrong coordinate order | Goong uses `lat,lng` in most APIs |
| No location bias | Pass `location` param for better results |
| Not decoding polyline | Use provided decode function |
| Missing API key | Add key to all requests |
| Wrong vehicle type | Use 'bike' for motorbikes in Vietnam |

## Dependencies

```json
{
  "dependencies": {
    "react-native-maps": "1.18.0",
    "mapbox-gl": "^3.0.0"
  }
}
```

## Getting API Keys

1. Sign up at [https://goong.io](https://goong.io)
2. Create a new project
3. Get API Key for REST APIs
4. Get Map Tiles Key for map display

## Related Skills

- **postgis-patterns** - Server-side geospatial storage
- **expo-location-patterns** - Getting device location
