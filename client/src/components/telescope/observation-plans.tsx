import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Eye, Redo, Play, Edit } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Telescope, ObservationPlan, ObservationTarget } from "@shared/schema";

// Enhanced schema with validation
const formSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  scheduledDate: z.date(),
  targets: z.array(
    z.object({
      name: z.string(),
      rightAscension: z.string(),
      declination: z.string(),
    })
  ).min(1, { message: "At least one target is required" }),
});

interface ObservationPlansProps {
  telescope: Telescope;
  userId: number;
}

export function ObservationPlans({ telescope, userId }: ObservationPlansProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [targetInput, setTargetInput] = useState("");
  const [targetRA, setTargetRA] = useState("");
  const [targetDEC, setTargetDEC] = useState("");
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      scheduledDate: new Date(),
      targets: [],
    },
  });
  
  // Query observation plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: [`/api/observation-plans?telescopeId=${telescope.id}`],
    refetchInterval: false,
  });
  
  // Create observation plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (plan: any) => {
      return apiRequest("POST", "/api/observation-plans", {
        ...plan,
        telescopeId: telescope.id,
        userId: userId,
        status: "draft"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/observation-plans?telescopeId=${telescope.id}`] });
      form.reset({
        name: "",
        description: "",
        scheduledDate: new Date(),
        targets: [],
      });
      toast({
        title: "Success",
        description: "Observation plan created",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create observation plan",
        variant: "destructive",
      });
    },
  });
  
  // Update observation plan status mutation
  const updatePlanStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/observation-plans/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/observation-plans?telescopeId=${telescope.id}`] });
      toast({
        title: "Success",
        description: "Plan status updated",
      });
    },
  });
  
  // Add target to the form
  const addTarget = () => {
    if (!targetInput || !targetRA || !targetDEC) {
      toast({
        title: "Missing Information",
        description: "Please provide target name, RA, and DEC",
        variant: "destructive",
      });
      return;
    }
    
    const newTarget = {
      name: targetInput,
      rightAscension: targetRA,
      declination: targetDEC,
    };
    
    const currentTargets = form.getValues().targets || [];
    form.setValue("targets", [...currentTargets, newTarget]);
    
    // Clear inputs
    setTargetInput("");
    setTargetRA("");
    setTargetDEC("");
    
    toast({
      title: "Target Added",
      description: `${targetInput} added to plan`,
    });
  };
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createPlanMutation.mutate(values);
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Handlers for plan actions
  const handleRunPlan = (plan: ObservationPlan) => {
    updatePlanStatusMutation.mutate({
      id: plan.id,
      status: "in-progress"
    });
    
    // In a real app, we would also start the observation sequence
    toast({
      title: "Starting Observation Plan",
      description: `Running plan: ${plan.name}`,
    });
  };
  
  const handleViewPlan = (plan: ObservationPlan) => {
    // In a real app, we would display detailed plan information
    toast({
      title: "Plan Details",
      description: `Viewing details for ${plan.name}`,
    });
  };
  
  const handleRestartPlan = (plan: ObservationPlan) => {
    updatePlanStatusMutation.mutate({
      id: plan.id,
      status: "scheduled"
    });
    
    toast({
      title: "Plan Rescheduled",
      description: `${plan.name} has been rescheduled`,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-gray-800 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Observation Plans</h3>
              <Button className="bg-astro-teal hover:bg-teal-600">
                <Plus className="mr-2 h-4 w-4" />
                New Plan
              </Button>
            </div>
            
            {isLoading ? (
              <div className="py-8 text-center text-gray-400">Loading plans...</div>
            ) : plans.length === 0 ? (
              <div className="py-8 text-center text-gray-400">No observation plans yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Targets</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {plans.map((plan: ObservationPlan) => (
                      <tr key={plan.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{plan.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {plan.scheduledDate ? format(new Date(plan.scheduledDate), "MM/dd/yyyy") : "Not scheduled"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {plan.targets ? plan.targets.map(t => t.name).join(", ") : "No targets"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(plan.status)}`}>
                            {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 mr-1" onClick={() => handleViewPlan(plan)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {plan.status === "completed" && (
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-300" onClick={() => handleRestartPlan(plan)}>
                              <Redo className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {plan.status === "scheduled" && (
                            <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300" onClick={() => handleRunPlan(plan)}>
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {plan.status === "draft" && (
                            <Button variant="ghost" size="sm" className="text-yellow-400 hover:text-yellow-300">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
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
            <h3 className="text-xl font-semibold text-white mb-4">Create New Plan</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-400">Plan Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter plan name"
                          className="bg-gray-700 border-gray-600 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm text-gray-400">Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                "bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-400">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Plan description"
                          className="bg-gray-700 border-gray-600 text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel className="text-sm text-gray-400 block mb-1">Targets</FormLabel>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Target name"
                        className="bg-gray-700 border-gray-600 text-white"
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                      />
                      <Input
                        placeholder="RA"
                        className="bg-gray-700 border-gray-600 text-white"
                        value={targetRA}
                        onChange={(e) => setTargetRA(e.target.value)}
                      />
                      <Input
                        placeholder="DEC"
                        className="bg-gray-700 border-gray-600 text-white"
                        value={targetDEC}
                        onChange={(e) => setTargetDEC(e.target.value)}
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-gray-600 bg-gray-700 hover:bg-gray-600 text-white"
                      onClick={addTarget}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Target
                    </Button>
                    
                    <div className="p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                      {form.getValues().targets?.length > 0 ? (
                        <ul className="space-y-1">
                          {form.getValues().targets.map((target, index) => (
                            <li key={index} className="text-sm text-gray-300">
                              {target.name} ({target.rightAscension}, {target.declination})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-400">No targets added yet</p>
                      )}
                    </div>
                  </div>
                  {form.formState.errors.targets && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.targets.message}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-astro-teal hover:bg-teal-600"
                  disabled={createPlanMutation.isPending}
                >
                  {createPlanMutation.isPending ? "Saving..." : "Save Plan"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
