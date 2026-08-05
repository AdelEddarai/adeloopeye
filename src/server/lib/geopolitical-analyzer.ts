/**
 * Comprehensive Geopolitical Relationship Analyzer
 * Analyzes all types of country-to-country relationships from live news:
 * - Military conflicts & war alerts (active + coming wars)
 * - Ceasefires, diplomatic tensions & agreements
 * - Trade routes, economic partnerships & investment flows
 * - Supply chains, logistics crises & new logistics plans
 * - Energy dependencies, migration flows, military deployments
 * - Border closures & blockades
 *
 * Uses multi-word country detection + flexible alias matching so that
 * "US strikes Iran", "Tehran hit by airstrike", "America and Russia
 * tensions" all resolve to the same canonical country pairs.
 */

import type { NewsArticle } from './api-clients/newsapi-client';

export type RelationshipType =
  // Negative / kinetic
  | 'MILITARY_CONFLICT'        // Active fighting, strikes, assaults
  | 'WAR_ALERT'                // Imminent / threatened / coming war
  | 'DIPLOMATIC_TENSION'       // Sanctions, condemnations, broken ties
  | 'MILITARY_DEPLOYMENT'      // Troops, warships, build-ups
  | 'BORDER_CLOSURE'           // Border/port/airspace closures, blockades
  | 'LOGISTICS_CRISIS'         // Shipping/trade/supply disruptions
  // Neutral / positive
  | 'CEASEFIRE'                // Ceasefire / truce / halted hostilities
  | 'DIPLOMATIC_AGREEMENT'     // Peace deals, normalization, prisoner swaps
  | 'LOGISTICS_PLAN'           // New corridors, rail/road/port links
  | 'TRADE_ROUTE'              // Goods flowing between countries
  | 'ECONOMIC_PARTNERSHIP'     // Investment, aid, cooperation
  | 'ALLIANCE'                 // Defense pacts, alliances, mutual support
  | 'SUPPLY_CHAIN'             // Manufacturing / supply links
  | 'ENERGY_DEPENDENCY'        // Oil/gas flows & dependency
  | 'MIGRATION_FLOW';          // Refugees, migrants, border crossings

export type GeopoliticalRelationship = {
  id: string;
  sourceCountry: string;
  targetCountry: string;
  sourcePosition: [number, number];
  targetPosition: [number, number];
  intensity: number; // 1-10
  type: RelationshipType;
  description: string;
  timestamp: string;
  articles: string[]; // URLs
  bidirectional?: boolean; // For trade, alliances, etc.
};

// Country coordinates (capitals) - EXPANDED WORLDWIDE
export const COUNTRY_COORDS: Record<string, [number, number]> = {
  // Middle East
  'Iran': [51.3890, 35.6892],
  'Israel': [35.2137, 31.7683],
  'Syria': [36.2765, 33.5138],
  'Lebanon': [35.4955, 33.8886],
  'Iraq': [44.3661, 33.3152],
  'Yemen': [44.2075, 15.5527],
  'Saudi Arabia': [46.6753, 24.7136],
  'Turkey': [32.8597, 39.9334],
  'Egypt': [31.2357, 30.0444],
  'Jordan': [35.9239, 31.9454],
  'UAE': [54.3773, 24.4539],
  'Qatar': [51.5310, 25.2854],
  'Kuwait': [47.9774, 29.3759],
  'Bahrain': [50.5577, 26.0667],
  'Oman': [58.4059, 23.5880],
  'Afghanistan': [69.2075, 34.5553],
  'Pakistan': [73.0479, 33.6844],
  'Gaza': [34.2804, 31.4167],
  'Western Sahara': [-13.0, 24.0],

  // Major Powers
  'United States': [-77.0369, 38.9072],
  'Russia': [37.6173, 55.7558],
  'China': [116.4074, 39.9042],

  // Europe
  'UK': [-0.1278, 51.5074],
  'France': [2.3522, 48.8566],
  'Germany': [13.4050, 52.5200],
  'Italy': [12.4964, 41.9028],
  'Spain': [-3.7038, 40.4168],
  'Poland': [21.0122, 52.2297],
  'Ukraine': [30.5234, 50.4501],
  'Netherlands': [4.8952, 52.3702],
  'Belgium': [4.3517, 50.8503],
  'Greece': [23.7275, 37.9838],
  'Norway': [10.7522, 59.9139],
  'Sweden': [18.0686, 59.3293],
  'Finland': [24.9384, 60.1699],
  'Belarus': [27.5618, 53.9045],
  'Romania': [26.1025, 44.4268],
  'Hungary': [19.0402, 47.4979],
  'Serbia': [20.4651, 44.7866],
  'Czechia': [14.4378, 50.0755],
  'Austria': [16.3738, 48.2082],
  'Switzerland': [7.4474, 46.9480],
  'Denmark': [12.5683, 55.6761],
  'Ireland': [-6.2603, 53.3498],
  'Portugal': [-9.1393, 38.7223],
  'Lithuania': [25.2797, 54.6872],
  'Latvia': [24.1052, 56.9496],
  'Estonia': [24.7536, 59.4370],
  'Croatia': [15.9819, 45.8150],
  'Bulgaria': [23.3219, 42.6977],
  'Slovakia': [17.1077, 48.1486],
  'Moldova': [28.8638, 47.0105],
  'Georgia': [44.8271, 41.7151],
  'Armenia': [44.5136, 40.1872],
  'Azerbaijan': [49.8671, 40.4093],

  // Asia-Pacific
  'India': [77.2090, 28.6139],
  'Japan': [139.6917, 35.6762],
  'South Korea': [126.9780, 37.5665],
  'North Korea': [125.7625, 39.0392],
  'Taiwan': [121.5654, 25.0330],
  'Vietnam': [105.8342, 21.0278],
  'Thailand': [100.5018, 13.7563],
  'Philippines': [120.9842, 14.5995],
  'Indonesia': [106.8456, -6.2088],
  'Malaysia': [101.6869, 3.1390],
  'Singapore': [103.8198, 1.3521],
  'Australia': [149.1300, -35.2809],
  'New Zealand': [174.7633, -41.2865],
  'Bangladesh': [90.4125, 23.8103],
  'Myanmar': [96.1561, 16.8661],
  'Cambodia': [104.8910, 11.5564],
  'Laos': [102.6345, 17.9757],
  'Sri Lanka': [79.8612, 6.9271],
  'Nepal': [85.3240, 27.7172],
  'Kazakhstan': [71.4704, 51.1605],
  'Mongolia': [106.9056, 47.8864],
  'Uzbekistan': [69.2401, 41.2995],

  // Americas
  'Canada': [-75.6972, 45.4215],
  'Mexico': [-99.1332, 19.4326],
  'Brazil': [-47.8825, -15.7942],
  'Argentina': [-58.3816, -34.6037],
  'Venezuela': [-66.9036, 10.4806],
  'Cuba': [-82.3666, 23.1136],
  'Colombia': [-74.0721, 4.7110],
  'Chile': [-70.6693, -33.4489],
  'Peru': [-77.0428, -12.0464],
  'Ecuador': [-78.5240, -0.2202],
  'Bolivia': [-68.1193, -16.5000],
  'Paraguay': [-57.6332, -25.2744],
  'Uruguay': [-56.1882, -34.9011],

  // Africa
  'Libya': [13.1913, 32.8872],
  'Sudan': [32.5599, 15.5007],
  'Ethiopia': [38.7469, 9.0320],
  'Somalia': [45.3182, 2.0469],
  'Nigeria': [7.5629, 9.0765],
  'South Africa': [28.0473, -26.2041],
  'Kenya': [36.8219, -1.2921],
  'Algeria': [3.0588, 36.7538],
  'Morocco': [-6.8498, 33.9716],
  'Tunisia': [10.1815, 36.8065],
  'Ghana': [-0.1870, 5.6037],
  'Niger': [2.1130, 13.5116],
  'Mali': [-8.0027, 12.6392],
  'Chad': [15.0557, 12.1348],
  'DR Congo': [15.2663, -4.4419],
  'Tanzania': [35.7383, -6.7924],
  'Uganda': [32.5825, 0.3476],
  'Mozambique': [32.5732, -25.9655],
  'Angola': [13.2344, -8.8147],
  'Ivory Coast': [-4.0097, 5.3453],
  'Cameroon': [11.5021, 3.8480],
  'Senegal': [-17.4381, 14.6928],
  'Mauritania': [-15.9593, 18.0787],
};

