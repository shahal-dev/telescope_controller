import { useState } from "react";
import { SimpleSkyMap } from "../ui/simple-sky-map";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

/**
 * SimpleMapTest - A component to test the SimpleSkyMap
 * 
 * You can use this component to test if the Aladin initialization is working correctly.
 * It provides a minimal interface to change the target and field of view.
 */
export function SimpleMapTest() {
  const [target, setTarget] = useState("M81");
  const [fov, setFov] = useState(1);
  const [currentTarget, setCurrentTarget] = useState(target);
  const [currentFov, setCurrentFov] = useState(fov);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentTarget(target);
    setCurrentFov(fov);
  };
  
  return (
    <div className="p-6 max-w-screen-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Simple Aladin Sky Map Test</h1>
      
      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <Input
          placeholder="Target (e.g., M81, M42, Jupiter)"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="flex-1"
        />
        <Input
          type="number"
          placeholder="Field of View in degrees"
          value={fov}
          onChange={(e) => setFov(Number(e.target.value))}
          min="0.01"
          max="180"
          step="0.1"
          className="w-40"
        />
        <Button type="submit">Update Map</Button>
      </form>
      
      <div className="bg-gray-900 p-4 rounded-lg">
        <SimpleSkyMap target={currentTarget} fov={currentFov} height="500px" />
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p className="mb-2">
          This is a minimal implementation of Aladin Lite that uses the following code:
        </p>
        <pre className="bg-gray-800 p-4 rounded text-green-400 overflow-x-auto">
{`// Initialize Aladin using the simplified pattern
if (window.A && window.A.init) {
  window.A.init.then(() => {
    const aladin = window.A.aladin('#aladin-container', {
      target: '${currentTarget}',
      fov: ${currentFov},
      survey: "P/DSS2/color",
      cooFrame: "J2000",
      showReticle: true,
    });
  });
}`}
        </pre>
      </div>
    </div>
  );
} 