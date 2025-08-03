import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ControlPanel } from "@/components/telescope/control-panel";
import { ObservationPlans } from "@/components/telescope/observation-plans";
import { LogsPanel } from "@/components/telescope/logs-panel";
import { SupernovaSearch } from "@/components/telescope/supernova-search";

export default function TelescopeControl() {
  const { id } = useParams();
  const telescopeId = parseInt(id);
  const [activeTab, setActiveTab] = useState("control");
  
  // Fetch telescope details
  const { data: telescope, isLoading: telescopeLoading } = useQuery({
    queryKey: [`/api/telescopes/${telescopeId}`],
  });
  
  // Fetch location details for the telescope
  const { data: location, isLoading: locationLoading } = useQuery({
    queryKey: [`/api/locations/${telescope?.locationId}`],
    enabled: !!telescope?.locationId,
  });
  
  const isLoading = telescopeLoading || locationLoading;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" className="text-blue-400 hover:text-blue-300 -ml-4">
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back to Locations
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-white ml-2">
          {isLoading ? (
            "Loading telescope details..."
          ) : (
            <>
              {telescope?.name} - {location?.name}
            </>
          )}
        </h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-400">Loading telescope data...</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="border-b border-gray-700 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger
              value="control"
              className="data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 border-b-2 border-transparent rounded-t-lg px-4 py-3"
            >
              Control
            </TabsTrigger>
            <TabsTrigger
              value="plan"
              className="data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 border-b-2 border-transparent rounded-t-lg px-4 py-3"
            >
              Observation Plans
            </TabsTrigger>
            <TabsTrigger
              value="log"
              className="data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 border-b-2 border-transparent rounded-t-lg px-4 py-3"
            >
              Logs
            </TabsTrigger>
            <TabsTrigger
              value="search"
              className="data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 border-b-2 border-transparent rounded-t-lg px-4 py-3"
            >
              Supernova Search
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="control" className="mt-0 pt-6">
            <ControlPanel telescope={telescope} />
          </TabsContent>
          
          <TabsContent value="plan" className="mt-0 pt-6">
            <ObservationPlans telescope={telescope} userId={1} />
          </TabsContent>
          
          <TabsContent value="log" className="mt-0 pt-6">
            <LogsPanel telescopeId={telescopeId} />
          </TabsContent>
          
          <TabsContent value="search" className="mt-0 pt-6">
            <SupernovaSearch telescopeId={telescopeId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
