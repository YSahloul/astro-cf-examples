# AI-Powered Wheel & Tire Fitment Assistant - PRD

## Overview

Build an AI-powered sales assistant for Sal's Wheels & Tires that helps customers find the perfect wheel, tire, and lift kit combinations for their vehicles. Unlike traditional lead capture forms, this system uses real build data from thousands of actual vehicle builds to make intelligent, evidence-based recommendations. The assistant combines automated AI recommendations with a stateful live chat agent powered by Cloudflare Agents SDK.

## Problem Statement

Current wheel and tire shopping experiences suffer from several critical issues:

1. **Information Overload**: Customers face thousands of wheel/tire combinations with no guidance on what actually fits their vehicle
2. **Fitment Uncertainty**: Will these wheels rub? Do I need to trim fenders? Customers have no way to know without expensive trial and error
3. **Lack of Evidence**: Reviews and forums are scattered; customers can't easily see real examples of their exact vehicle with specific setups
4. **Static Lead Forms**: Traditional contact forms capture minimal information and require extensive back-and-forth to understand customer needs
5. **Lost Context**: When customers reach out via chat, agents start from zero with no knowledge of what the customer was looking at

The existing lead generation system (see `lead-generation-final.md`) captures basic customer information but doesn't leverage the rich fitment data available through the wheel-fitment MCP tools to provide intelligent recommendations before the customer even talks to a sales rep.

## Goals

### Primary Goals

- **Primary Goal 1**: Enable customers to receive AI-curated wheel/tire/suspension recommendations based on REAL build evidence from similar vehicles, reducing decision paralysis and increasing conversion
- **Primary Goal 2**: Capture high-intent leads with complete vehicle information, customer preferences, and AI-recommended builds already attached, enabling sales reps to have informed conversations
- **Primary Goal 3**: Implement a stateful live chat agent using Cloudflare Agents SDK that maintains context across sessions and can modify recommendations based on customer feedback

### Secondary Goals

- **Secondary Goal 1**: Display actual photos from verified builds to provide social proof and visual confirmation of fitment
- **Secondary Goal 2**: Generate shareable quotes with QR codes that customers can bring to the shop or share with others
- **Secondary Goal 3**: Provide admin visibility into AI conversations and recommendation accuracy for continuous improvement
- **Secondary Goal 4**: Reduce time-to-quote from days (back-and-forth emails) to minutes (instant AI recommendations)

## Non-Goals

