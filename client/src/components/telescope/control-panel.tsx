import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { SkyMap, SkyMapRef } from "@/components/ui/sky-map";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Telescope as TelescopeType } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getTelescopeUtils } from "@/lib/telescope-utils";
import { 
  ZoomIn, ZoomOut, Crosshair, Home, Star, Telescope, 
  Plane, Milk, Power, Search, Camera, Focus, Target,
  ChevronRight, Thermometer, Timer, Layers, Maximize 
} from 'lucide-react';

interface ControlPanelProps {
  telescope: TelescopeType;
}

type MovementSpeed = "1x" | "10x" | "100x";
type FilterType = "Clear" | "Red" | "Green" | "Blue" | "Ha" | "OIII" | "SII" | "IR742" | "IR807" | "UV/IR Cut" | "Focus" | "Dark";
type TargetType = "Star" | "Galaxy" | "Planet" | "Other";
type JogUnit = "Steps" | "Microns" | "Inches";

/**
 * This component shows a complete telescope control panel with sky map integration.
 * Note: For a simpler/direct approach to initializing Aladin, you could use:
 * 
 * ```
 * // Simple Aladin initialization example
 * useEffect(() => {
 *   if (window.A) {
 *     window.A.init.then(() => {
 *       const aladin = window.A.aladin('#aladin-lite-div', {
 *         fov: 1, 
 *         target: 'M81',
 *         cooFrame: 'J2000',
 *         reticleColor: 'rgb(255, 50, 50)'
 *       });
 *     });
 *   }
 * }, []);
 * ```
 */