// Country aliases → canonical country name (lowercased keys).
// Enables "US", "USA", "America", "Washington" → United States, etc.
const COUNTRY_ALIASES: Record<string, string[]> = {
  'United States': ['us', 'usa', 'america', 'american', 'u.s.', 'washington', 'white house', 'pentagon', 'centcom', 'us military', 'us forces', 'us navy'],
  'Iran': ['iranian', 'tehran', 'irgc', 'islamic republic', 'persia'],
  'Israel': ['israeli', 'idf', 'tel aviv', 'jerusalem', 'netanyahu'],
  'Syria': ['syrian', 'damascus', 'assad'],
  'Lebanon': ['lebanese', 'beirut', 'hezbollah'],
  'Iraq': ['iraqi', 'baghdad', 'kurds', 'kurdistan'],
  'Yemen': ['yemeni', 'houthi', 'houthis', 'sanaa', 'ansar allah', 'ansarallah'],
  'Saudi Arabia': ['saudi', 'saudis', 'riyadh', 'saudi aramco'],
  'Turkey': ['turkish', 'ankara', 'erdogan', 'türkiye'],
  'Egypt': ['egyptian', 'cairo', 'sisi'],
  'Jordan': ['jordanian', 'amman'],
  'UAE': ['emirati', 'abu dhabi', 'dubai'],
  'Qatar': ['qatari', 'doha'],
  'Kuwait': ['kuwaiti', 'kuwait city'],
  'Bahrain': ['bahraini', 'manama'],
  'Oman': ['omani', 'muscat'],
  'Afghanistan': ['afghan', 'afghans', 'kabul', 'taliban'],
  'Pakistan': ['pakistani', 'islamabad', 'karachi'],
  'Gaza': ['palestine', 'palestinian', 'palestinians', 'hamas', 'gazan', 'gaza strip'],
  'Western Sahara': ['western sahara', 'polisario', 'sahrawi', 'laayoune', 'moroccan sahara'],

  'Russia': ['russian', 'russians', 'moscow', 'putin', 'kremlin'],
  'China': ['chinese', 'beijing', 'xi jinping', 'pla', 'peoples republic'],

  'UK': ['britain', 'british', 'london', 'u.k.', 'england', 'united kingdom', 'british army'],
  'France': ['french', 'paris', 'macron'],
  'Germany': ['german', 'berlin', 'merkel', 'scholz'],
  'Italy': ['italian', 'rome', 'milan'],
  'Spain': ['spanish', 'madrid', 'catalonia'],
  'Poland': ['polish', 'warsaw'],
  'Ukraine': ['ukrainian', 'ukrainians', 'kyiv', 'kiev', 'zelensky'],
  'Netherlands': ['dutch', 'amsterdam', 'the hague'],
  'Belgium': ['belgian', 'brussels'],
  'Greece': ['greek', 'athens'],
  'Norway': ['norwegian', 'oslo'],
  'Sweden': ['swedish', 'stockholm'],
  'Finland': ['finnish', 'helsinki'],
  'Belarus': ['belarusian', 'minsk', 'lukashenko'],
  'Romania': ['romanian', 'bucharest'],
  'Hungary': ['hungarian', 'budapest', 'orban'],
  'Serbia': ['serbian', 'belgrade', 'kosovo'],
  'Czechia': ['czech', 'prague'],
  'Austria': ['austrian', 'vienna'],
  'Switzerland': ['swiss', 'geneva'],
  'Denmark': ['danish', 'copenhagen'],
  'Ireland': ['irish', 'dublin'],
  'Portugal': ['portuguese', 'lisbon'],
  'Lithuania': ['lithuanian', 'vilnius'],
  'Latvia': ['latvian', 'riga'],
  'Estonia': ['estonian', 'tallinn'],
  'Croatia': ['croatian', 'zagreb'],
  'Bulgaria': ['bulgarian', 'sofia'],
  'Slovakia': ['slovak', 'bratislava'],
  'Moldova': ['moldovan', 'chisinau', 'transnistria'],
  'Georgia': ['georgian', 'tbilisi'],
  'Armenia': ['armenian', 'yerevan', 'nagorno-karabakh', 'artsakh'],
  'Azerbaijan': ['azerbaijani', 'baku'],

  'India': ['indian', 'new delhi', 'delhi', 'mumbai', 'modi'],
  'Japan': ['japanese', 'tokyo', 'japan self'],
  'South Korea': ['south korean', 'seoul', 'south korea'],
  'North Korea': ['north korean', 'pyongyang', 'kim jong'],
  'Taiwan': ['taiwanese', 'taipei'],
  'Vietnam': ['vietnamese', 'hanoi', 'ho chi minh'],
  'Thailand': ['thai', 'bangkok'],
  'Philippines': ['filipino', 'manila', 'philippine'],
  'Indonesia': ['indonesian', 'jakarta'],
  'Malaysia': ['malaysian', 'kuala lumpur'],
  'Singapore': ['singaporean'],
  'Australia': ['australian', 'canberra', 'sydney'],
  'New Zealand': ['new zealand', 'wellington'],
  'Bangladesh': ['bangladeshi', 'dhaka'],
  'Myanmar': ['myanmar', 'burmese', 'rangoon', 'yangon', 'burma'],
  'Cambodia': ['cambodian', 'phnom penh'],
  'Laos': ['laotian', 'vientiane'],
  'Sri Lanka': ['sri lankan', 'colombo'],
  'Nepal': ['nepali', 'kathmandu'],
  'Kazakhstan': ['kazakh', 'astana', 'almaty'],
  'Mongolia': ['mongolian', 'ulaanbaatar'],
  'Uzbekistan': ['uzbek', 'tashkent'],

  'Canada': ['canadian', 'ottawa'],
  'Mexico': ['mexican', 'mexico city'],
  'Brazil': ['brazilian', 'brasilia', 'sao paulo'],
  'Argentina': ['argentine', 'argentinian', 'buenos aires'],
  'Venezuela': ['venezuelan', 'caracas', 'maduro'],
  'Cuba': ['cuban', 'havana'],
  'Colombia': ['colombian', 'bogota'],
  'Chile': ['chilean', 'santiago'],
  'Peru': ['peruvian', 'lima'],
  'Ecuador': ['ecuadorian', 'quito'],
  'Bolivia': ['bolivian', 'la paz'],
  'Paraguay': ['paraguayan', 'asuncion'],
  'Uruguay': ['uruguayan', 'montevideo'],

  'Libya': ['libyan', 'tripoli'],
  'Sudan': ['sudanese', 'khartoum', 'darfur'],
  'Ethiopia': ['ethiopian', 'addis ababa', 'tigray'],
  'Somalia': ['somali', 'mogadishu', 'al shabaab'],
  'Nigeria': ['nigerian', 'lagos', 'abuja', 'boko haram'],
  'South Africa': ['south african', 'pretoria', 'johannesburg'],
  'Kenya': ['kenyan', 'nairobi'],
  'Algeria': ['algerian', 'algiers'],
  'Morocco': ['moroccan', 'rabat', 'casablanca', 'marrakech'],
  'Tunisia': ['tunisian', 'tunis'],
  'Ghana': ['ghanaian', 'accra'],
  'Niger': ['nigerien', 'niamey'],
  'Mali': ['malian', 'bamako'],
  'Chad': ['chadian', 'ndjamena'],
  'DR Congo': ['congo', 'congolese', 'kinshasa'],
  'Tanzania': ['tanzanian', 'dar es salaam'],
  'Uganda': ['ugandan', 'kampala'],
  'Mozambique': ['mozambican', 'maputo'],
  'Angola': ['angolan', 'luanda'],
  'Ivory Coast': ['ivory coast', 'cote divoire', 'abidjan'],
  'Cameroon': ['cameroonian', 'yaounde'],
  'Senegal': ['senegalese', 'dakar'],
  'Mauritania': ['mauritanian', 'nouakchott'],
};

