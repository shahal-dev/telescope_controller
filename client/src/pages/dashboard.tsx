import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LocationCard } from "@/components/dashboard/location-card";
import { Location, Telescope } from "@shared/schema";

async function fetchLocations() {
  const response = await fetch('/api/locations');
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }
  return response.json();
}

async function fetchTelescopes() {
  const response = await fetch('/api/telescopes');
  if (!response.ok) {
    throw new Error('Failed to fetch telescopes');
  }
  return response.json();
}

export default function Dashboard() {
  const [locationTelescopes, setLocationTelescopes] = useState<Record<number, Telescope[]>>({});
  
  // Fetch all locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations
  });
  
  // Fetch all telescopes
  const { data: telescopes = [], isLoading: telescopesLoading } = useQuery({
    queryKey: ['telescopes'],
    queryFn: fetchTelescopes
  });
  
  // Group telescopes by location
  useEffect(() => {
    if (telescopes.length > 0) {
      const telescopesByLocation: Record<number, Telescope[]> = {};
      
      telescopes.forEach((telescope: Telescope) => {
        if (!telescopesByLocation[telescope.locationId]) {
          telescopesByLocation[telescope.locationId] = [];
        }
        telescopesByLocation[telescope.locationId].push(telescope);
      });
      
      setLocationTelescopes(telescopesByLocation);
    }
  }, [telescopes]);
  
  const isLoading = locationsLoading || telescopesLoading;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'url(/background.jpg)' }}
    >
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-lg">Telescope Locations</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading locations and telescopes...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">No locations available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location: Location) => (
              <LocationCard
                key={location.id}
                location={location}
                telescopes={locationTelescopes[location.id] || []}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
