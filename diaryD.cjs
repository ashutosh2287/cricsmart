const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Header, Footer, TabStopType, TabStopPosition,
  VerticalAlign, PageBreak
} = require('docx');
const fs = require('fs');

// ─── Colours ───────────────────────────────────────────────────────────────
const NAVY   = "1B3A6B";
const STEEL  = "2E75B6";
const LGRAY  = "F2F5FA";
const MGRAY  = "D9E2F0";
const BLACK  = "1A1A1A";
const WHITE  = "FFFFFF";
const GREEN  = "1E6B3C";
const LGGREEN= "E8F4EE";

// ─── Helpers ────────────────────────────────────────────────────────────────
const border  = (c = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 4, color: c });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });
const borders  = (c = "CCCCCC") => ({ top: border(c), bottom: border(c), left: border(c), right: border(c) });
const noBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

function cell(children, opts = {}) {
  return new TableCell({
    borders: opts.borders ?? borders(),
    width:   opts.width  ?? { size: 0, type: WidthType.AUTO },
    shading: opts.shading ?? undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    children
  });
}

function hcell(text, w, bgColor = NAVY) {
  return new TableCell({
    borders: borders(STEEL),
    width:   { size: w, type: WidthType.DXA },
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 20, color: WHITE, font: "Arial" })]
    })]
  });
}

function dataCell(text, w, shade = false, bold = false, center = false) {
  return new TableCell({
    borders: borders("C5D3E8"),
    width:   { size: w, type: WidthType.DXA },
    shading: shade ? { fill: LGRAY, type: ShadingType.CLEAR } : undefined,
    margins: { top: 90, bottom: 90, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text, bold, size: 18, color: BLACK, font: "Arial" })]
    })]
  });
}

function spacer(n = 1) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(new Paragraph({ children: [] }));
  return arr;
}

