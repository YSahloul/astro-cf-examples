// src/lib/use-vehicle-agent.ts
// React hook to connect to the FitmentAgent Durable Object

import { useAgent } from "agents/react";
import { useState, useEffect, useCallback } from "react";
import type { FitmentAgent } from "@/agents/FitmentAgent";

export interface Vehicle {
  year: number;
  make: string;
  model: string;
  trim?: string;
}

export interface VehicleAgentState {
  visitorId: string;
  vehicle: Vehicle | null;
  intent: "tires_only" | "wheels_only" | "wheels_and_tires" | "package" | "package_and_lift" | null;
  recommendations: any[] | null;
  selectedRecommendation: any | null;
  quoteId: string | null;
}

// Get or create a visitor ID
function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  
  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("visitor_id", visitorId);
  }
  return visitorId;
}

export function useVehicleAgent() {
  const [state, setState] = useState<VehicleAgentState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visitorId = typeof window !== "undefined" ? getVisitorId() : "";

  // Connect to agent via /api/chat endpoint
  const agent = useAgent<FitmentAgent, VehicleAgentState>({
    host: typeof window !== "undefined" ? window.location.host : "",
    agent: "fitment-agent", 
    name: `visitor-${visitorId}`,
    onStateUpdate: (newState: VehicleAgentState) => {
      setState(newState);
    },
    onOpen: () => {
      setIsConnected(true);
      setError(null);
    },
    onClose: () => {
      setIsConnected(false);
    },
    onError: (err: Error) => {
      setError(err.message);
      setIsConnected(false);
    },
  });

  // Set vehicle via RPC
  const setVehicle = useCallback(async (vehicle: Vehicle) => {
    if (!agent) return null;
    try {
      const result = await agent.call("setVehicle", [vehicle]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set vehicle");
      return null;
    }
  }, [agent]);

  // Set intent via RPC
  const setIntent = useCallback(async (intent: VehicleAgentState["intent"]) => {
    if (!agent) return null;
    try {
      const result = await agent.call("setIntent", [intent]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set intent");
      return null;
    }
  }, [agent]);

  // Get current state via RPC
  const getSessionState = useCallback(async () => {
    if (!agent) return null;
    try {
      const result = await agent.call("getSessionState", []);
      setState(result as VehicleAgentState);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get session state");
      return null;
    }
  }, [agent]);

  // Clear session via RPC
  const clearSession = useCallback(async () => {
    if (!agent) return null;
    try {
      const result = await agent.call("clearSession", []);
      setState(null);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear session");
      return null;
    }
  }, [agent]);

  // Fetch initial state on connect
  useEffect(() => {
    if (isConnected && agent) {
      getSessionState();
    }
  }, [isConnected]);

  return {
    state,
    isConnected,
    error,
    setVehicle,
    setIntent,
    getSessionState,
    clearSession,
    // Convenience getters
    vehicle: state?.vehicle ?? null,
    intent: state?.intent ?? null,
    recommendations: state?.recommendations ?? null,
    hasVehicle: !!state?.vehicle,
  };
}
