/** Shared types for the search + place UI. */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PlaceText {
  text?: string | null;
  languageCode?: string | null;
}

/** The GooglePlace shape returned by the search/detail resolvers. */
export interface Place {
  id: string;
  name: string;
  photos?: (string | null)[] | null;
  websiteUri?: string | null;
  formattedAddress?: string | null;
  priceLevel?: string | null;
  displayName: PlaceText;
  primaryTypeDisplayName?: PlaceText | null;
  generativeSummary?: PlaceText | null;
  editorialSummary?: PlaceText | null;
}