// ─── Diary Entries ──────────────────────────────────────────────────────────
// 14 phases, ~20 weeks total.  Each week = 5 working days.
const phases = [
  {
    phase: 1,
    title: "Requirement Analysis & Research",
    duration: "3 Weeks",
    dates: "05 Jan – 23 Jan 2026",
    weeks: [
      {
        week: 1, range: "05 Jan – 09 Jan 2026",
        days: [
          { date: "Monday, 05 Jan 2026",    task: "Onboarding and orientation at Unified Mentor Pvt. Ltd. Received project brief for FinSights – Stock Tracking & Portfolio Management Tool.", learned: "Understood company workflow, communication protocols, and project management tools used internally.", output: "Completed onboarding formalities; set up development workstation and tools." },
          { date: "Tuesday, 06 Jan 2026",   task: "Initial research on stock market concepts: equities, indices, OHLC data, market capitalisation, and trading volume.", learned: "Gained foundational knowledge of financial terminology essential for building the platform.", output: "Prepared a research document summarising key financial concepts." },
          { date: "Wednesday, 07 Jan 2026", task: "Explored existing stock-market platforms (Moneycontrol, Zerodha, Yahoo Finance) to understand expected features and UX patterns.", learned: "Identified key UI/UX patterns such as real-time quote tables, portfolio dashboards, and watchlist management.", output: "Created a comparative analysis note of competitor platforms." },
          { date: "Thursday, 08 Jan 2026",  task: "Studied available public APIs: Yahoo Finance API, Finnhub API. Explored their endpoints, rate limits, and data formats.", learned: "Understood how RESTful financial APIs return JSON payloads with stock quotes, OHLC arrays, and metadata.", output: "Documented API response structures and selected Yahoo Finance + Finnhub as primary data sources." },
          { date: "Friday, 09 Jan 2026",    task: "Drafted initial project requirements, feature list, and user stories for the FinSights platform.", learned: "Learned how to translate business requirements into structured user stories with acceptance criteria.", output: "Produced a requirements specification draft covering authentication, trading, watchlist, and analytics modules." }
        ]
      },
      {
        week: 2, range: "12 Jan – 16 Jan 2026",
        days: [
          { date: "Monday, 12 Jan 2026",    task: "Researched full-stack technology choices: Next.js, React, Node.js, Express.js, MongoDB Atlas, TailwindCSS.", learned: "Understood the benefits of hybrid rendering (SSR/SSG/CSR) in Next.js for performance and SEO.", output: "Finalised technology stack and documented rationale for each choice." },
          { date: "Tuesday, 13 Jan 2026",   task: "Studied JWT-based authentication mechanisms and bcrypt password hashing.", learned: "Learned how stateless token-based auth works, including token signing, verification, and expiry.", output: "Created a short technical note on JWT flow for the team's reference." },
          { date: "Wednesday, 14 Jan 2026", task: "Explored Chart.js library – its chart types (line, candlestick, bar, pie) and integration with React.", learned: "Understood how to bind financial data arrays to Chart.js configurations for interactive rendering.", output: "Built a small proof-of-concept chart with sample OHLC data." },
          { date: "Thursday, 15 Jan 2026",  task: "Deep-dive into MongoDB Atlas: collections design, indexing strategies, and cloud connectivity.", learned: "Understood document-oriented data modelling and how to design schemas for Users, Portfolios, Transactions, and Watchlists.", output: "Drafted initial MongoDB schema diagrams for all major collections." },
          { date: "Friday, 16 Jan 2026",    task: "Reviewed and refined the complete requirement specification with the training supervisor.", learned: "Received feedback on scope prioritisation and importance of modular, testable feature development.", output: "Finalised and signed-off version 1.0 of the requirements document." }
        ]
      },
      {
        week: 3, range: "19 Jan – 23 Jan 2026",
        days: [
          { date: "Monday, 19 Jan 2026",    task: "Began detailed functional and non-functional requirements documentation.", learned: "Distinguished between functional (feature behaviour) and non-functional requirements (performance, security, scalability).", output: "Completed NFR document covering response time targets, security standards, and browser compatibility." },
          { date: "Tuesday, 20 Jan 2026",   task: "Investigated CORS handling and security best practices for REST APIs.", learned: "Understood how CORS policies, HTTP-only cookies, and environment variable protection contribute to application security.", output: "Documented security checklist for backend implementation phase." },
          { date: "Wednesday, 21 Jan 2026", task: "Researched caching strategies for API responses and explored TTL-based cache invalidation.", learned: "Learned how in-memory caching reduces repeated third-party API calls and improves latency.", output: "Added caching strategy notes to the technical design document." },
          { date: "Thursday, 22 Jan 2026",  task: "Explored Gemini API capabilities for AI-powered financial features: news summarisation, chatbot, trend analysis.", learned: "Understood how to integrate generative AI APIs into a backend middleware for structured financial insights.", output: "Drafted use-case specification for AI chatbot and market analysis assistant." },
          { date: "Friday, 23 Jan 2026",    task: "Phase 1 review and wrap-up. Consolidated all research notes into a master requirements document.", learned: "Learned how thorough upfront research accelerates later development phases by reducing ambiguity.", output: "Submitted Phase 1 deliverables to training guide for review." }
        ]
      }
    ]
  },
  {
    phase: 2,
    title: "System Architecture & Planning",
    duration: "4 Weeks",
    dates: "26 Jan – 20 Feb 2026",
    weeks: [
      {
        week: 4, range: "26 Jan – 30 Jan 2026",
        days: [
          { date: "Monday, 26 Jan 2026",    task: "Designed the three-layer architecture: Frontend (Next.js), Backend (Node.js/Express), Database (MongoDB Atlas).", learned: "Learned how separation of concerns improves maintainability and enables independent scaling of layers.", output: "Produced Layer Architecture Diagram (Fig. 3.1 equivalent)." },
          { date: "Tuesday, 27 Jan 2026",   task: "Designed the RESTful API module structure: routes, controllers, models, middleware.", learned: "Understood how modular REST design allows each feature to be developed and tested in isolation.", output: "Drafted REST API endpoint inventory for all planned modules." },
          { date: "Wednesday, 28 Jan 2026", task: "Planned JWT authentication flow: signup → hash password → issue token → protect routes via Auth Middleware.", learned: "Understood the complete lifecycle of a token-based auth system, including token storage and expiry handling.", output: "Created JWT Authentication Flow Diagram (Fig. 4.2)." },
          { date: "Thursday, 29 Jan 2026",  task: "Planned virtual trading buy/sell workflow with balance validation and transaction recording.", learned: "Learned how financial transaction logic requires multi-step validation to ensure data integrity and prevent invalid states.", output: "Created Virtual Trading Buy/Sell Workflow Diagram (Fig. 4.3)." },
          { date: "Friday, 30 Jan 2026",    task: "Designed the Frontend Component Hierarchy: pages, reusable components, hooks, services.", learned: "Understood how a component-driven architecture reduces code duplication and simplifies state management.", output: "Produced Frontend Component Hierarchy Diagram (Fig. 4.4)." }
        ]
      },
      {
        week: 5, range: "02 Feb – 06 Feb 2026",
        days: [
          { date: "Monday, 02 Feb 2026",    task: "Designed External API Integration Architecture showing the backend as a secure middleware layer.", learned: "Learned why proxying external API calls through the backend protects API keys and resolves CORS issues.", output: "Produced External API Integration Architecture Diagram (Fig. 4.5)." },
          { date: "Tuesday, 03 Feb 2026",   task: "Planned MongoDB Atlas collection schemas in detail: Users, Watchlists, Portfolios, Transactions, CachedStockData.", learned: "Understood compound indexing strategies for optimising financial data queries.", output: "Finalised MongoDB schema documentation with field definitions and index plans." },
          { date: "Wednesday, 04 Feb 2026", task: "Planned error handling and logging architecture: centralised middleware, structured logs, fallback responses.", learned: "Understood how a unified error handler improves debugging and prevents sensitive data leakage.", output: "Drafted error handling and logging specification document." },
          { date: "Thursday, 05 Feb 2026",  task: "Prepared the project Gantt chart covering all 14 phases from 05 Jan to 26 May 2026.", learned: "Learned how to break a large project into time-boxed phases and manage dependencies between them.", output: "Completed and submitted FinSights Project Gantt Chart." },
          { date: "Friday, 06 Feb 2026",    task: "Architecture review session with training supervisor. Incorporated feedback on caching and security layers.", learned: "Received guidance on adding retry/backoff and circuit-breaker patterns for external API resilience.", output: "Updated architecture documents with supervisor feedback." }
        ]
      },
      {
        week: 6, range: "09 Feb – 13 Feb 2026",
        days: [
          { date: "Monday, 09 Feb 2026",    task: "Set up Git repository, branch strategy (main, dev, feature branches), and folder structure for both frontend and backend.", learned: "Understood best practices for version control in collaborative full-stack projects.", output: "Initialised project repositories with README and .gitignore configurations." },
          { date: "Tuesday, 10 Feb 2026",   task: "Set up Node.js + Express.js backend boilerplate with environment variable management using dotenv.", learned: "Learned how to securely manage API keys, DB credentials, and JWT secrets through environment variables.", output: "Working Express server with health-check endpoint running successfully." },
          { date: "Wednesday, 11 Feb 2026", task: "Configured Next.js project with TailwindCSS and established folder structure for pages, components, hooks, and services.", learned: "Understood Next.js file-based routing and how Tailwind utility classes simplify responsive design.", output: "Frontend project scaffold running on localhost with Tailwind configured." },
          { date: "Thursday, 12 Feb 2026",  task: "Configured MongoDB Atlas cluster, created database user, set IP whitelist, and tested connection from the backend.", learned: "Learned MongoDB Atlas cloud setup including replica set configuration and TLS-secured connections.", output: "Successful MongoDB Atlas connection established from the Node.js backend." },
          { date: "Friday, 13 Feb 2026",    task: "Finalised development environment setup; documented local dev setup guide for future reference.", learned: "Appreciated the value of reproducible development environments and clear setup documentation.", output: "Environment setup guide and confirmed working full-stack scaffold." }
        ]
      },
      {
        week: 7, range: "16 Feb – 20 Feb 2026",
        days: [
          { date: "Monday, 16 Feb 2026",    task: "Installed and configured Mongoose ODM; defined initial User schema with validation rules.", learned: "Understood how Mongoose schemas enforce data integrity at the application layer before hitting MongoDB.", output: "User model with email, hashed password, username, and profile fields defined." },
          { date: "Tuesday, 17 Feb 2026",   task: "Defined Portfolio, Watchlist, and Transaction schemas in Mongoose.", learned: "Learned how to model financial relationships (user → portfolio → holdings → transactions) in a document database.", output: "All four primary Mongoose models created and tested with sample inserts." },
          { date: "Wednesday, 18 Feb 2026", task: "Planned and documented all test cases for the system (20 test cases across authentication, trading, portfolio, and UI modules).", learned: "Understood how writing test cases upfront guides implementation and ensures comprehensive coverage.", output: "Completed test case specification document (Tables 5.1, 5.2, 5.3)." },
          { date: "Thursday, 19 Feb 2026",  task: "Planned state management strategy for the frontend: React Context API, custom hooks, and local component state.", learned: "Understood when to use global context vs. local state vs. server-fetched state for financial data flows.", output: "State management plan document completed." },
          { date: "Friday, 20 Feb 2026",    task: "Phase 2 review: presented architecture diagrams and planning documents to training guide.", learned: "Received feedback emphasising the importance of consistent JSON response formats across all API endpoints.", output: "Phase 2 deliverables submitted; architecture approved to proceed to implementation." }
        ]
      }
    ]
  },
  {
    phase: 3,
    title: "Frontend Setup – Next.js & TailwindCSS",
    duration: "4 Weeks",
    dates: "23 Feb – 20 Mar 2026",
    weeks: [
      {
        week: 8, range: "23 Feb – 27 Feb 2026",
        days: [
          { date: "Monday, 23 Feb 2026",    task: "Built the navigation bar and sidebar components with responsive mobile menu.", learned: "Learned how to implement responsive navigation with Tailwind breakpoint utilities.", output: "Fully responsive Navbar component with active route highlighting." },
          { date: "Tuesday, 24 Feb 2026",   task: "Built the Home Dashboard page layout with news card grid and stock search bar.", learned: "Understood how to structure Next.js pages with SSR for news data and CSR for search interactions.", output: "Home Dashboard page rendering with placeholder news cards." },
          { date: "Wednesday, 25 Feb 2026", task: "Developed the Authentication pages: Login and Signup forms with input validation.", learned: "Learned client-side form validation patterns and how to handle auth state in React Context.", output: "Login and Signup pages with validation messages and loading states." },
          { date: "Thursday, 26 Feb 2026",  task: "Implemented protected route logic in Next.js to redirect unauthenticated users.", learned: "Understood how to use middleware and context to guard private pages in a Next.js application.", output: "Route guard HOC redirecting unauthenticated users to the login page." },
          { date: "Friday, 27 Feb 2026",    task: "Built skeleton loading animations for all data-dependent components.", learned: "Learned how skeleton loaders improve perceived performance and prevent layout shifts during data fetching.", output: "Reusable Skeleton component applied across Dashboard and Markets pages." }
        ]
      },
      {
        week: 9, range: "02 Mar – 06 Mar 2026",
        days: [
          { date: "Monday, 02 Mar 2026",    task: "Built the Markets page with a sortable, searchable stock table displaying Company Name, Symbol, Price, and % Change.", learned: "Learned how to implement client-side sorting and filtering for tabular financial data.", output: "Markets page with live-style stock table and search filter (Fig. 5.2)." },
          { date: "Tuesday, 03 Mar 2026",   task: "Implemented the Watchlist page with add/remove stock functionality and real-time price display.", learned: "Understood how to synchronise component state with backend API responses for watchlist CRUD operations.", output: "Watchlist page (Fig. 5.3) with stock cards showing price and % change." },
          { date: "Wednesday, 04 Mar 2026", task: "Built the Portfolio overview page displaying Invested, Current Value, Profit/Loss, and Available Balance metrics.", learned: "Learned how to aggregate financial data on the frontend for clear portfolio summary displays.", output: "Portfolio page (Fig. 5.4) with metric cards and holdings table." },
          { date: "Thursday, 05 Mar 2026",  task: "Built the User Profile page with avatar, display name, username, bio, and edit profile modal.", learned: "Understood how to handle file upload (avatar) and controlled form inputs in React.", output: "Profile page (Fig. 5.5) and Edit Profile modal (Fig. 5.10) functional." },
          { date: "Friday, 06 Mar 2026",    task: "Implemented dynamic routing for individual stock detail pages using Next.js dynamic segments.", learned: "Understood how [symbol].js pages allow reusable templates for any stock's detailed view.", output: "Stock Detail page rendering with dynamic stock symbol in the URL." }
        ]
      },
      {
        week: 10, range: "09 Mar – 13 Mar 2026",
        days: [
          { date: "Monday, 09 Mar 2026",    task: "Integrated Chart.js into the stock detail page with a line chart for historical price trends.", learned: "Learned how to map API OHLC arrays to Chart.js datasets and configure axis labels and tooltips.", output: "Interactive line chart rendering historical price data on the Stock Detail page." },
          { date: "Tuesday, 10 Mar 2026",   task: "Added candlestick chart support using the Chart.js financial plugin for OHLC visualisation.", learned: "Understood OHLC data structure and how candlestick charts communicate market behaviour.", output: "Candlestick chart rendering correctly with colour-coded bullish/bearish candles." },
          { date: "Wednesday, 11 Mar 2026", task: "Added pie/doughnut chart to the Portfolio page for sector allocation visualisation.", learned: "Learned how to dynamically generate chart colour palettes based on portfolio holdings.", output: "Portfolio distribution pie chart rendering with labelled sector slices." },
          { date: "Thursday, 12 Mar 2026",  task: "Implemented the AI chatbot UI component (Fig. 5.7) with message input, send button, and chat history display.", learned: "Understood how to build a stateful chat interface in React with async API call handling.", output: "AI Assistant chatbot panel rendering and ready for backend API integration." },
          { date: "Friday, 13 Mar 2026",    task: "Cross-browser and cross-device responsive testing of all built pages.", learned: "Identified and resolved Tailwind CSS breakpoint issues on tablet viewports.", output: "All pages verified responsive across desktop, tablet, and mobile screen sizes." }
        ]
      },
      {
        week: 11, range: "16 Mar – 20 Mar 2026",
        days: [
          { date: "Monday, 16 Mar 2026",    task: "Implemented error boundary components and fallback UI for failed API calls.", learned: "Learned how React error boundaries prevent full-page crashes and maintain partial UI functionality.", output: "Error boundary wrapper applied to all data-fetching components." },
          { date: "Tuesday, 17 Mar 2026",   task: "Added notification and toast components for success/error feedback on trading and watchlist actions.", learned: "Understood how transient UI notifications improve user experience for async operations.", output: "Toast notification system integrated and tested across the platform." },
          { date: "Wednesday, 18 Mar 2026", task: "Implemented dynamic imports and lazy loading for chart components to reduce initial bundle size.", learned: "Learned how Next.js dynamic imports with React.lazy reduce Time to Interactive (TTI).", output: "Chart components lazy-loaded; measured ~18% reduction in initial page load time." },
          { date: "Thursday, 19 Mar 2026",  task: "Refined TailwindCSS design tokens for consistent colour palette, spacing, and typography across the platform.", learned: "Understood the importance of design consistency in professional financial applications.", output: "Unified design system applied across all pages." },
          { date: "Friday, 20 Mar 2026",    task: "Frontend phase review; demonstrated all pages to training guide and incorporated UI feedback.", learned: "Received feedback on improving contrast ratios and adding loading indicators to async buttons.", output: "Phase 3 deliverables complete; frontend approved for API integration." }
        ]
      }
    ]
  },
  {
    phase: 4,
    title: "Backend Setup – Node.js & Express.js",
    duration: "4 Weeks",
    dates: "23 Mar – 17 Apr 2026",
    weeks: [
      {
        week: 12, range: "23 Mar – 27 Mar 2026",
        days: [
          { date: "Monday, 23 Mar 2026",    task: "Implemented modular REST API folder structure: /routes, /controllers, /models, /middleware.", learned: "Understood how modular organisation prevents code coupling and simplifies future feature additions.", output: "Complete project folder structure initialised with placeholder route files." },
          { date: "Tuesday, 24 Mar 2026",   task: "Built user authentication routes: POST /auth/signup and POST /auth/login.", learned: "Learned how to implement bcrypt salt rounds for password hashing and controlled error responses for duplicate accounts.", output: "Working signup and login endpoints returning JWT tokens on success." },
          { date: "Wednesday, 25 Mar 2026", task: "Implemented Auth Middleware: JWT token extraction from Authorization header, verification, and user ID attachment.", learned: "Understood how Express middleware intercepts requests to enforce authentication before reaching controllers.", output: "Auth Middleware protecting all private routes correctly." },
          { date: "Thursday, 26 Mar 2026",  task: "Built user profile routes: GET /user/profile and PUT /user/profile with owner-only access enforcement.", learned: "Learned how to implement resource ownership checks to prevent one user accessing another's profile.", output: "Profile endpoints returning and updating user data with proper authorisation." },
          { date: "Friday, 27 Mar 2026",    task: "Implemented CORS configuration, rate-limiting middleware, and input validation for all auth routes.", learned: "Understood how rate limiting prevents brute-force attacks and input validation prevents injection vulnerabilities.", output: "Security middleware stack applied and tested against invalid inputs." }
        ]
      },
      {
        week: 13, range: "30 Mar – 03 Apr 2026",
        days: [
          { date: "Monday, 30 Mar 2026",    task: "Built watchlist routes: GET, POST, DELETE /watchlist/:symbol with duplicate prevention logic.", learned: "Learned how to implement idempotent watchlist operations with proper HTTP status codes (201, 200, 404).", output: "All three watchlist endpoints functional and tested with Postman." },
          { date: "Tuesday, 31 Mar 2026",   task: "Built stock search and quote endpoints: GET /stocks/search and GET /stocks/quote/:symbol.", learned: "Understood how to proxy external API calls through Express controllers with response normalisation.", output: "Stock search and quote endpoints returning structured JSON data." },
          { date: "Wednesday, 01 Apr 2026", task: "Built historical data endpoint: GET /stocks/history/:symbol?interval=1mo returning OHLC arrays.", learned: "Learned how to handle query parameters for flexible data interval selection (1d, 1wk, 1mo, 3mo, 1y).", output: "History endpoint returning correctly formatted OHLC arrays for Chart.js consumption." },
          { date: "Thursday, 02 Apr 2026",  task: "Implemented the virtual portfolio buy endpoint: POST /portfolio/buy with full validation logic.", learned: "Understood multi-step financial transaction validation: symbol check → price fetch → balance check → DB update.", output: "Buy endpoint correctly deducting balance, updating holdings, and recording transactions." },
          { date: "Friday, 03 Apr 2026",    task: "Implemented the virtual portfolio sell endpoint: POST /portfolio/sell with quantity and ownership validation.", learned: "Learned how to calculate realised profit/loss on sell operations using average purchase price.", output: "Sell endpoint correctly crediting balance and computing profit/loss figures." }
        ]
      },
      {
        week: 14, range: "06 Apr – 10 Apr 2026",
        days: [
          { date: "Monday, 06 Apr 2026",    task: "Built portfolio valuation endpoint: GET /portfolio returning holdings, current market value, and P&L.", learned: "Learned how to fetch live prices for all held stocks concurrently using Promise.all for efficiency.", output: "Portfolio endpoint returning accurate real-time valuations with correct P&L computations." },
          { date: "Tuesday, 07 Apr 2026",   task: "Implemented transaction history endpoint: GET /portfolio/transactions with pagination support.", learned: "Understood how to implement cursor-based pagination for financial transaction logs.", output: "Transaction history endpoint returning paginated trade records." },
          { date: "Wednesday, 08 Apr 2026", task: "Implemented in-memory caching for stock quote and history responses with configurable TTL.", learned: "Learned how a simple cache object with timestamp-based expiry reduces external API calls significantly.", output: "Cache layer integrated; repeated requests served from cache within TTL window." },
          { date: "Thursday, 09 Apr 2026",  task: "Built centralised global error-handling middleware returning structured JSON error responses.", learned: "Understood how a single error handler prevents stack trace leakage and ensures consistent error formats.", output: "Error middleware intercepting all thrown errors and returning safe, structured responses." },
          { date: "Friday, 10 Apr 2026",    task: "Implemented structured server-side logging for all incoming requests, auth events, and transaction operations.", learned: "Learned how detailed logging facilitates debugging, security monitoring, and performance analysis in production.", output: "Logging system recording timestamps, route, status codes, and user IDs for each request." }
        ]
      },
      {
        week: 15, range: "13 Apr – 17 Apr 2026",
        days: [
          { date: "Monday, 13 Apr 2026",    task: "Implemented asynchronous error handling wrappers to safely manage promise rejections across all async controllers.", learned: "Learned how async wrapper utilities prevent unhandled promise rejections from crashing the Node.js process.", output: "All async controllers wrapped; server stability improved under error conditions." },
          { date: "Tuesday, 14 Apr 2026",   task: "Added retry logic and timeout handling for external API calls to Yahoo Finance and Finnhub.", learned: "Understood how retry/backoff patterns improve resilience against transient network failures.", output: "Retry mechanism implemented; API calls retry up to 3 times with exponential backoff." },
          { date: "Wednesday, 15 Apr 2026", task: "Wrote fallback logic to serve cached stock data when external APIs are unavailable.", learned: "Learned how graceful degradation maintains frontend stability during third-party service outages.", output: "Fallback serving confirmed; frontend shows meaningful messages when APIs are down." },
          { date: "Thursday, 16 Apr 2026",  task: "Conducted comprehensive API testing using Postman covering all 20 planned test cases.", learned: "Understood how systematic API testing identifies edge cases not caught during development.", output: "All 20 test cases executed; identified and fixed 3 edge-case bugs in balance validation." },
          { date: "Friday, 17 Apr 2026",    task: "Backend phase review with training guide. Demonstrated all API endpoints and test results.", learned: "Received feedback on improving portfolio endpoint response time by adding MongoDB indexes.", output: "Added compound indexes on userId+symbol fields; query performance improved noticeably." }
        ]
      }
    ]
  },
  {
    phase: 5,
    title: "API Integration, AI Features, Testing & Final Deployment",
    duration: "5 Weeks",
    dates: "20 Apr – 26 May 2026",
    weeks: [
      {
        week: 16, range: "20 Apr – 24 Apr 2026",
        days: [
          { date: "Monday, 20 Apr 2026",    task: "Integrated Yahoo Finance API into the backend for real-time quotes and historical OHLC data.", learned: "Understood how to parse and normalise Yahoo Finance JSON responses into clean internal data structures.", output: "Real-time quotes and 1-year OHLC history flowing from Yahoo Finance to frontend charts." },
          { date: "Tuesday, 21 Apr 2026",   task: "Integrated Finnhub API for company financials, analyst recommendations, and market news.", learned: "Learned how to handle differing JSON schemas from multiple financial APIs and merge data coherently.", output: "Finnhub-powered news feed and analyst recommendations displaying on stock detail pages." },
          { date: "Wednesday, 22 Apr 2026", task: "Integrated Gemini API into the backend for the AI Assistant chatbot and stock trend analysis.", learned: "Understood how to structure prompts for financial context and parse AI text responses for frontend display.", output: "AI Assistant chatbot responding to financial queries with market insights." },
          { date: "Thursday, 23 Apr 2026",  task: "Connected all frontend pages to live backend APIs, replacing placeholder data throughout.", learned: "Learned how to manage async API calls in Next.js using useEffect, SWR, and conditional rendering.", output: "All pages (Markets, Watchlist, Portfolio, Stock Detail) populated with live data." },
          { date: "Friday, 24 Apr 2026",    task: "End-to-end flow testing of the complete system: signup → login → watchlist → buy stock → check portfolio → logout.", learned: "Appreciated how end-to-end testing reveals integration issues not visible in unit or API tests alone.", output: "Complete user journey verified functional; minor UI alignment issues fixed." }
        ]
      },
      {
        week: 17, range: "27 Apr – 01 May 2026",
        days: [
          { date: "Monday, 27 Apr 2026",    task: "Executed all 20 test cases formally and documented results in the test case tables.", learned: "Learned how systematic test documentation provides evidence of quality for academic and professional submissions.", output: "All 20 test cases passed (Tables 5.1, 5.2, 5.3 completed)." },
          { date: "Tuesday, 28 Apr 2026",   task: "Performed concurrency testing: simulated two simultaneous buy requests for the same stock.", learned: "Understood the importance of atomic database operations to prevent double-spending in financial systems.", output: "Confirmed only one transaction succeeds; balance integrity maintained under concurrent requests." },
          { date: "Wednesday, 29 Apr 2026", task: "Conducted external API failure simulation testing: disconnected Yahoo Finance and verified fallback behaviour.", learned: "Confirmed that cached data is served and friendly error messages are shown without application crashes.", output: "Fallback mechanism verified; TC-16 passed successfully." },
          { date: "Thursday, 30 Apr 2026",  task: "Performance and UI responsiveness testing across multiple devices and screen sizes.", learned: "Learned how browser developer tools and Lighthouse audits identify performance and accessibility issues.", output: "TC-19 passed; Lighthouse performance score improved to 87 after image optimisation." },
          { date: "Friday, 01 May 2026",    task: "UI/UX refinement based on testing feedback: improved typography, spacing, and colour contrast.", learned: "Understood how attention to visual detail significantly improves the professionalism of a financial platform.", output: "Refined UI deployed to development environment; screenshots captured (Figs. 5.1–5.10)." }
        ]
      },
      {
        week: 18, range: "04 May – 08 May 2026",
        days: [
          { date: "Monday, 04 May 2026",    task: "Began writing Chapter 1 (Introduction) of the internship report: company background and project overview.", learned: "Learned how to articulate project motivation and business context clearly for an academic audience.", output: "Draft Chapter 1 completed and submitted for supervisor review." },
          { date: "Tuesday, 05 May 2026",   task: "Wrote Chapter 2 (Technology Stack) covering all frontend, backend, database, and API technologies.", learned: "Understood how to justify technology choices with clear technical rationale rather than mere listing.", output: "Chapter 2 draft with technology comparison tables completed." },
          { date: "Wednesday, 06 May 2026", task: "Wrote Chapter 3 (System Architecture) with diagrams and explanations of all architectural layers.", learned: "Learned how to translate technical diagrams into clear, readable prose for a professional report.", output: "Chapter 3 with architecture diagram and request flow description completed." },
          { date: "Thursday, 07 May 2026",  task: "Wrote Chapter 4 (Implementation) covering all seven implementation sub-sections in detail.", learned: "Appreciated how writing detailed implementation notes reinforces understanding of the technical decisions made.", output: "Chapter 4 draft covering API architecture, auth, backend logic, frontend, and database completed." },
          { date: "Friday, 08 May 2026",    task: "Wrote Chapter 5 (Testing and Results) with test case tables and output screenshots.", learned: "Learned how to present testing evidence professionally using structured tables and annotated screenshots.", output: "Chapter 5 with all 20 test cases and 10 output screen figures completed." }
        ]
      },
      {
        week: 19, range: "11 May – 15 May 2026",
        days: [
          { date: "Monday, 11 May 2026",    task: "Wrote Chapter 6 (Conclusion and Future Scope) covering technical achievements and enhancement roadmap.", learned: "Understood how to articulate both completed accomplishments and a credible future development roadmap.", output: "Chapter 6 covering conclusion and five detailed future scope sub-sections completed." },
          { date: "Tuesday, 12 May 2026",   task: "Compiled the complete report: cover page, certificate, declaration, acknowledgement, abstract, TOC, lists, references.", learned: "Learned how to format a professional engineering project report to university standards.", output: "Full report draft compiled and formatted consistently." },
          { date: "Wednesday, 13 May 2026", task: "Proofreading and revision of the complete report for grammar, technical accuracy, and formatting consistency.", learned: "Understood the importance of multiple review passes to catch errors missed during drafting.", output: "Revised report with all chapters proofread and formatted." },
          { date: "Thursday, 14 May 2026",  task: "Supervisor review meeting: presented complete report draft to Ishant Sethi for final feedback.", learned: "Received guidance on strengthening the future scope section and adding more detail to the testing overview.", output: "Incorporated supervisor feedback; final report version 1.0 ready." },
          { date: "Friday, 15 May 2026",    task: "Prepared final project presentation slides summarising architecture, features, testing, and outcomes.", learned: "Learned how to distil a complex technical project into a concise and engaging presentation narrative.", output: "Internship presentation deck completed." }
        ]
      },
      {
        week: 20, range: "18 May – 26 May 2026",
        days: [
          { date: "Monday, 18 May 2026",    task: "Final code review: cleaned up unused imports, commented complex logic, and ensured consistent code style.", learned: "Understood how clean, well-commented code is essential for long-term maintainability.", output: "Codebase cleaned and final version committed to main branch." },
          { date: "Tuesday, 19 May 2026",   task: "Prepared deployment configuration: environment variables, build scripts, and production settings.", learned: "Learned the differences between development and production configurations for a full-stack application.", output: "Production build configuration documented and verified." },
          { date: "Wednesday, 20 May 2026", task: "Final review of all project deliverables: codebase, report, test cases, screenshots, and Gantt chart.", learned: "Appreciated how thorough documentation demonstrates professionalism and makes projects reproducible.", output: "All project deliverables consolidated and organised in the submission folder." },
          { date: "Thursday, 21 May 2026",  task: "Conducted final end-to-end demonstration of the FinSights platform for the training guide.", learned: "Gained confidence in presenting a full-stack technical project to an industry audience.", output: "Final demonstration completed successfully; project signed off by Ishant Sethi." },
          { date: "Friday, 22 May 2026",    task: "Retrospective session: documented lessons learned, technical challenges faced, and personal skill growth.", learned: "Learned the value of structured retrospectives in consolidating learning from complex projects.", output: "Lessons-learned document prepared." },
          { date: "Monday, 25 May 2026",    task: "Prepared and finalised the internship report PDF for submission to UIET, Panjab University.", learned: "Understood university formatting requirements for engineering project reports.", output: "Final internship report PDF ready for submission." },
          { date: "Tuesday, 26 May 2026",   task: "Submitted complete internship report and project deliverables. Completed internship at Unified Mentor Pvt. Ltd.", learned: "Completed a full software development lifecycle from requirement analysis to deployment and documentation.", output: "Final report submitted. Internship successfully concluded on 26 May 2026." }
        ]
      }
    ]
  }
];