// Detection patterns for different relationship types.
// Order matters: first matching type wins.
const RELATIONSHIP_PATTERNS = {
  MILITARY_CONFLICT: [
    /(\w+)\s+(?:attacks?|strikes?|bombs?|raids?|invades?|assaults?|besieges?)\s+(\w+)/i,
    /(\w+)\s+(?:launches?|fires?)\s+(?:missiles?|rockets?|barrage)\s+(?:at|into|toward)\s+(\w+)/i,
    /(\w+)\s+(?:airstrikes?|bombardment|shelling|artillery)\s+(?:on|in|against)\s+(\w+)/i,
    /(\w+)\s+(?:war|conflict|combat|fighting|hostilities)\s+(?:with|against)\s+(\w+)/i,
    /(\w+)\s+(?:ground\s+)?(?:offensive|assault|invasion|campaign)\s+(?:on|in|against)\s+(\w+)/i,
    /(\w+)\s+(?:hit|struck)\s+(?:by|with)\s+(?:a\s+)?(?:missile|airstrike|drone|bomb|rocket)/i,
    /(\w+)\s+(?:retaliat|respond|counter)\s+(?:with|by)\s+(?:a\s+)?(?:strike|attack|missile)/i,
    /(?:war|fighting)\s+between\s+(\w+)\s+and\s+(\w+)/i,
    /(\w+)\s+(?:and|vs\.?|versus)\s+(\w+)\s+(?:clash|fight|battle|combat|skirmish)/i,
    /(\w+)\s+(?:escalated|intensified)\s+(?:a\s+)?(?:war|conflict|fighting|clash)\s+(?:with|against)\s+(\w+)/i,
  ],

  WAR_ALERT: [
    /(\w+)\s+(?:on\s+the\s+)?(?:brink|verge|edge)\s+of\s+(?:a\s+)?war\s+(?:with|against)\s+(\w+)/i,
    /(\w+)\s+(?:prepares?|gearing?\s+up|getting?\s+ready)\s+(?:for|to)\s+(?:a\s+)?(?:war|military\s+conflict)\s+(?:with|against)\s+(\w+)/i,
    /(\w+)\s+(?:threatens?|vows?|warns?)\s+(?:of|to\s+launch|to\s+start|to\s+begin)\s+(?:a\s+)?(?:war|strike|attack)\s+(?:with|against|on)\s+(\w+)/i,
    /(\w+)\s+(?:warns?|signals?)\s+of\s+(?:possible|imminent|potential)\s+(?:war|attack)\s+(?:with|against)\s+(\w+)/i,
    /(?:possible|imminent|potential|looming|coming|expected)\s+war\s+between\s+(\w+)\s+and\s+(\w+)/i,
    /(\w+)\s+(?:mobilizes?|massing?)\s+(?:military\s+forces?|troops?|forces?)\s+(?:against|at\s+border\s+with)\s+(\w+)/i,
    /(\w+)\s+(?:ready|prepared)\s+for\s+war\s+(?:with|against)\s+(\w+)/i,
    /(\w+)\s+headed\s+(?:toward|towards|for)\s+war\s+(?:with|against)\s+(\w+)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:on\s+the\s+brink|edging\s+toward|headed\s+for)\s+(?:war|conflict)/i,
  ],

  CEASEFIRE: [
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:reach(?:ed)?|agree(?:d)?|sign(?:ed)?|broker(?:ed)?|announce(?:d)?)\s+(?:a\s+)?(?:ceasefire|truce|armistice)/i,
    /(?:ceasefire|truce)\s+between\s+(\w+)\s+and\s+(\w+)/i,
    /(\w+)\s+(?:agree(?:d)?|reached)\s+to\s+(?:halt|stop|end)\s+(?:the\s+)?(?:fighting|hostilities|combat)\s+(?:with|against)\s+(\w+)/i,
    /(\w+)\s+(?:suspended|halted|ended)\s+(?:hostilities|combat|military\s+operations)\s+(?:with|against)\s+(\w+)/i,
    /(\w+)\s+and\s+(\w+)\s+(?:extend(?:ed)?|renew(?:ed)?|observe)\s+(?:the\s+)?(?:ceasefire|truce)/i,
  ],

  BORDER_CLOSURE: [
    /(\w+)\s+(?:closes?|seals?|shuts?|shuts?\s+down)\s+(?:the\s+)?border\s+(?:with|between)\s+(\w+)/i,
    /(\w+)\s+(?:closes?|seals?|blocks?)\s+(?:border\s+crossing|crossing\s+point|checkpoint|frontier)\s+(?:with|between)\s+(\w+)/i,
    /(\w+)\s+(?:imposes?|declares?)\s+(?:a\s+)?(?:blockade|closure)\s+(?:on|against)\s+(\w+)/i,
    /(\w+)\s+(?:closes?|restricts?)\s+airspace\s+(?:with|over)\s+(\w+)/i,
    /(\w+)\s+and\s+(\w+)\s+(?:border\s+closure|closure\s+of\s+border|blockade)/i,
  ],

  DIPLOMATIC_TENSION: [
    /(\w+)\s+(?:sanctions?|condemns?|criticizes?|denounces?|rebukes?)\s+(\w+)/i,
    /(\w+)\s+(?:tensions?|dispute|rift|standoff|feud)\s+(?:with|between|and)\s+(\w+)/i,
    /(\w+)\s+(?:breaks?|severs?|suspends?)\s+(?:ties|relations|diplomatic\s+relations)\s+(?:with)\s+(\w+)/i,
    /(\w+)\s+(?:expels?|recalls?)\s+(?:ambassador|diplomat|envoys?)\s+(?:from|to)\s+(\w+)/i,
    /(\w+)\s+(?:diplomatic\s+crisis|diplomatic\s+row|diplomatic\s+tension|diplomatic\s+breakdown)\s+(?:with|between)\s+(\w+)/i,
    /(\w+)\s+(?:downgrades?|cuts?)\s+(?:relations|diplomatic\s+ties)\s+(?:with)\s+(\w+)/i,
    /(\w+)\s+(?:rejected|refused|declined)\s+(?:to\s+negotiate|the\s+deal|talks|meeting)\s+(?:with|from)\s+(\w+)/i,
    /(\w+)\s+(?:accuses?|accused)\s+(\w+)\s+(?:of|over)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:tensions?|dispute|rift|standoff|feud)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:sanctions?|condemn|criticism|diplomatic\s+war)/i,
  ],

  DIPLOMATIC_AGREEMENT: [
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:agree(?:d)?|sign(?:ed)?|reach(?:ed)?)\s+(?:to\s+)?(?:normalize|restore|rebuild)\s+relations/i,
    /(?:peace\s+deal|peace\s+agreement|peace\s+treaty)\s+between\s+(\w+)\s+and\s+(\w+)/i,
    /(\w+)\s+(?:agree(?:d)?|reached)\s+(?:a\s+)?(?:deal|agreement|accord)\s+(?:to\s+)(?:end|resolve|settle|de-escalate)\s+(?:the\s+)?(?:war|conflict|dispute)\s+(?:with|between)\s+(\w+)/i,
    /(\w+)\s+(?:agreed|signed)\s+(?:a\s+)?(?:prisoner\s+swap|swap)\s+(?:with)\s+(\w+)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:resolve\s+their|settle\s+their|overcome\s+their)\s+(?:dispute|rift)/i,
    /(\w+)\s+(?:announce(?:d)?)\s+diplomatic\s+(?:deal|breakthrough|agreement)\s+(?:with|between)\s+(\w+)/i,
  ],

  MILITARY_DEPLOYMENT: [
    /(\w+)\s+(?:deploys?|dispatches?|sends?|stations?)\s+(?:troops?|forces?|military|warships?|soldiers?|battalion)\s+(?:to|into|in|near)\s+(\w+)/i,
    /(\w+)\s+(?:reinforces?|bolsters?)\s+(?:troops?|forces?|military|defenses?)\s+(?:at|in|along)\s+(?:the\s+)?(?:border\s+with|frontier\s+with)\s+(\w+)/i,
    /(\w+)\s+(?:military\s+build-up|troop\s+buildup|massing\s+of\s+troops)\s+(?:at|along|on)\s+(?:border\s+with|frontier\s+with)\s+(\w+)/i,
    /(\w+)\s+(?:sent|deployed)\s+(?:additional|more)\s+(?:troops?|forces?|military)\s+(?:to|in)\s+(\w+)/i,
    /(\w+)\s+(?:sends?|deploys?)\s+(?:aircraft\s+carrier|carrier\s+strike\s+group|naval\s+fleet|submarine)\s+(?:to|near|off)\s+(\w+)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:military\s+deployment|troop\s+deployment|build-up|mobilization)/i,
  ],

  LOGISTICS_CRISIS: [
    /(\w+)\s+(?:logistics\s+crisis|supply\s+chain\s+crisis|shipping\s+crisis|trade\s+crisis|logistics\s+nightmare)\s+(?:in|at|affecting|hitting)\s+(\w+)/i,
    /(\w+)\s+(?:port\s+closure|port\s+blockage|port\s+congestion|shipping\s+disruption|trade\s+disruption|freight\s+crisis)\s+(?:in|at|near)\s+(\w+)/i,
    /(\w+)\s+(?:blocked|closed|seized|confiscated|hijacked)\s+(?:trade|goods|ships|cargo|vessels?|ports?|shipping)\s+(?:from|to|at|in)\s+(\w+)/i,
    /(\w+)\s+(?:tariff|sanction|embargo)\s+(?:on|against)\s+(\w+)/i,
    /(?:chokepoint|bottleneck|logistics\s+bottleneck)\s+(?:blocked|closed|disrupted|crisis)\s+(?:in|at|between)\s+(\w+)\s+and\s+(\w+)/i,
    /(\w+)\s+(?:food\s+crisis|fuel\s+crisis|energy\s+crisis|goods\s+crisis|price\s+surge|price\s+hike|inflation)\s+(?:in|at|affecting|hitting)\s+(\w+)/i,
    /(?:supply\s+chain|shipping|logistics)\s+(?:disrupted|strangled|paralyzed|collapsed)\s+(?:in|at|between)\s+(\w+)\s+and\s+(\w+)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:logistics|supply|trade|port|shipping|crisis|disruption|blockade|embargo)/i,
  ],

  LOGISTICS_PLAN: [
    /(?:new|major|planned|proposed)\s+(?:logistics\s+corridor|trade\s+corridor|supply\s+corridor|shipping\s+route|sea\s+lane|rail\s+link|railway|railroad|dry\s+port|logistics\s+hub)\s+(?:connecting|linking|between|from)\s+(\w+)\s+(?:and|to)\s+(\w+)/i,
    /(\w+)\s+(?:plans?|proposes?|announces?|launches?)\s+(?:a\s+)?(?:new\s+)?(?:logistics\s+plan|logistics\s+corridor|shipping\s+route|rail\s+project|infrastructure\s+project|highway|port\s+expansion)\s+(?:with|between|connecting)\s+(\w+)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:to\s+)?(?:build|construct|open|develop)\s+(?:a\s+)?(?:new\s+)?(?:logistics|trade\s+corridor|rail|port|highway|shipping\s+route)/i,
    /(\w+)\s+(?:sign(?:ed)?|agree(?:d)?)\s+(?:a\s+)?(?:logistics|trade|transport|infrastructure)\s+(?:deal|agreement|pact|accord)\s+(?:with|between)\s+(\w+)/i,
    /(?:silk\s+road|belt\s+and\s+road)\s+(?:corridor|initiative)\s+(?:connecting|linking)\s+(\w+)\s+(?:and|to)\s+(\w+)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:new\s+)?(?:logistics|trade\s+corridor|railway|rail\s+link|shipping\s+route|supply\s+route|infrastructure\s+plan|port\s+plan)/i,
  ],

  SUPPLY_CHAIN: [
    /(\w+)\s+(?:supplies?|provides?|delivers?)\s+(?:goods|components?|parts?|materials|equipment|weapons|grain|food)\s+(?:to)\s+(\w+)/i,
    /(\w+)\s+(?:manufacturing|production|assembly)\s+(?:in|from|shifted\s+from)\s+(\w+)/i,
    /(\w+)\s+(?:supply\s+chain|logistics\s+network)\s+(?:with|to|from)\s+(\w+)/i,
    /(\w+)\s+(?:relies?|depend(?:s|ed)?)\s+on\s+(\w+)\s+(?:for\s+)(?:components?|parts|supplies|manufacturing|production|semiconductors)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:supply\s+chain|supplier|manufacturing|component|semiconductor|supplies)/i,
  ],

  ENERGY_DEPENDENCY: [
    /(\w+)\s+(?:oil|gas|energy|crude)\s+(?:from|to|exports?\s+to)\s+(\w+)/i,
    /(\w+)\s+(?:pipeline|LNG|gas\s+field|oil\s+field)\s+(?:to|from|between)\s+(\w+)/i,
    /(\w+)\s+(?:energy\s+deal|gas\s+deal|oil\s+deal|energy\s+agreement)\s+(?:with|between)\s+(\w+)/i,
    /(\w+)\s+(?:depends?|dependent)\s+on\s+(\w+)\s+(?:for\s+energy|for\s+oil|for\s+gas)/i,
    /(\w+)\s+(?:cuts?|halts?|reduces?)\s+(?:oil|gas|energy|fuel)\s+(?:supplies?|exports?)\s+(?:to|from)\s+(\w+)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:energy|oil|gas|fuel|pipeline|refinery)/i,
  ],

  TRADE_ROUTE: [
    /(\w+)\s+(?:exports?|imports?|trades?)\s+(?:with|to|from)\s+(\w+)/i,
    /(\w+)\s+(?:trade\s+deal|trade\s+agreement|bilateral\s+trade)\s+(?:with|between)\s+(\w+)/i,
    /(\w+)\s+(?:shipping|cargo|goods)\s+(?:to|from|between)\s+(\w+)/i,
    /(\w+)\s+(?:trade\s+route|shipping\s+lane|trade\s+corridor)\s+(?:connecting|linking|between)\s+(\w+)/i,
    /(\w+)\s+(?:import|export)\s+(?:surge|spike|increase|drop|decline|disruption)\s+(?:from|to)\s+(\w+)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:trade|commerce|business|exports|imports)/i,
  ],

  ECONOMIC_PARTNERSHIP: [
    /(\w+)\s+(?:investment|invests?)\s+(?:in)\s+(\w+)/i,
    /(\w+)\s+(?:economic\s+cooperation|economic\s+partnership|strategic\s+partnership)\s+(?:with|between)\s+(\w+)/i,
    /(\w+)\s+(?:FDI|foreign\s+investment|investment\s+deal|economic\s+deal)\s+(?:in|with|to|between)\s+(\w+)/i,
    /(\w+)\s+(?:infrastructure\s+deal|infrastructure\s+investment|infrastructure\s+agreement)\s+(?:with|in|between)\s+(\w+)/i,
    /(\w+)\s+(?:loan|aid|grant|financial\s+package|bailout)\s+(?:to|for|from)\s+(\w+)/i,
    /(\w+)\s+(?:free\s+trade|trade\s+agreement|customs\s+deal)\s+(?:with|between)\s+(\w+)/i,
    /(\w+)\s+(?:signed|reached|announced)\s+(?:a\s+)?(?:economic|trade|investment)\s+(?:agreement|deal|accord)\s+(?:with|between)\s+(\w+)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:invest|economic|investment|cooperation|partnership|aid|loan|deal|agreement)/i,
  ],

  ALLIANCE: [
    /(\w+)\s+(?:allies?|aligns?|partners?)\s+with\s+(\w+)/i,
    /(\w+)\s+(?:sign(?:ed|s)?)\s+(?:a\s+)?(?:treaty|pact|defense\s+pact|security\s+pact|military\s+alliance|mutual\s+defense\s+agreement)\s+with\s+(\w+)/i,
    /(\w+)\s+(?:supports?|backs?|defends?|stands\s+with)\s+(\w+)/i,
    /(\w+)\s+(?:joins?|joint\s+military\s+exercise|joint\s+drill)\s+with\s+(\w+)/i,
    /(\w+)\s+(?:security\s+partnership|defense\s+partnership|military\s+partnership)\s+(?:with|between)\s+(\w+)/i,
    /(\w+)\s+(?:pledged|committed|agreed)\s+(?:to\s+support|to\s+defend|military\s+support|to\s+back)\s+(\w+)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:alliance|partnership|coalition|treaty|pact)/i,
  ],

  MIGRATION_FLOW: [
    /(\w+)\s+(?:refugees?|migrants?|asylum\s+seekers?|displaced\s+people)\s+(?:to|from|in|into)\s+(\w+)/i,
    /(\w+)\s+(?:immigration|emigration|exodus)\s+(?:to|from)\s+(\w+)/i,
    /(\w+)\s+(?:refugee\s+crisis|migration\s+crisis|border\s+crisis|asylum\s+crisis)\s+(?:in|at|near|between)\s+(\w+)/i,
    /(\w+)\s+(?:flee|fleeing|escapes?|escaping)\s+(?:to|from)\s+(\w+)/i,
    /(?:thousands|millions)\s+(?:of\s+)?(?:refugees|migrants|people)\s+(?:crossing|arriving|heading)\s+to\s+(\w+)\s+from\s+(\w+)/i,
    /(\w+)\s+(?:and|with)\s+(\w+)\s+(?:refugee|migrant|asylum|migration|displaced)/i,
  ],
};

