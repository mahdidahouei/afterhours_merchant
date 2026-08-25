import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  City,
  ConnectRequest,
  ConnectedRestaurant,
  Platform,
  PlatformGuide,
  Restaurant,
} from "./types";

/**
 * The backend still requires a country to scope its city list, and Afterhours
 * only operates in the Netherlands. Rather than spend a round trip on
 * /countries to look up an id that never changes, it is named here.
 */
const NETHERLANDS_ID = "e346d6db-339d-48d1-b9fa-e93240856902";

export const connectKeys = {
  cities: ["connect", "cities"] as const,
  restaurants: (cityId?: string) => ["connect", "restaurants", cityId] as const,
  platforms: ["connect", "platforms"] as const,
};

/** Cities, already shaped for the <Select>. */
export function useCities() {
  return useQuery({
    queryKey: connectKeys.cities,
    queryFn: async () => {
      const { data } = await api.get<City[]>(`/countries/${NETHERLANDS_ID}/cities`);
      return data.map((city) => ({ value: city.id, label: city.name }));
    },
  });
}

export function useRestaurants(cityId: string | undefined) {
  return useQuery({
    queryKey: connectKeys.restaurants(cityId),
    queryFn: async () => {
      const { data } = await api.get<Restaurant[]>(`/cities/${cityId}/restaurants`);
      return data;
    },
    enabled: Boolean(cityId),
  });
}

export function usePlatforms() {
  return useQuery({
    queryKey: connectKeys.platforms,
    queryFn: async () => {
      const { data } = await api.get<Platform[]>("/reservation-platforms");
      return data;
    },
  });
}

/**
 * Fetched on demand rather than with useQuery: the wizard only advances once
 * the guide has actually arrived, so the call site needs to await it.
 */
export function usePlatformGuide() {
  return useMutation({
    mutationFn: async (platformId: string) => {
      const { data } = await api.get<PlatformGuide>(
        `/reservation-platforms/${platformId}/guide`,
      );
      return data;
    },
  });
}

export function useConnectRestaurant() {
  return useMutation({
    mutationFn: async ({ restaurantId, ...payload }: ConnectRequest) => {
      const { data } = await api.post<ConnectedRestaurant>(
        `/restaurants/${restaurantId}/reservation-platforms/test`,
        payload,
      );
      return data;
    },
  });
}