// ─── Build Document ──────────────────────────────────────────────────────────
const docChildren = [];

// === COVER PAGE ===
docChildren.push(
  new Paragraph({ children: [new TextRun({ text: "", size: 24 })] }),
  ...spacer(3),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "DAILY INTERNSHIP DIARY", bold: true, size: 48, color: NAVY, font: "Arial" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: STEEL, space: 4 } },
    children: [new TextRun({ text: "Stock Tracking and Portfolio Management Tool  ·  FinSights", size: 26, color: STEEL, font: "Arial", italics: true })]
  }),
  ...spacer(2),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Divyansh Pandey  ·  Roll No: SG22316", bold: true, size: 28, color: BLACK, font: "Arial" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BE Computer Science & Engineering", size: 24, color: BLACK, font: "Arial" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "UIET, Panjab University SSG Regional Centre, Hoshiarpur", size: 24, color: BLACK, font: "Arial" })] }),
  ...spacer(1),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Organisation:  Unified Mentor Pvt. Ltd., Gurugram, Haryana", size: 24, color: BLACK, font: "Arial" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Training Guide:  Ishant Sethi", size: 24, color: BLACK, font: "Arial" })] }),
  ...spacer(1),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Internship Duration:  05 January 2026 – 26 May 2026", bold: true, size: 24, color: NAVY, font: "Arial" })] }),
  ...spacer(5),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(2026)", size: 22, color: "888888", font: "Arial" })] }),
  new Paragraph({ children: [new PageBreak()] })
);

