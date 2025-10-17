// src/services/timezoneService.js
/**
 * Timezone management service for handling store and user timezone operations
 */

// Common IANA timezones for the dropdown
export const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)", offset: "UTC-5/-4" },
  { value: "America/Chicago", label: "Central Time (CT)", offset: "UTC-6/-5" },
  { value: "America/Denver", label: "Mountain Time (MT)", offset: "UTC-7/-6" },
  { value: "America/Phoenix", label: "Arizona (MST - no DST)", offset: "UTC-7" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", offset: "UTC-8/-7" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)", offset: "UTC-9/-8" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)", offset: "UTC-10" },
  { value: "Europe/London", label: "London (GMT/BST)", offset: "UTC+0/+1" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Asia/Dubai", label: "Dubai (GST)", offset: "UTC+4" },
  { value: "Asia/Kolkata", label: "India (IST)", offset: "UTC+5:30" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", offset: "UTC+8" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", offset: "UTC+9" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)", offset: "UTC+10/+11" },
  { value: "Pacific/Auckland", label: "Auckland (NZST/NZDT)", offset: "UTC+12/+13" },
];

// All IANA timezones (comprehensive list)
export const ALL_TIMEZONES = [
  ...COMMON_TIMEZONES,
  { value: "America/Adak", label: "Adak (HAST/HADT)", offset: "UTC-10/-9" },
  { value: "America/Boise", label: "Boise (MST/MDT)", offset: "UTC-7/-6" },
  { value: "America/Detroit", label: "Detroit (EST/EDT)", offset: "UTC-5/-4" },
  { value: "America/Indiana/Indianapolis", label: "Indianapolis (EST/EDT)", offset: "UTC-5/-4" },
  { value: "America/Juneau", label: "Juneau (AKST/AKDT)", offset: "UTC-9/-8" },
  { value: "America/Kentucky/Louisville", label: "Louisville (EST/EDT)", offset: "UTC-5/-4" },
  { value: "America/Metlakatla", label: "Metlakatla (AKST/AKDT)", offset: "UTC-9/-8" },
  { value: "America/Nome", label: "Nome (AKST/AKDT)", offset: "UTC-9/-8" },
  { value: "America/North_Dakota/Center", label: "Center, ND (CST/CDT)", offset: "UTC-6/-5" },
  { value: "America/Sitka", label: "Sitka (AKST/AKDT)", offset: "UTC-9/-8" },
  { value: "America/Yakutat", label: "Yakutat (AKST/AKDT)", offset: "UTC-9/-8" },
  { value: "America/Toronto", label: "Toronto (EST/EDT)", offset: "UTC-5/-4" },
  { value: "America/Vancouver", label: "Vancouver (PST/PDT)", offset: "UTC-8/-7" },
  { value: "America/Mexico_City", label: "Mexico City (CST/CDT)", offset: "UTC-6/-5" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT/BRST)", offset: "UTC-3/-2" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (ART)", offset: "UTC-3" },
  { value: "Europe/Dublin", label: "Dublin (GMT/IST)", offset: "UTC+0/+1" },
  { value: "Europe/Lisbon", label: "Lisbon (WET/WEST)", offset: "UTC+0/+1" },
  { value: "Europe/Madrid", label: "Madrid (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Rome", label: "Rome (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Brussels", label: "Brussels (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Zurich", label: "Zurich (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Vienna", label: "Vienna (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Stockholm", label: "Stockholm (CET/CEST)", offset: "UTC+1/+2" },
  { value: "Europe/Athens", label: "Athens (EET/EEST)", offset: "UTC+2/+3" },
  { value: "Europe/Istanbul", label: "Istanbul (TRT)", offset: "UTC+3" },
  { value: "Europe/Moscow", label: "Moscow (MSK)", offset: "UTC+3" },
  { value: "Africa/Cairo", label: "Cairo (EET)", offset: "UTC+2" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)", offset: "UTC+2" },
  { value: "Africa/Lagos", label: "Lagos (WAT)", offset: "UTC+1" },
  { value: "Asia/Jerusalem", label: "Jerusalem (IST/IDT)", offset: "UTC+2/+3" },
  { value: "Asia/Riyadh", label: "Riyadh (AST)", offset: "UTC+3" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)", offset: "UTC+7" },
  { value: "Asia/Singapore", label: "Singapore (SGT)", offset: "UTC+8" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)", offset: "UTC+8" },
  { value: "Asia/Seoul", label: "Seoul (KST)", offset: "UTC+9" },
  { value: "Asia/Taipei", label: "Taipei (CST)", offset: "UTC+8" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST/AEDT)", offset: "UTC+10/+11" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST)", offset: "UTC+10" },
  { value: "Australia/Perth", label: "Perth (AWST)", offset: "UTC+8" },
  { value: "Pacific/Fiji", label: "Fiji (FJT/FJST)", offset: "UTC+12/+13" },
  { value: "Pacific/Guam", label: "Guam (ChST)", offset: "UTC+10" },
];

/**
 * Get the user's current timezone
 * @returns {string} IANA timezone identifier
 */
