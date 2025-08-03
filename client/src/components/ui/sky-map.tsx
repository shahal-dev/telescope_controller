import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { celestialObjects } from "@/lib/sky-objects";
import { getTelescopeUtils } from "@/lib/telescope-utils";
import 'aladin-lite';

declare global {
  interface Window {
    A: any;
  }
}

interface SkyMapProps {
  className?: string;
  targetRA?: string;
  targetDEC?: string;
  targetName?: string;
  onSelectObject?: (object: { name: string; ra: string; dec: string }) => void;
  onReady?: (instance: any) => void;
}

// Survey data sources for Aladin
type SurveyId = 
  | "P/DSS2/color" 
  | "P/DSS2/red" 
  | "P/2MASS/color" 
  | "P/SDSS9/color" 
  | "P/Fermi/color" 
  | "P/Planck/color" 
  | "P/AKARI/FIS/Color" 
  | "P/GLIMPSE/color";

// Catalog IDs for Aladin
type CatalogId = 
  | "J/SIMBAD" 
  | "J/PEGASUS_I" 
  | "VI/342/smss" 
  | "VI/146/figaia2" 
  | "I/361/gaiadr3";

// Export an interface for the SkyMap ref
export interface SkyMapRef {
  zoomIn: () => void;
  zoomOut: () => void;
  centerOnTarget: () => void;
  setFov: (fov: number) => void;
}

