// Wildlife observation data types

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
}

export interface WildlifeObservation {
  id: string;
  species: string;
  items: string[]; // Additional items/observations
  enumerator: string; // Person collecting the data
  location: GPSLocation;
  timestamp: Date;
  synced: boolean; // Whether this has been uploaded to GitHub
  syncAttempted?: Date; // Last time we tried to sync
  syncError?: string; // Error message if sync failed
}

export interface OutboxItem {
  observation: WildlifeObservation;
  createdAt: Date;
  retryCount: number;
}

// Common wildlife species for the picker
export const WILDLIFE_SPECIES = [
  'White-tailed Deer',
  'Eastern Gray Squirrel',
  'American Black Bear',
  'Wild Turkey',
  'Eastern Cottontail Rabbit',
  'Red Fox',
  'Coyote',
  'Raccoon',
  'Gray Wolf',
  'Bald Eagle',
  'Great Horned Owl',
  'American Robin',
  'Northern Cardinal',
  'Blue Jay',
  'Eastern Bluebird',
  'Pileated Woodpecker',
  'Downy Woodpecker',
  'American Woodcock',
  'Ruffed Grouse',
  'Common Loon',
  'Canada Goose',
  'Mallard Duck',
  'Wood Duck',
  'American Beaver',
  'North American Porcupine',
  'Striped Skunk',
  'Virginia Opossum',
  'Bobcat',
  'Fisher',
  'Pine Marten',
  'River Otter',
  'Moose',
  'Caribou',
  'Snowshoe Hare',
  'Arctic Hare',
  'Muskox',
  'Polar Bear',
  'Grizzly Bear',
  'Bison',
  'Pronghorn',
  'Bighorn Sheep',
  'Mountain Goat',
  'Elk',
  'Mule Deer',
  'Pronghorn Antelope',
  'Mountain Lion',
  'Black-tailed Prairie Dog',
  'American Badger',
  'Wolverine',
  'Lynx',
  'Other'
] as const;

export type WildlifeSpecies = typeof WILDLIFE_SPECIES[number];
