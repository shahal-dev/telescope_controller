import { cn } from "@/lib/utils";

// Weather icon mapping
const weatherIcons = {
  "Clear Sky": "cloud-moon",
  "Clear": "moon",
  "Rain": "cloud-rain",
  "Cloudy": "cloud",
  "Partly Cloudy": "cloud-sun",
  "Overcast": "cloud",
  "Fog": "cloud-fog",
  "Snow": "cloud-snow",
  "Thunderstorm": "cloud-lightning",
};

type WeatherIconType = keyof typeof weatherIcons;

interface WeatherBadgeProps {
  condition: string;
  temperature: number;
  humidity: number;
  visibility: string;
  seeing: number;
  className?: string;
}

export function WeatherBadge({
  condition,
  temperature,
  humidity,
  visibility,
  seeing,
  className
}: WeatherBadgeProps) {
  const iconName = weatherIcons[condition as WeatherIconType] || "cloud";
  
  // Determine icon color based on condition
  const getIconColor = () => {
    switch (condition) {
      case "Clear Sky":
      case "Clear":
        return "text-blue-300";
      case "Partly Cloudy":
        return "text-yellow-200";
      case "Rain":
      case "Thunderstorm":
        return "text-blue-300";
      case "Snow":
        return "text-blue-100";
      default:
        return "text-gray-300";
    }
  };
  
  // Determine visibility indicator color
  const getVisibilityColor = () => {
    switch (visibility.toLowerCase()) {
      case "excellent":
        return "text-purple-400";
      case "very good":
      case "good":
        return "text-purple-400";
      case "fair":
        return "text-yellow-400";
      case "poor":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };
  
  const getVisibilityIcon = () => {
    if (visibility.toLowerCase() === "poor") {
      return "eye-slash";
    }
    return "eye";
  };

  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      <div>
        <p className="text-gray-400 text-sm">Weather</p>
        <div className="flex items-center mt-1">
          <i className={`fas fa-${iconName} ${getIconColor()} mr-2`}></i>
          <span className="text-white">{condition}</span>
        </div>
        <div className="mt-1">
          <span className="text-sm text-gray-300">{temperature}°C, Humidity: {humidity}%</span>
        </div>
      </div>
      <div>
        <p className="text-gray-400 text-sm">Visibility</p>
        <div className="flex items-center mt-1">
          <i className={`fas fa-${getVisibilityIcon()} ${getVisibilityColor()} mr-2`}></i>
          <span className="text-white">{visibility}</span>
        </div>
        <div className="mt-1">
          <span className="text-sm text-gray-300">Seeing: {seeing}/10</span>
        </div>
      </div>
    </div>
  );
}