export const SkyMap = forwardRef<SkyMapRef, SkyMapProps>(({
  className, 
  targetRA, 
  targetDEC, 
  targetName,
  onSelectObject,
  onReady
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const aladinRef = useRef<any>(null);
  const [coordinates, setCoordinates] = useState({ ra: "00h 00m 00s", dec: "+00° 00' 00\"" });
  const [currentSurvey, setCurrentSurvey] = useState<SurveyId>("P/DSS2/color");
  const [enabledCatalogs, setEnabledCatalogs] = useState<CatalogId[]>(["J/SIMBAD"]);
  const [fov, setFov] = useState(60); // Field of view in degrees
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generate unique container ID to avoid conflicts with multiple instances
  const containerId = useRef(`aladin-container-${Math.random().toString(36).substring(2, 9)}`);
  
  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (aladinRef.current) {
        const newFov = Math.max(fov * 0.5, 0.05);
        aladinRef.current.setFoV(newFov);
        setFov(newFov);
      }
    },
    zoomOut: () => {
      if (aladinRef.current) {
        const newFov = Math.min(fov * 2, 180);
        aladinRef.current.setFoV(newFov);
        setFov(newFov);
      }
    },
    centerOnTarget: () => {
      if (aladinRef.current && targetRA && targetDEC) {
        const targetCoords = `${targetRA} ${targetDEC}`;
        aladinRef.current.gotoObject(targetCoords);
        aladinRef.current.showReticle(true);
      }
    },
    setFov: (newFov: number) => {
      if (aladinRef.current) {
        aladinRef.current.setFoV(newFov);
        setFov(newFov);
      }
    }
  }));
  
  // Parse target coordinates properly
  const parseCoordinates = () => {
    if (!targetRA || !targetDEC) return null;
    return `${targetRA} ${targetDEC}`;
  };

  // Initialize Aladin library
  useEffect(() => {
    // Clear any previous errors
    setError(null);
    
    const initializeAladin = () => {
      if (window.A && window.A.init) {
        window.A.init.then(() => {
          setIsLoaded(true);
        }).catch((err: Error) => {
          setError(`Error in A.init: ${err.message}`);
        });
      } else {
        // Try again in a moment - script might be still loading
        setTimeout(initializeAladin, 100);
      }
    };
    
    try {
      // Check if Aladin script is already loaded
      if (!document.getElementById('aladin-script')) {
        // If not loaded, include the script
        const script = document.createElement('script');
        script.src = 'https://aladin.u-strasbg.fr/AladinLite/api/v3/latest/aladin.js';
        script.async = true;
        script.id = 'aladin-script';
        
        script.onload = () => {
          // Once the script loads, try to initialize
          initializeAladin();
        };
        
        script.onerror = () => {
          setError("Failed to load the Aladin script");
        };
        
        document.body.appendChild(script);
      } else {
        // Script tag exists, try to initialize
        initializeAladin();
      }
    } catch (err) {
      setError(`Error loading Aladin script: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    return () => {
      // Clean up any pending timers if component unmounts during loading
      // This isn't strictly necessary but is good practice
    };
  }, []);

  // Initialize Aladin Sky Atlas
  useEffect(() => {
    // Only proceed if the library is loaded and we have a map reference
    if (!isLoaded || !window.A || !mapRef.current) return;
    
    // Prevent multiple initializations
    if (aladinRef.current) return;
    
    try {
      // Create the Aladin instance directly without A.init.then() 
      // since we already waited for init in the script loading phase
      aladinRef.current = window.A.aladin(`#${containerId.current}`, {
        survey: currentSurvey,
        fov: fov,
        target: targetName || (targetRA && targetDEC ? `${targetRA} ${targetDEC}` : 'M31'),
        cooFrame: 'J2000',
        showReticle: Boolean(targetRA && targetDEC),
        reticleColor: 'rgb(255, 50, 50)',
        reticleSize: 32,
        showFullscreenControl: false,
        showLayersControl: true,
        showGotoControl: false,
        showZoomControl: true,
        showContextMenu: true,
        showCooGrid: true,
        fullScreen: false,
        showShareControl: false,
        showCatalog: true,
      });
      
      // Load catalogs
      enabledCatalogs.forEach(catalogId => {
        const catalog = window.A.catalogFromVizieR(catalogId, 
          catalogId === "J/SIMBAD" ? "SIMBAD objects" : 
          catalogId === "VI/342/smss" ? "SkyMapper Southern Survey" : 
          catalogId === "VI/146/figaia2" ? "GAIA" : 
          "Astronomical catalog", 
          { onClick: handleCatalogClick }
        );
        aladinRef.current.addCatalog(catalog);
      });
      
      // Create a marker for the target if coordinates and name are provided
      if (targetRA && targetDEC && targetName) {
        const targetCoords = `${targetRA} ${targetDEC}`;
        const markerCat = window.A.catalog({ name: 'Target', shape: 'circle', color: '#00ff00' });
        aladinRef.current.addCatalog(markerCat);
        markerCat.addSources([window.A.source(targetCoords, { name: targetName })]);
      }
      
      // Set up click handler
      aladinRef.current.on('objectClicked', function(object: any) {
        if (object && object.data && onSelectObject) {
          // Extract RA/DEC from Aladin format
          const { ra, dec } = object.data;
          // Format RA as "XXh XXm XXs"
          const raHour = Math.floor(ra / 15);
          const raMinRemainder = (ra / 15 - raHour) * 60;
          const raMin = Math.floor(raMinRemainder);
          const raSec = Math.floor((raMinRemainder - raMin) * 60);
          const formattedRA = `${raHour}h ${raMin}m ${raSec}s`;
          
          // Format DEC as "+/-XX° XX' XX""
          const decDeg = Math.floor(Math.abs(dec));
          const decMinRemainder = (Math.abs(dec) - decDeg) * 60;
          const decMin = Math.floor(decMinRemainder);
          const decSec = Math.floor((decMinRemainder - decMin) * 60);
          const formattedDEC = `${dec >= 0 ? '+' : '-'}${decDeg}° ${decMin}' ${decSec}"`;
          
          onSelectObject({
            name: object.data.name || "Unknown Object",
            ra: formattedRA,
            dec: formattedDEC
          });
          
          setCoordinates({ ra: formattedRA, dec: formattedDEC });
        }
      });
      
      // Notify parent component that the map is ready
      if (onReady) {
        onReady({
          zoomIn: () => {
            const newFov = Math.max(fov * 0.5, 0.05);
            aladinRef.current.setFoV(newFov);
            setFov(newFov);
          },
          zoomOut: () => {
            const newFov = Math.min(fov * 2, 180);
            aladinRef.current.setFoV(newFov);
            setFov(newFov);
          },
          centerOnTarget: () => {
            if (targetRA && targetDEC) {
              const targetCoords = `${targetRA} ${targetDEC}`;
              aladinRef.current.gotoObject(targetCoords);
              aladinRef.current.showReticle(true);
            }
          },
          setFov: (newFov: number) => {
            aladinRef.current.setFoV(newFov);
            setFov(newFov);
          }
        });
      }
    } catch (err) {
      setError(`Error initializing Aladin: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    // Cleanup on unmount
    return () => {
      if (aladinRef.current) {
        // There's no explicit destroy method in Aladin Lite
        // But we can clean up by removing our event listeners
        if (aladinRef.current.off) {
          aladinRef.current.off('objectClicked');
        }
        aladinRef.current = null;
      }
    };
  }, [isLoaded, targetRA, targetDEC, targetName, onSelectObject, onReady, currentSurvey, enabledCatalogs, fov]);
  
  // Handle catalog object click
  const handleCatalogClick = (data: any) => {
    if (data && onSelectObject) {
      // Extract coordinates from Aladin data format
      // This will vary depending on the catalog
      const name = data.name || data.main_id || "Unknown";
      
      // Format RA and DEC properly
      const formattedRA = data.ra || "00h 00m 00s";
      const formattedDEC = data.dec || "+00° 00' 00\"";
      
      onSelectObject({
        name,
        ra: formattedRA,
        dec: formattedDEC
      });
      
      setCoordinates({ ra: formattedRA, dec: formattedDEC });
    }
  };
  
  // Change the survey (background data)
  const changeSurvey = (newSurveyId: SurveyId) => {
    if (aladinRef.current) {
      aladinRef.current.setImageSurvey(newSurveyId);
      setCurrentSurvey(newSurveyId);
    }
  };
  
  // Toggle a catalog on/off
  const toggleCatalog = (catalogId: CatalogId) => {
    setEnabledCatalogs(prev => {
      if (prev.includes(catalogId)) {
        // Remove catalog
        if (aladinRef.current) {
          const catalogs = aladinRef.current.getCatalogs();
          for (let i = 0; i < catalogs.length; i++) {
            if (catalogs[i].name.includes(catalogId.replace('J/', ''))) {
              aladinRef.current.removeCatalog(catalogs[i]);
              break;
            }
          }
        }
        return prev.filter(c => c !== catalogId);
      } else {
        // Add catalog
        if (aladinRef.current) {
          const catalog = window.A.catalogFromVizieR(catalogId, 
            catalogId === "J/SIMBAD" ? "SIMBAD objects" : 
            catalogId === "VI/342/smss" ? "SkyMapper Southern Survey" : 
            catalogId === "VI/146/figaia2" ? "GAIA" : 
            "Astronomical catalog", 
            { onClick: handleCatalogClick }
          );
          aladinRef.current.addCatalog(catalog);
        }
        return [...prev, catalogId];
      }
    });
  };
  
  // Change the field of view
  const changeZoom = (newFov: number) => {
    if (aladinRef.current) {
      aladinRef.current.setFoV(newFov);
      setFov(newFov);
    }
  };
  
  // Get the current LST and AZ/ALT from utilities
  const { getLST, getAzimuthAltitude } = getTelescopeUtils();
  const lst = getLST(new Date());
  const { azimuth, altitude } = getAzimuthAltitude(targetRA || "00h 00m 00s", targetDEC || "+00° 00' 00\"", lst);

  return (
    <div className="space-y-2">
      {/* Error display */}
      {error && (
        <div className="bg-red-500/20 text-red-300 text-xs p-2 rounded-md">
          Error loading sky map: {error}
        </div>
      )}
      
      {/* Loading indicator */}
      {!isLoaded && !error && (
        <div className="flex justify-center items-center h-[400px] bg-gray-900 rounded-xl">
          <div className="text-blue-300">Loading Aladin Sky Map...</div>
        </div>
      )}
      
      {/* Aladin container */}
      <div className={cn("relative w-full h-[400px] rounded-xl overflow-hidden shadow-lg", !isLoaded && "hidden")}>
        <div id={containerId.current} ref={mapRef} className={cn("w-full h-full", className)}></div>
        
        {/* Top Controls Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 p-2 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center">
          <div className="flex space-x-2">
            <select 
              className="bg-gray-800/80 text-blue-300 text-xs rounded border border-gray-700 py-1 px-2"
              value={currentSurvey}
              onChange={(e) => changeSurvey(e.target.value as SurveyId)}
            >
              <option value="P/DSS2/color">DSS Color</option>
              <option value="P/DSS2/red">DSS Red</option>
              <option value="P/2MASS/color">2MASS</option>
              <option value="P/SDSS9/color">SDSS9</option>
              <option value="P/Fermi/color">Fermi</option>
              <option value="P/Planck/color">Planck</option>
              <option value="P/AKARI/FIS/Color">AKARI</option>
              <option value="P/GLIMPSE/color">GLIMPSE</option>
            </select>
          </div>
          
          <div className="bg-black/60 rounded px-2 py-1 text-blue-200 text-xs">
            {coordinates.ra} {coordinates.dec}
          </div>
          
          <div className="flex space-x-2">
            <button 
              className="bg-gray-800/80 text-blue-300 text-xs rounded border border-gray-700 py-1 px-2"
              onClick={() => changeZoom(Math.max(fov * 0.5, 0.05))}
            >
              Zoom +
            </button>
            <button 
              className="bg-gray-800/80 text-blue-300 text-xs rounded border border-gray-700 py-1 px-2"
              onClick={() => changeZoom(Math.min(fov * 2, 180))}
            >
              Zoom -
            </button>
          </div>
        </div>
        
        {/* Bottom Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center">
          <div className="text-gray-400 text-xs">
            FOV: {fov.toFixed(1)}°
          </div>
          
          {targetName && (
            <div className="bg-black/60 rounded px-2 py-1 text-green-400 text-xs flex space-x-4">
              <span>Target: {targetName}</span>
              <span>Az: {azimuth.toFixed(1)}°</span>
              <span>Alt: {altitude.toFixed(1)}°</span>
            </div>
          )}
          
          <div className="text-gray-400 text-xs">
            LST: {lst}
          </div>
        </div>
      </div>
      
      {/* Catalog Controls */}
      {isLoaded && !error && (
        <div className="flex space-x-2 text-xs justify-center">
          <label className="inline-flex items-center">
            <input 
              type="checkbox" 
              className="form-checkbox h-3 w-3" 
              checked={enabledCatalogs.includes("J/SIMBAD")}
              onChange={() => toggleCatalog("J/SIMBAD")}
            />
            <span className="ml-1 text-blue-200">SIMBAD</span>
          </label>
          <label className="inline-flex items-center">
            <input 
              type="checkbox" 
              className="form-checkbox h-3 w-3" 
              checked={enabledCatalogs.includes("VI/342/smss")}
              onChange={() => toggleCatalog("VI/342/smss")}
            />
            <span className="ml-1 text-blue-200">SkyMapper</span>
          </label>
          <label className="inline-flex items-center">
            <input 
              type="checkbox" 
              className="form-checkbox h-3 w-3" 
              checked={enabledCatalogs.includes("VI/146/figaia2")}
              onChange={() => toggleCatalog("VI/146/figaia2")}
            />
            <span className="ml-1 text-blue-200">GAIA</span>
          </label>
          <label className="inline-flex items-center">
            <input 
              type="checkbox" 
              className="form-checkbox h-3 w-3" 
              checked={aladinRef.current?.cooGrid?.isShowing || false}
              onChange={() => {
                if (aladinRef.current) {
                  aladinRef.current.showCooGrid(!aladinRef.current.cooGrid?.isShowing);
                }
              }}
            />
            <span className="ml-1 text-blue-200">Grid</span>
          </label>
        </div>
      )}
    </div>
  );
});
