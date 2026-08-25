/** The reservation systems Afterhours integrates with. */
export type PlatformKey = "guestplan" | "formitable" | "gotable";

export type Platform = {
  id: string;
  name: PlatformKey;
  iconUrl: string;
};

/** The one credential a given guide step asks the user for. */
export type GuideField = {
  field: "account_id" | "apikey";
  placeholder: string;
};

export type GuideStep = {
  step: number;
  title: string;
  /** Markdown bullets, rendered as a numbered list. */
  body: string[];
  need?: GuideField;
  video: string;
};

export type PlatformGuide = {
  name: string;
  iconUrl: string;
  steps: GuideStep[];
};

export type Restaurant = {
  id: string;
  name: string;
  address: string;
  claimed: boolean;
  /** True when this restaurant already has a platform connected. */
  connect: boolean;
};

export type City = {
  id: string;
  name: string;
};

/** Payload for the final connect call. */
export type ConnectRequest = {
  restaurantId: string;
  platformId: string;
  apikey?: string;
  inplatformId?: string;
};

/** The restaurant card the API echoes back on a successful connection. */
export type ConnectedRestaurant = {
  id: string;
  name: string;
  label: string;
  cuisinse: string;
  neighbourhood: string;
  priceRange: string;
  rating: number;
  reservable: string;
  vibes: string | null;
  thumbnailPhoto: {
    id: string;
    priority: number;
    sizes: Partial<Record<"256" | "512" | "original", string>>;
  } | null;
};
