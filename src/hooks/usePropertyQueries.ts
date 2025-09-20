import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, propertyGroupsApi } from '../services/api';
import { useToast } from '../components/ui/use-toast';

// Query keys for better cache management
export const QUERY_KEYS = {
  properties: ['properties'] as const,
  propertyGroups: ['property-groups'] as const,
  propertyGroupsPaginated: (page: number, limit: number, filters?: any) =>
    ['property-groups', 'paginated', page, limit, filters] as const,
  propertyGroup: (id: string) => ['property-groups', id] as const,
  hotelMetrics: ['hotel-metrics'] as const,
} as const;

// Properties hooks
export const useProperties = () => {
  return useQuery({
    queryKey: QUERY_KEYS.properties,
    queryFn: async () => {
      const response = await api.get('/admin/hotels');
      return response.data.data || [];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Property Groups hooks
export const usePropertyGroups = (options?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  const { page = 1, limit = 20, status, search } = options || {};

  return useQuery({
    queryKey: QUERY_KEYS.propertyGroupsPaginated(page, limit, { status, search }),
    queryFn: async () => {
      const params = {
        page,
        limit,
        ...(status !== 'all' && status && { status }),
        ...(search && { search }),
      };

      const response = await propertyGroupsApi.getGroups(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true, // Keep previous data while loading new page
  });
};

export const usePropertyGroup = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.propertyGroup(id),
    queryFn: async () => {
      const response = await propertyGroupsApi.getGroup(id);
      return response.data.data;
    },
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutations with optimistic updates
export const useCreatePropertyGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupData: any) => {
      const response = await propertyGroupsApi.createGroup(groupData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch property groups
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.propertyGroups });
      toast({
        title: "Success",
        description: "Property group created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to create property group"
      });
    },
  });
};

export const useUpdatePropertyGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await propertyGroupsApi.updateGroup(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Update the cache for the specific group
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.propertyGroup(variables.id) });
      // Invalidate the groups list to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.propertyGroups });
      toast({
        title: "Success",
        description: "Property group updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update property group"
      });
    },
  });
};

export const useDeletePropertyGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      await propertyGroupsApi.deleteGroup(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.propertyGroup(deletedId) });
      // Invalidate the groups list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.propertyGroups });
      toast({
        title: "Success",
        description: "Property group deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete property group"
      });
    },
  });
};

export const useSyncGroupSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await propertyGroupsApi.syncGroupSettings(id);
      return response.data;
    },
    onSuccess: (_, groupId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.propertyGroup(groupId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.propertyGroups });
      toast({
        title: "Success",
        description: "Group settings synced successfully"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to sync group settings"
      });
    },
  });
};

export const useAddPropertiesToGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, propertyIds }: { groupId: string; propertyIds: string[] }) => {
      const response = await propertyGroupsApi.addPropertiesToGroup(groupId, { propertyIds });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.propertyGroup(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.propertyGroups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.properties });
      toast({
        title: "Success",
        description: `Added ${variables.propertyIds.length} property(ies) to group successfully`
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to add properties to group"
      });
    },
  });
};

export const useRemovePropertiesFromGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, propertyIds }: { groupId: string; propertyIds: string[] }) => {
      const response = await propertyGroupsApi.removePropertiesFromGroup(groupId, { propertyIds });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.propertyGroup(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.propertyGroups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.properties });
      toast({
        title: "Success",
        description: `Removed ${variables.propertyIds.length} property(ies) from group successfully`
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to remove properties from group"
      });
    },
  });
};

// Utility hook for prefetching data
export const usePrefetchPropertyGroup = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.propertyGroup(id),
      queryFn: async () => {
        const response = await propertyGroupsApi.getGroup(id);
        return response.data.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};