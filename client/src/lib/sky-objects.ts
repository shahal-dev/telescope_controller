// Sky objects for the demo sky map
export const celestialObjects = [
  {
    name: "M31",
    ra: "00h 42m 44s",
    dec: "+41° 16' 9\"",
    type: "Galaxy",
    magnitude: "3.4",
    color: "#4f8aff"
  },
  {
    name: "M42",
    ra: "05h 35m 17s",
    dec: "-05° 23' 28\"",
    type: "Nebula",
    magnitude: "4.0",
    color: "#8a77e0"
  },
  {
    name: "M45",
    ra: "03h 47m 24s",
    dec: "+24° 07' 00\"",
    type: "Star Cluster",
    magnitude: "1.6",
    color: "#8ac4e0"
  },
  {
    name: "M51",
    ra: "13h 29m 53s",
    dec: "+47° 11' 43\"",
    type: "Galaxy",
    magnitude: "8.4",
    color: "#4f8aff"
  },
  {
    name: "M57",
    ra: "18h 53m 35s",
    dec: "+33° 01' 45\"",
    type: "Nebula",
    magnitude: "8.8",
    color: "#8a77e0"
  },
  {
    name: "M81",
    ra: "09h 55m 33s",
    dec: "+69° 03' 55\"",
    type: "Galaxy",
    magnitude: "6.9",
    color: "#4f8aff"
  },
  {
    name: "Jupiter",
    ra: "03h 29m 08s",
    dec: "+17° 02' 28\"",
    type: "Planet",
    magnitude: "-2.7",
    color: "#ffd166"
  },
  {
    name: "Saturn",
    ra: "21h 08m 28s",
    dec: "-16° 26' 37\"",
    type: "Planet",
    magnitude: "0.5",
    color: "#f8b886"
  },
  {
    name: "Sirius",
    ra: "06h 45m 09s",
    dec: "-16° 42' 58\"",
    type: "Star",
    magnitude: "-1.46",
    color: "#ffffff"
  },
  {
    name: "Vega",
    ra: "18h 36m 56s",
    dec: "+38° 47' 01\"",
    type: "Star",
    magnitude: "0.03",
    color: "#bfdfff"
  },
  {
    name: "Betelgeuse",
    ra: "05h 55m 10s",
    dec: "+07° 24' 25\"",
    type: "Star",
    magnitude: "0.5",
    color: "#ff8a5c"
  },
  {
    name: "Polaris",
    ra: "02h 31m 49s",
    dec: "+89° 15' 51\"",
    type: "Star",
    magnitude: "1.98",
    color: "#f8f5e6"
  }
];

// Star types with colors
export const starTypes = [
  { type: "O", color: "#9bb0ff", temperature: "≥ 30,000K", example: "Mintaka" },
  { type: "B", color: "#aabfff", temperature: "10,000–30,000K", example: "Rigel" },
  { type: "A", color: "#cad7ff", temperature: "7,500–10,000K", example: "Sirius" },
  { type: "F", color: "#f8f7ff", temperature: "6,000–7,500K", example: "Procyon" },
  { type: "G", color: "#fff4ea", temperature: "5,200–6,000K", example: "Sun" },
  { type: "K", color: "#ffd2a1", temperature: "3,700–5,200K", example: "Arcturus" },
  { type: "M", color: "#ffcc6f", temperature: "2,400–3,700K", example: "Betelgeuse" }
];

// Constellation data
export const constellations = [
  { name: "Orion", stars: ["Betelgeuse", "Rigel", "Bellatrix", "Mintaka"] },
  { name: "Ursa Major", stars: ["Dubhe", "Merak", "Phecda", "Megrez", "Alioth"] },
  { name: "Cassiopeia", stars: ["Schedar", "Caph", "Gamma Cas", "Ruchbah"] },
  { name: "Lyra", stars: ["Vega", "Sheliak", "Sulafat"] },
  { name: "Cygnus", stars: ["Deneb", "Albireo", "Sadr"] }
];
