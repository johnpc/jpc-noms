/**
 * Seed places (DATA, not logic — exempt from the line/CRAP gates). Each is a
 * GooglePlace shape stored in GoogleApiCache under its id, so guest browsing +
 * e2e assert on real, stable restaurant data without a live Google call.
 */
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
  },
] as const;
