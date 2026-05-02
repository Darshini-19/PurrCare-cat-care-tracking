/**
 * Broad breed list (CFA / TICA / FIFe / GCCF–style names + domestic types).
 * Not every landrace worldwide — use "Other / not listed" + notes when needed.
 */
const BREEDS_ALPHA = [
  "Abyssinian",
  "Aegean",
  "American Bobtail",
  "American Curl",
  "American Shorthair",
  "American Wirehair",
  "Arabian Mau",
  "Asian (Malayan)",
  "Australian Mist",
  "Balinese",
  "Bambino",
  "Bengal",
  "Birman",
  "Bombay",
  "Brazilian Shorthair",
  "British Longhair",
  "British Shorthair",
  "Burmese",
  "Burmilla",
  "California Spangled",
  "Chantilly-Tiffany",
  "Chartreux",
  "Chausie",
  "Colorpoint Shorthair",
  "Cornish Rex",
  "Cymric",
  "Devon Rex",
  "Donskoy",
  "Dragon Li",
  "Dwelf",
  "Egyptian Mau",
  "European Shorthair",
  "Exotic Shorthair",
  "German Rex",
  "Havana Brown",
  "Highlander",
  "Himalayan",
  "Japanese Bobtail",
  "Javanese",
  "Khao Manee",
  "Korat",
  "Kurilian Bobtail",
  "LaPerm",
  "Lykoi",
  "Maine Coon",
  "Manx",
  "Minskin",
  "Munchkin",
  "Nebelung",
  "Norwegian Forest",
  "Ocicat",
  "Oriental Longhair",
  "Oriental Shorthair",
  "Persian",
  "Peterbald",
  "Pixie-bob",
  "Ragamuffin",
  "Ragdoll",
  "Russian Blue",
  "Savannah",
  "Scottish Fold",
  "Scottish Straight",
  "Selkirk Rex",
  "Serengeti",
  "Siamese",
  "Siberian",
  "Singapura",
  "Snowshoe",
  "Sokoke",
  "Somali",
  "Sphynx",
  "Thai (Old-style Siamese)",
  "Tonkinese",
  "Toyger",
  "Turkish Angora",
  "Turkish Van",
  "Ukrainian Levkoy",
  "York Chocolate",
];

export const CAT_BREEDS_ORDERED = [
  "— Select breed —",
  "Mixed / Domestic shorthair",
  "Mixed / Domestic longhair",
  ...BREEDS_ALPHA,
  "Other / not listed (see notes)",
];

export const GENDERS = ["— Select —", "Female", "Male", "Unknown / prefer not to say"];

export const AGE_OPTIONS = [
  "— Select —",
  "Under 6 months",
  "6–12 months",
  "1–2 years",
  "3–5 years",
  "6–10 years",
  "11–14 years",
  "15+ years",
  "Unknown",
];

export const SLEEP_HOURS_OPTIONS = [
  "— Select —",
  "Under 12 hours / day",
  "12–14 hours / day",
  "14–16 hours / day",
  "16–18 hours / day",
  "18–20 hours / day",
  "20+ hours / day",
  "Varies / not sure",
];

export const FOOD_INTAKE_OPTIONS = [
  "— Select —",
  "Free feeding (dry available at all times)",
  "1× daily (see notes for time)",
  "2× daily — morning & evening",
  "2× daily — morning & night",
  "3× daily — morning, midday, evening",
  "4× daily — small meals",
  "5–6× daily — small portions (e.g. kitten-style)",
  "Wet only — schedule in notes",
  "As prescribed by veterinarian",
  "Other (describe in notes)",
];

export const WATER_CHANGE_OPTIONS = [
  "— Select —",
  "Twice daily",
  "Once daily",
  "Every 2 days",
  "Every 3 days",
  "When bowl is empty or low",
  "Fountain — refill as needed",
  "Other (see notes)",
];

export const LITTER_CHANGE_OPTIONS = [
  "— Select —",
  "Scoop daily; full litter replace weekly",
  "Scoop daily; full replace every 2 weeks",
  "Scoop daily; full replace monthly",
  "Scoop twice daily; full replace weekly",
  "Full clean & replace weekly",
  "Full clean & replace every 2 weeks",
  "Other (see notes)",
];

export const PLAY_TIME_OPTIONS = [
  "— Select —",
  "Under 15 min / day",
  "15–30 min / day",
  "30–45 min / day",
  "45–60 min / day",
  "1–2 hours / day",
  "2+ hours / day",
  "Varies / indoor-outdoor",
];

const PLACEHOLDER_BREED = "— Select breed —";

/** Map saved breed string to a valid <select> value */
export function matchBreedToOption(stored) {
  if (!stored || !String(stored).trim()) return "";
  const t = String(stored).trim();
  if (CAT_BREEDS_ORDERED.includes(t)) return t === PLACEHOLDER_BREED ? "" : t;
  return "Other / not listed (see notes)";
}

export function matchOption(stored, options, placeholder) {
  if (!stored || !String(stored).trim()) return "";
  const t = String(stored).trim();
  if (options.includes(t)) return t === placeholder ? "" : t;
  return "";
}