- Building a full e-commerce checkout flow (this captures leads and generates quotes, not transactions)
- Integration with external inventory management systems in this iteration
- Multi-tenant support (single business instance for Sal's Wheels & Tires)
- Automated appointment scheduling integration (covered in separate lead-generation PRD)
- Voice/phone agent integration (text-based chat only)
- Training custom ML models (uses existing LLMs with prompt engineering)

## Requirements

### Functional Requirements

#### Priority 1 - AI Fitment Recommendations Engine

- **FR-1**: Vehicle intake form must capture Year, Make, Model with cascading dropdowns populated from wheel-fitment MCP data
- **FR-2**: Customer must select intent from: "Tires Only", "Wheels Only", "Wheels + Tires", "Full Package (Wheels + Tires + Lift)"
- **FR-3**: System must call `searchVehicleBuilds` MCP tool to fetch real builds matching the customer's vehicle
- **FR-4**: System must call `getGuaranteedFitments` MCP tool to identify fitments with verified no-rubbing, no-trimming outcomes
- **FR-5**: System must call `recommendFitments` MCP tool to get AI-recommended options based on evidence strength
- **FR-6**: LLM must analyze fetched builds and generate 3-5 curated recommendations with explanations
- **FR-7**: Each recommendation must include: wheel specs, tire size, suspension requirements, price estimate, confidence level (based on number of confirming builds)
- **FR-8**: Recommendations must display actual photos from real builds via `getVehicleBuildDetails` MCP tool
- **FR-9**: System must show "X verified builds" count for each recommendation as social proof
- **FR-10**: Customer must be able to filter recommendations by: price range, wheel diameter, suspension level, stance preference
- **FR-11**: System must fall back to `getWheelSizeOEMData` MCP tool for OEM specs if no aftermarket builds exist

#### Priority 2 - Live Chat Agent (Cloudflare Agents SDK)

- **FR-12**: Implement stateful chat agent using `AIChatAgent` base class from Cloudflare Agents SDK
- **FR-13**: Each visitor must be identified by cookie and routed to a dedicated Durable Object instance
- **FR-14**: Agent state must persist: vehicle info, selected intent, viewed recommendations, conversation history
- **FR-15**: Agent must be able to answer questions about displayed recommendations (e.g., "Will this setup rub?", "What's the difference between these two?")
- **FR-16**: Agent must be able to modify recommendations based on customer feedback (e.g., "Show me larger tires", "I don't want to cut my fenders")
- **FR-17**: Agent must have access to all wheel-fitment MCP tools to fetch additional data on demand
- **FR-18**: Chat widget must appear in bottom-right corner, expandable/collapsible
- **FR-19**: Agent must maintain conversation history across page refreshes and browser sessions (within 30-day cookie window)
- **FR-20**: Agent must be able to detect when customer is ready to proceed and prompt quote generation

#### Priority 3 - Quote Generation

- **FR-21**: Customer must be able to select a recommendation and generate a formal quote
- **FR-22**: Quote generation must use existing `generateQuote` MCP tool
- **FR-23**: Quote must include: vehicle info, selected wheel/tire/suspension specs, pricing, sample build photos as evidence
- **FR-24**: Quote must generate unique shareable URL with QR code
- **FR-25**: Quote must be linked to the lead record in the database
- **FR-26**: Customer must be able to add/modify contact info (name, phone, email) before finalizing quote
- **FR-27**: System must send quote summary email to customer (if email provided) and notification to business owner

#### Priority 4 - Admin Dashboard Extensions

- **FR-28**: Admin leads page must display AI-related fields: vehicle year/make/model, intent, AI recommendations JSON
- **FR-29**: Admin must have access to `/admin/conversations` page showing chat transcripts per visitor
- **FR-30**: Conversation view must show full message history with timestamps and any MCP tool calls made
- **FR-31**: Admin must be able to filter leads by: intent type, vehicle make, whether quote was generated
- **FR-32**: Admin must be able to view and retrieve quotes by quote ID
- **FR-33**: Analytics page must show: AI recommendation acceptance rate, most popular vehicle/wheel combinations, average time to quote

### Non-Functional Requirements

- **NFR-1 Performance**: Initial AI recommendations must load within 5 seconds of form submission (includes MCP calls + LLM processing)
- **NFR-2 Performance**: Chat responses must stream to user within 500ms of message send (using AI SDK streaming)
- **NFR-3 Scalability**: Durable Object per visitor must support 10,000+ concurrent chat sessions
- **NFR-4 Reliability**: Agent state must persist across Worker restarts and cold starts via Durable Object SQLite storage
- **NFR-5 Security**: All MCP tool calls must be server-side only; client cannot directly invoke MCP tools
- **NFR-6 Edge Compatibility**: All LLM inference must work within Cloudflare Workers constraints (use streaming, avoid long blocking calls)
- **NFR-7 Mobile Responsiveness**: Vehicle selector, recommendations grid, and chat widget must be fully functional on mobile (320px+)
- **NFR-8 Accessibility**: Chat widget must support keyboard navigation and screen reader announcements for new messages
- **NFR-9 Data Privacy**: Conversation history stored in Durable Object; PII (phone, email) encrypted at rest in D1
- **NFR-10 Cost Efficiency**: Use Workers AI (free tier) or cost-efficient models for initial recommendations; premium models for complex chat queries

## Proposed Architecture

### System Design

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                    Cloudflare Edge                          │
                                    │  ┌──────────────────────────────────────────────────────┐   │
                                    │  │                   Astro Workers                       │   │
┌──────────────┐                    │  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │   │
│   Customer   │───HTTP Request────▶│  │  │  /quote    │  │  /api/chat │  │ /admin/leads   │  │   │
│   Browser    │◀──SSR Response─────│  │  │  (Astro)   │  │  (WebSocket)│  │ (React Admin)  │  │   │
└──────────────┘                    │  │  └─────┬──────┘  └──────┬─────┘  └───────┬────────┘  │   │
       │                            │  └────────┼────────────────┼────────────────┼──────────┘   │
       │                            │           │                │                │              │
       │  WebSocket                 │  ┌────────▼────────────────▼────────────────▼──────────┐   │
       └────────────────────────────┼──│                 Durable Objects                      │   │
                                    │  │  ┌────────────────────────────────────────────────┐  │   │
                                    │  │  │              FitmentAgent (AIChatAgent)         │  │   │
                                    │  │  │  ┌─────────────────┐  ┌─────────────────────┐  │  │   │
                                    │  │  │  │  Agent State    │  │  SQLite Messages    │  │  │   │
                                    │  │  │  │  - vehicle      │  │  - conversation     │  │  │   │
                                    │  │  │  │  - intent       │  │    history          │  │  │   │
                                    │  │  │  │  - recommendations│ │  - tool calls log  │  │  │   │
                                    │  │  │  │  - visitorId    │  │                     │  │  │   │
                                    │  │  │  └─────────────────┘  └─────────────────────┘  │  │   │
                                    │  │  └──────────────────────────┬─────────────────────┘  │   │
                                    │  └─────────────────────────────┼────────────────────────┘   │
                                    │                                │                            │
                                    │  ┌─────────────────────────────▼────────────────────────┐   │
                                    │  │                    Service Layer                      │   │
                                    │  │  ┌────────────────┐  ┌────────────────┐              │   │
                                    │  │  │ LLM Service    │  │ wheel-fitment  │              │   │
                                    │  │  │ (OpenAI/       │  │ MCP Client     │              │   │
                                    │  │  │  Anthropic/    │  │                │              │   │
                                    │  │  │  Workers AI)   │  │ - searchBuilds │              │   │
                                    │  │  └────────────────┘  │ - getDetails   │              │   │
                                    │  │                      │ - recommend    │              │   │
                                    │  │                      │ - generateQuote│              │   │
                                    │  │                      └────────────────┘              │   │
                                    │  └──────────────────────────────────────────────────────┘   │
                                    │                                                             │
                                    │  ┌──────────────────────────────────────────────────────┐   │
                                    │  │                    D1 Database                        │   │
                                    │  │  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐  │   │
                                    │  │  │  leads   │  │ conversations │  │    quotes       │  │   │
                                    │  │  └──────────┘  └──────────────┘  └─────────────────┘  │   │
                                    │  └──────────────────────────────────────────────────────┘   │
                                    └─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### Frontend Components

##### Customer-Facing

- **VehicleIntakeForm**: Entry point form with Year/Make/Model cascading selects + intent radio buttons
  - Uses react-select or native selects with search
  - Calls `/api/vehicles` endpoint for make/model data
  - On submit, triggers AI recommendation flow

- **RecommendationsGrid**: Displays AI-curated recommendations in card layout
  - Each card shows: wheel/tire specs, suspension info, price range, photo gallery, confidence badge
  - Cards are filterable by price, wheel size, suspension level
  - "Select This Setup" button triggers quote generation

- **BuildPhotoCarousel**: Slideshow of real build photos for each recommendation
  - Images sourced from `getVehicleBuildDetails` MCP tool
  - Shows vehicle info overlay (year, make, model, trim)
  - Swipeable on mobile

- **ChatWidget**: Floating chat interface in bottom-right corner
  - Minimized state: Chat bubble with unread count
  - Expanded state: Full chat window with input field
  - Uses `useAgentChat` hook from `@cloudflare/ai-chat/react`
  - Auto-resumes conversation on page load

- **QuotePreview**: Modal showing quote details before finalization
  - Editable contact info fields
  - Summary of selected items with pricing
  - QR code preview
  - "Generate Quote" button

##### Admin-Facing

- **LeadsTableEnhanced**: Extended leads table with AI-specific columns
  - Columns: Name, Vehicle, Intent, Recommendations (expandable JSON), Quote ID, Status, Date
  - Filters: By intent, by vehicle make, by quote status

- **ConversationViewer**: Full chat transcript viewer
  - Message bubbles for user vs assistant
  - Collapsible sections for MCP tool calls
  - Timestamp for each message
  - Link to associated lead/quote

- **AIAnalyticsDashboard**: Metrics on AI system performance
  - Recommendation acceptance rate
  - Most popular setups
  - Average time to quote
  - Conversation length distribution

#### Backend Components

##### Astro Actions

- **getVehicleMakes**: Returns list of vehicle makes from MCP or cache
- **getVehicleModels**: Returns models for a given make/year
- **generateAIRecommendations**: Core action that orchestrates MCP calls and LLM processing
  - Input: { year, make, model, intent }
  - Calls: `searchVehicleBuilds`, `getGuaranteedFitments`, `recommendFitments`, `getWheelSizeOEMData`
  - Passes data to LLM for synthesis
  - Output: Array of curated recommendations with explanations
- **createQuoteFromRecommendation**: Wraps `generateQuote` MCP tool with lead record creation
- **getConversationHistory**: Retrieves chat history from Durable Object for admin view

##### Durable Object (FitmentAgent)

```typescript
// src/agents/FitmentAgent.ts
import { AIChatAgent } from "@cloudflare/ai-chat";
import { routeAgentRequest, callable } from "agents";
import { streamText, convertToModelMessages, tool } from "ai";
import { openai } from "@ai-sdk/openai";

interface FitmentAgentState {
  visitorId: string;
  vehicle: { year: number; make: string; model: string } | null;
  intent: string | null;
  recommendations: Recommendation[] | null;
  selectedRecommendation: Recommendation | null;
  quoteId: string | null;
}

export class FitmentAgent extends AIChatAgent<Env, FitmentAgentState> {
  initialState: FitmentAgentState = {
    visitorId: "",
    vehicle: null,
    intent: null,
    recommendations: null,
    selectedRecommendation: null,
    quoteId: null,
  };

  // Called when new chat message arrives
  async onChatMessage(onFinish) {
    const systemPrompt = this.buildSystemPrompt();
    
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: await convertToModelMessages(this.messages),
      tools: {
        searchBuilds: tool({
          description: "Search for real vehicle builds",
          parameters: z.object({ ... }),
          execute: async (params) => this.callMCP("searchVehicleBuilds", params),
        }),
        getGuaranteedFitments: tool({
          description: "Get fitments with no rubbing/trimming",
          parameters: z.object({ ... }),
          execute: async (params) => this.callMCP("getGuaranteedFitments", params),
        }),
        generateQuote: tool({
          description: "Generate a quote for selected setup",
          parameters: z.object({ ... }),
          execute: async (params) => this.callMCP("generateQuote", params),
        }),
      },
      onFinish,
    });
    
    return result.toUIMessageStreamResponse();
  }

  @callable()
  setVehicle(vehicle: { year: number; make: string; model: string }) {
    this.setState({ ...this.state, vehicle });
  }

  @callable()
  setIntent(intent: string) {
    this.setState({ ...this.state, intent });
  }

  @callable()
  setRecommendations(recommendations: Recommendation[]) {
    this.setState({ ...this.state, recommendations });
  }

  private buildSystemPrompt(): string {
    return `You are an expert wheel and tire fitment consultant for Sal's Wheels & Tires.
    
Current customer context:
- Vehicle: ${JSON.stringify(this.state.vehicle)}
- Intent: ${this.state.intent}
- Current recommendations: ${JSON.stringify(this.state.recommendations)}

You have access to real build data from thousands of actual vehicle setups. Use the tools
to search for builds, check guaranteed fitments, and generate quotes when the customer is ready.

Be helpful, knowledgeable, and confident. Reference specific builds when possible.`;
  }

  private async callMCP(toolName: string, params: any) {
    // Bridge to wheel-fitment MCP tools
    // Implementation depends on how MCP is exposed in the environment
  }
}
```

#### Database Schema Updates

```sql
-- Update existing leads table with AI-specific fields
ALTER TABLE leads ADD COLUMN vehicle_year INTEGER;
ALTER TABLE leads ADD COLUMN vehicle_make TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN vehicle_model TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN vehicle_trim TEXT DEFAULT '';
ALTER TABLE leads ADD COLUMN intent TEXT DEFAULT ''; -- tires_only, wheels_only, wheels_and_tires, package
ALTER TABLE leads ADD COLUMN recommended_builds TEXT DEFAULT ''; -- JSON array of build recommendations
ALTER TABLE leads ADD COLUMN selected_build TEXT DEFAULT ''; -- JSON of selected recommendation
ALTER TABLE leads ADD COLUMN quote_id TEXT DEFAULT ''; -- Reference to generated quote
ALTER TABLE leads ADD COLUMN agent_session_id TEXT DEFAULT ''; -- Durable Object ID for conversation
ALTER TABLE leads ADD COLUMN source TEXT DEFAULT 'ai_assistant'; -- ai_assistant, manual, import

CREATE INDEX idx_leads_vehicle ON leads(vehicle_year, vehicle_make, vehicle_model);
CREATE INDEX idx_leads_intent ON leads(intent);
CREATE INDEX idx_leads_quote_id ON leads(quote_id);

-- New conversations table for admin review (denormalized from DO for querying)
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL UNIQUE, -- Durable Object ID
  visitor_id TEXT NOT NULL, -- Cookie-based visitor ID
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  vehicle_year INTEGER,
  vehicle_make TEXT DEFAULT '',
  vehicle_model TEXT DEFAULT '',
  intent TEXT DEFAULT '',
  message_count INTEGER DEFAULT 0,
  first_message_at TEXT DEFAULT '',
  last_message_at TEXT DEFAULT '',
  status TEXT DEFAULT 'active', -- active, converted, abandoned
  created_at TEXT DEFAULT '',
  updated_at TEXT DEFAULT ''
);

CREATE INDEX idx_conversations_visitor ON conversations(visitor_id);
CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_conversations_status ON conversations(status);

-- Conversation messages (synced from DO for admin viewing)
CREATE TABLE conversation_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user, assistant, tool
  content TEXT NOT NULL,
  tool_name TEXT DEFAULT '', -- If role=tool, which tool was called
  tool_input TEXT DEFAULT '', -- JSON of tool parameters
  tool_output TEXT DEFAULT '', -- JSON of tool result
  created_at TEXT DEFAULT ''
);

CREATE INDEX idx_messages_conversation ON conversation_messages(conversation_id);

-- Quotes table (for local tracking, complements MCP quote generation)
CREATE TABLE quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id TEXT NOT NULL UNIQUE, -- MCP-generated quote ID (e.g., QT-2024-ABC123)
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
  vehicle_year INTEGER,
  vehicle_make TEXT DEFAULT '',
  vehicle_model TEXT DEFAULT '',
  intent TEXT DEFAULT '',
  wheel_specs TEXT DEFAULT '', -- JSON
  tire_specs TEXT DEFAULT '', -- JSON
  suspension_specs TEXT DEFAULT '', -- JSON
  total_price REAL DEFAULT 0,
  evidence_builds TEXT DEFAULT '', -- JSON array of build URLs used as evidence
  qr_code_url TEXT DEFAULT '',
  status TEXT DEFAULT 'draft', -- draft, sent, viewed, converted, expired
  expires_at TEXT DEFAULT '',
  created_at TEXT DEFAULT '',
  updated_at TEXT DEFAULT ''
);

CREATE INDEX idx_quotes_quote_id ON quotes(quote_id);
CREATE INDEX idx_quotes_lead ON quotes(lead_id);
CREATE INDEX idx_quotes_status ON quotes(status);
```

### Data Flow

#### 1. Initial Recommendation Flow

```
Customer lands on /quote
    │
    ▼
VehicleIntakeForm renders with Year dropdown
    │
    ▼
Customer selects Year → triggers getVehicleMakes(year)
    │
    ▼
Customer selects Make → triggers getVehicleModels(year, make)
    │
    ▼
Customer selects Model + Intent → Submit
    │
    ▼
generateAIRecommendations action called:
    │
    ├─▶ MCP: searchVehicleBuilds(year, make, model)
    │       Returns: Array of real builds with specs
    │
    ├─▶ MCP: getGuaranteedFitments(year, make, model, minBuilds=3)
    │       Returns: Fitments proven to work without issues
    │
    ├─▶ MCP: recommendFitments(year, make, model, intent, minEvidenceBuilds=5)
    │       Returns: AI-recommended fitments with evidence
    │
    ├─▶ MCP: getWheelSizeOEMData(year, make, model)
    │       Returns: OEM bolt pattern, center bore, tire sizes
    │
    └─▶ LLM: Synthesize data into 3-5 recommendations
            Input: All MCP results + intent
            Output: Curated recommendations with explanations
    │
    ▼
RecommendationsGrid displays results
    │
    ▼
For each recommendation, fetch photos:
    MCP: getVehicleBuildDetails(build_url) → BuildPhotoCarousel
    │
    ▼
FitmentAgent DO initialized with:
    - vehicle info
    - intent
    - recommendations array
    │
    ▼
ChatWidget connects to FitmentAgent via WebSocket
```

#### 2. Chat Interaction Flow

```
Customer types message in ChatWidget
    │
    ▼
Message sent via WebSocket to FitmentAgent DO
    │
    ▼
AIChatAgent.onChatMessage() invoked:
    │
    ├─▶ System prompt includes current state
    │   (vehicle, intent, recommendations)
    │
    ├─▶ LLM processes message with tools available:
    │   - searchBuilds (if customer wants different options)
    │   - getGuaranteedFitments (if customer asks about fitment safety)
    │   - generateQuote (if customer ready to proceed)
    │
    └─▶ Response streamed back to client
    │
    ▼
If tool called:
    ├─▶ Execute MCP call
    ├─▶ Update agent state if needed
    └─▶ Continue LLM response with tool result
    │
    ▼
Response displayed in ChatWidget
Message persisted in DO SQLite
```

#### 3. Quote Generation Flow

```
Customer clicks "Select This Setup" on a recommendation
    OR
Agent determines customer is ready (via chat)
    │
    ▼
QuotePreview modal opens:
    - Pre-filled with selected recommendation
    - Customer can edit contact info
    │
    ▼
Customer clicks "Generate Quote"
    │
    ▼
createQuoteFromRecommendation action:
    │
    ├─▶ MCP: generateQuote({
    │       vehicle_year, vehicle_make, vehicle_model,
    │       wheel_sku, wheel_size, wheel_offset,
    │       tire_sku, tire_size,
    │       suspension_sku, suspension_lift,
    │       customer_name, customer_email, customer_phone,
    │       evidence_build_count, sample_build_urls
    │   })
    │   Returns: { quote_id, qr_code_url }
    │
    ├─▶ Create lead record in D1 (if not exists)
    │
    ├─▶ Create quote record in D1
    │
    ├─▶ Update conversation record with lead_id
    │
    └─▶ Send notification emails (customer + business owner)
    │
    ▼
Display quote confirmation with:
    - Quote ID
    - QR code
    - "Share" button
    - "Print" button
```

## Technical Considerations

### Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Agent Framework** | Cloudflare Agents SDK (`agents` + `@cloudflare/ai-chat`) | Native Durable Object integration, automatic message persistence, WebSocket support, resumable streaming |
| **LLM for Recommendations** | OpenAI GPT-4o-mini or Claude 3 Haiku | Cost-effective for high-volume initial recommendations; good at structured output |
| **LLM for Chat** | OpenAI GPT-4o or Claude 3.5 Sonnet | Higher quality for nuanced customer interactions; worth the cost for conversion |
| **MCP Client** | Direct HTTP calls to wheel-fitment MCP | MCP tools are exposed via HTTP; can be called from Workers |
| **State Management** | Durable Object SQLite + React state | DO for persistence, React for UI state; clean separation |
| **Streaming** | AI SDK `streamText` + `toUIMessageStreamResponse` | Standard pattern for Vercel AI SDK; works with AIChatAgent |
| **Frontend Framework** | React (already in use) | Existing investment; good ecosystem for chat components |
| **Styling** | Tailwind CSS (already in use) | Consistent with existing admin dashboard |

### Trade-offs Analyzed

| Decision | Option A | Option B | Chosen | Rationale |
|----------|----------|----------|--------|-----------|
| **Agent persistence** | Single DO per customer (cookie-based) | New DO per session | **A** | Better UX: customer returns and sees same conversation; 30-day cookie matches typical sales cycle |
| **Recommendation generation** | Client-side LLM calls | Server-side LLM calls | **B** | Security: MCP tools shouldn't be exposed to client; Cost control: server-side can cache/batch |
| **Chat architecture** | Full page chat | Floating widget | **B** | Better UX: customer can reference recommendations while chatting; standard pattern |
| **Message storage** | DO only | DO + D1 sync | **Both** | DO for real-time; D1 for admin queries (eventual consistency acceptable for admin) |
| **Photo loading** | Eager load all | Lazy load on demand | **B** | Performance: only fetch photos for visible recommendations; faster initial load |
| **LLM model selection** | Single model | Tiered by complexity | **B** | Cost optimization: cheap model for initial recs, expensive for chat nuances |
| **Visitor identification** | Cookie only | Cookie + fingerprint | **A** | Privacy: fingerprinting raises concerns; cookie sufficient for use case |
| **Tool calling** | MCP server integration | Direct HTTP to MCP tools | **B** | Simpler: wheel-fitment MCP exposed via HTTP; no need for full MCP server pattern |

### MCP Tool Integration Strategy

The wheel-fitment MCP tools are available as HTTP endpoints. Integration approach:

```typescript
// src/lib/mcp-client.ts
export class WheelFitmentMCP {
  constructor(private baseUrl: string) {}

  async searchVehicleBuilds(params: {
    year: number;
    make: string;
    model: string;
    suspension?: string;
    stance?: string;
    rubbing?: string;
    trimming?: string;
  }): Promise<VehicleBuild[]> {
    const response = await fetch(`${this.baseUrl}/searchVehicleBuilds`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  }

  async getGuaranteedFitments(params: {
    year: number;
    make: string;
    model: string;
    minBuilds?: number;
    driveType?: string;
  }): Promise<GuaranteedFitment[]> {
    // ...
  }

  async recommendFitments(params: {
    year: number;
    make: string;
    model: string;
    intent: string;
    toleranceRubbing?: 'strict' | 'mild' | 'any';
    toleranceTrimming?: 'strict' | 'mild' | 'any';
    minEvidenceBuilds?: number;
  }): Promise<FitmentRecommendation[]> {
    // ...
  }

  async generateQuote(params: GenerateQuoteParams): Promise<Quote> {
    // ...
  }

  async getVehicleBuildDetails(url: string): Promise<BuildDetails> {
    // ...
  }

  async getWheelSizeOEMData(params: {
    year: number;
    make: string;
    model: string;
  }): Promise<OEMData> {
    // ...
  }
}
```

### LLM Prompt Engineering

#### Initial Recommendation Prompt

```
You are an expert wheel and tire fitment consultant. Analyze the following data and provide 3-5 recommended setups.

VEHICLE: {{year}} {{make}} {{model}}
CUSTOMER INTENT: {{intent}}

REAL BUILD DATA (from verified vehicle owners):
{{searchBuildsResults}}

GUARANTEED FITMENTS (proven no rubbing/trimming):
{{guaranteedFitmentsResults}}

AI RECOMMENDATIONS (based on evidence):
{{recommendFitmentsResults}}

OEM SPECS:
{{oemData}}

For each recommendation, provide:
1. Setup name (e.g., "Street Performance" or "Off-Road Ready")
2. Wheel: Brand, Model, Size (e.g., 18x9), Offset, Finish
3. Tire: Brand, Model, Size (e.g., 285/70R18)
4. Suspension: Required modifications (if any)
5. Price range: Estimated total cost
6. Confidence: How many builds confirm this works
7. Explanation: Why this setup works well for the customer's intent
8. Considerations: Any rubbing, trimming, or modifications needed

Prioritize:
- Setups with multiple confirming builds (higher confidence)
- Options that match the customer's intent
- Range of price points (budget, mid, premium)
- Safety (prefer no-rubbing options)
```

#### Chat System Prompt

```
You are a helpful wheel and tire fitment expert for Sal's Wheels & Tires. You're chatting with a customer who is considering wheel and tire options for their vehicle.

CURRENT CONTEXT:
- Vehicle: {{year}} {{make}} {{model}}
- Customer Intent: {{intent}}
- Recommendations shown: {{recommendationsSummary}}
- Selected option: {{selectedOption || 'None yet'}}

You have access to tools:
- searchBuilds: Search for more vehicle builds with different criteria
- getGuaranteedFitments: Find fitments proven to work without issues
- generateQuote: Create a formal quote when customer is ready

GUIDELINES:
1. Be confident and knowledgeable - you have real data to back up your recommendations
2. Reference specific builds when relevant ("We've seen 15 Tacomas running this exact setup...")
3. If customer asks about fitment, emphasize evidence-based answers
4. Proactively suggest generating a quote when customer seems interested
5. Handle objections with data (e.g., "Many customers worry about rubbing, but 23 builds confirm this fits perfectly")
6. Keep responses concise - this is chat, not email
```

## Implementation Strategy

### Phased Approach

#### Phase 1: AI Recommendation Engine (Week 1-2)

**Milestones:**
1. Set up MCP client library for wheel-fitment tools
2. Implement `generateAIRecommendations` action with LLM integration
3. Build VehicleIntakeForm component with cascading selects
4. Build RecommendationsGrid component with cards
5. Build BuildPhotoCarousel component
6. Create `/quote` page integrating above components
7. Add database schema updates for AI fields

**Deliverables:**
- Customer can enter vehicle, select intent, see AI recommendations
- Recommendations show real photos and specs
- No chat yet, no quote generation

#### Phase 2: Live Chat Agent (Week 3-4)

**Milestones:**
1. Set up Cloudflare Agents SDK (`agents`, `@cloudflare/ai-chat`)
2. Implement FitmentAgent Durable Object class
3. Configure wrangler.jsonc for Durable Object binding
4. Implement tool definitions for MCP tools in agent
5. Build ChatWidget React component with `useAgentChat`
6. Implement visitor identification (cookie-based)
7. Wire ChatWidget to FitmentAgent
8. Add WebSocket route handling

**Deliverables:**
- Floating chat widget on /quote page
- Chat persists across page refreshes
- Agent can answer questions and call MCP tools
- Agent state includes vehicle/intent/recommendations

#### Phase 3: Quote Generation (Week 5)

**Milestones:**
1. Build QuotePreview modal component
2. Implement `createQuoteFromRecommendation` action
3. Wire "Select This Setup" button to QuotePreview
4. Integrate with `generateQuote` MCP tool
5. Create lead + quote records in D1
6. Implement email notifications (customer + business)
7. Build quote confirmation page with QR code display

**Deliverables:**
- Customer can generate quote from recommendation or via chat
- Quote includes vehicle, specs, pricing, QR code
- Lead created automatically with AI data

#### Phase 4: Admin Dashboard Extensions (Week 6)

**Milestones:**
1. Update LeadsTable with AI columns (vehicle, intent, quote)
2. Build ConversationViewer component
3. Build `/admin/conversations` page
4. Implement D1 sync for conversation messages (scheduled worker)
5. Add AI-specific filters to leads page
6. Build AIAnalyticsDashboard component
7. Integrate analytics into `/admin/analytics` page

**Deliverables:**
- Admin can view leads with AI data
- Admin can read full chat transcripts
- Admin can see AI system metrics

#### Phase 5: Polish & Optimization (Week 7-8)

**Milestones:**
1. Performance optimization (caching, lazy loading)
2. Mobile responsiveness testing and fixes
3. Accessibility audit and fixes (chat widget, forms)
4. Error handling improvements
5. Rate limiting for MCP calls
6. Cost monitoring for LLM usage
7. A/B testing infrastructure for prompts
8. Documentation and training materials

**Deliverables:**
- Production-ready system
- Performance within NFR targets
- Admin documentation

### Risk Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **MCP tool rate limits** | High | Medium | Implement caching layer; batch requests where possible; show cached recommendations while fetching updates |
| **LLM cost overrun** | High | Medium | Use tiered models; implement token budgets per session; monitor usage with alerts |
| **Durable Object cold starts** | Medium | Low | Use alarm scheduling to keep active; implement connection retry in client |
| **Poor recommendation quality** | High | Medium | Start with curated prompts; implement feedback loop; A/B test prompt variations |
| **WebSocket connection drops** | Medium | Medium | Implement reconnection logic in ChatWidget; persist message queue locally |
| **Build data staleness** | Low | Low | MCP tools pull from live database; builds data regularly updated externally |
| **Customer drops off mid-flow** | Medium | High | Send follow-up email if partial session (has vehicle but no quote); implement session recovery |
| **Complex vehicle edge cases** | Medium | Medium | Fallback to OEM data; agent can escalate to "contact us" flow |
| **Privacy/GDPR concerns** | High | Low | Implement data retention policies; cookie consent for chat persistence; PII encryption |

### Wrangler Configuration

```jsonc
// wrangler.jsonc additions
{
  "durable_objects": {
    "bindings": [
      {
        "name": "FITMENT_AGENT",
        "class_name": "FitmentAgent"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["FitmentAgent"]
    }
  ],
  "vars": {
    "OPENAI_API_KEY": "", // Set in wrangler secrets
    "MCP_BASE_URL": "https://wheel-fitment-mcp.example.com"
  }
}
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Time to first recommendation** | < 5 seconds | Measure from form submit to recommendations render |
| **Recommendation acceptance rate** | > 30% | Leads with quote / leads with recommendations shown |
| **Chat engagement rate** | > 50% | Sessions with chat message / total sessions |
| **Quote generation rate** | > 40% | Quotes generated / sessions with recommendations |
| **Lead capture rate** | > 60% | Leads created / quotes generated |
| **Chat resolution rate** | > 80% | Chats leading to quote without human intervention |
| **Customer satisfaction** | > 4.5/5 | Post-quote survey |
| **Average time to quote** | < 5 minutes | From page load to quote generation |
| **Cost per recommendation** | < $0.05 | LLM + MCP costs per recommendation set |
| **Cost per chat session** | < $0.50 | LLM costs per chat session |

## Open Questions

### Resolved

- **Q1**: Should chat persist across devices (logged-in user)?
  - **Decision**: No. Cookie-based only for MVP. Cross-device requires auth system out of scope.

- **Q2**: How to handle multiple vehicles per customer?
  - **Decision**: Each new vehicle/intent combo creates a new session. Customer can start over with "New Vehicle" button.

### Open

- **Q3**: What LLM provider to use primarily?
  - **Options**: OpenAI (GPT-4o-mini for recs, GPT-4o for chat) | Anthropic (Haiku for recs, Sonnet for chat) | Workers AI (free but less capable)
  - **Recommendation**: Start with OpenAI for consistency; evaluate Workers AI for cost reduction later

- **Q4**: How long to retain conversation data?
  - **Options**: 30 days (match cookie) | 90 days (sales cycle) | 1 year (analytics) | Indefinite
  - **Recommendation**: 90 days in DO, archive to D1 indefinitely for analytics

- **Q5**: Should we implement proactive chat messages?
  - **Example**: Agent sends "I see you've been looking at the TRD Pro setup - any questions?"
  - **Recommendation**: Phase 2 enhancement; MVP focuses on reactive chat

- **Q6**: How to handle inventory/availability?
  - **Issue**: MCP tools return products but don't have real-time inventory
  - **Options**: Show all with "check availability" CTA | Only show in-stock | Show with availability indicator
  - **Recommendation**: Show all; quote includes "subject to availability" disclaimer; inventory integration future phase

- **Q7**: What happens when MCP returns no builds?
  - **Options**: Show OEM specs only | Suggest similar vehicles | Show generic recommendations
  - **Recommendation**: Cascade: OEM specs → similar models → generic "contact us for custom consultation"

- **Q8**: Should chat agent have access to pricing?
  - **Options**: Full pricing | Price ranges only | "Contact for pricing"
  - **Recommendation**: Price ranges from MCP `getProductDetails`; exact quotes require generate quote flow

## Appendix

### Sample MCP Tool Responses

#### searchVehicleBuilds Response

```json
{
  "builds": [
    {
      "url": "https://www.customwheeloffset.com/wheel-offset-gallery/123456",
      "year": 2024,
      "make": "Toyota",
      "model": "Tacoma",
      "trim": "TRD Off-Road",
      "wheel": {
        "brand": "Method",
        "model": "MR305",
        "size": "17x8.5",
        "offset": 0
      },
      "tire": {
        "brand": "BFGoodrich",
        "model": "KO2",
        "size": "285/70R17"
      },
      "suspension": "Leveling Kit",
      "rubbing": "No rubbing or scrubbing",
      "trimming": "No Trimming",
      "stance": "Flush",
      "images": ["https://..."]
    }
  ],
  "totalBuilds": 47,
  "pagination": { "page": 1, "totalPages": 5 }
}
```

#### recommendFitments Response

```json
{
  "recommendations": [
    {
      "wheelSize": "17x8.5",
      "tireSize": "285/70R17",
      "suspensionType": "Leveling Kit",
      "evidence_builds": 23,
      "sample_urls": ["https://...", "https://..."],
      "common_wheels": ["Method MR305", "Fuel Shok", "Icon Rebound"],
      "common_tires": ["BFGoodrich KO2", "Nitto Ridge Grappler"],
      "rubbing_status": "No rubbing reported",
      "trimming_status": "None required"
    }
  ]
}
```

### UI Wireframes

#### /quote Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Sal's Wheels & Tires        [Phone] [Hours] [Location] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Find Your Perfect Setup                                       │
│                                                                 │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│   │ Year   ▼    │ │ Make   ▼    │ │ Model  ▼    │              │
│   └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                 │
│   What are you looking for?                                     │
│   ○ Tires Only  ○ Wheels Only  ○ Wheels + Tires  ○ Full Package│
│                                                                 │
│   [Get AI Recommendations]                                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Recommended Setups for Your 2024 Toyota Tacoma               │
│   Based on 47 verified builds                                   │
│                                                                 │
│   ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐│
│   │ [Photo Carousel] │  │ [Photo Carousel] │  │[Photo Carousel││
│   │                  │  │                  │  │               ││
│   │ Street Performance│  │ Off-Road Ready   │  │ Budget Friendly│
│   │ 17x8.5 +0        │  │ 17x9 -12         │  │ 17x8 +15      ││
│   │ 285/70R17        │  │ 285/75R17        │  │ 265/70R17     ││
│   │ Leveling Kit     │  │ 3" Lift Required │  │ Stock Height  ││
│   │ $2,400 - $2,800  │  │ $3,500 - $4,200  │  │ $1,800 - $2,200│
│   │ ✓ 23 builds      │  │ ✓ 15 builds      │  │ ✓ 9 builds    ││
│   │ [Select Setup]   │  │ [Select Setup]   │  │ [Select Setup]││
│   └──────────────────┘  └──────────────────┘  └───────────────┘│
│                                                                 │
│                                             ┌─────────────────┐ │
│                                             │ 💬 Chat with AI │ │
│                                             └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Chat Widget Expanded

```
┌─────────────────────────────────┐
│ AI Fitment Expert          [−] │
├─────────────────────────────────┤
│                                 │
│ 🤖 I see you're looking at     │
│    setups for your 2024 Tacoma. │
│    Let me know if you have any │
│    questions!                   │
│                                 │
│                    ┌───────────┐│
│                    │ Will the  ││
│                    │ 285/75    ││
│                    │ tires rub?││
│                    └───────────┘│
│                                 │
│ 🤖 Great question! Based on 15 │
│    verified builds with that   │
│    size on a 3" lift, only 2   │
│    reported slight rub at full │
│    turn. 13 had no issues at   │
│    all. Would you like to see  │
│    some examples?              │
│                                 │
├─────────────────────────────────┤
│ [Type a message...      ] [➤]  │
└─────────────────────────────────┘
```

### Glossary

- **MCP**: Model Context Protocol - tool interface for LLM integrations
- **Durable Object (DO)**: Cloudflare's stateful serverless primitive
- **AIChatAgent**: Base class from Cloudflare Agents SDK for chat agents
- **Fitment**: How wheels/tires fit on a vehicle (includes rubbing, trimming, stance)
- **Stance**: How far wheels protrude from fenders (flush, aggressive, tucked)
- **Rubbing**: When tires contact fenders or suspension components
- **Trimming**: Cutting fender liners or body panels for clearance
- **OEM**: Original Equipment Manufacturer (factory specs)
- **Build**: A documented vehicle setup with specific wheel/tire/suspension configuration