// Fallback keywords per type: if a pair of countries appears in an article
// that also contains one of these keywords, treat it as that relationship.
// Catches word-order variations the regex patterns miss.
const TYPE_KEYWORDS: Record<string, string[]> = {
  MILITARY_CONFLICT: ['attack', 'airstrike', 'air strike', 'strike', 'bomb', 'raid', 'invasion', 'assault', 'war', 'conflict', 'shell', 'missile', 'rocket', 'drone', 'clash', 'offensive', 'combat', 'skirmish', 'battle'],
  WAR_ALERT: ['brink of war', 'preparing for war', 'prepare for war', 'threaten', 'threat of war', 'possible war', 'imminent attack', 'mobiliz', 'military build-up', 'buildup', 'ready for war', 'escalation', 'warned', 'warning'],
  CEASEFIRE: ['ceasefire', 'cease-fire', 'truce', 'armistice', 'halt hostilities', 'halt to fighting', 'stop fighting', 'end the fighting'],
  BORDER_CLOSURE: ['border closure', 'closes border', 'sealed the border', 'blockade', 'closed the border', 'border crossing closed'],
  DIPLOMATIC_TENSION: ['sanction', 'condemn', 'criticize', 'tensions', 'diplomatic crisis', 'dispute', 'rift', 'standoff', 'expelled', 'recalled ambassador', 'breaks ties', 'severed'],
  DIPLOMATIC_AGREEMENT: ['peace deal', 'peace agreement', 'normalize relations', 'normalized relations', 'resolve dispute', 'settle dispute', 'prisoner swap', 'peace treaty'],
  MILITARY_DEPLOYMENT: ['deploy', 'deployment', 'troops', 'warships', 'military build-up', 'soldiers sent', 'reinforce', 'carrier strike group', 'naval fleet'],
  LOGISTICS_CRISIS: ['logistics crisis', 'supply chain', 'shipping crisis', 'trade crisis', 'port closure', 'shipping disruption', 'trade disruption', 'embargo', 'tariff', 'chokepoint', 'bottleneck', 'freight', 'cargo seized', 'inflation', 'price surge'],
  LOGISTICS_PLAN: ['logistics corridor', 'trade corridor', 'rail link', 'railway', 'shipping route', 'new port', 'highway', 'infrastructure plan', 'belt and road', 'logistics hub', 'dry port', 'supply route'],
  SUPPLY_CHAIN: ['supply chain', 'manufacturing', 'components', 'semiconductor', 'supplier', 'production', 'assembly'],
  ENERGY_DEPENDENCY: ['oil', 'gas', 'energy', 'pipeline', 'lng', 'crude', 'refinery', 'fuel', 'petroleum'],
  TRADE_ROUTE: ['trade', 'exports', 'imports', 'shipping', 'cargo', 'goods', 'commerce', 'bilateral trade', 'trade deal'],
  ECONOMIC_PARTNERSHIP: ['investment', 'invest', 'economic cooperation', 'fdi', 'loan', 'aid', 'grant', 'partnership', 'cooperation', 'infrastructure deal', 'free trade'],
  ALLIANCE: ['alliance', 'ally', 'treaty', 'pact', 'defense pact', 'coalition', 'mutual defense', 'joint exercise', 'support', 'stands with', 'security partnership'],
  MIGRATION_FLOW: ['refugee', 'migrant', 'asylum', 'immigration', 'emigration', 'displaced', 'exodus', 'flee'],
};

