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
- Want local payment options (VND)
- Building delivery/logistics apps with Vietnam-specific routing

**Don't use when:**
- Targeting global markets (use Google Maps or Mapbox)
- Need advanced GIS features (use PostGIS)
- Building simple apps without map visualization

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

Create reusable service for Goong API calls:

```typescript
// src/services/goong.service.ts
const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GOONG_BASE_URL = 'https://rsapi.goong.io';

interface GoongPlace {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  geometry: {
    location: { lat: number; lng: number };
  };
}

interface GoongRoute {
  legs: Array<{
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    steps: Array<{
      polyline: { points: string };
      distance: { value: number };
      duration: { value: number };
    }>;
  }>;
  overview_polyline: { points: string };
}

export const goongService = {
  /**
   * Autocomplete places search
   */
  async autocomplete(
    input: string, 
    location?: { lat: number; lng: number }
  ): Promise<GoongPlace[]> {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY!,
      input,
      radius: '50000', // 50km radius
      more_compound: 'true',
    });

    if (location) {
      params.append('location', `${location.lat},${location.lng}`);
    }

    const response = await fetch(
      `${GOONG_BASE_URL}/Place/AutoComplete?${params}`
    );
    const data = await response.json();
    return data.predictions || [];
  },

  /**
   * Get place details by place_id
   */
  async getPlaceDetail(placeId: string): Promise<GoongPlace | null> {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY!,
      place_id: placeId,
    });

    const response = await fetch(
      `${GOONG_BASE_URL}/Place/Detail?${params}`
    );
    const data = await response.json();
    return data.result || null;
  },

  /**
   * Reverse geocode (coordinates to address)
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY!,
      latlng: `${lat},${lng}`,
    });

    const response = await fetch(
      `${GOONG_BASE_URL}/Geocode?${params}`
    );
    const data = await response.json();
    
    if (data.results?.length > 0) {
      return data.results[0].formatted_address;
    }
    return 'Unknown location';
  },

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    vehicle: 'bike' | 'car' | 'taxi' = 'bike'
  ): Promise<GoongRoute | null> {
    const params = new URLSearchParams({
      api_key: GOONG_API_KEY!,
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      vehicle,
    });

    const response = await fetch(
      `${GOONG_BASE_URL}/Direction?${params}`
    );
    const data = await response.json();
    
    if (data.routes?.length > 0) {
      return data.routes[0];
    }
    return null;
  },

  /**
   * Decode polyline from directions
   */
  decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
    const points: Array<{ latitude: number; longitude: number }> = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  },
};
```

### Pattern 2: Place Autocomplete Component

React Native autocomplete input:

```typescript
// src/components/maps/GoongPlaceAutocomplete.tsx
import { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator 
} from 'react-native';
import { goongService } from '@/services/goong.service';

interface Props {
  placeholder?: string;
  onPlaceSelect: (place: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
  currentLocation?: { lat: number; lng: number };
}

export function GoongPlaceAutocomplete({ 
  placeholder = 'Nhập địa chỉ...', 
  onPlaceSelect,
  currentLocation 
}: Props) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.length < 3) {
      setPredictions([]);
      return;
    }

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

    // Get place details for coordinates
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
          placeholderTextColor="#9CA3AF"
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

Get directions and display route on map:

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
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{
    latitude: number;
    longitude: number;
  }>>([]);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');

  useEffect(() => {
    fetchRoute();
  }, [origin, destination]);

  const fetchRoute = async () => {
    const route = await goongService.getDirections(origin, destination, 'bike');
    
    if (route) {
      // Decode polyline
      const coordinates = goongService.decodePolyline(
        route.overview_polyline.points
      );
      setRouteCoordinates(coordinates);
      
      // Get distance and duration
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
        {/* Origin marker */}
        <Marker
          coordinate={{ latitude: origin.lat, longitude: origin.lng }}
          title="Điểm đi"
          pinColor="green"
        />

        {/* Destination marker */}
        <Marker
          coordinate={{ latitude: destination.lat, longitude: destination.lng }}
          title="Điểm đến"
          pinColor="red"
        />

        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#4F46E5"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Route info */}
      <View className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-xl shadow-lg">
        <Text className="text-lg font-bold">Thông tin tuyến đường</Text>
        <Text className="text-gray-600">Khoảng cách: {distance}</Text>
        <Text className="text-gray-600">Thời gian: {duration}</Text>
      </View>
    </View>
  );
}
```

### Pattern 4: Web Map with Goong Tiles

Use Goong map tiles in web admin dashboard:

```typescript
// apps/admin/src/components/maps/GoongMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const GOONG_MAPTILES_KEY = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY;

interface Props {
  center: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: Array<{
    id: string;
    lng: number;
    lat: number;
    color?: string;
  }>;
}

export function GoongMap({ center, zoom = 14, markers = [] }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAPTILES_KEY}`,
      center,
      zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers
  useEffect(() => {
    if (!map.current) return;

    markers.forEach((marker) => {
      new mapboxgl.Marker({ color: marker.color || '#4F46E5' })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map.current!);
    });
  }, [markers]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
```

### Pattern 5: Price Calculation Hook

Calculate delivery price based on distance:

```typescript
// src/hooks/useDeliveryPrice.ts
import { useState, useCallback } from 'react';
import { goongService } from '@/services/goong.service';

interface PriceResult {
  distance: number;  // meters
  duration: number;  // seconds
  price: number;     // VND
}

const BASE_PRICE = 10000;    // 10,000 VND
const PRICE_PER_KM = 5000;   // 5,000 VND per km

export function useDeliveryPrice() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = useCallback(async (
    pickup: { lat: number; lng: number },
    dropoff: { lat: number; lng: number }
  ): Promise<PriceResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const route = await goongService.getDirections(pickup, dropoff, 'bike');
      
      if (!route) {
        setError('Không thể tính toán tuyến đường');
        return null;
      }

      const leg = route.legs[0];
      const distanceKm = leg.distance.value / 1000;
      
      // Calculate price
      const price = Math.ceil(distanceKm) * PRICE_PER_KM + BASE_PRICE;

      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
        price,
      };
    } catch (err) {
      setError('Lỗi tính toán giá');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { calculatePrice, isLoading, error };
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
- **react-native-best-practices** - Mobile performance
