import { useEffect, useRef, useState } from "react";

/**
 * SimpleSkyMap - A minimal implementation of Aladin Lite
 * This component shows the bare minimum needed to get Aladin working
 */
export function SimpleSkyMap({
  target = "M81",
  fov = 1,
  height = "400px"
}: {
  target?: string;
  fov?: number;
  height?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const containerId = useRef(`simple-aladin-${Math.random().toString(36).substring(2, 9)}`);
  const aladinRef = useRef<any>(null);
  
  useEffect(() => {
    // Load Aladin script if not already loaded
    if (!document.getElementById('aladin-script')) {
      const script = document.createElement('script');
      script.src = 'https://aladin.u-strasbg.fr/AladinLite/api/v3/latest/aladin.js';
      script.id = 'aladin-script';
      script.async = true;
      document.body.appendChild(script);
    }
    
    // Initialize Aladin using the simplified pattern
    const initAladin = () => {
      if (window.A && window.A.init) {
        window.A.init.then(() => {
          if (!aladinRef.current) {
            aladinRef.current = window.A.aladin(`#${containerId.current}`, {
              target,
              fov,
              survey: "P/DSS2/color",
              cooFrame: "J2000",
              reticleColor: "rgb(0, 255, 0)",
              showReticle: true,
            });
          }
        }).catch((err: Error) => {
          setError(`Aladin initialization error: ${err.message}`);
        });
      } else {
        // Script might be loading, wait a bit and try again
        setTimeout(initAladin, 100);
      }
    };
    
    // Start initialization process
    initAladin();
    
    return () => {
      // Simple cleanup
      aladinRef.current = null;
    };
  }, [target, fov]);
  
  return (
    <div style={{ position: "relative" }}>
      {error && (
        <div style={{ 
          color: "red", 
          backgroundColor: "rgba(255, 0, 0, 0.1)", 
          padding: "8px", 
          borderRadius: "4px",
          marginBottom: "8px"
        }}>
          {error}
        </div>
      )}
      <div 
        id={containerId.current} 
        style={{ 
          width: "100%", 
          height: height, 
          borderRadius: "8px", 
          overflow: "hidden" 
        }}
      />
    </div>
  );
} 