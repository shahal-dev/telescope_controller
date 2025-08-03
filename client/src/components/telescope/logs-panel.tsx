import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Log } from "@shared/schema";

interface LogsPanelProps {
  telescopeId: number;
}

export function LogsPanel({ telescopeId }: LogsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    levels: {
      info: true,
      warning: true,
      error: true,
      system: true
    },
    activityType: "all",
    searchTerm: ""
  });
  
  // Fetch logs for the telescope
  const { data: logs = [], isLoading } = useQuery({
    queryKey: [`/api/logs?telescopeId=${telescopeId}`],
    refetchInterval: 10000, // Refetch logs every 10 seconds
  });
  
  // Clear logs mutation
  const clearLogsMutation = useMutation({
    mutationFn: () => {
      return apiRequest("DELETE", `/api/logs/${telescopeId}/clear`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/logs?telescopeId=${telescopeId}`] });
      toast({
        title: "Logs Cleared",
        description: "All logs have been cleared for this telescope",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear logs",
        variant: "destructive",
      });
    }
  });
  
  // Apply filters to logs
  const filteredLogs = logs.filter((log: Log) => {
    // Level filter
    if (!filters.levels[log.level as keyof typeof filters.levels]) {
      return false;
    }
    
    // Date filter
    if (filters.startDate && new Date(log.timestamp) < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && new Date(log.timestamp) > new Date(filters.endDate)) {
      return false;
    }
    
    // Activity type filter
    if (filters.activityType !== "all") {
      const activityTypes = {
        movement: ["slewing", "move", "direction", "tracking"],
        capture: ["exposure", "image", "camera"],
        system: ["initialized", "system", "connected", "calibration"],
        errors: ["error", "warning", "lost", "failed"]
      };
      
      const typeTerms = activityTypes[filters.activityType as keyof typeof activityTypes];
      if (!typeTerms.some(term => log.message.toLowerCase().includes(term))) {
        return false;
      }
    }
    
    // Search term
    if (filters.searchTerm && !log.message.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Format timestamp
  const formatTimestamp = (timestamp: string | Date) => {
    return format(new Date(timestamp), "HH:mm:ss");
  };
  
  // Get log level class
  const getLogLevelClass = (level: string) => {
    switch (level) {
      case "info":
        return "text-blue-400";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      case "system":
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    toast({
      title: "Filters Applied",
      description: "Log view has been updated",
    });
  };
  
  // Export logs
  const handleExportLogs = () => {
    const logsText = filteredLogs.map((log: Log) => {
      return `[${format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}] [${log.level.toUpperCase()}] ${log.message}`;
    }).join("\n");
    
    const blob = new Blob([logsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telescope-${telescopeId}-logs-${format(new Date(), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Logs Exported",
      description: "Log file has been downloaded",
    });
  };
  
  // Log statistics
  const logStats = {
    total: filteredLogs.length,
    info: filteredLogs.filter((log: Log) => log.level === "info").length,
    warning: filteredLogs.filter((log: Log) => log.level === "warning").length,
    error: filteredLogs.filter((log: Log) => log.level === "error").length,
    system: filteredLogs.filter((log: Log) => log.level === "system").length,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-gray-800 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Operation Logs</h3>
              <div className="flex space-x-2">
                <Button variant="outline" className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600" onClick={handleExportLogs}>
                  Export
                </Button>
                <Button variant="outline" className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600" onClick={() => clearLogsMutation.mutate()}>
                  Clear
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 h-[500px] overflow-y-auto font-mono text-sm">
              {isLoading ? (
                <p className="text-gray-400">Loading logs...</p>
              ) : filteredLogs.length === 0 ? (
                <p className="text-gray-400">No logs available</p>
              ) : (
                filteredLogs.map((log: Log) => (
                  <p key={log.id} className={`${getLogLevelClass(log.level)}`}>
                    [{formatTimestamp(log.timestamp)}] {log.message}
                  </p>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card className="bg-gray-800 border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Log Filters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    className="bg-gray-700 border-gray-600 text-white"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                  <Input
                    type="date"
                    className="bg-gray-700 border-gray-600 text-white"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Log Level</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="info"
                      checked={filters.levels.info}
                      onCheckedChange={(checked) => 
                        setFilters({
                          ...filters,
                          levels: { ...filters.levels, info: checked === true }
                        })
                      }
                    />
                    <label htmlFor="info" className="text-white cursor-pointer">Info</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="warning"
                      checked={filters.levels.warning}
                      onCheckedChange={(checked) => 
                        setFilters({
                          ...filters,
                          levels: { ...filters.levels, warning: checked === true }
                        })
                      }
                    />
                    <label htmlFor="warning" className="text-white cursor-pointer">Warning</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="error"
                      checked={filters.levels.error}
                      onCheckedChange={(checked) => 
                        setFilters({
                          ...filters,
                          levels: { ...filters.levels, error: checked === true }
                        })
                      }
                    />
                    <label htmlFor="error" className="text-white cursor-pointer">Error</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="system"
                      checked={filters.levels.system}
                      onCheckedChange={(checked) => 
                        setFilters({
                          ...filters,
                          levels: { ...filters.levels, system: checked === true }
                        })
                      }
                    />
                    <label htmlFor="system" className="text-white cursor-pointer">System</label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Activity Type</label>
                <Select
                  value={filters.activityType}
                  onValueChange={(value) => setFilters({ ...filters, activityType: value })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="movement">Telescope Movement</SelectItem>
                    <SelectItem value="capture">Image Capture</SelectItem>
                    <SelectItem value="system">System Events</SelectItem>
                    <SelectItem value="errors">Errors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Search</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search logs..."
                    className="w-full bg-gray-700 border-gray-600 pl-10 text-white"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-search text-gray-400"></i>
                  </div>
                </div>
              </div>
              
              <Button className="w-full bg-astro-blue hover:bg-blue-700" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6 bg-gray-800 border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Log Statistics</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm text-gray-400 mb-1">Total Logs</h4>
                <p className="text-2xl font-bold text-white">{logStats.total}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-gray-400 mb-1">Info</h4>
                  <p className="text-lg font-semibold text-blue-400">{logStats.info}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 mb-1">Warnings</h4>
                  <p className="text-lg font-semibold text-yellow-400">{logStats.warning}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 mb-1">Errors</h4>
                  <p className="text-lg font-semibold text-red-400">{logStats.error}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-400 mb-1">System</h4>
                  <p className="text-lg font-semibold text-green-400">{logStats.system}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