export function ControlPanel({ telescope }: ControlPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [raInput, setRaInput] = useState("");
  const [decInput, setDecInput] = useState("");
  const [objectInput, setObjectInput] = useState("");
  const [speed, setSpeed] = useState<MovementSpeed>("1x");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("Clear");
  const [telescopeStatus, setTelescopeStatus] = useState({
    connection: "Connected",
    mountStatus: "Tracking",
    guiding: "Manual",
    camera: "Ready",
    power: "90%"
  });
  const [skyMapOptions, setSkyMapOptions] = useState({
    stars: true,
    dsos: true,
    planets: true,
    milkyWay: true
  });
  const [tracking, setTracking] = useState(true);
  const [targetType, setTargetType] = useState<TargetType>("Star");
  const [targetName, setTargetName] = useState("");
  const [numExposures, setNumExposures] = useState(1);
  const [exposureTime, setExposureTime] = useState(30);
  const [focuserPosition, setFocuserPosition] = useState(5000);
  const [jogAmount, setJogAmount] = useState(100);
  const [jogUnit, setJogUnit] = useState<JogUnit>("Steps");
  const [guiderEnabled, setGuiderEnabled] = useState(false);
  const [guiderError, setGuiderError] = useState({ x: 0.0, y: 0.0 });
  
  // Create ref for the SkyMap component
  const skyMapRef = useRef<SkyMapRef>(null);
  
  // Connect to WebSocket for telescope control
  const { sendMessage, lastMessage, connected } = useWebSocket(
    telescope.id, 
    (response) => {
      if (response.type === 'log') {
        queryClient.invalidateQueries({ queryKey: [`/api/logs?telescopeId=${telescope.id}`] });
      }
    }
  );
  
  // Handle sky map controls
  const handleZoomIn = () => {
    if (skyMapRef.current) {
      skyMapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (skyMapRef.current) {
      skyMapRef.current.zoomOut();
    }
  };

  const handleCenterOnTarget = () => {
    if (skyMapRef.current) {
      skyMapRef.current.centerOnTarget();
    }
  };
  
  // Handle telescope movement
  const handleMove = (direction: string) => {
    sendMessage({
      type: 'move',
      telescope: telescope.id,
      params: { direction, speed }
    });
    
    toast({
      title: "Telescope Movement",
      description: `Moving ${direction} at ${speed} speed`,
    });
  };
  
  // Handle telescope go to command
  const handleGoTo = (
    target?: string, 
    ra: string = raInput, 
    dec: string = decInput
  ) => {
    if ((!target && (!ra || !dec))) {
      toast({
        title: "Invalid coordinates",
        description: "Please enter RA and DEC or select an object",
        variant: "destructive",
      });
      return;
    }
    
    sendMessage({
      type: 'goto',
      telescope: telescope.id,
      params: { target, ra, dec }
    });
    
    toast({
      title: "Telescope Command",
      description: `Slewing to ${target || 'coordinates'}`,
    });
  };
  
  // Handle search for objects
  const handleSearch = () => {
    if (!objectInput.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter an object name or ID",
        variant: "destructive",
      });
      return;
    }
    
    // In a real application, this would search a database or API
    // For now, we'll simulate a not found result
    toast({
      title: "Object Search",
      description: `Searching for ${objectInput}...`,
    });
    
    // Simulate a search delay
    setTimeout(() => {
      toast({
        title: "Object Not Found",
        description: `Could not find object "${objectInput}"`,
        variant: "destructive",
      });
    }, 1500);
  };
  
  // Handle object selection from sky map
  const handleObjectSelect = (object: { name: string; ra: string; dec: string }) => {
    setRaInput(object.ra);
    setDecInput(object.dec);
    setObjectInput(object.name);
    
    toast({
      title: "Object Selected",
      description: `${object.name} selected with coordinates ${object.ra} ${object.dec}`,
    });
  };
  
  // Handle filter selection
  const handleFilterSelect = (filter: FilterType) => {
    setSelectedFilter(filter);
    sendMessage({
      type: 'camera',
      telescope: telescope.id,
      params: { filter }
    });
    
    toast({
      title: "Filter Changed",
      description: `Switched to ${filter} filter`,
    });
  };
  
  // Update telescope data mutation
  const updateTelescopeMutation = useMutation({
    mutationFn: (telescopeData: Partial<TelescopeType>) => {
      return apiRequest("PATCH", `/api/telescopes/${telescope.id}`, telescopeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/telescopes/${telescope.id}`] });
    },
  });

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black text-white min-h-screen">
      <div className="flex flex-col max-w-screen-2xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b border-blue-900/40 bg-gradient-to-r from-gray-900 to-blue-900/20">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
              Live Telescope Control
            </h1>
            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              Connected
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-400">
              Last Updated: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex space-x-4">
              <button className="text-sm text-blue-300 hover:text-blue-200 transition-colors flex items-center">
                <span className="mr-1">?</span> Help
              </button>
              <button className="text-sm text-blue-300 hover:text-blue-200 transition-colors flex items-center">
                <span className="mr-1">⚙️</span> Settings
              </button>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row px-6 py-6 gap-6">
          {/* Left Column - Sky Map, Previews, Observatory, Telescope Controls */}
          <div className="lg:w-7/12 space-y-4">
            {/* Sky Map Header */}
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-blue-300">
                  {telescope.name}
                </h2>
                <p className="text-sm text-gray-400">
                  Interactive Sky View
                </p>
              </div>
              
              {/* Sky Map Controls */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-900/60 border-blue-800 text-blue-300 hover:bg-blue-900/30"
                  onClick={handleZoomIn}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-900/60 border-blue-800 text-blue-300 hover:bg-blue-900/30"
                  onClick={handleZoomOut}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-900/60 border-blue-800 text-blue-300 hover:bg-blue-900/30"
                  onClick={handleCenterOnTarget}
                >
                  <Crosshair className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sky Map Container */}
            <div className="relative rounded-lg overflow-hidden bg-gray-950 border border-blue-900/30">
              {/* Sky Map Options */}
              <div className="absolute top-2 right-2 z-10 flex space-x-2">
                <Button 
                  variant="outline"
                  size="sm"
                  className={`bg-gray-900/80 border-blue-800 ${
                    skyMapOptions.stars ? 'text-yellow-300' : 'text-gray-400'
                  } hover:bg-blue-900/30`}
                  onClick={() => setSkyMapOptions(prev => ({ ...prev, stars: !prev.stars }))}
                >
                  <Star className="h-4 w-4 mr-1" /> Stars
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className={`bg-gray-900/80 border-blue-800 ${
                    skyMapOptions.dsos ? 'text-purple-300' : 'text-gray-400'
                  } hover:bg-blue-900/30`}
                  onClick={() => setSkyMapOptions(prev => ({ ...prev, dsos: !prev.dsos }))}
                >
                  <Telescope className="h-4 w-4 mr-1" /> DSOs
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className={`bg-gray-900/80 border-blue-800 ${
                    skyMapOptions.planets ? 'text-orange-300' : 'text-gray-400'
                  } hover:bg-blue-900/30`}
                  onClick={() => setSkyMapOptions(prev => ({ ...prev, planets: !prev.planets }))}
                >
                  <Plane className="h-4 w-4 mr-1" /> Planets
                </Button>
              </div>

              <SkyMap 
                ref={skyMapRef}
                targetRA={telescope.rightAscension || raInput || undefined}
                targetDEC={telescope.declination || decInput || undefined}
                targetName={telescope.targetObject || targetName || undefined}
                onSelectObject={handleObjectSelect}
                className="h-[500px] shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              />
            </div>
            
            {/* Camera Previews */}
            <div className="grid grid-cols-2 gap-4">
              {/* All Sky Camera */}
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 rounded-lg shadow-md border border-blue-900/30">
                <h3 className="text-blue-300 text-sm font-semibold mb-2 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
                  All Sky Camera
                </h3>
                <div className="h-48 bg-gray-950 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                  <div className="relative h-32 w-32 bg-gradient-to-br from-white/90 to-white/70 rounded-full flex-shrink-0">
                    <div className="absolute inset-1 rounded-full bg-blue-100"></div>
                  </div>
                </div>
              </div>

              {/* Last Image */}
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 rounded-lg shadow-md border border-blue-900/30">
                <h3 className="text-blue-300 text-sm font-semibold mb-2 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                  Last Image
                </h3>
                <div className="h-48 bg-gray-950 rounded-lg overflow-hidden shadow-inner">
                  <img 
                    src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80" 
                    alt="Last capture"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Observatory Info */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-md p-4 border border-blue-900/30">
              <h3 className="text-blue-300 text-sm font-semibold mb-3 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
                Observatory Status
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-900/60 px-3 py-2 rounded">
                  <p className="text-gray-400">Roof</p>
                  <p className="text-red-500 font-medium">Closed</p>
                </div>
                <div className="bg-gray-900/60 px-3 py-2 rounded">
                  <p className="text-gray-400">UTC</p>
                  <p className="text-green-500 font-medium">{new Date().toISOString().slice(11, 19)}</p>
                </div>
                <div className="bg-gray-900/60 px-3 py-2 rounded">
                  <p className="text-gray-400">LST</p>
                  <p className="text-green-500 font-medium">{getTelescopeUtils().getLST()}</p>
                </div>
                <div className="bg-gray-900/60 px-3 py-2 rounded">
                  <p className="text-gray-400">Date</p>
                  <p className="text-blue-400 font-medium">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-900/60 px-3 py-2 rounded">
                  <p className="text-gray-400">Time</p>
                  <p className="text-blue-400 font-medium">{new Date().toLocaleTimeString()}</p>
                </div>
                <div className="bg-gray-900/60 px-3 py-2 rounded">
                  <p className="text-gray-400">User</p>
                  <p className="text-blue-400 font-medium">Admin</p>
                </div>
              </div>
            </div>

            {/* Telescope Controls */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-md p-4 border border-blue-900/30">
              <h3 className="text-blue-300 text-sm font-semibold mb-3 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-400 mr-2"></span>
                Telescope Controls
              </h3>
              
              <div className="space-y-3">
                {/* Tracking Controls */}
                <div className="flex items-center space-x-3">
                  <Button
                    variant={tracking ? "default" : "outline"}
                    className={tracking 
                      ? "bg-green-600 hover:bg-green-500"
                      : "border-red-800 text-red-300 hover:bg-red-900/30"}
                    onClick={() => setTracking(!tracking)}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Tracking {tracking ? "On" : "Off"}
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
                    onClick={() => {/* Set Tracking */}}
                  >
                    Set Tracking
                  </Button>
                </div>

                {/* Target Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Target Type</label>
                    <select 
                      className="w-full bg-gray-900 border border-blue-800 text-white p-2 text-sm rounded-md"
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value as TargetType)}
                    >
                      <option>Star</option>
                      <option>Galaxy</option>
                      <option>Planet</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Target Name</label>
                    <input
                      type="text"
                      className="w-full bg-gray-900 border border-blue-800 text-white p-2 text-sm rounded-md"
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      placeholder="e.g., M31"
                    />
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600"
                  onClick={() => {/* Lookup coordinates */}}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Lookup RA & DEC
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Right Ascension</label>
                    <input
                      type="text"
                      className="w-full bg-gray-900 border border-blue-800 text-white p-2 text-sm rounded-md"
                      value={raInput}
                      onChange={(e) => setRaInput(e.target.value)}
                      placeholder="00h 00m 00s"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Declination</label>
                    <input
                      type="text"
                      className="w-full bg-gray-900 border border-blue-800 text-white p-2 text-sm rounded-md"
                      value={decInput}
                      onChange={(e) => setDecInput(e.target.value)}
                      placeholder="+00° 00' 00"
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
                    onClick={() => handleGoTo()}
                  >
                    SLEW
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600"
                    onClick={() => {/* Home telescope */}}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    HOME
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Controls */}
          <div className="lg:w-5/12 space-y-4">
            {/* Imaging Device */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-md p-4 border border-blue-900/30">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-blue-300 text-sm font-semibold flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-2"></span>
                  Imaging Device
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="text-xs text-green-400">Ready</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex space-x-2">
                  <select className="flex-1 bg-gray-900 border border-blue-800 text-white p-2 text-sm rounded-md">
                    <option>Main Camera</option>
                    <option>Guide Camera</option>
                    <option>All-Sky Camera</option>
                  </select>
                  <Button
                    variant="outline"
                    className="border-blue-800 text-blue-300 hover:bg-blue-900/30"
                  >
                    Change
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-gray-900/60 p-2 rounded-md">
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="text-sm text-green-400">Connected</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Temperature</p>
                    <p className="text-sm text-blue-400">-20.5°C</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Number of Exposures</label>
                    <input
                      type="number"
                      className="w-full bg-gray-900 border border-blue-800 text-white p-2 text-sm rounded-md"
                      value={numExposures}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          setNumExposures(value);
                        }
                      }}
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Exposure Time (s)</label>
                    <input
                      type="number"
                      className="w-full bg-gray-900 border border-blue-800 text-white p-2 text-sm rounded-md"
                      value={exposureTime}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          setExposureTime(value);
                        }
                      }}
                      min="0.001"
                      step="0.001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Auto Guider */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-md p-4 border border-blue-900/30">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-blue-300 text-sm font-semibold flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 mr-2"></span>
                  Auto Guider
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
                  <span className="text-xs text-yellow-400">Standby</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-900/60 p-2 rounded-md">
                    <p className="text-xs text-gray-400">Error X</p>
                    <p className="text-sm text-blue-400">{guiderError.x.toFixed(2)}"</p>
                  </div>
                  <div className="bg-gray-900/60 p-2 rounded-md">
                    <p className="text-xs text-gray-400">Error Y</p>
                    <p className="text-sm text-blue-400">{guiderError.y.toFixed(2)}"</p>
                  </div>
                </div>

                <Button
                  variant={guiderEnabled ? "default" : "outline"}
                  className={`w-full ${
                    guiderEnabled 
                      ? "bg-green-600 hover:bg-green-500"
                      : "border-blue-800 text-blue-300 hover:bg-blue-900/30"
                  }`}
                  onClick={() => setGuiderEnabled(!guiderEnabled)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  {guiderEnabled ? "DISABLE" : "ENABLE"} GUIDING
                </Button>
              </div>
            </div>

            {/* Filter Wheel */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-md p-4 border border-blue-900/30">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-blue-300 text-sm font-semibold flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-2"></span>
                  Filter Wheel
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="text-xs text-green-400">Ready</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex space-x-2">
                  <select 
                    className="flex-1 bg-gray-900 border border-blue-800 text-white p-2 text-sm rounded-md"
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
                  >
                    <option value="Clear">Clear</option>
                    <option value="Red">Red</option>
                    <option value="Green">Green</option>
                    <option value="Blue">Blue</option>
                    <option value="Ha">Ha</option>
                    <option value="OIII">OIII</option>
                    <option value="SII">SII</option>
                    <option value="IR742">IR742</option>
                    <option value="IR807">IR807</option>
                    <option value="UV/IR Cut">UV/IR Cut</option>
                    <option value="Focus">Focus</option>
                    <option value="Dark">Dark</option>
                  </select>
                  <Button
                    variant="outline"
                    className="border-blue-800 text-blue-300 hover:bg-blue-900/30"
                    onClick={() => {/* Handle filter change */}}
                  >
                    Change
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-gray-900/60 p-2 rounded-md">
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="text-sm text-green-400">Connected</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Temperature</p>
                    <p className="text-sm text-blue-400">-20.5°C</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Focuser */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-md p-4 border border-blue-900/30">
              <h3 className="text-blue-300 text-sm font-semibold mb-3 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                Focuser
              </h3>

              <div className="space-y-3">
                <div className="bg-gray-900/60 p-2 rounded-md">
                  <p className="text-xs text-gray-400">Current Position</p>
                  <p className="text-lg text-yellow-400 font-medium">{focuserPosition}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Jog Amount</label>
                    <input
                      type="number"
                      className="w-full bg-gray-900 border border-blue-800 text-white p-2 text-sm rounded-md"
                      value={jogAmount}
                      onChange={(e) => setJogAmount(parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Units</label>
                    <select
                      className="w-full bg-gray-900 border border-blue-800 text-white p-2 text-sm rounded-md"
                      value={jogUnit}
                      onChange={(e) => setJogUnit(e.target.value as JogUnit)}
                    >
                      <option>Steps</option>
                      <option>Microns</option>
                      <option>Inches</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600"
                  >
                    <Focus className="h-4 w-4 mr-2" />
                    JOG FOCUSER
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600"
                  >
                    AUTO FOCUS
                  </Button>
                </div>
                
              </div>
              
            </div>
            {/* Final Expose Button */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-md p-4 border border-blue-900/30">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 bg-gray-900/60 p-2 rounded-md">
                  <div>
                    <p className="text-xs text-gray-400">Selected Filter</p>
                    <p className="text-sm text-blue-400">{selectedFilter}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Exposure Settings</p>
                    <p className="text-sm text-blue-400">{numExposures}x {exposureTime.toFixed(3)}s</p>
                  </div>
                </div>
                
                <Button
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 transition-all duration-200 transform hover:scale-[1.02]"
                  onClick={() => {
                    toast({
                      title: "Starting Exposure Sequence",
                      description: `Taking ${numExposures} exposures at ${exposureTime.toFixed(3)}s with ${selectedFilter} filter`,
                    });
                    /* Handle exposure */
                  }}
                >
                  <Camera className="h-6 w-6 mr-3" />
                  START EXPOSURE SEQUENCE
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