// Max context chars around a country pair to classify them as related.
const PAIR_CONTEXT = 150;

/**
 * Analyze news articles for all types of geopolitical relationships.
 * Multi-word + alias-aware country detection with three match stages:
 *   1. Regex patterns against the tight pair window
 *   2. Regex patterns against the full article content
 *   3. Keyword fallback (word-order independent)
 */
export function analyzeGeopoliticalRelationships(articles: NewsArticle[]): GeopoliticalRelationship[] {
  const relationships = new Map<string, GeopoliticalRelationship>();

  // Sorted by length descending so longer names match first (e.g. "United States")
  const sortedCountryNames = Object.keys(COUNTRY_COORDS).sort((a, b) => b.length - a.length);

  for (const article of articles) {
    const content = `${article.title} ${article.description}`;
    const lower = content.toLowerCase();

    // Find all country names mentioned in this article (canonical name OR alias)
    const mentionedCountries: string[] = [];
    for (const name of sortedCountryNames) {
      const aliases = COUNTRY_ALIASES[name] ?? [];
      const hit = countryHit(lower, name) || aliases.some(a => countryHit(lower, a));
      if (hit) mentionedCountries.push(name);
    }

    if (mentionedCountries.length < 2) continue;

    // Cap pairs to bound compute on multi-country roundups
    const cappedCountries = mentionedCountries.slice(0, 6);

    // For each pair of mentioned countries, detect relationship type
    for (let i = 0; i < cappedCountries.length; i++) {
      for (let j = i + 1; j < cappedCountries.length; j++) {
        const source = cappedCountries[i];
        const target = cappedCountries[j];

        // Extract the window of text containing both countries
        const pairText = extractPairText(content, source, target);
        if (!pairText) continue;

        const pairLower = pairText.toLowerCase();

        // Stage 1: regex patterns against tight pair window
        let matched = matchPatterns(relationships, article, source, target, pairLower, content);
        if (matched) continue;

        // Stage 2: regex patterns against full article content
        matched = matchPatterns(relationships, article, source, target, lower, content);
        if (matched) continue;

        // Stage 3: keyword fallback (word-order independent)
        for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
          if (keywords.some(k => lower.includes(k))) {
            createRelationship(relationships, source, target, type as RelationshipType, article, lower);
            break;
          }
        }
      }
    }
  }

  return Array.from(relationships.values());
}

