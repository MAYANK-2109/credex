# Architecture

## System Overview

```mermaid
graph TB
    subgraph Client["Client (Next.js Frontend)"]
        Landing["Landing Page<br/>(marketing)"]
        Optimizer["Optimizer Page<br/>(audit tool)"]
        Share["Share Page<br/>(view results)"]
    end
    
    subgraph Backend["API Routes"]
        LeadsAPI["POST /api/leads<br/>(capture emails)"]
        SharesAPI["POST /api/shares<br/>(create share links)"]
        FeedbackAPI["POST /api/feedback<br/>(collect feedback)"]
    end
    
    subgraph Data["Data Layer"]
        OptEngine["optimization-engine.ts<br/>(deterministic rules)"]
        LLMService["llm-service.ts<br/>(AI summaries)"]
        LeadsFile["leads.json"]
        SharesFile["shares.json"]
        Storage["storage-utils.ts<br/>(file I/O)"]
    end
    
    Client -->|input config| Optimizer
    Optimizer -->|run rules| OptEngine
    OptEngine -->|calculate savings| Optimizer
    Optimizer -->|generate AI summary| LLMService
    LLMService -->|LLM API| Optimizer
    Optimizer -->|submit lead| LeadsAPI
    LeadsAPI -->|write| Storage
    Storage -->|persist| LeadsFile
    Optimizer -->|create share| SharesAPI
    SharesAPI -->|write| Storage
    Storage -->|persist| SharesFile
    Optimizer -->|send feedback| FeedbackAPI
    FeedbackAPI -->|write| Storage
    Share -->|read| Storage
    Share -->|load| SharesFile
```

## Key Components

### Frontend (Client)
- **Landing Page**: Marketing-focused entry point with value proposition and call-to-action
- **Optimizer Page**: Interactive audit tool where users input team size, use case, and tool configuration
- **Share Page**: View-only interface to inspect previously shared optimization results

### API Layer
- **Leads API** (`/api/leads`): Captures user email addresses and interest in contact follow-up
- **Shares API** (`/api/shares`): Generates shareable links for audit results with unique identifiers
- **Feedback API** (`/api/feedback`): Collects user feedback on recommendations

### Optimization Engine
- **Deterministic Rules** (`optimization-engine.ts`): 
  - Claude Team floor enforcement (minimum 5 seats)
  - Cursor Business floor enforcement (minimum 10 seats)
  - Pricing mismatch detection (overpayment checks)
  - Calculates monthly and annual savings
- **LLM Service** (`llm-service.ts`): Generates human-readable AI summaries of recommendations

### Data Layer
- **File-based Storage**: All data persisted to JSON files (`leads.json`, `shares.json`)
- **Storage Utils** (`storage-utils.ts`): Abstraction layer for file I/O operations
- **No Database**: Leverages Next.js file system for simplicity and fast iteration

## Data Flow

1. **User Input** → User selects team size, primary use case, and tool stack
2. **Optimization** → Deterministic engine applies business rules to detect savings opportunities
3. **Results** → Display recommendations with monthly/annual savings
4. **Sharing** → Generate shareable link stored in `shares.json`
5. **Lead Capture** → Optional email submission stored in `leads.json`
6. **Feedback Loop** → Collect audit feedback in `data/feedback.json`
