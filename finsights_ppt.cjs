const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaChartLine, FaShieldAlt, FaDatabase, FaRocket,
  FaCode, FaServer, FaBrain, FaUsers,
  FaCheckCircle, FaStar, FaArrowRight, FaBullseye,
  FaChartBar, FaWallet, FaSearch, FaBell,
  FaExchangeAlt, FaLock, FaMobileAlt, FaCloud
} = require("react-icons/fa");

// ─── Color palette ─────────────────────────────────────────────────────────
const C = {
  navy:    "0D1B2A",   // dark bg
  blue:    "1565C0",   // primary accent
  teal:    "00B4D8",   // secondary accent
  mint:    "90E0EF",   // highlight
  white:   "FFFFFF",
  offwhite:"F0F4F8",
  gray:    "94A3B8",
  darkCard:"152232",
  cardBg:  "132030",
  green:   "22C55E",
  gold:    "F59E0B",
  red:     "EF4444",
  light:   "E2EBF5",
};

// ─── Icon helper ────────────────────────────────────────────────────────────
async function icon(IconComp, color = "#FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComp, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function buildPPT() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title  = "FinSights – Stock Tracking & Portfolio Management";
  pres.author = "Divyansh Pandey";

  // Pre-render icons
  const icChart   = await icon(FaChartLine, "#00B4D8");
  const icShield  = await icon(FaShieldAlt, "#00B4D8");
  const icDb      = await icon(FaDatabase,  "#00B4D8");
  const icRocket  = await icon(FaRocket,    "#00B4D8");
  const icCode    = await icon(FaCode,      "#00B4D8");
  const icServer  = await icon(FaServer,    "#00B4D8");
  const icBrain   = await icon(FaBrain,     "#00B4D8");
  const icUsers   = await icon(FaUsers,     "#00B4D8");
  const icCheck   = await icon(FaCheckCircle,"#22C55E");
  const icStar    = await icon(FaStar,      "#F59E0B");
  const icWallet  = await icon(FaWallet,    "#00B4D8");
  const icSearch  = await icon(FaSearch,    "#00B4D8");
  const icExchange= await icon(FaExchangeAlt,"#00B4D8");
  const icLock    = await icon(FaLock,      "#00B4D8");
  const icMobile  = await icon(FaMobileAlt, "#00B4D8");
  const icCloud   = await icon(FaCloud,     "#00B4D8");
  const icCheckW  = await icon(FaCheckCircle,"#FFFFFF");
  const icBrainGold = await icon(FaBrain,   "#F59E0B");
  const icChartGold = await icon(FaChartLine,"#F59E0B");
  const icBullseye  = await icon(FaBullseye, "#00B4D8");

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 1 – Title
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    // Top accent bar
    s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.06, fill:{ color: C.teal }, line:{ color: C.teal } });

    // Left decorative column
    s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.06, w:0.35, h:5.565, fill:{ color: C.blue }, line:{ color: C.blue } });

    // Large chart icon
    s.addImage({ data: icChart, x:7.5, y:0.7, w:2.0, h:2.0 });

    // Subtle grid bg shape
    s.addShape(pres.shapes.RECTANGLE, { x:0.35, y:0.06, w:9.65, h:5.565,
      fill:{ color: C.navy }, line:{ color: C.navy } });

    // Re-add icon on top
    s.addImage({ data: icChart, x:7.4, y:0.6, w:2.2, h:2.2 });

    // Tag
    s.addText("A REPORT ON", {
      x:0.6, y:0.5, w:6, h:0.3,
      fontSize:11, color: C.teal, bold:true, charSpacing:4,
      fontFace:"Calibri"
    });

    // Main title
    s.addText("FinSights", {
      x:0.6, y:0.85, w:6.8, h:1.0,
      fontSize:52, color: C.white, bold:true, fontFace:"Trebuchet MS"
    });

    // Subtitle
    s.addText("Stock Tracking & Portfolio Management Tool", {
      x:0.6, y:1.8, w:6.8, h:0.55,
      fontSize:18, color: C.mint, fontFace:"Calibri"
    });

    // Divider
    s.addShape(pres.shapes.RECTANGLE, { x:0.6, y:2.42, w:3.5, h:0.04, fill:{ color: C.teal }, line:{ color: C.teal } });

    // Details block
    s.addText([
      { text: "Divyansh Pandey  ", options:{ bold:true, color: C.white } },
      { text: "(SG22316)", options:{ color: C.gray } }
    ], { x:0.6, y:2.6, w:6, h:0.35, fontSize:13, fontFace:"Calibri" });

    s.addText("B.E. Computer Science & Engineering", {
      x:0.6, y:2.95, w:6, h:0.28,
      fontSize:12, color: C.gray, fontFace:"Calibri"
    });

    s.addText("UIET, Panjab University SSG Regional Centre, Hoshiarpur", {
      x:0.6, y:3.23, w:7, h:0.28,
      fontSize:12, color: C.gray, fontFace:"Calibri"
    });

    s.addText("Supervised by: Ishant Sethi  |  Unified Mentor Pvt. Ltd.  |  2026", {
      x:0.6, y:3.55, w:8, h:0.28,
      fontSize:11, color: C.gray, fontFace:"Calibri"
    });

    // Bottom bar
    s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.33, w:10, h:0.3,
      fill:{ color: C.blue }, line:{ color: C.blue } });
    s.addText("Internship Report  |  Full-Stack Financial Web Application", {
      x:0.3, y:5.33, w:9.4, h:0.3,
      fontSize:10, color: C.white, fontFace:"Calibri", valign:"middle"
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 2 – Company Introduction
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.offwhite };

    // Left panel
    s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:3.2, h:5.625,
      fill:{ color: C.navy }, line:{ color: C.navy } });

    s.addImage({ data: icUsers, x:1.1, y:0.5, w:1.0, h:1.0 });

    s.addText("About\nUnified\nMentor", {
      x:0.2, y:1.6, w:2.8, h:1.8,
      fontSize:22, color: C.white, bold:true, fontFace:"Trebuchet MS", align:"center"
    });

    s.addShape(pres.shapes.RECTANGLE, { x:0.6, y:3.45, w:2.0, h:0.04,
      fill:{ color: C.teal }, line:{ color: C.teal } });

    s.addText("EdTech & IT Solutions\nGurugram, Haryana, India", {
      x:0.2, y:3.6, w:2.8, h:0.7,
      fontSize:11, color: C.mint, fontFace:"Calibri", align:"center"
    });

    // Right content
    s.addText("Company Introduction", {
      x:3.5, y:0.3, w:6.2, h:0.5,
      fontSize:24, color: C.navy, bold:true, fontFace:"Trebuchet MS"
    });

    s.addText("Unified Mentor Pvt. Ltd. bridges academia and industry through practical training and software solutions.", {
      x:3.5, y:0.85, w:6.2, h:0.55,
      fontSize:13, color:"334155", fontFace:"Calibri"
    });

    const services = [
      [icCode,   "Full-Stack Development",   "Web, App, API & Frontend/Backend"],
      [icCloud,  "Cloud & DevOps",            "Cloud Computing, Cybersecurity"],
      [icBrain,  "AI & Data Science",         "ML, Analytics, Deep Learning"],
      [icMobile, "UI/UX & Mobile",            "Design, Database, IoT, Blockchain"],
    ];

    services.forEach(([ico, title, desc], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 3.5 + col * 3.2;
      const y = 1.55 + row * 1.6;

      s.addShape(pres.shapes.RECTANGLE, { x, y, w:3.0, h:1.4,
        fill:{ color: C.white },
        shadow:{ type:"outer", blur:6, offset:2, angle:135, color:"000000", opacity:0.08 }
      });
      s.addImage({ data: ico, x: x+0.15, y: y+0.2, w:0.45, h:0.45 });
      s.addText(title, { x: x+0.7, y: y+0.18, w:2.15, h:0.32,
        fontSize:12, bold:true, color: C.navy, fontFace:"Calibri" });
      s.addText(desc, { x: x+0.7, y: y+0.5, w:2.15, h:0.5,
        fontSize:10, color:"475569", fontFace:"Calibri" });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 3 – Project Overview
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.06,
      fill:{ color: C.teal }, line:{ color: C.teal } });

    s.addText("PROJECT OVERVIEW", {
      x:0.5, y:0.2, w:9, h:0.4,
      fontSize:11, color: C.teal, bold:true, charSpacing:4, fontFace:"Calibri"
    });

    s.addText("What is FinSights?", {
      x:0.5, y:0.55, w:9, h:0.65,
      fontSize:32, color: C.white, bold:true, fontFace:"Trebuchet MS"
    });

    // Central description box
    s.addShape(pres.shapes.RECTANGLE, { x:0.5, y:1.3, w:9.0, h:0.88,
      fill:{ color: C.darkCard }, line:{ color: C.blue }
    });
    s.addText("FinSights is a comprehensive full-stack web application providing real-time stock market data, historical analysis, virtual trading, and AI-powered insights — bridging the gap between theoretical financial concepts and practical investment experience.", {
      x:0.7, y:1.35, w:8.6, h:0.8,
      fontSize:13, color: C.white, fontFace:"Calibri", align:"center", valign:"middle"
    });

    // 4 highlight cards
    const highlights = [
      [icChart,    "Real-Time Data",        "Live stock prices via Yahoo Finance & Finnhub APIs"],
      [icExchange, "Virtual Trading",       "₹10,00,000 virtual balance for risk-free practice"],
      [icBrain,    "AI-Powered",            "Gemini API for insights, chatbot & stock analysis"],
      [icShield,   "Secure Platform",       "JWT auth, bcrypt hashing & HTTPS security"],
    ];

    highlights.forEach(([ico, title, desc], i) => {
      const x = 0.5 + i * 2.3;
      s.addShape(pres.shapes.RECTANGLE, { x, y:2.35, w:2.15, h:2.8,
        fill:{ color: C.cardBg }, line:{ color: C.blue }
      });
      s.addImage({ data: ico, x: x+0.83, y:2.5, w:0.5, h:0.5 });
      s.addText(title, {
        x: x+0.1, y:3.1, w:1.95, h:0.4,
        fontSize:13, bold:true, color: C.teal, fontFace:"Calibri", align:"center"
      });
      s.addText(desc, {
        x: x+0.1, y:3.52, w:1.95, h:1.3,
        fontSize:10.5, color: C.light, fontFace:"Calibri", align:"center"
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 4 – Objectives
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.offwhite };

    // Top band
    s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:1.05,
      fill:{ color: C.navy }, line:{ color: C.navy } });
    s.addImage({ data: icBullseye, x:0.3, y:0.18, w:0.65, h:0.65 });
    s.addText("Key Objectives", {
      x:1.1, y:0.2, w:8, h:0.65,
      fontSize:28, color: C.white, bold:true, fontFace:"Trebuchet MS", valign:"middle"
    });

    const objectives = [
      ["Real-Time Stock Data",        "Fetch live prices & market movements via Yahoo Finance API",        C.blue],
      ["Historical Market Analysis",  "Interactive Chart.js visualizations – trends, patterns, timeframes", C.teal],
      ["Personal Watchlist",          "Create & manage custom watchlists for preferred stocks",              "0891B2"],
      ["Virtual Trading Simulation",  "Buy/sell stocks with ₹10,00,000 virtual balance risk-free",         C.blue],
      ["JWT Authentication",          "Secure token-based login, signup & protected dashboard access",      C.teal],
      ["Profile Management",          "Edit name, avatar, bio & account settings",                          "0891B2"],
      ["Responsive UI",               "Next.js + TailwindCSS for seamless mobile/tablet/desktop experience","1565C0"],
    ];

    objectives.forEach(([title, desc, accent], i) => {
      const col = i < 4 ? 0 : 1;
      const row = i < 4 ? i : i - 4;
      const x = col === 0 ? 0.3 : 5.3;
      const y = 1.2 + row * 1.05;

      s.addShape(pres.shapes.RECTANGLE, { x, y, w:0.06, h:0.75,
        fill:{ color: accent }, line:{ color: accent } });
      s.addText(title, {
        x: x+0.2, y: y+0.02, w: col === 0 ? 4.4 : 4.2, h:0.3,
        fontSize:13, bold:true, color: C.navy, fontFace:"Calibri"
      });
      s.addText(desc, {
        x: x+0.2, y: y+0.32, w: col === 0 ? 4.4 : 4.2, h:0.38,
        fontSize:11, color:"475569", fontFace:"Calibri"
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 5 – Technology Stack
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.06,
      fill:{ color: C.gold }, line:{ color: C.gold } });

    s.addText("TECHNOLOGY STACK", {
      x:0.5, y:0.18, w:9, h:0.4,
      fontSize:11, color: C.gold, bold:true, charSpacing:4, fontFace:"Calibri"
    });
    s.addText("Modern Production-Grade Stack", {
      x:0.5, y:0.52, w:9, h:0.55,
      fontSize:28, color: C.white, bold:true, fontFace:"Trebuchet MS"
    });

    const layers = [
      {
        label:"FRONTEND", icon: icCode, color: C.blue,
        items: ["Next.js (SSR / SSG / CSR)", "React.js Components", "TailwindCSS Utility Styling", "Chart.js Visualizations"]
      },
      {
        label:"BACKEND", icon: icServer, color: C.teal,
        items: ["Node.js Event-Driven Runtime", "Express.js REST API Framework", "JWT Authentication Layer", "bcrypt Password Hashing"]
      },
      {
        label:"DATABASE", icon: icDb, color: "7C3AED",
        items: ["MongoDB Atlas (NoSQL)", "Mongoose ODM", "Replica Sets & TLS", "Indexed Queries"]
      },
      {
        label:"APIs & AI", icon: icBrainGold, color: C.gold,
        items: ["Yahoo Finance API", "Finnhub API", "Gemini AI API", "RESTful Integration"]
      }
    ];

    layers.forEach((layer, i) => {
      const x = 0.3 + i * 2.4;
      s.addShape(pres.shapes.RECTANGLE, { x, y:1.2, w:2.2, h:3.9,
        fill:{ color: C.darkCard }, line:{ color: layer.color }
      });
      // Header accent
      s.addShape(pres.shapes.RECTANGLE, { x, y:1.2, w:2.2, h:0.55,
        fill:{ color: layer.color }, line:{ color: layer.color }
      });
      s.addText(layer.label, {
        x: x+0.05, y:1.22, w:2.1, h:0.5,
        fontSize:11, bold:true, color: C.white, fontFace:"Calibri",
        align:"center", charSpacing:2
      });
      s.addImage({ data: layer.icon, x: x+0.85, y:1.85, w:0.5, h:0.5 });
      layer.items.forEach((item, j) => {
        s.addText("• " + item, {
          x: x+0.1, y: 2.5 + j * 0.55, w:2.0, h:0.45,
          fontSize:10.5, color: C.light, fontFace:"Calibri"
        });
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 6 – System Architecture
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.offwhite };

    s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.06,
      fill:{ color: C.navy }, line:{ color: C.navy } });

    s.addText("System Architecture", {
      x:0.4, y:0.18, w:9.2, h:0.55,
      fontSize:28, color: C.navy, bold:true, fontFace:"Trebuchet MS"
    });
    s.addText("Three-tier layered architecture with RESTful communication", {
      x:0.4, y:0.72, w:9.2, h:0.3,
      fontSize:13, color:"475569", fontFace:"Calibri"
    });

    // Architecture flow
    const tiers = [
      { label:"FRONTEND LAYER",    sub:"Next.js + React + TailwindCSS",   color: C.blue,  x:0.3  },
      { label:"BACKEND LAYER",     sub:"Node.js + Express.js + JWT Auth", color: C.teal,  x:3.55 },
      { label:"DATABASE LAYER",    sub:"MongoDB Atlas + Mongoose ODM",    color:"7C3AED", x:6.8  },
    ];

    tiers.forEach(tier => {
      s.addShape(pres.shapes.RECTANGLE, { x:tier.x, y:1.15, w:3.0, h:2.5,
        fill:{ color: tier.color },
        shadow:{ type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.15 }
      });
      s.addText(tier.label, {
        x:tier.x+0.1, y:1.25, w:2.8, h:0.55,
        fontSize:13, bold:true, color: C.white, fontFace:"Calibri", align:"center"
      });
      s.addShape(pres.shapes.RECTANGLE, { x:tier.x+0.1, y:1.78, w:2.8, h:0.04,
        fill:{ color: C.white }, line:{ color: C.white }
      });
      s.addText(tier.sub, {
        x:tier.x+0.1, y:1.85, w:2.8, h:0.45,
        fontSize:10.5, color: C.white, fontFace:"Calibri", align:"center"
      });
    });

    // Arrows between tiers
    [[3.3, 2.35], [6.55, 2.35]].forEach(([ax, ay]) => {
      s.addShape(pres.shapes.RECTANGLE, { x:ax, y:ay, w:0.25, h:0.06,
        fill:{ color: C.navy }, line:{ color: C.navy } });
      s.addText("⟶", { x:ax-0.05, y:ay-0.1, w:0.4, h:0.3,
        fontSize:18, color: C.navy });
    });

    // External APIs box
    s.addShape(pres.shapes.RECTANGLE, { x:0.3, y:3.85, w:9.4, h:1.4,
      fill:{ color: C.white },
      shadow:{ type:"outer", blur:6, offset:2, angle:135, color:"000000", opacity:0.1 }
    });
    s.addShape(pres.shapes.RECTANGLE, { x:0.3, y:3.85, w:9.4, h:0.38,
      fill:{ color: C.gold }, line:{ color: C.gold }
    });
    s.addText("EXTERNAL SERVICES & APIS", {
      x:0.4, y:3.86, w:9.2, h:0.36,
      fontSize:11, bold:true, color: C.white, charSpacing:2, fontFace:"Calibri", align:"center"
    });

    const apis = ["Yahoo Finance API", "Finnhub API", "Gemini AI API", "MongoDB Atlas Cloud"];
    apis.forEach((api, i) => {
      s.addImage({ data: icCheck, x: 0.6 + i*2.3, y:4.35, w:0.25, h:0.25 });
      s.addText(api, { x: 0.9 + i*2.3, y:4.33, w:2.0, h:0.3,
        fontSize:11, color: C.navy, bold:true, fontFace:"Calibri" });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 7 – Key Features
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.06,
      fill:{ color: C.teal }, line:{ color: C.teal } });

    s.addText("KEY FEATURES", {
      x:0.5, y:0.18, w:9, h:0.4,
      fontSize:11, color: C.teal, bold:true, charSpacing:4, fontFace:"Calibri"
    });
    s.addText("Platform Capabilities", {
      x:0.5, y:0.52, w:9, h:0.55,
      fontSize:28, color: C.white, bold:true, fontFace:"Trebuchet MS"
    });

    const features = [
      [icChart,    C.blue, "Live Market Dashboard",     "Real-time stock prices, % change, volume for major stocks"],
      [icSearch,   C.teal, "Stock Search & Details",    "Search any symbol – live chart, OHLC, news & AI analysis"],
      [icStar,     C.gold, "Custom Watchlists",         "Add/remove favorite stocks, monitor market behavior"],
      [icWallet,   C.blue, "Virtual Portfolio",         "Track holdings, P&L, invested capital & current value"],
      [icExchange, C.teal, "Buy / Sell Trading",        "Execute virtual trades with balance validation & history"],
      [icBrain,    C.gold, "AI Chatbot Assistant",      "Gemini-powered: ask about stocks, trends & investing"],
    ];

    features.forEach(([ico, accent, title, desc], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.4 + col * 5.0;
      const y = 1.18 + row * 1.38;

      s.addShape(pres.shapes.RECTANGLE, { x, y, w:4.7, h:1.22,
        fill:{ color: C.darkCard }, line:{ color: accent }
      });
      s.addImage({ data: ico, x: x+0.18, y: y+0.36, w:0.45, h:0.45 });
      s.addText(title, {
        x: x+0.75, y: y+0.1, w:3.8, h:0.35,
        fontSize:13, bold:true, color: C.white, fontFace:"Calibri"
      });
      s.addText(desc, {
        x: x+0.75, y: y+0.46, w:3.8, h:0.6,
        fontSize:11, color: C.light, fontFace:"Calibri"
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 8 – Virtual Trading System
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.offwhite };

    s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:1.0,
      fill:{ color: C.navy }, line:{ color: C.navy } });
    s.addImage({ data: icExchange, x:0.3, y:0.18, w:0.6, h:0.6 });
    s.addText("Virtual Trading System", {
      x:1.1, y:0.2, w:8.5, h:0.6,
      fontSize:26, color: C.white, bold:true, fontFace:"Trebuchet MS", valign:"middle"
    });

    // Starting balance callout
    s.addShape(pres.shapes.RECTANGLE, { x:0.3, y:1.1, w:3.2, h:1.8,
      fill:{ color: C.navy },
      shadow:{ type:"outer", blur:8, offset:3, angle:135, color:"000000", opacity:0.15 }
    });
    s.addText("Starting Balance", {
      x:0.3, y:1.18, w:3.2, h:0.38,
      fontSize:13, color: C.teal, fontFace:"Calibri", align:"center"
    });
    s.addText("₹10,00,000", {
      x:0.3, y:1.55, w:3.2, h:0.7,
      fontSize:30, bold:true, color: C.white, fontFace:"Trebuchet MS", align:"center"
    });
    s.addText("Virtual Currency", {
      x:0.3, y:2.22, w:3.2, h:0.3,
      fontSize:11, color: C.gray, fontFace:"Calibri", align:"center"
    });

    // Buy flow
    s.addShape(pres.shapes.RECTANGLE, { x:3.8, y:1.1, w:5.9, h:0.75,
      fill:{ color: C.blue },
      shadow:{ type:"outer", blur:5, offset:2, angle:135, color:"000000", opacity:0.12 }
    });
    s.addText("BUY WORKFLOW", {
      x:3.9, y:1.12, w:5.7, h:0.25,
      fontSize:10, bold:true, color: C.white, charSpacing:2, fontFace:"Calibri"
    });
    s.addText("Validate Symbol → Fetch Live Price → Check Balance → Deduct Funds → Update Holdings → Record Transaction", {
      x:3.9, y:1.37, w:5.7, h:0.38,
      fontSize:10, color: C.white, fontFace:"Calibri"
    });

    s.addShape(pres.shapes.RECTANGLE, { x:3.8, y:2.0, w:5.9, h:0.75,
      fill:{ color: C.teal },
      shadow:{ type:"outer", blur:5, offset:2, angle:135, color:"000000", opacity:0.12 }
    });
    s.addText("SELL WORKFLOW", {
      x:3.9, y:2.02, w:5.7, h:0.25,
      fontSize:10, bold:true, color: C.white, charSpacing:2, fontFace:"Calibri"
    });
    s.addText("Validate Ownership → Verify Quantity → Compute P&L → Credit Balance → Update Portfolio → Store History", {
      x:3.9, y:2.27, w:5.7, h:0.38,
      fontSize:10, color: C.white, fontFace:"Calibri"
    });

    // Bottom stats
    const stats = [
      ["Real-Time Prices",  "Yahoo Finance + Finnhub"],
      ["P&L Tracking",      "Per-stock profit / loss"],
      ["Transaction Log",   "Full buy/sell history"],
      ["Portfolio Charts",  "Pie chart distribution"],
    ];

    stats.forEach(([title, desc], i) => {
      const x = 0.3 + i * 2.4;
      s.addShape(pres.shapes.RECTANGLE, { x, y:3.05, w:2.2, h:1.6,
        fill:{ color: C.white },
        shadow:{ type:"outer", blur:5, offset:2, angle:135, color:"000000", opacity:0.08 }
      });
      s.addImage({ data: icCheckW, x: x+0.87, y:3.12, w:0.45, h:0.45 });
      s.addShape(pres.shapes.RECTANGLE, { x: x, y:3.05, w:2.2, h:0.07,
        fill:{ color: C.blue }, line:{ color: C.blue } });
      s.addText(title, {
        x: x+0.1, y:3.62, w:2.0, h:0.35,
        fontSize:12, bold:true, color: C.navy, fontFace:"Calibri", align:"center"
      });
      s.addText(desc, {
        x: x+0.1, y:3.97, w:2.0, h:0.5,
        fontSize:10, color:"475569", fontFace:"Calibri", align:"center"
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 9 – Testing & Results
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.06,
      fill:{ color: C.green }, line:{ color: C.green } });

    s.addText("TESTING & RESULTS", {
      x:0.5, y:0.18, w:9, h:0.4,
      fontSize:11, color: C.green, bold:true, charSpacing:4, fontFace:"Calibri"
    });
    s.addText("All 20 Test Cases Passed", {
      x:0.5, y:0.52, w:9, h:0.55,
      fontSize:28, color: C.white, bold:true, fontFace:"Trebuchet MS"
    });

    // Pass rate callout
    s.addShape(pres.shapes.RECTANGLE, { x:7.8, y:0.12, w:1.9, h:1.0,
      fill:{ color: C.green }, line:{ color: C.green }
    });
    s.addText("100%\nPASS RATE", {
      x:7.8, y:0.15, w:1.9, h:0.95,
      fontSize:16, bold:true, color: C.white, fontFace:"Trebuchet MS", align:"center"
    });

    const testGroups = [
      {
        title:"Authentication Module  (TC-01 to TC-06)",
        color: C.blue,
        cases:[
          ["TC-01", "User signup (new email)",            "201 Created; bcrypt hashing"],
          ["TC-02", "Valid login credentials",            "JWT token generated correctly"],
          ["TC-03", "Login with wrong password",          "401 Unauthorized; no data leak"],
          ["TC-05", "Expired token on protected route",  "401 Unauthorized returned"],
        ]
      },
      {
        title:"Trading & Portfolio Module  (TC-11 to TC-18)",
        color: C.teal,
        cases:[
          ["TC-11", "Buy with sufficient balance",        "Holdings updated; balance deducted"],
          ["TC-12", "Buy with insufficient funds",        "400 Bad Request; no DB change"],
          ["TC-15", "Portfolio valuation accuracy",       "Value = Σ(qty × price); ±0.01"],
          ["TC-18", "Simultaneous buy requests",          "No double-spend; balance safe"],
        ]
      }
    ];

    testGroups.forEach((group, gi) => {
      const y0 = 1.2 + gi * 2.15;
      s.addText(group.title, {
        x:0.4, y: y0, w:9.2, h:0.32,
        fontSize:12, bold:true, color: group.color, fontFace:"Calibri"
      });
      group.cases.forEach((row, ri) => {
        const rowY = y0 + 0.36 + ri * 0.38;
        s.addShape(pres.shapes.RECTANGLE, { x:0.4, y:rowY, w:9.2, h:0.33,
          fill:{ color: ri % 2 === 0 ? C.darkCard : C.cardBg }, line:{ color: "1e3a55" }
        });
        s.addText(row[0], { x:0.5, y:rowY+0.03, w:0.7, h:0.27, fontSize:10, color: group.color, bold:true, fontFace:"Calibri" });
        s.addText(row[1], { x:1.25, y:rowY+0.03, w:4.2, h:0.27, fontSize:10, color: C.white, fontFace:"Calibri" });
        s.addText(row[2], { x:5.5, y:rowY+0.03, w:3.4, h:0.27, fontSize:10, color: C.gray, fontFace:"Calibri" });
        s.addImage({ data: icCheck, x:9.15, y:rowY+0.04, w:0.25, h:0.25 });
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 10 – Conclusion & Future Scope
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.offwhite };

    s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:1.0,
      fill:{ color: C.navy }, line:{ color: C.navy } });
    s.addText("Conclusion & Future Scope", {
      x:0.5, y:0.2, w:9, h:0.6,
      fontSize:26, color: C.white, bold:true, fontFace:"Trebuchet MS", valign:"middle"
    });

    // Conclusion block
    s.addText("Conclusion", {
      x:0.4, y:1.1, w:4.4, h:0.38,
      fontSize:16, bold:true, color: C.navy, fontFace:"Trebuchet MS"
    });
    const conclusions = [
      "Full-stack fintech app combining React/Next.js frontend with Node.js/Express.js backend",
      "Secure JWT authentication, MongoDB Atlas cloud database & modular REST API",
      "Real-time stock data via Yahoo Finance & Finnhub; Chart.js visualizations",
      "AI-powered features via Gemini API: chatbot, trend analysis & market insights",
      "All 20 test cases passed; responsive across devices; 100% security compliance",
    ];
    conclusions.forEach((c, i) => {
      s.addImage({ data: icCheck, x:0.4, y:1.55 + i*0.52, w:0.28, h:0.28 });
      s.addText(c, {
        x:0.75, y:1.55 + i*0.52, w:4.1, h:0.42,
        fontSize:11, color:"334155", fontFace:"Calibri"
      });
    });

    // Divider
    s.addShape(pres.shapes.RECTANGLE, { x:5.1, y:1.1, w:0.04, h:4.2,
      fill:{ color:"CBD5E1" }, line:{ color:"CBD5E1" } });

    // Future scope
    s.addText("Future Scope", {
      x:5.4, y:1.1, w:4.3, h:0.38,
      fontSize:16, bold:true, color: C.navy, fontFace:"Trebuchet MS"
    });
    const futures = [
      [icMobile,    "Mobile App (React Native / Flutter)"],
      [icChartGold, "Advanced Technical Indicators (RSI, MACD)"],
      [icBrainGold, "AI Stock Forecasting (LSTM, ARIMA)"],
      [icCloud,     "WebSocket Real-Time Price Streaming"],
      [icUsers,     "Social Trading & Leaderboards"],
    ];
    futures.forEach(([ico, text], i) => {
      s.addImage({ data: ico, x:5.4, y:1.6 + i*0.55, w:0.3, h:0.3 });
      s.addText(text, {
        x:5.8, y:1.6 + i*0.55, w:3.9, h:0.42,
        fontSize:11, color:"334155", fontFace:"Calibri", valign:"middle"
      });
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SLIDE 11 – Thank You
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };

    s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.06,
      fill:{ color: C.teal }, line:{ color: C.teal } });
    s.addShape(pres.shapes.RECTANGLE, { x:0, y:5.565, w:10, h:0.06,
      fill:{ color: C.teal }, line:{ color: C.teal } });

    s.addImage({ data: icChart, x:4.0, y:0.5, w:2.0, h:2.0 });

    s.addText("Thank You", {
      x:1, y:2.6, w:8, h:0.9,
      fontSize:48, bold:true, color: C.white, fontFace:"Trebuchet MS", align:"center"
    });

    s.addShape(pres.shapes.RECTANGLE, { x:3.5, y:3.52, w:3.0, h:0.05,
      fill:{ color: C.teal }, line:{ color: C.teal } });

    s.addText("Divyansh Pandey  |  SG22316  |  B.E. CSE", {
      x:1, y:3.65, w:8, h:0.38,
      fontSize:14, color: C.mint, fontFace:"Calibri", align:"center"
    });
    s.addText("UIET, Panjab University SSG Regional Centre, Hoshiarpur  |  2026", {
      x:1, y:4.03, w:8, h:0.3,
      fontSize:12, color: C.gray, fontFace:"Calibri", align:"center"
    });
    s.addText("Supervised by: Ishant Sethi  |  Unified Mentor Pvt. Ltd.", {
      x:1, y:4.35, w:8, h:0.3,
      fontSize:12, color: C.gray, fontFace:"Calibri", align:"center"
    });
  }

  // ─── Write file ────────────────────────────────────────────────────────
  await pres.writeFile({ fileName: "FinSights_Presentation.pptx" });
  console.log("Done: FinSights_Presentation.pptx");
}

buildPPT().catch(err => { console.error(err); process.exit(1); });
