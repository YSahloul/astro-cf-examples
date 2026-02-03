// src/lib/mcp-client.ts
// Wheel Fitment MCP Client Library

export interface VehicleBuild {
  url: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  wheel: {
    brand: string;
    model: string;
    size: string;
    offset: number;
  };
  tire: {
    brand: string;
    model: string;
    size: string;
  };
  suspension: string;
  rubbing: string;
  trimming: string;
  stance: string;
  images: string[];
}

export interface GuaranteedFitment {
  wheelSize: string;
  tireSize: string;
  suspensionType: string;
  evidence_builds: number;
  sample_urls: string[];
  rubbing_status: string;
  trimming_status: string;
}

export interface FitmentRecommendation {
  wheelSize: string;
  tireSize: string;
  suspensionType: string;
  evidence_builds: number;
  sample_urls: string[];
  common_wheels: string[];
  common_tires: string[];
  rubbing_status: string;
  trimming_status: string;
}

export interface OEMData {
  boltPattern: string;
  centerBore: number;
  threadSize: string;
  torqueSpec: string;
  trims: Array<{
    name: string;
    wheelSize: string;
    tireSize: string;
  }>;
}

export interface Quote {
  quote_id: string;
  qr_code_url: string;
  total_price: number;
  expires_at: string;
}

export interface GetQuoteResult {
  quote_id: string;
  vehicle: {
    year: number;
    make: string;
    model: string;
    trim?: string;
    drive?: string;
  };
  wheel?: {
    sku?: string;
    brand?: string;
    model?: string;
    size?: string;
    offset?: number;
    finish?: string;
    price?: number;
    quantity?: number;
    image_url?: string;
    product_url?: string;
  };
  tire?: {
    sku?: string;
    brand?: string;
    model?: string;
    size?: string;
    price?: number;
    quantity?: number;
    image_url?: string;
    product_url?: string;
  };
  suspension?: {
    sku?: string;
    brand?: string;
    model?: string;
    lift?: string;
    price?: number;
    image_url?: string;
    product_url?: string;
  };
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  evidence_build_count?: number;
  sample_build_urls?: string[];
  rubbing_status?: string;
  trimming_status?: string;
  total_price?: number;
  estimated_install?: number;
  qr_code_url: string;
  status: string;
  expires_at: string;
  created_at: string;
  view_count?: number;
}

export interface BuildDetails {
  url: string;
  vehicle: { year: number; make: string; model: string; trim?: string };
  wheel: {
    brand: string;
    model: string;
    size: string;
    offset: number;
    finish?: string;
  };
  tire: { brand: string; model: string; size: string };
  suspension: { type: string; lift?: string; brand?: string };
  fitment: { rubbing: string; trimming: string; stance: string };
  images: string[];
  notes?: string;
}

export interface VehicleGeneration {
  name: string;
  years: string;
  generationParameter: string;
}

export interface VehicleTrim {
  name: string;
  engine?: string;
  power?: string;
}

export interface SearchVehicleBuildsParams {
  year: number;
  make: string;
  model: string;
  suspension?: string;
  stance?: string;
  rubbing?: string;
  trimming?: string;
  wheelDiameterFrom?: number;
  page?: number;
  fetchAllPages?: boolean;
}

export interface SearchVehicleBuildsResult {
  builds: VehicleBuild[];
  totalBuilds: number;
  pagination: {
    page: number;
    totalPages: number;
  };
}

export interface GetGuaranteedFitmentsParams {
  year: number;
  make: string;
  model: string;
  minBuilds?: number;
  driveType?: string;
  suspensionType?: string;
  allowSlightRub?: boolean;
  allowMinorTrimming?: boolean;
}

export interface RecommendFitmentsParams {
  year: number;
  make: string;
  model: string;
  intent?:
    | 'tires_only'
    | 'wheels_only'
    | 'wheels_and_tires'
    | 'package'
    | 'package_and_lift';
  toleranceRubbing?: 'strict' | 'mild' | 'any';
  toleranceTrimming?: 'strict' | 'mild' | 'any';
  minEvidenceBuilds?: number;
  driveType?: string;
  includeSamples?: boolean;
  limit?: number;
}

export interface RecommendFitmentsResult {
  recommendations: FitmentRecommendation[];
}

export interface GetOEMDataParams {
  year: number;
  make: string;
  model: string;
  generation?: string;
}

export interface GenerateQuoteParams {
  vehicle_year: number;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_trim?: string;
  vehicle_drive?: '4WD' | '2WD' | 'AWD' | 'RWD';
  wheel_sku?: string;
  wheel_brand?: string;
  wheel_model?: string;
  wheel_size?: string;
  wheel_offset?: number;
  wheel_finish?: string;
  wheel_price?: number;
  wheel_quantity?: number;
  wheel_image_url?: string;
  wheel_product_url?: string;
  tire_sku?: string;
  tire_brand?: string;
  tire_model?: string;
  tire_size?: string;
  tire_price?: number;
  tire_quantity?: number;
  tire_image_url?: string;
  tire_product_url?: string;
  suspension_sku?: string;
  suspension_brand?: string;
  suspension_model?: string;
  suspension_lift?: string;
  suspension_price?: number;
  suspension_image_url?: string;
  suspension_product_url?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  evidence_build_count?: number;
  sample_build_urls?: string[];
  rubbing_status?: string;
  trimming_status?: string;
  estimated_install?: number;
  expires_in_days?: number;
}

