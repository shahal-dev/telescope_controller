import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, History, Plus } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SupernovaTarget, SupernovaDiscovery } from "@shared/schema";

interface SupernovaSearchProps {
  telescopeId: number;
}

export function SupernovaSearch({ telescopeId }: SupernovaSearchProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchForm, setSearchForm] = useState({
    galaxyType: "all",
    magnitudeLimit: "12",
    distanceMin: "0",
    distanceMax: "100",
    constellation: "any"
  });
  
  // Fetch supernova targets
  const { data: targets = [], isLoading: targetsLoading } = useQuery({
    queryKey: ['/api/supernova-targets'],
  });
  
  // Fetch supernova discoveries
  const { data: discoveries = [], isLoading: discoveriesLoading } = useQuery({
    queryKey: ['/api/supernova-discoveries'],
  });
  
  // Handle search form changes
  const handleSearchFormChange = (field: string, value: string) => {
    setSearchForm(prev => ({ ...prev, [field]: value }));
  };
  
  // Create a new target mutation
  const createTargetMutation = useMutation({
    mutationFn: (target: any) => {
      return apiRequest("POST", "/api/supernova-targets", target);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supernova-targets'] });
      toast({
        title: "Success",
        description: "Target added to search list",
      });
    }
  });
  
  // Search for target
  const handleSearch = (targetId: number) => {
    // In a real app, this would initiate an observation session for this target
    toast({
      title: "Search Initiated",
      description: "Starting observation of selected target",
    });
    
    // Simulating a new observation
    const target = targets.find((t: SupernovaTarget) => t.id === targetId);
    
    if (target) {
      // Create a log entry for this search
      apiRequest("POST", "/api/logs", {
        telescopeId: telescopeId,
        level: "info",
        message: `Searching for supernovae in ${target.name}`,
        timestamp: new Date(),
        data: { target }
      });
    }
  };
  
  // Handle view history
  const handleHistory = (targetId: number) => {
    const target = targets.find((t: SupernovaTarget) => t.id === targetId);
    
    if (target) {
      toast({
        title: "Observation History",
        description: `Viewing history for ${target.name}`,
      });
    }
  };
  
  // Get badge color for supernova type
  const getSupernovaTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "type ia":
        return "bg-blue-900 text-blue-300";
      case "type ii":
        return "bg-red-900 text-red-300";
      case "type ib":
      case "type ic":
        return "bg-green-900 text-green-300";
      default:
        return "bg-gray-900 text-gray-300";
    }
  };
  
  // Filter targets based on form
  const filteredTargets = targets.filter((target: SupernovaTarget) => {
    // Galaxy type filter
    if (searchForm.galaxyType !== "all" && target.type.toLowerCase() !== searchForm.galaxyType.toLowerCase()) {
      return false;
    }
    
    // Distance filter - parse from "XX Mpc" format
    const distance = parseFloat(target.distance.split(" ")[0]);
    if (distance < parseFloat(searchForm.distanceMin) || distance > parseFloat(searchForm.distanceMax)) {
      return false;
    }
    
    // Magnitude filter - lower magnitude means brighter object
    const magnitude = parseFloat(target.magnitude);
    if (magnitude > parseFloat(searchForm.magnitudeLimit)) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-gray-800 border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Supernova Search</h3>
            
            <div className="mb-6">
              <div className="flex space-x-3 mb-4">
                <Button className="bg-astro-teal hover:bg-teal-600">
                  <Plus className="mr-2 h-4 w-4" />
                  New Search
                </Button>
                <Button variant="outline" className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600">
                  Load Template
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Galaxy Type</label>
                  <Select
                    value={searchForm.galaxyType}
                    onValueChange={(value) => handleSearchFormChange("galaxyType", value)}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select galaxy type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="spiral">Spiral</SelectItem>
                      <SelectItem value="elliptical">Elliptical</SelectItem>
                      <SelectItem value="irregular">Irregular</SelectItem>
                      <SelectItem value="barred spiral">Barred Spiral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Magnitude Limit</label>
                  <Select
                    value={searchForm.magnitudeLimit}
                    onValueChange={(value) => handleSearchFormChange("magnitudeLimit", value)}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select magnitude limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="13">13</SelectItem>
                      <SelectItem value="14">14</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Distance (Mpc)</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={searchForm.distanceMin}
                      onChange={(e) => handleSearchFormChange("distanceMin", e.target.value)}
                      className="w-24 bg-gray-700 border-gray-600 text-white"
                    />
                    <span className="text-gray-400">to</span>
                    <Input
                      type="number"
                      value={searchForm.distanceMax}
                      onChange={(e) => handleSearchFormChange("distanceMax", e.target.value)}
                      className="w-24 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Constellation</label>
                  <Select
                    value={searchForm.constellation}
                    onValueChange={(value) => handleSearchFormChange("constellation", value)}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select constellation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="andromeda">Andromeda</SelectItem>
                      <SelectItem value="virgo">Virgo</SelectItem>
                      <SelectItem value="ursa major">Ursa Major</SelectItem>
                      <SelectItem value="leo">Leo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {targetsLoading ? (
              <div className="text-center py-8 text-gray-400">Loading targets...</div>
            ) : filteredTargets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No targets found matching the criteria</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Galaxy</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Magnitude</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Distance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Check</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredTargets.map((target: SupernovaTarget) => (
                      <tr key={target.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{target.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{target.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{target.magnitude}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{target.distance}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {target.lastChecked ? format(new Date(target.lastChecked), "MM/dd/yyyy") : "Never"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-400 hover:text-blue-300 mr-3"
                            onClick={() => handleSearch(target.id)}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-400 hover:text-blue-300"
                            onClick={() => handleHistory(target.id)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card className="bg-gray-800 border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Recent Supernovae</h3>
            
            {discoveriesLoading ? (
              <div className="text-center py-4 text-gray-400">Loading discoveries...</div>
            ) : discoveries.length === 0 ? (
              <div className="text-center py-4 text-gray-400">No recent discoveries</div>
            ) : (
              <div className="space-y-4">
                {discoveries.map((discovery: SupernovaDiscovery) => (
                  <div key={discovery.id} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-white">{discovery.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${getSupernovaTypeBadge(discovery.type)}`}>
                        {discovery.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{discovery.location}</p>
                    <p className="text-xs text-gray-400">
                      Discovered: {format(new Date(discovery.discoveryDate), "MM/dd/yyyy")}
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-400">Mag: {discovery.magnitude}</span>
                      <Button 
                        size="sm" 
                        className="text-xs bg-astro-blue hover:bg-blue-700 text-white px-2 py-1"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Observation Schedule</h3>
              
              <div className="space-y-3">
                <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-white">Tonight</h4>
                    <span className="text-xs text-gray-400">4 galaxies</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className="text-gray-300">NGC 4321, NGC 5194</p>
                    <p className="text-gray-300">NGC 1365, NGC 4569</p>
                  </div>
                </div>
                
                <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-white">Tomorrow</h4>
                    <span className="text-xs text-gray-400">3 galaxies</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className="text-gray-300">NGC 3031, NGC 4826</p>
                    <p className="text-gray-300">NGC 4472</p>
                  </div>
                </div>
              </div>
              
              <Button className="mt-4 w-full bg-astro-purple hover:bg-purple-700">
                View Full Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