// === INSTRUCTIONS / LEGEND PAGE ===
docChildren.push(
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "About This Diary", font: "Arial", color: NAVY })] }),
  new Paragraph({ children: [new TextRun({ text: "This daily internship diary is a formal record of work carried out by Divyansh Pandey (SG22316) during the internship at Unified Mentor Pvt. Ltd. from 05 January 2026 to 26 May 2026. Each entry describes the task performed on that day, the key concept or skill learned, and the tangible output produced.", size: 22, font: "Arial", color: BLACK })] }),
  ...spacer(1),
  new Paragraph({ children: [new TextRun({ text: "The diary is organised into five broad phases aligned with the project Gantt chart:", size: 22, font: "Arial", color: BLACK })] }),
  ...spacer(1)
);

const phasesSummary = [
  ["Phase 1", "Requirement Analysis & Research",             "05 Jan – 23 Jan 2026"],
  ["Phase 2", "System Architecture & Planning",              "26 Jan – 20 Feb 2026"],
  ["Phase 3", "Frontend Setup (Next.js + TailwindCSS)",      "23 Feb – 20 Mar 2026"],
  ["Phase 4", "Backend Setup (Node.js + Express.js)",        "23 Mar – 17 Apr 2026"],
  ["Phase 5", "API Integration, Testing & Final Deployment", "20 Apr – 26 May 2026"],
];

