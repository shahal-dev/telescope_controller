import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WeatherBadge } from "@/components/ui/weather-badge";
import { Location, Telescope } from "@shared/schema";

interface LocationCardProps {
  location: Location;
  telescopes: Telescope[];
}

export function LocationCard({ location, telescopes }: LocationCardProps) {
  const getStatusIndicator = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          dot: "bg-green-500",
          label: "Online"
        };
      case "weather-alert":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          dot: "bg-red-500",
          label: "Weather Alert"
        };
      case "maintenance":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          dot: "bg-yellow-500",
          label: "Maintenance"
        };
      case "offline":
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          dot: "bg-gray-500",
          label: "Offline"
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          dot: "bg-gray-500",
          label: status
        };
    }
  };
  
  const getTelescopeStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case "standby":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Standby</Badge>;
      case "maintenance":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Maintenance</Badge>;
      case "offline":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Offline</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const indicator = getStatusIndicator(location.status);

  return (
    <Card className="location-card bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:cursor-pointer hover:transform hover:-translate-y-1 hover:shadow-blue-900/40"
      style={{
        backgroundImage: `linear-gradient(rgba(17, 24, 39, 0.75), rgba(17, 24, 39, 0.90)), url('https://images.unsplash.com/${
          location.name.toLowerCase().includes("dhaka") ? "photo-1615376550439-9384818d1f38" : 
          location.name.toLowerCase().includes("chittagong") ? "photo-1499578124509-1611b77778c8" :
          location.name.toLowerCase().includes("cox") ? "photo-1531906484431-6686f1bbd187" :
          location.name.toLowerCase().includes("rangpur") ? "photo-1516339901601-2e1392d93f58" :
          "photo-1462331940025-496dfbfc7564"
        }?auto=format&fit=crop&w=800&q=60')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-white">{location.name}</h2>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${indicator.bg} ${indicator.text}`}>
            <span className={`h-2 w-2 rounded-full ${indicator.dot} mr-1`}></span>
            {indicator.label}
          </span>
        </div>
        
        {location.weatherData && (
          <div className="mt-3">
            <WeatherBadge
              condition={location.weatherData.condition}
              temperature={location.weatherData.temperature}
              humidity={location.weatherData.humidity}
              visibility={location.weatherData.visibility}
              seeing={location.weatherData.seeing}
            />
          </div>
        )}
        
        <div className="mt-4">
          <p className="text-gray-400 text-sm mb-2">Telescopes</p>
          <div className="space-y-2">
            {telescopes.length > 0 ? (
              telescopes.map((telescope) => (
                <div key={telescope.id} className="flex justify-between items-center bg-gray-700 bg-opacity-40 rounded p-2">
                  <Link href={`/telescope/${telescope.id}`}>
                    <span className="text-white hover:text-blue-300 transition-colors cursor-pointer">
                      {telescope.name}
                    </span>
                  </Link>
                  {getTelescopeStatusBadge(telescope.status)}
                </div>
              ))
            ) : (
              <div className="flex justify-center items-center bg-gray-700 bg-opacity-40 rounded p-2">
                <span className="text-gray-400">No telescopes available</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
