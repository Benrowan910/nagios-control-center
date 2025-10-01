export interface NInstance {
  id: string;
  name: string;           // Canonical XI instance name
  url: string;            // API URL
  apiKey: string;        // API key (if using API authentication)
  username?: string;      // Username (if using basic auth)
  password?: string;      // Password (if using basic auth)
  nickname?: string;      // Friendly display name
  purpose?: string;       // What this XI monitors
  location?: string;      // Location for weather data
  latitude?: number;      // Latitude for weather
  longitude?: number;     // Longitude for weather
  authenticated: boolean; // Whether instance is authenticated
}

export let INSTANCES: NInstance[] = [
  // Start with empty array, instances will be added through UI
];