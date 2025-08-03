import { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Crosshair, Telescope, Plane, Milk } from "lucide-react";

interface SkyMapProps {
  targetRA?: string;
  targetDEC?: string;
  targetName?: string;
  onSelectObject: (object: { name: string; ra: string; dec: string }) => void;
  className?: string;
}

declare global {
  interface Window {
    A: any; // Aladin Lite namespace
  }
}

export function SkyMap({ targetRA, targetDEC, targetName, onSelectObject, className }: SkyMapProps) {
  const containerId = `aladin-map-${Math.random().toString(36).substr(2, 9)}`;
  const aladinRef = useRef<any>(null);

  useEffect(() => {
    // Load Aladin Lite script if not already loaded
    if (!document.getElementById('aladin-script')) {
      const script = document.createElement('script');
      script.id = 'aladin-script';
      script.src = 'https://aladin.u-strasbg.fr/AladinLite/api/v3/latest/aladin.js';
      script.async = true;
      script.onload = () => {
        initAladin();
      };
      document.body.appendChild(script);
    } else {
      // If script is already loaded, initialize directly
      initAladin();
    }

    return () => {
      if (aladinRef.current) {
        // Clean up Aladin instance if needed
        aladinRef.current = null;
      }
    };
  }, [containerId]);

  // Update target when coordinates change
  useEffect(() => {
    if (aladinRef.current && targetRA && targetDEC) {
      aladinRef.current.gotoRaDec(targetRA, targetDEC);
    }
  }, [targetRA, targetDEC]);

  const initAladin = () => {
    if (!window.A) return;

    // Wait for the container to be available
    const container = document.getElementById(containerId);
    if (!container) return;

    // Initialize Aladin Lite
    const aladin = window.A.aladin(`#${containerId}`, {
      survey: 'P/DSS2/color',
      fov: 60,
      target: targetName || 'M31',
      cooFrame: 'icrs',
      showReticle: true,
      showZoomControl: false,
      showFullscreenControl: false,
      showLayersControl: false,
      showGotoControl: false,
      showShareControl: false,
      showCatalog: true,
      projection: 'SIN',
    });

    aladinRef.current = aladin;

    // Add catalogs
    aladin.addCatalog(window.A.catalogFromVizieR('I/345/gaia2', {
      onClick: 'showPopup',
      name: 'Gaia DR2'
    }));
    
    // Set up click handler
    aladin.on('objectClicked', function(object: any) {
      if (object && object.data) {
        const ra = object.ra.toFixed(6);
        const dec = object.dec.toFixed(6);
        onSelectObject({
          name: object.data.name || `GAIA ${object.data.Source}`,
          ra: ra,
          dec: dec,
        });
      }
    });

    // If we have target coordinates, go there
    if (targetRA && targetDEC) {
      aladin.gotoRaDec(targetRA, targetDEC);
    }
  };

  const handleZoomIn = () => {
    if (aladinRef.current) {
      aladinRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (aladinRef.current) {
      aladinRef.current.zoomOut();
    }
  };

  const handleCenter = () => {
    if (aladinRef.current && targetRA && targetDEC) {
      aladinRef.current.gotoRaDec(targetRA, targetDEC);
    }
  };

  return (
    <div className="relative">
      {/* Sky Map Controls */}
      <div className="absolute top-2 right-2 z-10 flex space-x-2">
        <Button 
          variant="outline"
          size="sm"
          className="bg-gray-900/80 border-blue-800 text-blue-300 hover:bg-blue-900/30"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline"
          size="sm"
          className="bg-gray-900/80 border-blue-800 text-blue-300 hover:bg-blue-900/30"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline"
          size="sm"
          className="bg-gray-900/80 border-blue-800 text-blue-300 hover:bg-blue-900/30"
          onClick={handleCenter}
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>

      {/* Aladin Container */}
      <div 
        id={containerId}
        className={`h-[500px] shadow-[0_0_15px_rgba(59,130,246,0.3)] rounded-lg overflow-hidden ${className}`}
      />
    </div>
  );
} 