/** Tappable cuisine suggestions for the search page (like jpc-eats). Data, not
 * logic — a click just sets the search term. */
export const SEARCH_SUGGESTIONS = [
  'Pizza',
  'Sushi',
  'Tacos',
  'Italian food',
  'Chinese food',
  'Sandwiches',
  'Burgers',
  'Thai food',
  'Indian food',
  'Mexican food',
  'Breakfast',
  'Coffee',
  'Dessert',
  'Vegan food',
  'Bars',
] as const;

/** The default query shown on first load (before the user types). */
export const DEFAULT_QUERY = 'food';
