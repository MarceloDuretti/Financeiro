import { useEffect, useRef } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useWebSocketContext, type WebSocketMessage } from "@/contexts/WebSocketContext";

/**
 * Hook that combines TanStack Query with WebSocket for real-time updates
 * 
 * Usage:
 * ```tsx
 * const { data, isLoading } = useRealtimeQuery<CostCenter[]>({
 *   queryKey: ['/api/cost-centers'],
 *   resource: 'cost-centers'
 * });
 * ```
 * 
 * When other users create/update/delete data for the same resource,
 * this hook automatically invalidates the query and refetches.
 */
export function useRealtimeQuery<TData = unknown>(
  options: UseQueryOptions<TData> & {
    resource: string;
  }
) {
  const { resource, ...queryOptions } = options;
  const { subscribe } = useWebSocketContext();
  const queryKeyRef = useRef(queryOptions.queryKey);
  const resourceRef = useRef(resource);
  
  // Update refs when values change
  queryKeyRef.current = queryOptions.queryKey;
  resourceRef.current = resource;

  // Subscribe to WebSocket messages - only once!
  useEffect(() => {
    const unsubscribe = subscribe((message: WebSocketMessage) => {
      // Only handle data change events for this resource
      if (message.type === "data:change" && message.resource === resourceRef.current) {
        console.log(`[Realtime] ${resourceRef.current} ${message.action}`, message.data);

        // Invalidate and refetch the query
        if (queryKeyRef.current) {
          queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
        }
      }
    });

    // Cleanup subscription on unmount
    return unsubscribe;
    // Subscribe only depends on subscribe function (stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);

  // Use standard TanStack Query
  return useQuery(queryOptions);
}

/**
 * Hook for WebSocket connection status
 * Useful for showing connection indicators in the UI
 */
export function useWebSocketStatus() {
  const { status, error } = useWebSocketContext();
  return { status, error };
}
