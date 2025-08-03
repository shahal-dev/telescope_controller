import { Telescope } from "@shared/schema";

// Get telescope utility functions
export function getTelescopeUtils() {
  // Calculate the telescope's altitude and azimuth from RA and DEC
  const getAzimuthAltitude = (
    ra: string,
    dec: string,
    lst: string = "00:00:00"
  ): { altitude: number; azimuth: number } => {
    try {
      // Parse RA in hours
      let raHours = 0;
      if (ra.includes('h')) {
        const raParts = ra.split(/[hm\s]/);
        raHours = parseFloat(raParts[0]) + parseFloat(raParts[1] || '0') / 60 + parseFloat(raParts[2] || '0') / 3600;
      } else {
        raHours = parseFloat(ra);
      }
      
      // Parse DEC in degrees
      let decDeg = 0;
      if (dec.includes('°')) {
        const sign = dec.startsWith('-') ? -1 : 1;
        const decParts = dec.replace(/[+\-]/, '').split(/[°'\s]/);
        decDeg = sign * (parseFloat(decParts[0]) + parseFloat(decParts[1] || '0') / 60 + parseFloat(decParts[2] || '0') / 3600);
      } else {
        decDeg = parseFloat(dec);
      }
      
      // Simplified calculation (not astronomically accurate)
      // In a real app, this would use proper astronomical calculations
      const hourAngle = parseFloat(lst.split(':')[0]) - raHours;
      
      // Convert hour angle to degrees
      const ha = hourAngle * 15;
      
      // Observer latitude (we'll use a default of 23° N for Bangladesh)
      const lat = 23.8;
      
      // Convert to radians
      const haRad = ha * Math.PI / 180;
      const decRad = decDeg * Math.PI / 180;
      const latRad = lat * Math.PI / 180;
      
      // Calculate altitude
      const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
      const altRad = Math.asin(sinAlt);
      const altitude = altRad * 180 / Math.PI;
      
      // Calculate azimuth
      const cosAz = (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) / (Math.cos(altRad) * Math.cos(latRad));
      const azRad = Math.acos(Math.max(-1, Math.min(1, cosAz)));
      let azimuth = azRad * 180 / Math.PI;
      
      // Adjust azimuth for the hemisphere
      if (Math.sin(haRad) > 0) {
        azimuth = 360 - azimuth;
      }
      
      return {
        altitude,
        azimuth
      };
    } catch (error) {
      console.error('Error calculating alt/az', error);
      return {
        altitude: 45, // default value
        azimuth: 180, // default value
      };
    }
  };

  // Calculate Local Sidereal Time (LST)
  const getLST = (date: Date = new Date()): string => {
    // Get the time in UTC
    const now = new Date(date);
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    
    // Get the date in UTC
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth() + 1; // JavaScript months are 0-based
    const utcDay = now.getUTCDate();
    
    // Calculate the Julian Date (simplified)
    let jd = 367 * utcYear - Math.floor(7 * (utcYear + Math.floor((utcMonth + 9) / 12)) / 4) + 
             Math.floor(275 * utcMonth / 9) + utcDay + 1721013.5 + 
             (utcHours + utcMinutes / 60 + utcSeconds / 3600) / 24;
    
    // Calculate the Greenwich Sidereal Time (GST)
    const t = (jd - 2451545.0) / 36525;
    let gst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - t * t * t / 38710000;
    gst = gst % 360;
    
    // Calculate hours, minutes, seconds from GST
    const gstHours = Math.floor(gst / 15);
    const gstMinutes = Math.floor((gst / 15 - gstHours) * 60);
    const gstSeconds = Math.floor(((gst / 15 - gstHours) * 60 - gstMinutes) * 60);
    
    // Format as a string HH:MM:SS
    return `${gstHours.toString().padStart(2, '0')}:${gstMinutes.toString().padStart(2, '0')}:${gstSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate the telescope's altitude and azimuth from RA and DEC
  const calculateAltAz = (
    ra: string,
    dec: string,
    latitude: number,
    longitude: number,
    timestamp = new Date()
  ): { altitude: number; azimuth: number } => {
    const lst = getLST(timestamp);
    return getAzimuthAltitude(ra, dec, lst);
  };
  
  return {
    calculateAltAz,
    getAzimuthAltitude,
    getLST
  };
}

// Format RA (Right Ascension) for display
export function formatRA(ra: string | undefined): string {
  if (!ra) return "N/A";
  
  // RA is typically in the format "00h 00m 00s"
  return ra;
}

// Format DEC (Declination) for display
export function formatDEC(dec: string | undefined): string {
  if (!dec) return "N/A";
  
  // DEC is typically in the format "+00° 00' 00\""
  return dec;
}

// Get the telescope's status display information
export function getTelescopeStatusInfo(status: string): {
  color: string;
  label: string;
  icon: string;
} {
  switch (status.toLowerCase()) {
    case "active":
      return {
        color: "text-green-500",
        label: "Active",
        icon: "circle-check"
      };
    case "standby":
      return {
        color: "text-yellow-500",
        label: "Standby",
        icon: "circle-pause"
      };
    case "offline":
      return {
        color: "text-gray-500",
        label: "Offline",
        icon: "circle-x"
      };
    case "maintenance":
      return {
        color: "text-red-500",
        label: "Maintenance",
        icon: "wrench"
      };
    default:
      return {
        color: "text-gray-400",
        label: status,
        icon: "circle-question"
      };
  }
}

// Check if telescope is operational
export function isTelescopeOperational(telescope: Telescope): boolean {
  return ["active", "standby"].includes(telescope.status.toLowerCase());
}

// Get common celestial targets with coordinates
export const commonTargets = [
  { name: "Sun", ra: "Variable", dec: "Variable" },
  { name: "Moon", ra: "Variable", dec: "Variable" },
  { name: "Mercury", ra: "Variable", dec: "Variable" },
  { name: "Venus", ra: "Variable", dec: "Variable" },
  { name: "Mars", ra: "Variable", dec: "Variable" },
  { name: "Jupiter", ra: "03h 29m 08s", dec: "+17° 02' 28\"" },
  { name: "Saturn", ra: "21h 08m 28s", dec: "-16° 26' 37\"" },
  { name: "Uranus", ra: "02h 40m 49s", dec: "+15° 12' 41\"" },
  { name: "Neptune", ra: "23h 29m 06s", dec: "-04° 20' 12\"" },
  { name: "M1 (Crab Nebula)", ra: "05h 34m 32s", dec: "+22° 00' 52\"" },
  { name: "M31 (Andromeda Galaxy)", ra: "00h 42m 44s", dec: "+41° 16' 9\"" },
  { name: "M42 (Orion Nebula)", ra: "05h 35m 17s", dec: "-05° 23' 28\"" },
  { name: "M45 (Pleiades)", ra: "03h 47m 24s", dec: "+24° 07' 00\"" },
  { name: "M51 (Whirlpool Galaxy)", ra: "13h 29m 53s", dec: "+47° 11' 43\"" },
  { name: "M57 (Ring Nebula)", ra: "18h 53m 35s", dec: "+33° 01' 45\"" },
  { name: "M81 (Bode's Galaxy)", ra: "09h 55m 33s", dec: "+69° 03' 55\"" },
];