export interface GetVehicleGenerationsParams {
  make: string;
  model: string;
}

export interface GetVehicleGenerationsResult {
  generations: VehicleGeneration[];
}

export interface GetVehicleTrimsParams {
  year: number;
  make: string;
  model: string;
  generation?: string;
}

export interface GetVehicleTrimsResult {
  trims: VehicleTrim[];
}

// Default MCP base URL - can be overridden via env or constructor
const DEFAULT_MCP_BASE_URL =
  'https://fitment-mcp.agenticflows.workers.dev';

/**
 * MCP JSON-RPC response structure
 */
interface MCPResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string;
  result?: {
    content?: Array<{ type: string; text?: string }>;
  } & T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * WheelFitmentMCP - Client for the Wheel Fitment MCP server
 *
 * Communicates with the MCP server via JSON-RPC over HTTP POST.
 * All tools are exposed at the /mcp endpoint.
 */
export class WheelFitmentMCP {
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_MCP_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Internal method to call MCP tools via JSON-RPC
   */
  private async callTool<T, P extends object>(
    toolName: string,
    params: P
  ): Promise<T> {
    const requestId = crypto.randomUUID();

    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params,
        },
        id: requestId,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `MCP call failed: ${response.status} ${response.statusText}`
      );
    }

    const result = (await response.json()) as MCPResponse<T>;

    if (result.error) {
      throw new Error(
        `MCP error (${result.error.code}): ${result.error.message}`
      );
    }

    // MCP returns content array with text content for tool results
    const content = result.result?.content?.[0];
    if (content?.type === 'text' && content.text) {
      return JSON.parse(content.text) as T;
    }

    // Fallback to direct result if no content array
    return result.result as T;
  }

  /**
   * Search for wheel/tire fitment builds for a specific vehicle
   * Returns real user-submitted builds with detailed specifications
   */
  async searchVehicleBuilds(
    params: SearchVehicleBuildsParams
  ): Promise<SearchVehicleBuildsResult> {
    return this.callTool('searchVehicleBuilds', params);
  }

  /**
   * Get detailed specifications for a specific vehicle build
   * Use after finding a build with searchVehicleBuilds
   */
  async getVehicleBuildDetails(url: string): Promise<BuildDetails> {
    return this.callTool('getVehicleBuildDetails', { url });
  }

  /**
   * Get proven wheel/tire fitments with NO rubbing and NO trimming required
   * Only returns fitments verified by multiple builds
   */
  async getGuaranteedFitments(
    params: GetGuaranteedFitmentsParams
  ): Promise<GuaranteedFitment[]> {
    return this.callTool('getGuaranteedFitments', params);
  }

  /**
   * Recommend popular wheel/tire fitment options from the database
   * Uses real build evidence and fits user tolerance preferences
   */
  async recommendFitments(
    params: RecommendFitmentsParams
  ): Promise<RecommendFitmentsResult> {
    return this.callTool('recommendFitments', params);
  }

  /**
   * Get OEM wheel and tire fitment data for a specific vehicle
   * Returns factory original equipment specifications
   */
  async getWheelSizeOEMData(params: GetOEMDataParams): Promise<OEMData> {
    return this.callTool('getWheelSizeOEMData', params);
  }

  /**
   * Generate a fitment quote with unique ID and QR code URL
   * Creates a shareable quote for wheel/tire/suspension packages
   */
  async generateQuote(params: GenerateQuoteParams): Promise<Quote> {
    return this.callTool('generateQuote', params);
  }

  /**
   * Get all available generations for a vehicle
   * Returns generationParameter field for use in other methods
   */
  async getVehicleGenerations(
    params: GetVehicleGenerationsParams
  ): Promise<GetVehicleGenerationsResult> {
    return this.callTool('getVehicleGenerations', params);
  }

  /**
   * Get a list of all available trims for a specific vehicle generation
   * Returns trim names, engine info, and power ratings
   */
  async getVehicleTrims(
    params: GetVehicleTrimsParams
  ): Promise<GetVehicleTrimsResult> {
    return this.callTool('getVehicleTrims', params);
  }

  /**
   * Retrieve a quote by its public ID
   * Returns full quote details including all items, pricing, and verification info
   */
  async getQuote(
    quoteId: string,
    trackView: boolean = true
  ): Promise<GetQuoteResult> {
    return this.callTool('getQuote', { quote_id: quoteId, track_view: trackView });
  }
}

/**
 * Create a WheelFitmentMCP client instance
 * @param baseUrl - Optional custom MCP server URL (defaults to production)
 */
export function createWheelFitmentClient(baseUrl?: string): WheelFitmentMCP {
  return new WheelFitmentMCP(baseUrl);
}

// Singleton instance for convenience - uses default URL
export const wheelFitmentMCP = new WheelFitmentMCP();
