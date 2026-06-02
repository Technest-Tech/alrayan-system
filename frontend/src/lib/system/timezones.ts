import { COUNTRIES } from './countries'

/**
 * Countries that span multiple IANA timezones.
 * All other countries fall back to their single `timezone` field in COUNTRIES.
 */
const MULTI_TZ: Record<string, string[]> = {
  AU: [
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane',
    'Australia/Perth',
    'Australia/Adelaide',
    'Australia/Darwin',
    'Australia/Hobart',
    'Australia/Lord_Howe',
  ],
  BR: [
    'America/Sao_Paulo',
    'America/Fortaleza',
    'America/Recife',
    'America/Belem',
    'America/Maceio',
    'America/Manaus',
    'America/Cuiaba',
    'America/Porto_Velho',
    'America/Boa_Vista',
    'America/Rio_Branco',
    'America/Noronha',
  ],
  CA: [
    'America/Toronto',
    'America/Vancouver',
    'America/Edmonton',
    'America/Winnipeg',
    'America/Halifax',
    'America/St_Johns',
    'America/Regina',
    'America/Whitehorse',
    'America/Yellowknife',
    'America/Iqaluit',
    'America/Glace_Bay',
    'America/Moncton',
  ],
  CN: [
    'Asia/Shanghai',
    'Asia/Urumqi',
  ],
  ID: [
    'Asia/Jakarta',
    'Asia/Makassar',
    'Asia/Jayapura',
    'Asia/Pontianak',
  ],
  IN: [
    'Asia/Kolkata',
  ],
  KZ: [
    'Asia/Almaty',
    'Asia/Aqtau',
    'Asia/Aqtobe',
    'Asia/Oral',
    'Asia/Qostanay',
    'Asia/Atyrau',
  ],
  MX: [
    'America/Mexico_City',
    'America/Cancun',
    'America/Monterrey',
    'America/Mazatlan',
    'America/Chihuahua',
    'America/Hermosillo',
    'America/Tijuana',
    'America/Bahia_Banderas',
    'America/Merida',
  ],
  RU: [
    'Europe/Moscow',
    'Europe/Kaliningrad',
    'Europe/Samara',
    'Europe/Ulyanovsk',
    'Europe/Volgograd',
    'Europe/Saratov',
    'Asia/Yekaterinburg',
    'Asia/Omsk',
    'Asia/Novosibirsk',
    'Asia/Barnaul',
    'Asia/Tomsk',
    'Asia/Krasnoyarsk',
    'Asia/Novokuznetsk',
    'Asia/Irkutsk',
    'Asia/Chita',
    'Asia/Yakutsk',
    'Asia/Khandyga',
    'Asia/Vladivostok',
    'Asia/Ust-Nera',
    'Asia/Sakhalin',
    'Asia/Magadan',
    'Asia/Srednekolymsk',
    'Asia/Kamchatka',
    'Asia/Anadyr',
  ],
  US: [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'America/Phoenix',
    'America/Indiana/Indianapolis',
    'America/Indiana/Knox',
    'America/Indiana/Marengo',
    'America/Indiana/Petersburg',
    'America/Indiana/Tell_City',
    'America/Indiana/Vevay',
    'America/Indiana/Vincennes',
    'America/Indiana/Winamac',
    'America/Kentucky/Louisville',
    'America/Kentucky/Monticello',
    'America/Detroit',
    'America/Menominee',
    'America/North_Dakota/Beulah',
    'America/North_Dakota/Center',
    'America/North_Dakota/New_Salem',
    'America/Boise',
    'America/Juneau',
    'America/Sitka',
    'America/Nome',
    'America/Metlakatla',
    'America/Yakutat',
    'America/Adak',
  ],
  ES: [
    'Europe/Madrid',
    'Atlantic/Canary',
    'Africa/Ceuta',
  ],
  PT: [
    'Europe/Lisbon',
    'Atlantic/Azores',
    'Atlantic/Madeira',
  ],
  FR: [
    'Europe/Paris',
    'Indian/Reunion',
    'Indian/Mayotte',
    'America/Martinique',
    'America/Guadeloupe',
    'America/Cayenne',
    'Pacific/Noumea',
    'Pacific/Tahiti',
    'Pacific/Wallis',
    'Indian/Kerguelen',
  ],
  GB: [
    'Europe/London',
  ],
  NZ: [
    'Pacific/Auckland',
    'Pacific/Chatham',
  ],
  MN: [
    'Asia/Ulaanbaatar',
    'Asia/Hovd',
    'Asia/Choibalsan',
  ],
  PG: [
    'Pacific/Port_Moresby',
    'Pacific/Bougainville',
  ],
}

/** Returns all IANA timezone strings for a given country code. */
export function getTimezonesForCountry(code: string): string[] {
  if (MULTI_TZ[code]) return MULTI_TZ[code]
  const country = COUNTRIES.find((c) => c.code === code)
  return country?.timezone ? [country.timezone] : []
}

/** Human-readable label for an IANA timezone string. */
export function tzLabel(tz: string): string {
  // e.g. "America/New_York" → "New York"
  //      "America/Indiana/Indianapolis" → "Indiana / Indianapolis"
  const parts = tz.split('/').slice(1)
  return parts.map((p) => p.replace(/_/g, ' ')).join(' / ')
}

/** UTC offset label, e.g. "UTC+3" */
export function tzOffset(tz: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
    const parts = fmt.formatToParts(new Date())
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
    return offset
  } catch {
    return ''
  }
}
