/**
 * Seed places (DATA, not logic — exempt from the line/CRAP gates). Each is a
 * GooglePlace shape stored in GoogleApiCache under its id, so guest browsing +
 * e2e assert on real, stable restaurant data without a live Google call.
 */
// Same hours every day so e2e can assert "Today: …" no matter which weekday
// the suite runs (weekdayDescriptions is Monday-first, matching Google).
const ALL_WEEK_HOURS = {
  weekdayDescriptions: [
    'Monday: 11:00 AM – 9:00 PM',
    'Tuesday: 11:00 AM – 9:00 PM',
    'Wednesday: 11:00 AM – 9:00 PM',
    'Thursday: 11:00 AM – 9:00 PM',
    'Friday: 11:00 AM – 9:00 PM',
    'Saturday: 11:00 AM – 9:00 PM',
    'Sunday: 11:00 AM – 9:00 PM',
  ],
};

export const SEEDED_PLACES = [
  {
    id: 'seed-zingermans',
    name: 'places/seed-zingermans',
    photos: [],
    websiteUri: 'https://www.zingermansdeli.com',
    formattedAddress: '422 Detroit St, Ann Arbor, MI 48104',
    priceLevel: 'PRICE_LEVEL_MODERATE',
    displayName: { text: "Zingerman's Delicatessen", languageCode: 'en' },
    editorialSummary: {
      text: 'Iconic deli with sandwiches, breads, and cheeses.',
      languageCode: 'en',
    },
    regularOpeningHours: ALL_WEEK_HOURS,
  },
  {
    id: 'seed-frita-batidos',
    name: 'places/seed-frita-batidos',
    photos: [],
    websiteUri: 'https://www.fritabatidos.com',
    formattedAddress: '117 W Washington St, Ann Arbor, MI 48104',
    priceLevel: 'PRICE_LEVEL_INEXPENSIVE',
    displayName: { text: 'Frita Batidos', languageCode: 'en' },
    editorialSummary: { text: 'Cuban-inspired street food and milkshakes.', languageCode: 'en' },
    regularOpeningHours: ALL_WEEK_HOURS,
  },
  {
    id: 'seed-jolly-pumpkin',
    name: 'places/seed-jolly-pumpkin',
    photos: [],
    websiteUri: 'https://www.jollypumpkin.com',
    formattedAddress: '311 S Main St, Ann Arbor, MI 48104',
    priceLevel: 'PRICE_LEVEL_MODERATE',
    displayName: { text: 'Jolly Pumpkin Café & Brewery', languageCode: 'en' },
    editorialSummary: {
      text: 'Sour ales and wood-fired fare in a rustic setting.',
      languageCode: 'en',
    },
    regularOpeningHours: ALL_WEEK_HOURS,
  },
] as const;
