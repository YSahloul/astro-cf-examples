// src/agents/FitmentAgent.ts
// Fitment Agent - AI chat agent for wheel/tire fitment recommendations

import { AIChatAgent } from "@cloudflare/ai-chat";
import { routeAgentRequest, callable } from "agents";
import { streamText, convertToModelMessages, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import {
  WheelFitmentMCP,
  type FitmentRecommendation,
} from "../lib/mcp-client";

// State interface for the FitmentAgent
export interface FitmentAgentState {
  visitorId: string;
  vehicle: {
    year: number;
    make: string;
    model: string;
    trim?: string;
    driveType?: "4WD" | "2WD" | "AWD" | "RWD";
  } | null;
  intent:
    | "tires_only"
    | "wheels_only"
    | "wheels_and_tires"
    | "package"
    | "package_and_lift"
    | null;
  recommendations: FitmentRecommendation[] | null;
  selectedRecommendation: FitmentRecommendation | null;
  quoteId: string | null;
}

// Environment bindings - extends the global Cloudflare.Env from worker-configuration.d.ts
interface FitmentEnv extends Cloudflare.Env {
  FITMENT_AGENT: DurableObjectNamespace;
}

export class FitmentAgent extends AIChatAgent<FitmentEnv, FitmentAgentState> {
  // Initial state for new sessions
  initialState: FitmentAgentState = {
    visitorId: "",
    vehicle: null,
    intent: null,
    recommendations: null,
    selectedRecommendation: null,
    quoteId: null,
  };

  // MCP client instance (renamed to avoid collision with base class)
  private fitmentMcp: WheelFitmentMCP = new WheelFitmentMCP();

  /**
   * Build system prompt including current state context
   */
  private buildSystemPrompt(): string {
    const { vehicle, intent, recommendations, selectedRecommendation, quoteId } =
      this.state;

    let context = `You are a friendly and knowledgeable wheel and tire fitment specialist at an auto shop. 
You help customers find the perfect wheels and tires for their vehicles.

Your capabilities:
- Search for real user builds to see what others have done with similar vehicles
- Find guaranteed fitments (proven to work with no rubbing or trimming)
- Generate quotes for wheel/tire packages

Guidelines:
- Be conversational and helpful
- Ask clarifying questions when needed
- Always verify vehicle details before making recommendations
- Explain fitment concepts when customers seem confused
- Highlight the evidence (number of builds) backing each recommendation
`;

    // Add current state context
    context += "\n\n--- CURRENT SESSION STATE ---\n";

    if (vehicle) {
      context += `\nVehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      if (vehicle.trim) context += ` ${vehicle.trim}`;
      if (vehicle.driveType) context += ` (${vehicle.driveType})`;
    } else {
      context += "\nVehicle: Not yet specified";
    }

    if (intent) {
      const intentLabels: Record<string, string> = {
        tires_only: "Looking for tires only",
        wheels_only: "Looking for wheels only",
        wheels_and_tires: "Looking for wheels and tires",
        package: "Looking for a wheel/tire package",
        package_and_lift: "Looking for wheels, tires, and a lift kit",
      };
      context += `\nIntent: ${intentLabels[intent] || intent}`;
    } else {
      context += "\nIntent: Not yet determined";
    }

    if (recommendations && recommendations.length > 0) {
      context += `\nRecommendations: ${recommendations.length} options found`;
      context += `\n  Top option: ${recommendations[0].wheelSize} wheels with ${recommendations[0].tireSize} tires`;
      context += ` (${recommendations[0].evidence_builds} verified builds)`;
    }

    if (selectedRecommendation) {
      context += `\nSelected: ${selectedRecommendation.wheelSize} with ${selectedRecommendation.tireSize}`;
    }

    if (quoteId) {
      context += `\nQuote ID: ${quoteId}`;
    }

    context += "\n--- END STATE ---\n";

    return context;
  }

  /**
   * Define tools available to the LLM
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getTools(): Record<string, any> {
    const agent = this;

    return {
      searchVehicleBuilds: tool({
        description:
          "Search for real user builds showing wheel/tire fitments on specific vehicles. Use this to show customers what others have done with similar vehicles.",
        inputSchema: z.object({
          year: z.number().describe("Vehicle year"),
          make: z.string().describe("Vehicle make (e.g., Toyota)"),
          model: z.string().describe("Vehicle model (e.g., Tacoma)"),
          suspension: z
            .string()
            .optional()
            .describe("Suspension type filter (e.g., Stock, Leveling Kit)"),
          page: z.number().optional().describe("Page number for pagination"),
        }),
        execute: async ({
          year,
          make,
          model,
          suspension,
          page,
        }: {
          year: number;
          make: string;
          model: string;
          suspension?: string;
          page?: number;
        }) => {
          try {
            const result = await agent.fitmentMcp.searchVehicleBuilds({
              year,
              make,
              model,
              suspension,
              page,
            });
            return {
              success: true,
              totalBuilds: result.totalBuilds,
              builds: result.builds.slice(0, 5).map((b) => ({
                wheel: `${b.wheel.brand} ${b.wheel.model} ${b.wheel.size}`,
                tire: `${b.tire.brand} ${b.tire.model} ${b.tire.size}`,
                suspension: b.suspension,
                rubbing: b.rubbing,
                trimming: b.trimming,
                url: b.url,
              })),
              pagination: result.pagination,
            };
          } catch (error) {
            return {
              success: false,
              error:
                error instanceof Error ? error.message : "Failed to search builds",
            };
          }
        },
      }),

      getGuaranteedFitments: tool({
        description:
          "Get proven wheel/tire combinations that are guaranteed to fit with NO rubbing and NO trimming. Only returns fitments verified by multiple real builds.",
        inputSchema: z.object({
          year: z.number().describe("Vehicle year"),
          make: z.string().describe("Vehicle make"),
          model: z.string().describe("Vehicle model"),
          suspensionType: z
            .string()
            .optional()
            .describe("Filter by suspension type"),
          minBuilds: z
            .number()
            .optional()
            .describe("Minimum confirming builds (default: 3)"),
          allowSlightRub: z
            .boolean()
            .optional()
            .describe("Allow slight rub at full turn"),
          allowMinorTrimming: z.boolean().optional().describe("Allow minor plastic trimming"),
        }),
        execute: async (params: {
          year: number;
          make: string;
          model: string;
          suspensionType?: string;
          minBuilds?: number;
          allowSlightRub?: boolean;
          allowMinorTrimming?: boolean;
        }) => {
          try {
            const fitments = await agent.fitmentMcp.getGuaranteedFitments(params);
            return {
              success: true,
              fitments: fitments.slice(0, 10),
              total: fitments.length,
            };
          } catch (error) {
            return {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to get guaranteed fitments",
            };
          }
        },
      }),

      recommendFitments: tool({
        description:
          "Get personalized wheel/tire recommendations based on customer preferences and tolerance for rubbing/trimming. Uses real build evidence.",
        inputSchema: z.object({
          year: z.number().describe("Vehicle year"),
          make: z.string().describe("Vehicle make"),
          model: z.string().describe("Vehicle model"),
          intent: z
            .enum([
              "tires_only",
              "wheels_only",
              "wheels_and_tires",
              "package",
              "package_and_lift",
            ])
            .optional()
            .describe("What the customer is looking for"),
          toleranceRubbing: z
            .enum(["strict", "mild", "any"])
            .optional()
            .describe("Rubbing tolerance"),
          toleranceTrimming: z
            .enum(["strict", "mild", "any"])
            .optional()
            .describe("Trimming tolerance"),
          limit: z.number().optional().describe("Max recommendations to return"),
        }),
        execute: async (params: {
          year: number;
          make: string;
          model: string;
          intent?: "tires_only" | "wheels_only" | "wheels_and_tires" | "package" | "package_and_lift";
          toleranceRubbing?: "strict" | "mild" | "any";
          toleranceTrimming?: "strict" | "mild" | "any";
          limit?: number;
        }) => {
          try {
            const result = await agent.fitmentMcp.recommendFitments(params);
            // Store recommendations in state
            if (result.recommendations?.length > 0) {
              agent.setState({
                ...agent.state,
                recommendations: result.recommendations,
              });
            }
            return {
              success: true,
              recommendations: result.recommendations,
              count: result.recommendations?.length || 0,
            };
          } catch (error) {
            return {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to get recommendations",
            };
          }
        },
      }),

      generateQuote: tool({
        description:
          "Generate a shareable quote for a wheel/tire/suspension package. Creates a unique quote ID and QR code.",
        inputSchema: z.object({
          vehicle_year: z.number().describe("Vehicle year"),
          vehicle_make: z.string().describe("Vehicle make"),
          vehicle_model: z.string().describe("Vehicle model"),
          wheel_brand: z.string().optional().describe("Wheel brand"),
          wheel_model: z.string().optional().describe("Wheel model name"),
          wheel_size: z.string().optional().describe("Wheel size (e.g., 17x9)"),
          wheel_offset: z.number().optional().describe("Wheel offset in mm"),
          tire_brand: z.string().optional().describe("Tire brand"),
          tire_model: z.string().optional().describe("Tire model"),
          tire_size: z.string().optional().describe("Tire size (e.g., 285/75R17)"),
          suspension_brand: z.string().optional().describe("Suspension brand"),
          suspension_lift: z.string().optional().describe("Lift amount"),
          customer_name: z.string().optional().describe("Customer name"),
          customer_email: z.string().optional().describe("Customer email"),
          evidence_build_count: z
            .number()
            .optional()
            .describe("Number of verified builds with this setup"),
          rubbing_status: z.string().optional().describe("Rubbing status"),
          trimming_status: z.string().optional().describe("Trimming status"),
        }),
        execute: async (params: {
          vehicle_year: number;
          vehicle_make: string;
          vehicle_model: string;
          wheel_brand?: string;
          wheel_model?: string;
          wheel_size?: string;
          wheel_offset?: number;
          tire_brand?: string;
          tire_model?: string;
          tire_size?: string;
          suspension_brand?: string;
          suspension_lift?: string;
          customer_name?: string;
          customer_email?: string;
          evidence_build_count?: number;
          rubbing_status?: string;
          trimming_status?: string;
        }) => {
          try {
            const quote = await agent.fitmentMcp.generateQuote(params);
            // Store quote ID in state
            agent.setState({
              ...agent.state,
              quoteId: quote.quote_id,
            });
            return {
              success: true,
              quote_id: quote.quote_id,
              qr_code_url: quote.qr_code_url,
              expires_at: quote.expires_at,
            };
          } catch (error) {
            return {
              success: false,
              error:
                error instanceof Error ? error.message : "Failed to generate quote",
            };
          }
        },
      }),

      setVehicle: tool({
        description:
          "Store the customer's vehicle information in the session. Call this once vehicle details are confirmed.",
        inputSchema: z.object({
          year: z.number().describe("Vehicle year"),
          make: z.string().describe("Vehicle make"),
          model: z.string().describe("Vehicle model"),
          trim: z.string().optional().describe("Vehicle trim"),
          driveType: z
            .enum(["4WD", "2WD", "AWD", "RWD"])
            .optional()
            .describe("Drive type"),
        }),
        execute: async ({
          year,
          make,
          model,
          trim,
          driveType,
        }: {
          year: number;
          make: string;
          model: string;
          trim?: string;
          driveType?: "4WD" | "2WD" | "AWD" | "RWD";
        }) => {
          agent.setState({
            ...agent.state,
            vehicle: { year, make, model, trim, driveType },
          });
          return {
            success: true,
            message: `Vehicle set to ${year} ${make} ${model}${trim ? ` ${trim}` : ""}`,
          };
        },
      }),

      setIntent: tool({
        description:
          "Store what the customer is looking for. Call this when customer clarifies their needs.",
        inputSchema: z.object({
          intent: z
            .enum([
              "tires_only",
              "wheels_only",
              "wheels_and_tires",
              "package",
              "package_and_lift",
            ])
            .describe("Customer intent"),
        }),
        execute: async ({
          intent,
        }: {
          intent: "tires_only" | "wheels_only" | "wheels_and_tires" | "package" | "package_and_lift";
        }) => {
          agent.setState({
            ...agent.state,
            intent,
          });
          return { success: true, intent };
        },
      }),

      selectRecommendation: tool({
        description:
          "Mark a recommendation as selected by the customer. Use the index from the recommendations list.",
        inputSchema: z.object({
          index: z
            .number()
            .describe("Index of the recommendation in the current list (0-based)"),
        }),
        execute: async ({ index }: { index: number }) => {
          const { recommendations } = agent.state;
          if (!recommendations || index >= recommendations.length) {
            return { success: false, error: "Invalid recommendation index" };
          }
          const selected = recommendations[index];
          agent.setState({
            ...agent.state,
            selectedRecommendation: selected,
          });
          return {
            success: true,
            selected: {
              wheelSize: selected.wheelSize,
              tireSize: selected.tireSize,
              suspensionType: selected.suspensionType,
            },
          };
        },
      }),
    };
  }

  /**
   * Handle incoming chat messages
   */
  async onChatMessage(
    onFinish: Parameters<AIChatAgent<FitmentEnv, FitmentAgentState>["onChatMessage"]>[0]
  ) {
    const tools = this.getTools();
    const result = streamText({
      model: openai("gpt-4o"),
      system: this.buildSystemPrompt(),
      messages: await convertToModelMessages(this.messages),
      tools,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onFinish: onFinish as any,
    });

    return result.toUIMessageStreamResponse();
  }

  /**
   * RPC method to set vehicle directly (callable from client)
   */
  @callable()
  setVehicle(vehicle: FitmentAgentState["vehicle"]) {
    this.setState({ ...this.state, vehicle });
    return { success: true, vehicle };
  }

  /**
   * RPC method to set intent directly (callable from client)
   */
  @callable()
  setIntent(intent: FitmentAgentState["intent"]) {
    this.setState({ ...this.state, intent });
    return { success: true, intent };
  }

  /**
   * RPC method to get current state (callable from client)
   */
  @callable()
  getSessionState() {
    return this.state;
  }

  /**
   * RPC method to clear session state
   */
  @callable()
  clearSession() {
    this.setState(this.initialState);
    return { success: true };
  }
}

// Export routeAgentRequest for use in worker entry point
export { routeAgentRequest };