/** Try every type's regex patterns against `text`; create a relationship on first hit. */
function matchPatterns(
  relationships: Map<string, GeopoliticalRelationship>,
  article: NewsArticle,
  source: string,
  target: string,
  text: string,
  content: string,
): boolean {
  for (const [type, patterns] of Object.entries(RELATIONSHIP_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        createRelationship(relationships, source, target, type as RelationshipType, article, content);
        return true;
      }
    }
  }
  return false;
}

function createRelationship(
  relationships: Map<string, GeopoliticalRelationship>,
  source: string,
  target: string,
  type: RelationshipType,
  article: NewsArticle,
  content: string,
): void {
  const key = makeRelationshipKey(source, target, type);
  const existing = relationships.get(key);
  if (existing) {
    existing.intensity = Math.min(10, existing.intensity + 1);
    if (!existing.articles.includes(article.url)) existing.articles.push(article.url);
    return;
  }
  relationships.set(key, {
    id: `geo-${key}-${Date.now()}`,
    sourceCountry: source,
    targetCountry: target,
    sourcePosition: COUNTRY_COORDS[source],
    targetPosition: COUNTRY_COORDS[target],
    intensity: calculateIntensity(content, type),
    type,
    description: article.title,
    timestamp: article.publishedAt,
    articles: [article.url],
    bidirectional: isBidirectional(type),
  });
}

