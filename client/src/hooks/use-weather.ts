import { useState, useEffect } from "react";
import { WeatherData } from "@shared/schema";

// In a real app, this would fetch from a weather API
// For now, we'll just return mock data based on location
export function useWeather(locationId: number) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call to a weather service
        // For this demo, we'll fetch from our backend which already has weather data
        const response = await fetch(`/api/locations/${locationId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch weather data: ${response.status}`);
        }
        
        const locationData = await response.json();
        
        if (locationData.weatherData) {
          setWeather(locationData.weatherData);
          setError(null);
        } else {
          setError("No weather data available");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (locationId) {
      fetchWeather();
    }
    
    // Set up periodic refresh - every 15 minutes
    const intervalId = setInterval(() => {
      if (locationId) {
        fetchWeather();
      }
    }, 15 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [locationId]);
  
  // Function to update weather manually
  const refreshWeather = async () => {
    if (locationId) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/locations/${locationId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch weather data: ${response.status}`);
        }
        
        const locationData = await response.json();
        
        if (locationData.weatherData) {
          setWeather(locationData.weatherData);
          setError(null);
        } else {
          setError("No weather data available");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return { weather, isLoading, error, refreshWeather };
}
