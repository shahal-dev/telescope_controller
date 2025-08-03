import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterType } from "./filter-wheel";
import { useToast } from "@/hooks/use-toast";

interface ExposureControlProps {
  selectedFilter: FilterType;
  numExposures: number;
  exposureTime: number;
  onExposureStart: () => void;
}

export function ExposureControl({ 
  selectedFilter, 
  numExposures, 
  exposureTime,
  onExposureStart 
}: ExposureControlProps) {
  const { toast } = useToast();

  const handleStartExposure = () => {
    toast({
      title: "Starting Exposure Sequence",
      description: `Taking ${numExposures} exposures at ${exposureTime.toFixed(3)}s with ${selectedFilter} filter`,
    });
    onExposureStart();
  };

  return (
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
          onClick={handleStartExposure}
        >
          <Camera className="h-6 w-6 mr-3" />
          START EXPOSURE SEQUENCE
        </Button>
      </div>
    </div>
  );
} 