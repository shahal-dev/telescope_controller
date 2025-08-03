import { Button } from "@/components/ui/button";

export type FilterType = "Clear" | "Red" | "Green" | "Blue" | "Ha" | "OIII" | "SII" | "IR742" | "IR807" | "UV/IR Cut" | "Focus" | "Dark";

interface FilterWheelProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function FilterWheel({ selectedFilter, onFilterChange }: FilterWheelProps) {
  return (
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
            onChange={(e) => onFilterChange(e.target.value as FilterType)}
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
  );
} 