function isBidirectional(type: string): boolean {
  return [
    'TRADE_ROUTE',
    'ALLIANCE',
    'ECONOMIC_PARTNERSHIP',
    'ENERGY_DEPENDENCY',
    'SUPPLY_CHAIN',
    'CEASEFIRE',
    'DIPLOMATIC_AGREEMENT',
    'LOGISTICS_PLAN',
  ].includes(type);
}

function makeRelationshipKey(source: string, target: string, type: string): string {
  const isBidir = isBidirectional(type);
  if (isBidir && source > target) {
    return `${target}-${source}-${type}`;
  }
  return `${source}-${target}-${type}`;
}

/** Match a country name (or alias) only as a standalone token, not inside another word. */
function countryHit(lower: string, name: string): boolean {
  const escaped = escapeRegExp(name.toLowerCase());
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(lower);
}

/**
 * Find the byte-position + length of the first real occurrence of a country
 * in lowercased text, matching its canonical name OR any alias (word-boundary
 * aware so "us" matches "US" but not "focus"). Essential because most news
 * uses aliases ("USA", "Tehran", "Moscow") rather than canonical names.
 */
function findCountrySpan(lower: string, country: string): { idx: number; len: number } | null {
  const names = [country.toLowerCase(), ...(COUNTRY_ALIASES[country] ?? [])];
  let best: { idx: number; len: number } | null = null;
  for (const n of names) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(n)}($|[^a-z0-9])`, 'i');
    const m = re.exec(lower);
    if (!m) continue;
    const prefixLen = m[1] ? m[1].length : 0;
    const idx = m.index + prefixLen;
    if (!best || idx < best.idx) best = { idx, len: n.length };
  }
  return best;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractPairText(content: string, countryA: string, countryB: string): string | null {
  const lower = content.toLowerCase();
  const spanA = findCountrySpan(lower, countryA);
  const spanB = findCountrySpan(lower, countryB);
  if (!spanA || !spanB) return null;

  const start = Math.min(spanA.idx, spanB.idx);
  const end = Math.max(spanA.idx + spanA.len, spanB.idx + spanB.len);

  const windowStart = Math.max(0, start - PAIR_CONTEXT);
  const windowEnd = Math.min(content.length, end + PAIR_CONTEXT);
  return content.slice(windowStart, windowEnd);
}

/**
 * Calculate relationship intensity based on keywords and type
 */
function calculateIntensity(content: string, type: RelationshipType): number {
  const lower = content.toLowerCase();
  let intensity = 3; // Base intensity

  switch (type) {
    case 'MILITARY_CONFLICT':
      intensity = 7;
      if (lower.includes('war') || lower.includes('invasion')) intensity = 10;
      if (lower.includes('killed') || lower.includes('casualties')) intensity = Math.min(10, intensity + 2);
      if (lower.includes('missile') || lower.includes('airstrike')) intensity = Math.min(10, intensity + 1);
      break;

    case 'WAR_ALERT':
      intensity = 7;
      if (lower.includes('brink') || lower.includes('imminent')) intensity = 9;
      if (lower.includes('prepare') || lower.includes('mobilize') || lower.includes('build-up')) intensity = 8;
      if (lower.includes('war')) intensity = Math.min(10, intensity + 1);
      break;

    case 'MILITARY_DEPLOYMENT':
      intensity = 6;
      if (lower.includes('build-up') || lower.includes('large-scale') || lower.includes('thousands')) intensity = 8;
      if (lower.includes('carrier') || lower.includes('warships')) intensity = Math.min(10, intensity + 2);
      break;

    case 'BORDER_CLOSURE':
      intensity = 6;
      if (lower.includes('blockade') || lower.includes('complete closure')) intensity = 8;
      break;

    case 'DIPLOMATIC_TENSION':
      intensity = 4;
      if (lower.includes('crisis') || lower.includes('escalation')) intensity = 6;
      if (lower.includes('war') || lower.includes('threat')) intensity = 7;
      if (lower.includes('breaks ties') || lower.includes('expels')) intensity = 8;
      break;

    case 'CEASEFIRE':
      intensity = 5;
      if (lower.includes('extend') || lower.includes('renew')) intensity = 6;
      if (lower.includes('permanent') || lower.includes('brokered')) intensity = 7;
      break;

    case 'DIPLOMATIC_AGREEMENT':
      intensity = 5;
      if (lower.includes('normalize') || lower.includes('restore')) intensity = 7;
      if (lower.includes('peace')) intensity = 8;
      break;

    case 'TRADE_ROUTE':
      intensity = 5;
      if (lower.includes('billion') || lower.includes('major')) intensity = 7;
      if (lower.includes('largest') || lower.includes('record')) intensity = 8;
      break;

    case 'ALLIANCE':
      intensity = 6;
      if (lower.includes('nato') || lower.includes('treaty')) intensity = 8;
      if (lower.includes('defense') || lower.includes('military')) intensity = 9;
      break;

    case 'SUPPLY_CHAIN':
      intensity = 5;
      if (lower.includes('critical') || lower.includes('essential')) intensity = 7;
      if (lower.includes('shortage') || lower.includes('disruption')) intensity = 8;
      break;

    case 'ENERGY_DEPENDENCY':
      intensity = 6;
      if (lower.includes('pipeline') || lower.includes('major')) intensity = 8;
      if (lower.includes('cuts') || lower.includes('halts')) intensity = 9;
      break;

    case 'LOGISTICS_CRISIS':
      intensity = 6;
      if (lower.includes('blockade') || lower.includes('embargo') || lower.includes('closure')) intensity = 8;
      if (lower.includes('crisis') || lower.includes('disruption')) intensity = 7;
      break;

    case 'LOGISTICS_PLAN':
      intensity = 5;
      if (lower.includes('billion') || lower.includes('major') || lower.includes('corridor')) intensity = 7;
      if (lower.includes('landmark') || lower.includes('strategic')) intensity = 8;
      break;

    case 'MIGRATION_FLOW':
      intensity = 4;
      if (lower.includes('crisis') || lower.includes('thousands')) intensity = 6;
      if (lower.includes('millions') || lower.includes('mass')) intensity = 8;
      break;

    case 'ECONOMIC_PARTNERSHIP':
      intensity = 5;
      if (lower.includes('billion') || lower.includes('major')) intensity = 7;
      if (lower.includes('strategic') || lower.includes('landmark')) intensity = 8;
      break;
  }

  return Math.min(10, intensity);
}

// Export for backward compatibility
export type ConflictRelationship = GeopoliticalRelationship;
export const analyzeConflictRelationships = analyzeGeopoliticalRelationships;