docChildren.push(
  new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [1100, 5026, 2900],
    rows: [
      new TableRow({ children: [hcell("Phase", 1100), hcell("Title", 5026), hcell("Period", 2900)] }),
      ...phasesSummary.map(([ph, ti, dt], i) =>
        new TableRow({ children: [
          dataCell(ph, 1100, i % 2 === 0, true, true),
          dataCell(ti, 5026, i % 2 === 0, false, false),
          dataCell(dt, 2900, i % 2 === 0, false, true)
        ]})
      )
    ]
  }),
  new Paragraph({ children: [new PageBreak()] })
);

// === DIARY ENTRIES ===
for (const phase of phases) {
  // Phase header page
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { fill: NAVY, type: ShadingType.CLEAR },
      spacing: { before: 200, after: 200 },
      border: {
        top: border(STEEL), bottom: border(STEEL),
        left: border(STEEL), right: border(STEEL)
      },
      children: [
        new TextRun({ text: `Phase ${phase.phase}  ·  ${phase.title}`, bold: true, size: 32, color: WHITE, font: "Arial" })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Duration: ${phase.duration}   |   ${phase.dates}`, size: 22, color: STEEL, font: "Arial", italics: true })]
    }),
    ...spacer(1)
  );

  for (const week of phase.weeks) {
    // Week header
    docChildren.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: STEEL, space: 2 } },
        children: [
          new TextRun({ text: `Week ${week.week}  —  ${week.range}`, bold: true, size: 24, color: NAVY, font: "Arial" })
        ]
      }),
      ...spacer(0)
    );

    for (const day of week.days) {
      // Day entry table
      docChildren.push(
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [9026],
          rows: [
            // Date header row
            new TableRow({
              children: [new TableCell({
                borders: { top: border(STEEL), bottom: border(STEEL), left: border(STEEL), right: border(STEEL) },
                width: { size: 9026, type: WidthType.DXA },
                shading: { fill: MGRAY, type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 160, right: 160 },
                children: [new Paragraph({
                  children: [new TextRun({ text: `  ${day.date}`, bold: true, size: 22, color: NAVY, font: "Arial" })]
                })]
              })]
            }),
            // Task row
            new TableRow({
              children: [new TableCell({
                borders: { top: border("DDDDDD"), bottom: border("DDDDDD"), left: border(STEEL), right: border("CCCCCC") },
                width: { size: 9026, type: WidthType.DXA },
                shading: { fill: WHITE, type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 160, right: 160 },
                children: [new Paragraph({
                  children: [
                    new TextRun({ text: "Task:  ", bold: true, size: 20, color: NAVY, font: "Arial" }),
                    new TextRun({ text: day.task, size: 20, color: BLACK, font: "Arial" })
                  ]
                })]
              })]
            }),
            // Learned row
            new TableRow({
              children: [new TableCell({
                borders: { top: border("DDDDDD"), bottom: border("DDDDDD"), left: border(STEEL), right: border("CCCCCC") },
                width: { size: 9026, type: WidthType.DXA },
                shading: { fill: LGRAY, type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 160, right: 160 },
                children: [new Paragraph({
                  children: [
                    new TextRun({ text: "Learning:  ", bold: true, size: 20, color: GREEN, font: "Arial" }),
                    new TextRun({ text: day.learned, size: 20, color: BLACK, font: "Arial" })
                  ]
                })]
              })]
            }),
            // Output row
            new TableRow({
              children: [new TableCell({
                borders: { top: border("DDDDDD"), bottom: border(STEEL), left: border(STEEL), right: border("CCCCCC") },
                width: { size: 9026, type: WidthType.DXA },
                shading: { fill: LGGREEN, type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 160, right: 160 },
                children: [new Paragraph({
                  children: [
                    new TextRun({ text: "Output:  ", bold: true, size: 20, color: GREEN, font: "Arial" }),
                    new TextRun({ text: day.output, size: 20, color: BLACK, font: "Arial" })
                  ]
                })]
              })]
            }),
          ]
        }),
        ...spacer(1)
      );
    }
    docChildren.push(...spacer(1));
  }
  docChildren.push(new Paragraph({ children: [new PageBreak()] }));
}

// === SUPERVISOR SIGN-OFF PAGE ===
docChildren.push(
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Supervisor's Certificate of Completion", font: "Arial", color: NAVY })] }),
  new Paragraph({ children: [new TextRun({ text: "I hereby certify that the above daily diary entries accurately reflect the work performed by Divyansh Pandey (SG22316) during the internship at Unified Mentor Pvt. Ltd. from 05 January 2026 to 26 May 2026.", size: 22, font: "Arial", color: BLACK })] }),
  ...spacer(3),
  new Paragraph({ children: [new TextRun({ text: "Name:  Ishant Sethi", size: 22, font: "Arial", color: BLACK, bold: true })] }),
  new Paragraph({ children: [new TextRun({ text: "Designation:  Training Guide, Unified Mentor Pvt. Ltd.", size: 22, font: "Arial", color: BLACK })] }),
  ...spacer(3),
  new Paragraph({ children: [new TextRun({ text: "Signature:  _______________________________", size: 22, font: "Arial", color: BLACK })] }),
  ...spacer(1),
  new Paragraph({ children: [new TextRun({ text: "Date:  ________________", size: 22, font: "Arial", color: BLACK })] }),
  ...spacer(4),
  new Paragraph({
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA", space: 2 } },
    children: [new TextRun({ text: "Divyansh Pandey  ·  SG22316  ·  BE CSE  ·  UIET, Panjab University, Hoshiarpur  ·  2026", size: 18, font: "Arial", color: "888888" })]
  })
);

// ─── Build & Write ───────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 34, bold: true, font: "Arial", color: NAVY },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: STEEL, space: 2 } },
          children: [
            new TextRun({ text: "FinSights  ·  Daily Internship Diary  ·  Divyansh Pandey (SG22316)", size: 18, color: "888888", font: "Arial" })
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: STEEL, space: 2 } },
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({ text: "Unified Mentor Pvt. Ltd.  ·  Internship 2026", size: 18, color: "888888", font: "Arial" }),
            new TextRun({ text: "\tPage ", size: 18, color: "888888", font: "Arial" }),
            new TextRun({
  children: [PageNumber.CURRENT],
  size: 18,
  color: "888888",
  font: "Arial"
})
       ]
        })]
      })
    },
    children: docChildren
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('Divyansh_Pandey_Daily_Diary.docx', buf);
  console.log('Done');
});