export function getUserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York"; // fallback
  }
}

/**
 * Convert a UTC timestamp to a Date object
 * @param {Date|string|number} utcTimestamp - UTC timestamp (Date object, ISO string, or epoch)
 * @returns {Date} Date object
 */
export function convertToTimeZone(utcTimestamp) {
  try {
    let date;
    if (utcTimestamp instanceof Date) {
      date = utcTimestamp;
    } else if (typeof utcTimestamp === "string") {
      date = new Date(utcTimestamp);
    } else if (typeof utcTimestamp === "number") {
      date = new Date(utcTimestamp);
    } else if (utcTimestamp?.seconds) {
      // Firestore Timestamp
      date = new Date(utcTimestamp.seconds * 1000);
    } else {
      throw new Error("Invalid timestamp format");
    }

    // Return the date object - timezone conversion happens during formatting
    return date;
  } catch (error) {
    console.error("Error converting timezone:", error);
    return new Date();
  }
}

/**
 * Format a timestamp for a specific timezone
 * @param {Date|string|number} timestamp - The timestamp to format
 * @param {string} timeZone - IANA timezone identifier
 * @param {object} options - Formatting options
 * @returns {string} Formatted date/time string
 */
export function formatInTimeZone(
  timestamp,
  timeZone,
  options = {
    dateStyle: "medium",
    timeStyle: "short",
  }
) {
  try {
    const date = convertToTimeZone(timestamp, timeZone);
    return new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone,
    }).format(date);
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Invalid date";
  }
}

/**
 * Get a localized ISO string for a specific timezone
 * @param {Date|string|number} timestamp - The timestamp
 * @param {string} timeZone - IANA timezone identifier
 * @returns {string} ISO 8601 string (without timezone offset info)
 */
export function toISOStringInTimeZone(timestamp, timeZone) {
  try {
    const date = convertToTimeZone(timestamp, timeZone);
    
    // Format parts in the target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    
    const parts = formatter.formatToParts(date);
    const values = {};
    parts.forEach(({ type, value }) => {
      values[type] = value;
    });
    
    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`;
  } catch (error) {
    console.error("Error creating ISO string:", error);
    return new Date().toISOString();
  }
}

/**
 * Get the current time in a specific timezone
 * @param {string} timeZone - IANA timezone identifier
 * @returns {Date} Current time as Date object
 */
export function getCurrentTimeInZone(timeZone) {
  return convertToTimeZone(new Date(), timeZone);
}

/**
 * Get timezone offset string (e.g., "UTC-7" or "UTC+5:30")
 * @param {string} timeZone - IANA timezone identifier
 * @returns {string} Offset string
 */
export function getTimeZoneOffset(timeZone) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    });
    
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    
    if (offsetPart && offsetPart.value.startsWith("GMT")) {
      return offsetPart.value.replace("GMT", "UTC");
    }
    
    // Fallback calculation
    const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(now.toLocaleString("en-US", { timeZone }));
    const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? "+" : "-";
    
    return `UTC${sign}${hours}${minutes > 0 ? `:${minutes}` : ""}`;
  } catch (error) {
    console.error("Error getting timezone offset:", error);
    return "UTC";
  }
}

/**
 * Create timezone context for saving with database records
 * @param {string} storeTimeZone - Store's configured timezone
 * @param {string} userTimeZone - User's timezone (optional, will be detected if not provided)
 * @returns {object} Timezone context object
 */
export function createTimeZoneContext(storeTimeZone, userTimeZone = null) {
  const detectedUserTZ = userTimeZone || getUserTimeZone();
  const now = new Date();
  
  return {
    storeTimeZone,
    userTimeZone: detectedUserTZ,
    createdAtStoreTime: toISOStringInTimeZone(now, storeTimeZone),
    createdAtUserTime: toISOStringInTimeZone(now, detectedUserTZ),
  };
}

/**
 * Format timestamp showing both store and user timezones
 * @param {Date|string|number} timestamp - The timestamp
 * @param {string} storeTimeZone - Store's timezone
 * @param {string} userTimeZone - User's timezone
 * @returns {object} Formatted strings for both timezones
 */
export function formatDualTimeZone(timestamp, storeTimeZone, userTimeZone) {
  return {
    store: formatInTimeZone(timestamp, storeTimeZone),
    user: formatInTimeZone(timestamp, userTimeZone),
    storeTimezone: storeTimeZone,
    userTimezone: userTimeZone,
  };
}

/**
 * Search timezones by query string
 * @param {string} query - Search query
 * @returns {Array} Filtered timezone list
 */
export function searchTimeZones(query) {
  if (!query || query.trim() === "") {
    return COMMON_TIMEZONES;
  }
  
  const lowerQuery = query.toLowerCase();
  return ALL_TIMEZONES.filter(
    (tz) =>
      tz.label.toLowerCase().includes(lowerQuery) ||
      tz.value.toLowerCase().includes(lowerQuery) ||
      tz.offset.toLowerCase().includes(lowerQuery)
  );
}
