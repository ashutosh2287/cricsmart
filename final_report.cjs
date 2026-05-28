const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, NumberFormat,
  LevelFormat
} = require('docx');
const fs = require('fs');

// ── Constants ──────────────────────────────────────────────────────────────
const TNR = "Times New Roman";
const BODY_SIZE = 24;   // 12pt in half-points
const HEAD1_SIZE = 28;  // 14pt
const HEAD2_SIZE = 28;  // 14pt (section headings)
const HEAD3_SIZE = 24;  // 12pt (sub-section headings)
const CAPTION_SIZE = 20;// 10pt
const COVER_TITLE_SIZE = 48; // 24pt
const COVER_CO_SIZE = 44;    // 22pt
const COVER_H_SIZE = 28;     // 14pt
const COVER_B_SIZE = 24;     // 12pt

const SPACING_15 = { line: 360, lineRule: "auto" };  // 1.5 spacing
const SPACING_SINGLE = { line: 240, lineRule: "auto" };

// Margins in DXA: Left=32mm=1814, Top/Bottom/Right=25mm=1417
const PAGE_MARGINS = { top: 1417, right: 1417, bottom: 1417, left: 1814 };
const A4 = { width: 11906, height: 16838 };

// Content width for tables (A4 width - left margin - right margin)
const CONTENT_W = A4.width - PAGE_MARGINS.left - PAGE_MARGINS.right; // 8675 DXA

// ── Helper: Section page properties ───────────────────────────────────────
function pageProps(numFormat, startNum) {
  return {
    page: {
      size: A4,
      margin: PAGE_MARGINS,
      pageNumbers: { start: startNum, formatType: numFormat }
    }
  };
}

// ── Helper: Footer with centered page number ───────────────────────────────
function centeredPageFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: TNR, size: BODY_SIZE })]
    })]
  });
}

function emptyFooter() {
  return new Footer({ children: [new Paragraph({ children: [] })] });
}

// ── Helper: Body paragraph ─────────────────────────────────────────────────
function body(text, align) {
  return new Paragraph({
    alignment: align || AlignmentType.JUSTIFIED,
    spacing: SPACING_15,
    children: [new TextRun({ text, font: TNR, size: BODY_SIZE })]
  });
}

function bodyBold(text, align) {
  return new Paragraph({
    alignment: align || AlignmentType.JUSTIFIED,
    spacing: SPACING_15,
    children: [new TextRun({ text, font: TNR, size: BODY_SIZE, bold: true })]
  });
}

function emptyLine() {
  return new Paragraph({
    spacing: SPACING_15,
    children: [new TextRun({ text: "", font: TNR, size: BODY_SIZE })]
  });
}

// ── Helper: Chapter heading (14pt bold, centered) ──────────────────────────
function chapterHeading(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { ...SPACING_15, before: 240, after: 240 },
    children: [new TextRun({ text: text.toUpperCase(), font: TNR, size: HEAD1_SIZE, bold: true })]
  });
}

// ── Helper: Section heading (14pt bold) ───────────────────────────────────
function sectionHeading(num, text) {
  return new Paragraph({
    spacing: { ...SPACING_15, before: 200, after: 100 },
    children: [new TextRun({ text: `${num} ${text}`, font: TNR, size: HEAD2_SIZE, bold: true })]
  });
}

// ── Helper: Sub-section heading (12pt bold) ────────────────────────────────
function subHeading(num, text) {
  return new Paragraph({
    spacing: { ...SPACING_15, before: 160, after: 80 },
    children: [new TextRun({ text: `${num} ${text}`, font: TNR, size: HEAD3_SIZE, bold: true })]
  });
}

// ── Helper: Bullet item ────────────────────────────────────────────────────
function bulletItem(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: SPACING_15,
    children: [new TextRun({ text, font: TNR, size: BODY_SIZE })]
  });
}

function bulletItemBold(label, rest) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: SPACING_15,
    children: [
      new TextRun({ text: label, font: TNR, size: BODY_SIZE, bold: true }),
      new TextRun({ text: rest, font: TNR, size: BODY_SIZE })
    ]
  });
}

// ── Helper: Centered large text (for cover page) ───────────────────────────
function coverText(text, size, bold) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 360 },
    children: [new TextRun({ text, font: TNR, size: size || COVER_B_SIZE, bold: !!bold })]
  });
}

// ── Helper: Page break ─────────────────────────────────────────────────────
function pgBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ── Helper: Divider line (bottom border on paragraph) ─────────────────────
function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } },
    children: [new TextRun({ text: "", font: TNR, size: BODY_SIZE })]
  });
}

// ── Table helpers ──────────────────────────────────────────────────────────
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const allBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function headerCell(text, width) {
  return new TableCell({
    borders: allBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "D0D0D0", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      spacing: SPACING_SINGLE,
      children: [new TextRun({ text, font: TNR, size: BODY_SIZE, bold: true })]
    })]
  });
}

function dataCell(text, width, align) {
  return new TableCell({
    borders: allBorders,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: align || AlignmentType.LEFT,
      spacing: SPACING_SINGLE,
      children: [new TextRun({ text, font: TNR, size: BODY_SIZE })]
    })]
  });
}

// ── Section 1: Cover Pages (no page numbers) ───────────────────────────────
function makeCoverSection() {
  return {
    properties: {
      page: { size: A4, margin: PAGE_MARGINS }
    },
    footers: { default: emptyFooter() },
    children: [
      // ── Cover Page ──
      emptyLine(), emptyLine(), emptyLine(),
      coverText("A REPORT ON", COVER_B_SIZE, false),
      emptyLine(),
      coverText("Stock Tracking and Portfolio Management Tool", COVER_TITLE_SIZE, true),
      emptyLine(),
      coverText("At Unified Mentor Pvt. Ltd.", COVER_CO_SIZE, false),
      emptyLine(), emptyLine(),
      coverText("SUBMITTED IN PARTIAL FULFILLMENT FOR AWARD DEGREE OF", COVER_B_SIZE, false),
      emptyLine(),
      coverText("BACHELOR OF ENGINEERING", COVER_H_SIZE, true),
      coverText("IN", COVER_B_SIZE, false),
      coverText("Computer Science & Engineering", COVER_H_SIZE, true),
      emptyLine(),
      coverText("BY", COVER_B_SIZE, false),
      emptyLine(),
      coverText("Divyansh Pandey  (SG22316)", COVER_H_SIZE, true),
      emptyLine(), emptyLine(),
      coverText("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", COVER_H_SIZE, true),
      emptyLine(),
      coverText("UIET, PANJAB UNIVERSITY SSG REGIONAL CENTRE,", COVER_H_SIZE, true),
      coverText("HOSHIARPUR-146021, Punjab (INDIA)", COVER_H_SIZE, true),
      emptyLine(),
      coverText("(2025)", COVER_B_SIZE, false),

      // ── Page break to Inside Cover ──
      pgBreak(),

      // ── Inside Cover Page ──
      emptyLine(), emptyLine(), emptyLine(),
      coverText("A REPORT ON", COVER_B_SIZE, false),
      emptyLine(),
      coverText("Stock Tracking and Portfolio Management Tool", COVER_TITLE_SIZE, true),
      emptyLine(),
      coverText("At Unified Mentor Pvt. Ltd.", COVER_CO_SIZE, false),
      emptyLine(), emptyLine(),
      coverText("SUBMITTED IN PARTIAL FULFILLMENT FOR AWARD DEGREE OF", COVER_B_SIZE, false),
      emptyLine(),
      coverText("BACHELOR OF ENGINEERING", COVER_H_SIZE, true),
      coverText("IN", COVER_B_SIZE, false),
      coverText("Computer Science & Engineering", COVER_H_SIZE, true),
      emptyLine(),
      coverText("BY", COVER_B_SIZE, false),
      emptyLine(),
      coverText("Divyansh Pandey  (SG22316)", COVER_H_SIZE, true),
      emptyLine(), emptyLine(),
      coverText("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", COVER_H_SIZE, true),
      emptyLine(),
      coverText("UIET, PANJAB UNIVERSITY SSG REGIONAL CENTRE,", COVER_H_SIZE, true),
      coverText("HOSHIARPUR-146021, Punjab (INDIA)", COVER_H_SIZE, true),
      emptyLine(),
      coverText("(2025)", COVER_B_SIZE, false),
    ]
  };
}

// ── Section 2: Preliminary Pages (Roman numerals, start at ii=2) ───────────
function makePreliminarySection() {
  return {
    properties: pageProps(NumberFormat.LOWER_ROMAN, 2),
    footers: { default: centeredPageFooter() },
    children: [
      // ── Certificate ──
      chapterHeading("CERTIFICATE"),
      emptyLine(),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: SPACING_15,
        children: [
          new TextRun({ text: "\t\tCertified that the training report entitled ", font: TNR, size: BODY_SIZE }),
          new TextRun({ text: '"Stock Tracking and Portfolio Management Tool"', font: TNR, size: BODY_SIZE, bold: true }),
          new TextRun({ text: " submitted by ", font: TNR, size: BODY_SIZE }),
          new TextRun({ text: "Divyansh Pandey", font: TNR, size: BODY_SIZE, bold: true }),
          new TextRun({ text: " (SG22316), student of Computer Science & Engineering, UIET, Panjab University Swami Sarvanand Giri Regional Centre, Hoshiarpur, in the partial fulfillment of the requirement for the award of Bachelor of Engineering (Computer Science & Engineering) Degree of Panjab University, Chandigarh is a record of student's own study carried under my supervision & guidance.", font: TNR, size: BODY_SIZE }),
        ]
      }),
      emptyLine(),
      body("This report has not been submitted to any other university or institution for the award of any degree."),
      emptyLine(), emptyLine(), emptyLine(),
      body("Name & Signature of Training Supervisor"),
      body("Ishant Sethi"),
      body("Training Guide, Unified Mentor Pvt. Ltd."),

      // ── Declaration ──
      pgBreak(),
      chapterHeading("DECLARATION"),
      emptyLine(),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: SPACING_15,
        children: [
          new TextRun({ text: "\t\tThe work embodied in the training report entitled, ", font: TNR, size: BODY_SIZE }),
          new TextRun({ text: '"Stock Tracking and Portfolio Management Tool"', font: TNR, size: BODY_SIZE, bold: true }),
          new TextRun({ text: " submitted to the Department of Computer Science & Engineering at UIET, Panjab University Swami Sarvanand Giri Regional Centre, Hoshiarpur for the award of degree of Bachelor of Engineering, has been done by me. The training report is entirely based on my own work and not submitted elsewhere for the award of any other degree. All ideas and references have been duly acknowledged.", font: TNR, size: BODY_SIZE }),
        ]
      }),
      emptyLine(), emptyLine(), emptyLine(),
      body("Name and Signature of Student"),
      emptyLine(),
      body("Divyansh Pandey"),
      body("Roll Number: SG22316"),
      body("BE Computer Science & Engineering"),
      body("UIET, Panjab University SSG Regional Centre, Hoshiarpur-146021, Punjab (India)"),
      emptyLine(), emptyLine(),
      body("Countersigned by: (Supervisor)"),
      body("Ishant Sethi, Unified Mentor Pvt. Ltd."),

      // ── Acknowledgement ──
      pgBreak(),
      chapterHeading("ACKNOWLEDGEMENT"),
      emptyLine(),
      body("I would like to express my sincere gratitude to my training guide, Ishant Sethi, and Unified Mentor Pvt. Ltd. for their continuous support, encouragement, and invaluable guidance throughout the course of my internship. Their consistent motivation, constructive feedback, and insightful suggestions played a crucial role in shaping the quality, direction, and successful completion of my work."),
      emptyLine(),
      body("I am deeply thankful to Unified Mentor Pvt. Ltd. for providing a highly professional and learning-oriented environment. The exposure to real-world projects, industry practices, and modern development tools significantly enhanced my technical knowledge and practical skills. The resources and mentorship provided during this internship allowed me to explore new concepts and gain a deeper understanding of software development."),
      emptyLine(),
      body("This internship has been an enriching learning experience, enabling me to gain hands-on expertise in full-stack development, backend API design, authentication systems, and stock market analytics. Working on real-world applications such as secure user management, virtual trading systems, and financial data visualization has strengthened my problem-solving abilities, analytical thinking, and overall technical confidence."),
      emptyLine(),
      body("I would also like to extend my heartfelt thanks to my peers and colleagues for their constant encouragement, collaboration, and support throughout this journey."),
      emptyLine(), emptyLine(), emptyLine(),
      body("Divyansh Pandey"),
      body("Roll Number: SG22316"),
      body("BE Computer Science & Engineering"),

      // ── Abstract ──
      pgBreak(),
      chapterHeading("ABSTRACT"),
      emptyLine(),
      body("FinSights is a comprehensive full-stack web application designed to provide users with an intuitive and educational platform for understanding financial markets. It offers real-time and historical stock market data, detailed price charts, market insights, and virtual trading features, making it an ideal tool for beginners, students, and financial enthusiasts. The platform bridges the gap between theoretical stock market concepts and practical hands-on experience by allowing users to explore live market data while simulating investments without any monetary risk."),
      emptyLine(),
      body("Developed using modern web technologies including Next.js and React.js for a dynamic and responsive frontend, TailwindCSS for optimized styling, and Node.js with Express.js for the backend, FinSights ensures a smooth and efficient user experience. The system uses MongoDB Atlas as its cloud-based NoSQL database for managing user profiles, watchlists, virtual portfolios, and trade history. With JWT authentication, the platform provides secure login, signup, and user data management."),
      emptyLine(),
      body("Stock market data, including real-time prices, historical trends, and performance indicators, is fetched using the Yahoo Finance API, ensuring accurate and up-to-date market information. Visualizations such as line charts, candlestick charts, and trend graphs are implemented using Chart.js, allowing users to analyze market behavior over time and make informed decisions within the virtual trading environment."),
      emptyLine(),
      body("One of the notable features of FinSights is its fully functional virtual trading simulation, where users are allotted a starting balance of Rs.10,00,000 to buy and sell stocks, track their holdings, and monitor profit-loss ratios. Users can also create customized watchlists to track their preferred stocks. Overall, FinSights serves as an innovative learning and practice platform that blends technology, finance, and analytics."),

      // ── Table of Contents ──
      pgBreak(),
      chapterHeading("TABLE OF CONTENTS"),
      emptyLine(),
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [1200, 6275, 1200],
        rows: [
          new TableRow({ children: [
            headerCell("S.No.", 1200), headerCell("Title", 6275), headerCell("Page No.", 1200)
          ]}),
          ...tocRow("", "Certificate", "ii"),
          ...tocRow("", "Declaration", "iii"),
          ...tocRow("", "Acknowledgement", "iv"),
          ...tocRow("", "Abstract", "v"),
          ...tocRow("", "Table of Contents", "vi"),
          ...tocRow("", "List of Figures", "vii"),
          ...tocRow("", "List of Tables", "viii"),
          ...tocRow("", "List of Abbreviations", "ix"),
          ...tocRowChapter("Chapter 1", "Introduction", "1"),
          ...tocRow("1.1", "Company Introduction", "1"),
          ...tocRow("1.2", "Project Introduction", "3"),
          ...tocRow("1.3", "Objectives", "5"),
          ...tocRowChapter("Chapter 2", "Technology Stack", "7"),
          ...tocRow("2.1", "Frontend Technologies", "7"),
          ...tocRow("2.2", "Backend Technologies", "10"),
          ...tocRow("2.3", "Database", "12"),
          ...tocRow("2.4", "Authentication Layer", "13"),
          ...tocRow("2.5", "External APIs and Market Data", "14"),
          ...tocRowChapter("Chapter 3", "System Architecture", "15"),
          ...tocRow("3.1", "Overview", "15"),
          ...tocRow("3.2", "Frontend Architecture", "15"),
          ...tocRow("3.3", "Backend Architecture", "16"),
          ...tocRow("3.4", "External APIs and Caching", "16"),
          ...tocRow("3.5", "Database Layer", "17"),
          ...tocRow("3.6", "Request Flow and Security", "17"),
          ...tocRow("3.7", "Operational Concerns", "18"),
          ...tocRowChapter("Chapter 4", "Implementation", "19"),
          ...tocRow("4.1", "Modular REST API Architecture", "19"),
          ...tocRow("4.2", "Authentication and Security Implementation", "20"),
          ...tocRow("4.3", "Backend Processing and Business Logic", "21"),
          ...tocRow("4.4", "Frontend Implementation Using Next.js and React", "22"),
          ...tocRow("4.5", "External API Integration", "24"),
          ...tocRow("4.6", "Database Implementation with MongoDB Atlas", "25"),
          ...tocRow("4.7", "Error Handling and Logging", "26"),
          ...tocRowChapter("Chapter 5", "Testing and Results", "27"),
          ...tocRow("5.1", "Testing Overview", "27"),
          ...tocRow("5.2", "Test Case Table", "29"),
          ...tocRow("5.3", "Output Screens", "31"),
          ...tocRowChapter("Chapter 6", "Conclusion and Future Scope", "33"),
          ...tocRow("6.1", "Conclusion", "33"),
          ...tocRow("6.2", "Future Scope", "34"),
          ...tocRow("", "References", "37"),
        ]
      }),

      // ── List of Figures ──
      pgBreak(),
      chapterHeading("LIST OF FIGURES"),
      emptyLine(),
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [1200, 5875, 1600],
        rows: [
          new TableRow({ children: [
            headerCell("Fig. No.", 1200), headerCell("Title", 5875), headerCell("Page No.", 1600)
          ]}),
          ...figRow("3.1", "FinSights System Architecture Diagram", "15"),
          ...figRow("4.1", "REST API Module Structure", "19"),
          ...figRow("4.2", "JWT Authentication Flow", "20"),
          ...figRow("4.3", "Virtual Trading Buy/Sell Workflow", "21"),
          ...figRow("4.4", "Frontend Component Hierarchy", "22"),
          ...figRow("4.5", "External API Integration Architecture", "24"),
          ...figRow("5.1", "Home Page - Dashboard View", "31"),
          ...figRow("5.2", "Markets Page - Live Stock Data", "31"),
          ...figRow("5.3", "Watchlist Page", "32"),
          ...figRow("5.4", "Portfolio Page", "32"),
          ...figRow("5.5", "User Profile Page", "33"),
        ]
      }),

      // ── List of Tables ──
      pgBreak(),
      chapterHeading("LIST OF TABLES"),
      emptyLine(),
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [1400, 5675, 1600],
        rows: [
          new TableRow({ children: [
            headerCell("Table No.", 1400), headerCell("Title", 5675), headerCell("Page No.", 1600)
          ]}),
          ...figRow("2.1", "Frontend Technologies Overview", "7"),
          ...figRow("2.2", "Backend Technologies Overview", "10"),
          ...figRow("5.1", "Test Cases - Authentication Module", "29"),
          ...figRow("5.2", "Test Cases - Trading and Portfolio Module", "30"),
          ...figRow("5.3", "Test Cases - Performance and UI Module", "31"),
        ]
      }),

      // ── List of Abbreviations ──
      pgBreak(),
      chapterHeading("LIST OF ABBREVIATIONS"),
      emptyLine(),
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [2000, 6675],
        rows: [
          new TableRow({ children: [headerCell("Abbreviation", 2000), headerCell("Full Form", 6675)] }),
          ...abbRow("API", "Application Programming Interface"),
          ...abbRow("ARIMA", "Autoregressive Integrated Moving Average"),
          ...abbRow("CORS", "Cross-Origin Resource Sharing"),
          ...abbRow("CSR", "Client-Side Rendering"),
          ...abbRow("CSS", "Cascading Style Sheets"),
          ...abbRow("CRUD", "Create, Read, Update, Delete"),
          ...abbRow("HTTP/HTTPS", "HyperText Transfer Protocol / Secure"),
          ...abbRow("JWT", "JSON Web Token"),
          ...abbRow("LSTM", "Long Short-Term Memory"),
          ...abbRow("MVC", "Model-View-Controller"),
          ...abbRow("NoSQL", "Non-relational Structured Query Language"),
          ...abbRow("OHLC", "Open, High, Low, Close"),
          ...abbRow("REST", "Representational State Transfer"),
          ...abbRow("SEO", "Search Engine Optimization"),
          ...abbRow("SSG", "Static Site Generation"),
          ...abbRow("SSR", "Server-Side Rendering"),
          ...abbRow("TLS", "Transport Layer Security"),
          ...abbRow("TTL", "Time-To-Live"),
          ...abbRow("UI/UX", "User Interface / User Experience"),
          ...abbRow("URL", "Uniform Resource Locator"),
        ]
      }),
    ]
  };
}

// Helper: TOC row
function tocRow(num, title, page) {
  return [new TableRow({ children: [
    dataCell(num, 1200), dataCell(title, 6275), dataCell(page, 1200, AlignmentType.CENTER)
  ]})];
}
function tocRowChapter(num, title, page) {
  return [new TableRow({ children: [
    new TableCell({ borders: allBorders, width: { size: 1200, type: WidthType.DXA }, shading: { fill: "E8E8E8", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ spacing: SPACING_SINGLE, children: [new TextRun({ text: num, font: TNR, size: BODY_SIZE, bold: true })] })] }),
    new TableCell({ borders: allBorders, width: { size: 6275, type: WidthType.DXA }, shading: { fill: "E8E8E8", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ spacing: SPACING_SINGLE, children: [new TextRun({ text: title, font: TNR, size: BODY_SIZE, bold: true })] })] }),
    new TableCell({ borders: allBorders, width: { size: 1200, type: WidthType.DXA }, shading: { fill: "E8E8E8", type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: SPACING_SINGLE, children: [new TextRun({ text: page, font: TNR, size: BODY_SIZE, bold: true })] })] }),
  ]})];
}
function figRow(num, title, page) {
  return [new TableRow({ children: [
    dataCell(num, 1200), dataCell(title, 5875), dataCell(page, 1600, AlignmentType.CENTER)
  ]})];
}
function abbRow(abbr, full) {
  return [new TableRow({ children: [
    dataCell(abbr, 2000), dataCell(full, 6675)
  ]})];
}

// ── Section 3: Main Chapters (Arabic numerals from 1) ─────────────────────
function makeChaptersSection() {
  return {
    properties: pageProps(NumberFormat.DECIMAL, 1),
    footers: { default: centeredPageFooter() },
    children: [
      // ════════════════════════════════════════════
      // CHAPTER 1: INTRODUCTION
      // ════════════════════════════════════════════
      chapterHeading("Chapter 1: Introduction"),
      emptyLine(),

      sectionHeading("1.1", "Company Introduction"),
      body("Unified Mentor Pvt. Ltd. is a growing EdTech and IT solutions company based in Gurugram (Gurgaon), Haryana, India. The company focuses on delivering both industry-oriented training programs and innovative software solutions to bridge the gap between academic learning and real-world industry requirements."),
      emptyLine(),
      body("Unified Mentor aims to build a career-focused and technology-driven ecosystem where students, professionals, and businesses can benefit from practical knowledge, mentorship, and scalable digital solutions. The organization emphasizes hands-on learning, real-world project exposure, and modern software development practices."),
      emptyLine(),
      subHeading("1.1.1", "Software Services Offered"),
      body("The company provides a wide range of software services including:"),
      bulletItem("Web Development, App Development, and Full-Stack Development"),
      bulletItem("Backend and Frontend Development with API Design"),
      bulletItem("Cloud Computing, DevOps, and Cybersecurity"),
      bulletItem("Data Science, Data Analytics, Machine Learning, and Artificial Intelligence"),
      bulletItem("UI/UX Design, Database Management, Blockchain, and IoT"),
      bulletItem("Automation and Software Testing"),
      emptyLine(),

      sectionHeading("1.2", "Project Introduction"),
      body("The stock market is one of the most dynamic, unpredictable, and influential components of the global financial ecosystem. Its behavior is shaped by multiple factors including company performance, economic indicators, geopolitical events, investor sentiment, and real-time market activity. For students, beginners, and aspiring investors, understanding stock movements, interpreting market trends, and analyzing portfolio growth can be challenging without proper tools or practical exposure."),
      emptyLine(),
      body("FinSights is developed as a modern, interactive platform that bridges this gap by combining market data analysis with practical trading simulation. It allows users to access real-time stock prices, explore historical market trends, and visualize performance using dynamic charts. The application also includes customizable watchlists, enabling users to track their favorite stocks and monitor their market behavior over various timeframes."),
      emptyLine(),
      body("One of the key features of FinSights is its virtual trading environment, where users receive a starting balance of Rs.10,00,000 in virtual currency to buy and sell stocks just as they would in real-world trading. This simulation helps learners practice investment decisions without monetary risk, evaluate their strategies, and gain confidence before entering actual financial markets. Additionally, the platform integrates news-driven insights, helping users correlate market sentiment and external events with stock performance."),
      emptyLine(),

      sectionHeading("1.3", "Objectives"),
      body("The primary objective of the FinSights platform is to provide users with an intuitive, interactive, and educational environment for understanding real-time financial markets. The following goals guide the development of the system:"),
      emptyLine(),
      subHeading("1.3.1", "Deliver Real-Time Stock Market Data"),
      body("To allow users to track live stock prices and market movements for informed analysis and learning, fetching data directly from the Yahoo Finance API."),
      emptyLine(),
      subHeading("1.3.2", "Provide Historical Market Analysis Using Chart.js"),
      body("To visualize long-term stock performance through interactive charts, enabling users to identify trends, patterns, and fluctuations over different time intervals."),
      emptyLine(),
      subHeading("1.3.3", "Enable Personal Watchlist Management"),
      body("To allow users to create and manage customized watchlists for monitoring selected stocks based on their interests and investment goals."),
      emptyLine(),
      subHeading("1.3.4", "Offer Virtual Trading with a Rs.10,00,000 Starting Balance"),
      body("To simulate real-world trading by enabling users to buy and sell stocks using virtual money, fostering risk-free investment practice and financial literacy."),
      emptyLine(),
      subHeading("1.3.5", "Ensure Secure Authentication Using JWT"),
      body("To protect user accounts and data through a robust, token-based authentication mechanism, supporting safe login, signup, and authorized access to personal dashboards."),
      emptyLine(),
      subHeading("1.3.6", "Provide Comprehensive User Profile Management"),
      body("To allow users to edit and update personal details, including name, avatar, and other profile information, ensuring a customizable and personalized experience."),
      emptyLine(),
      subHeading("1.3.7", "Deliver a Fully Responsive UI with Next.js and TailwindCSS"),
      body("To ensure seamless usability across devices by developing a fast, modern, and mobile-friendly interface."),

      // ════════════════════════════════════════════
      // CHAPTER 2: TECHNOLOGY STACK
      // ════════════════════════════════════════════
      pgBreak(),
      chapterHeading("Chapter 2: Technology Stack"),
      body("The FinSights platform has been engineered using a modern, production-grade technology stack that ensures performance, scalability, real-time responsiveness, and exceptional user experience. Each technology in the stack has been carefully chosen to fulfill specific architectural, functional, and security needs of the application."),
      emptyLine(),

      sectionHeading("2.1", "Frontend Technologies"),
      subHeading("2.1.1", "Next.js (Universal React Framework)"),
      body("Next.js serves as the backbone of the frontend and enables a hybrid rendering model, including Server-Side Rendering (SSR), Static Site Generation (SSG), and Client-Side Rendering (CSR). This combination significantly enhances performance, SEO optimization, initial load speed, and dynamic routing."),
      emptyLine(),
      subHeading("2.1.2", "React.js (Component-Based UI Architecture)"),
      body("React enables the creation of reusable UI components that update efficiently using its virtual DOM algorithm. This allows FinSights to deliver dynamic dashboards, responsive charts, watchlist modules, portfolio tables, and user settings pages with smooth performance."),
      emptyLine(),
      subHeading("2.1.3", "TailwindCSS (Utility-First CSS Framework)"),
      body("TailwindCSS powers the design language of FinSights, helping build a stunning UI without writing traditional CSS. It ensures pixel-perfect responsive design that adapts flawlessly across desktops, tablets, and smartphones."),
      emptyLine(),
      subHeading("2.1.4", "Chart.js (Interactive Data Visualization Library)"),
      body("Chart.js brings the stock market to life through intuitive and interactive data visualizations. It is used for rendering the following chart types:"),
      bulletItem("Line charts for stock price movement over time"),
      bulletItem("Candlestick charts displaying Open-High-Low-Close (OHLC) data"),
      bulletItem("Volume charts for market activity analysis"),
      bulletItem("Multi-axis comparative charts for performance benchmarking"),
      emptyLine(),

      sectionHeading("2.2", "Backend Technologies"),
      subHeading("2.2.1", "Node.js (High-Performance JavaScript Runtime)"),
      body("Node.js powers the backend with a non-blocking, event-driven architecture that handles concurrent requests efficiently. It supports FinSights' fast API responses for stock data, watchlist operations, and virtual trading logic. Key advantages include high throughput with asynchronous I/O, a single language across frontend and backend, and a massive NPM ecosystem."),
      emptyLine(),
      subHeading("2.2.2", "Express.js (Minimal yet Powerful Backend Framework)"),
      body("Express provides the routing and middleware backbone used for all backend operations. It manages authentication routes, user profile management, stock search and quote fetching, portfolio buy/sell operations, and watchlist CRUD operations."),
      emptyLine(),

      sectionHeading("2.3", "Database"),
      subHeading("2.3.1", "MongoDB Atlas (Cloud-Native NoSQL Database)"),
      body("MongoDB Atlas stores all persistent data including user profiles, encrypted passwords, watchlists, and virtual portfolio transactions. Its NoSQL schema makes it ideal for financial applications requiring flexible and fast read/write operations. The database is configured for high availability through replica sets and secure access via TLS and IP whitelisting."),
      emptyLine(),

      sectionHeading("2.4", "Authentication Layer"),
      subHeading("2.4.1", "JWT (JSON Web Token)"),
      body("JWT ensures secure, tamper-proof authentication between client and server. The server signs tokens using a secret key, enabling stateless authentication with no session overhead. Advantages include secure login and signup, no session storage requirement, seamless operation across mobile and web, and protected routes using middleware."),
      emptyLine(),

      sectionHeading("2.5", "External APIs and Market Data"),
      subHeading("2.5.1", "Yahoo Finance API"),
      body("Yahoo Finance API serves as the core data provider for the FinSights platform. It supplies real-time stock quotes, daily/weekly/monthly historical data, OHLC values, volume and market cap data, price change percentages, day high/low values, and sector and index information."),

      // ════════════════════════════════════════════
      // CHAPTER 3: SYSTEM ARCHITECTURE
      // ════════════════════════════════════════════
      pgBreak(),
      chapterHeading("Chapter 3: System Architecture"),
      emptyLine(),

      sectionHeading("3.1", "Overview"),
      body("The FinSights architecture is organized into three clearly separated layers — Frontend, Backend, and Database — each responsible for a distinct set of concerns and communicating through well-defined RESTful interfaces. This layered approach ensures separation of concerns, scalability, and maintainability across the entire application."),
      emptyLine(),

      sectionHeading("3.2", "Frontend Architecture"),
      body("The client runs in the user's browser and is composed of static assets, reusable UI components, and Next.js pages. UI interactions such as searches, watchlist edits, and trade actions send HTTPS requests or trigger client-side fetches to the backend. Next.js provides hybrid rendering (SSR/SSG/CSR) for fast initial loads and SEO-friendly pages while the React component tree handles dynamic updates and Chart.js visualizations. Static assets and optimized images are served from the frontend layer to minimize latency and improve perceived performance."),
      emptyLine(),

      sectionHeading("3.3", "Backend Architecture"),
      body("All client requests are routed to the server handler which exposes REST endpoints. Incoming requests first pass through reusable middleware for logging, request validation, CORS handling, and rate-limiting. An Auth Middleware validates JWT tokens for protected routes. Authenticated requests are forwarded to route handlers and controllers that implement business logic including user profile updates, watchlist CRUD operations, trade validation, and portfolio computation. Controllers interact with two data sources: the internal data model (MongoDB) and external market data providers (Yahoo Finance API). All data is normalized into structured JSON formats before being returned to the frontend."),
      emptyLine(),

      sectionHeading("3.4", "External APIs and Caching"),
      body("To avoid unnecessary latency and rate-limit issues, the backend implements short-term caching for frequently requested market data and uses defensive patterns such as retry/backoff and circuit breakers when calling Yahoo Finance. This layer fetches OHLC/historical data for Chart.js visualizations, real-time quotes for market tables, and supplemental metadata. If the same stock data is requested multiple times within a short interval, the response may be served from the cache rather than making a fresh API request."),
      emptyLine(),

      sectionHeading("3.5", "Database Layer"),
      body("Persistent user data — profiles, hashed passwords, watchlists, portfolio holdings, and transaction history — is stored in MongoDB Atlas. The models layer encapsulates schema validation and database operations, providing an abstraction for controllers to read and write data. The database is configured for high availability using replica sets and secure access via TLS and IP whitelisting. Indexes on frequently queried fields such as userId and symbol enable fast lookups."),
      emptyLine(),

      sectionHeading("3.6", "Request Flow and Security"),
      body("The typical request flow is: Browser → Next.js Page → Server Handler → Auth Middleware → Routes → Controllers → Models / External APIs → MongoDB. Responses are returned as JSON and the frontend updates the UI accordingly. Security best practices applied include password hashing using bcrypt, tokens issued with short TTLs, sensitive tokens stored securely in httpOnly cookies or secure storage, and HTTPS enforced end-to-end. Rate-limiting, input validation, and centralized error handling protect the application from abuse and accidental failures."),
      emptyLine(),

      sectionHeading("3.7", "Operational Concerns"),
      body("The architecture supports horizontal scaling of both frontend and backend layers. Stateless servers allow additional instances to be deployed behind a load balancer. Logging and metrics covering request latency, error rates, and API failure rates feed monitoring and alerting dashboards. For production deployments, improvements such as background jobs for heavy tasks, Redis for high-speed caching, and a CDN for static assets can be added without changing the core design."),

      // ════════════════════════════════════════════
      // CHAPTER 4: IMPLEMENTATION
      // ════════════════════════════════════════════
      pgBreak(),
      chapterHeading("Chapter 4: Implementation"),
      body("The implementation of the FinSights platform follows a clean, modular, and scalable approach using modern full-stack development principles. The system is divided into three core layers — Frontend, Backend, and Database — each developed independently yet integrated seamlessly through RESTful communication. This separation of concerns ensures maintainability, robustness, and ease of future expansion."),
      emptyLine(),

      sectionHeading("4.1", "Modular REST API Architecture"),
      body("The backend of FinSights is built using Node.js and Express.js, structured around a modular REST API design pattern. Each major functionality — such as authentication, stock operations, watchlist management, user profile updates, and portfolio trading — is separated into individual route modules and controllers. The key components are:"),
      bulletItemBold("Routes: ", "Define endpoint paths and HTTP methods for all operations."),
      bulletItemBold("Controllers: ", "Contain business logic for each operation."),
      bulletItemBold("Models: ", "Define the schema and database structure using MongoDB."),
      bulletItemBold("Middleware: ", "Handle authentication, validation, and error handling."),
      emptyLine(),
      body("This layered approach allows features to be added or modified without affecting other modules, enhancing scalability and maintainability of the system."),
      emptyLine(),

      sectionHeading("4.2", "Authentication and Security Implementation"),
      body("FinSights uses JWT (JSON Web Token) for secure authentication across all protected resources. When a user logs in or signs up, passwords are securely hashed using bcrypt before storage. Upon successful authentication, the server generates a signed JWT containing the user's ID, which is sent to the frontend and attached to future requests. Protected routes use an Auth Middleware to verify token validity before granting access."),
      emptyLine(),
      body("Additional security measures implemented include:"),
      bulletItem("Input validation to prevent injection attacks"),
      bulletItem("HTTPS-only communication enforced across all endpoints"),
      bulletItem("Environment variable protection using dotenv"),
      bulletItem("Strict CORS policies to prevent unauthorized cross-origin access"),
      emptyLine(),

      sectionHeading("4.3", "Backend Processing and Business Logic"),
      body("The backend is responsible for executing all core financial operations. Portfolio Management assigns every new user a virtual starting balance of Rs.10,00,000. During a buy operation, the backend validates the stock symbol, fetches its real-time market price, verifies sufficient funds, and updates the holdings while deducting the appropriate amount from the available balance. Sell operations involve validating the quantity held, calculating profit or loss, and crediting proceeds back to the user's balance. All portfolio updates are permanently stored in MongoDB."),
      emptyLine(),
      body("The Watchlist Management module allows users to add, remove, and view their preferred stocks. Any modification is directly reflected in the user's document in MongoDB, ensuring fast retrieval and seamless synchronization. The User Profile Management module enables users to update personal details such as name, avatar, and bio, protected by JWT-based authentication."),
      emptyLine(),
      body("The Data Fetching Logic integrates with the Yahoo Finance API to retrieve real-time stock quotes, historical data, OHLC values, and market insights. All retrieved data is normalized into clean, structured JSON formats before being sent to the frontend."),
      emptyLine(),

      sectionHeading("4.4", "Frontend Implementation Using Next.js and React"),
      body("The frontend of FinSights is developed using Next.js, combining Server-Side Rendering (SSR), Static Site Generation (SSG), and Client-Side Rendering (CSR). This hybrid approach significantly improves page load speed, enhances SEO performance, and enables smooth user interactions. Next.js provides an efficient file-based routing system, simplifying navigation across pages such as Home, Markets, Watchlist, Portfolio, and Profile."),
      emptyLine(),
      body("To ensure a clean, modular, and maintainable interface, the frontend uses a collection of reusable UI components built with React. These components include stock tables for displaying live market data, watchlist cards for tracking selected stocks, portfolio charts for visualizing holdings, news cards for financial insights, and profile components for user information. Each element is designed using TailwindCSS for responsive layouts and consistent styling."),
      emptyLine(),
      body("The frontend fetches data from the Express backend using the native fetch() API, with optional support for axios. The integration of Chart.js generates detailed visual analytics including line charts for stock price trends, candlestick charts for OHLC data analysis, and pie charts for portfolio distribution."),
      emptyLine(),

      sectionHeading("4.5", "External API Integration"),
      body("The FinSights platform relies on the Yahoo Finance API as its primary source for real-time and historical stock market data. Instead of allowing the frontend to communicate with the external API directly, the backend acts as a secure and controlled middleware layer. When the user initiates a request, the frontend sends it to the Express backend, which forwards it to Yahoo Finance, retrieves the data, performs formatting and validation, and returns clean JSON to the frontend. This architecture prevents direct exposure of API keys, eliminates CORS issues, and enables caching mechanisms to improve performance."),
      emptyLine(),
      body("To maintain system reliability under poor network conditions, fallback systems are implemented. If the Yahoo Finance API becomes slow, rate-limited, or temporarily unavailable, the backend returns cached data or a graceful error message, ensuring the frontend can notify the user appropriately."),
      emptyLine(),

      sectionHeading("4.6", "Database Implementation with MongoDB Atlas"),
      body("MongoDB Atlas is used as the cloud-hosted NoSQL database for the FinSights platform. The system is organized into several collections including Users, Watchlists, Portfolios, Transactions, and Cached Stock Data. Indexes are applied on frequently queried fields such as userId and symbol, ensuring faster lookups. The database stores hashed passwords, JWT identifiers, user profile information, virtual portfolio records, transaction histories, and watchlist entries. Since MongoDB Atlas is cloud-based, all user information persists reliably between sessions."),
      emptyLine(),

      sectionHeading("4.7", "Error Handling and Logging"),
      body("A robust global error-handling middleware is implemented in the backend to capture all unexpected errors, exceptions, and invalid operations in a consistent manner. Instead of exposing raw system errors to the frontend, this middleware intercepts failures and returns standardized JSON responses. The backend maintains detailed server-side logs that track important events such as request timestamps, external API failures, authentication anomalies, and portfolio transaction errors. By combining centralized error handling with comprehensive logging, the backend becomes easier to maintain, more secure, and more transparent."),

      // ════════════════════════════════════════════
      // CHAPTER 5: TESTING AND RESULTS
      // ════════════════════════════════════════════
      pgBreak(),
      chapterHeading("Chapter 5: Testing and Results"),
      emptyLine(),

      sectionHeading("5.1", "Testing Overview"),
      body("Testing is a critical part of the software development process. For the FinSights platform, a structured and comprehensive testing approach was followed. The application was thoroughly evaluated using a combination of functional testing, integration testing, and behavioral validation to ensure that every module works as expected under various conditions. Test cases were designed to cover all major functionalities including authentication, profile management, watchlist operations, stock data retrieval, trading workflows, portfolio valuation, failure handling, caching, concurrency, and user interface responsiveness."),
      emptyLine(),
      body("The authentication module was tested first, since secure login and signup are essential for protecting user data. The authorization and protected routes were verified to ensure that unauthorized access is fully blocked. Profile management, watchlist CRUD operations, real-time and historical stock data fetching, virtual trading buy/sell logic, portfolio valuation accuracy, API reliability and caching behavior, concurrency handling, and frontend UI responsiveness were all validated through the 20 test cases described below."),
      emptyLine(),

      sectionHeading("5.2", "Test Case Table"),
      emptyLine(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SPACING_SINGLE,
        children: [new TextRun({ text: "Table 5.1 Test Cases - Authentication, Data Retrieval, and Profile Modules", font: TNR, size: CAPTION_SIZE, bold: true })]
      }),
      emptyLine(),
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [700, 2500, 2700, 2775],
        rows: [
          new TableRow({ children: [
            headerCell("TC ID", 700), headerCell("Test Scenario", 2500),
            headerCell("Expected Result", 2700), headerCell("Status", 775)
          ]}),
          ...tcRow("TC-01", "User signup with new email", "201 Created; password hashed with bcrypt", "Pass"),
          ...tcRow("TC-02", "Valid login credentials", "JWT token generated with correct structure", "Pass"),
          ...tcRow("TC-03", "Login with wrong password", "401 Unauthorized; no token or user data leaked", "Pass"),
          ...tcRow("TC-04", "Access protected route without token", "401 Unauthorized; access blocked", "Pass"),
          ...tcRow("TC-05", "Access protected route with expired token", "401 Unauthorized; expired token message", "Pass"),
          ...tcRow("TC-06", "Update user profile (name, avatar, bio)", "200 OK; MongoDB updated; owner-only access", "Pass"),
          ...tcRow("TC-07", "Add stock (AAPL) to watchlist", "Stock added; user document updated in DB", "Pass"),
          ...tcRow("TC-08", "Remove stock (AAPL) from watchlist", "Stock removed; confirmation response returned", "Pass"),
          ...tcRow("TC-09", "Fetch real-time stock data for a symbol", "Current price, % change, volume returned", "Pass"),
          ...tcRow("TC-10", "Fetch 1-month OHLC historical data", "Array of OHLC objects; charts render correctly", "Pass"),
        ]
      }),
      emptyLine(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: SPACING_SINGLE,
        children: [new TextRun({ text: "Table 5.2 Test Cases - Trading, Portfolio, and System Modules", font: TNR, size: CAPTION_SIZE, bold: true })]
      }),
      emptyLine(),
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [700, 2500, 2700, 775],
        rows: [
          new TableRow({ children: [
            headerCell("TC ID", 700), headerCell("Test Scenario", 2500),
            headerCell("Expected Result", 2700), headerCell("Status", 775)
          ]}),
          ...tcRow("TC-11", "Buy stock with sufficient balance", "Holdings updated; balance deducted; transaction recorded", "Pass"),
          ...tcRow("TC-12", "Buy stock with insufficient funds", "400 Bad Request; no DB changes", "Pass"),
          ...tcRow("TC-13", "Sell stock with sufficient quantity", "Holdings updated; profit/loss computed; balance credited", "Pass"),
          ...tcRow("TC-14", "Sell more shares than held", "400 Bad Request; data integrity maintained", "Pass"),
          ...tcRow("TC-15", "Portfolio valuation accuracy", "Value = sum(qty x price) + balance; rounding within 0.01", "Pass"),
          ...tcRow("TC-16", "External API (Yahoo Finance) failure", "503 or cached data returned; UI shows friendly message", "Pass"),
          ...tcRow("TC-17", "Repeated request within cache TTL", "Cached response returned; no new external API call", "Pass"),
          ...tcRow("TC-18", "Two simultaneous buy requests", "Only one succeeds; balance not negative; no double-spend", "Pass"),
          ...tcRow("TC-19", "UI responsiveness across screen sizes", "Layout adapts correctly on mobile, tablet, and desktop", "Pass"),
          ...tcRow("TC-20", "Logout and token invalidation", "Protected endpoints reject access after logout", "Pass"),
        ]
      }),
      emptyLine(),

      sectionHeading("5.3", "Output Screens"),
      body("The following figures illustrate the key screens of the FinSights application. Each screen demonstrates a major feature of the platform and its responsive design across devices."),
      emptyLine(),
      new Paragraph({
        spacing: SPACING_SINGLE,
        children: [new TextRun({ text: "Fig. 5.1 Home Page - Dashboard View", font: TNR, size: CAPTION_SIZE, bold: true })]
      }),
      body("[Screenshot: Home Page displaying live market summary, trending stocks, and navigation menu]"),
      emptyLine(),
      new Paragraph({
        spacing: SPACING_SINGLE,
        children: [new TextRun({ text: "Fig. 5.2 Markets Page - Live Stock Data", font: TNR, size: CAPTION_SIZE, bold: true })]
      }),
      body("[Screenshot: Markets Page showing real-time stock table with prices, percentage changes, and volume]"),
      emptyLine(),
      new Paragraph({
        spacing: SPACING_SINGLE,
        children: [new TextRun({ text: "Fig. 5.3 Watchlist Page", font: TNR, size: CAPTION_SIZE, bold: true })]
      }),
      body("[Screenshot: Watchlist Page displaying user-selected stocks with add/remove functionality]"),
      emptyLine(),
      new Paragraph({
        spacing: SPACING_SINGLE,
        children: [new TextRun({ text: "Fig. 5.4 Portfolio Page", font: TNR, size: CAPTION_SIZE, bold: true })]
      }),
      body("[Screenshot: Portfolio Page showing virtual holdings, profit/loss, and buy/sell trading interface]"),
      emptyLine(),
      new Paragraph({
        spacing: SPACING_SINGLE,
        children: [new TextRun({ text: "Fig. 5.5 User Profile Page", font: TNR, size: CAPTION_SIZE, bold: true })]
      }),
      body("[Screenshot: Profile Page showing editable name, avatar, and account details]"),

      // ════════════════════════════════════════════
      // CHAPTER 6: CONCLUSION AND FUTURE SCOPE
      // ════════════════════════════════════════════
      pgBreak(),
      chapterHeading("Chapter 6: Conclusion and Future Scope"),
      emptyLine(),

      sectionHeading("6.1", "Conclusion"),
      body("The FinSights platform stands as a comprehensive demonstration of how modern full-stack technologies can be integrated to build a highly interactive, secure, and educational stock market simulation system. By combining real-time market data, historical charting, virtual trading, personalized watchlists, and smooth UI/UX design, the project successfully bridges the gap between theoretical financial concepts and practical market exposure. It enables users — especially students, beginners, and aspiring investors — to understand market fluctuations, analyze stock behavior, and practice investment strategies in a completely risk-free environment."),
      emptyLine(),
      body("From a technical standpoint, FinSights showcases a strong implementation of contemporary development practices, including modular REST APIs, JWT-based authentication, cloud-hosted NoSQL database management, secure backend architecture, and optimized frontend rendering through Next.js. The integration of Yahoo Finance API and Chart.js highlights the project's ability to handle dynamic data visualization and real-time financial analytics."),
      emptyLine(),
      body("Furthermore, the system's robust handling of user data, error management, caching, and portfolio computations reflects a carefully engineered backend with focus on stability, security, and scalability. Beyond its functional achievements, FinSights demonstrates the practical value of technology in democratizing financial learning. With further enhancements, the platform has strong potential to evolve into a professional-grade financial learning tool."),
      emptyLine(),

      sectionHeading("6.2", "Future Scope"),
      body("FinSights has been developed as a feature-rich and educational stock market learning platform, but there remains tremendous scope for improvement. Several enhancements can evolve the system into a more advanced, industry-grade financial application."),
      emptyLine(),
      subHeading("6.2.1", "Integration of Real Broker APIs"),
      body("A major future enhancement is the integration of real broker APIs, which would enable users to execute actual stock market trades directly from the platform. By connecting to brokerage services such as Zerodha Kite Connect, Upstox API, or Alpaca Markets, FinSights could expand beyond virtual trading to support real-world order placement, live trade execution, and full-fledged portfolio management."),
      emptyLine(),
      subHeading("6.2.2", "AI-Powered Stock Forecasting"),
      body("Artificial Intelligence can significantly enhance the analytical capabilities of FinSights. Machine learning models such as LSTM networks, ARIMA, Prophet models, sentiment analysis, and reinforcement learning algorithms can be used to predict stock price movements, analyze volatility, and assess market sentiment. Implementing AI-driven forecasting would offer users powerful insights and data-driven predictions to aid smarter decision-making."),
      emptyLine(),
      subHeading("6.2.3", "Real-Time Data Streaming Using WebSockets"),
      body("Currently, stock charts and tables rely on periodic API polling. Introducing WebSocket-based live streaming would enable ultra-fast, real-time updates to stock prices, charts, order books, and portfolio values. This would provide users with a professional trading terminal experience, featuring instant data refresh and smooth, uninterrupted market tracking."),
      emptyLine(),
      subHeading("6.2.4", "Advanced Analytics Dashboards"),
      body("To strengthen analytical capabilities, FinSights can be expanded with advanced dashboards including sector-wise performance metrics, risk and volatility analysis, portfolio diversification analytics, profit/loss curves and return projections, and heatmaps with comparative indexes. These dashboards would significantly enhance the user's ability to analyze the market deeply."),
      emptyLine(),
      subHeading("6.2.5", "Social Trading Features"),
      body("Social trading can transform FinSights into a community-driven learning platform. Features like leaderboards, community discussions, shared watchlists, strategy sharing, and peer-to-peer portfolio comparison would enable users to learn from one another, follow top-performing traders, and understand different investment strategies."),

      // ════════════════════════════════════════════
      // REFERENCES
      // ════════════════════════════════════════════
      pgBreak(),
      chapterHeading("REFERENCES"),
      emptyLine(),
      body("[1] Next.js Official Documentation. Available: https://nextjs.org/docs"),
      emptyLine(),
      body("[2] React.js Official Documentation. Available: https://react.dev/"),
      emptyLine(),
      body("[3] Chart.js Official Documentation. Available: https://www.chartjs.org/docs"),
      emptyLine(),
      body("[4] MongoDB Atlas Documentation. Available: https://www.mongodb.com/docs/atlas"),
      emptyLine(),
      body("[5] Node.js + Express.js Official Documentation. Available: https://expressjs.com/"),
      emptyLine(),
      body("[6] TailwindCSS Official Documentation. Available: https://tailwindcss.com/docs"),
      emptyLine(),
      body("[7] JWT (JSON Web Token) Documentation. Available: https://jwt.io/introduction"),
      emptyLine(),
      body("[8] Bcrypt Password Hashing Documentation. Available: https://www.npmjs.com/package/bcrypt"),
      emptyLine(),
      body("[9] Axios HTTP Client Documentation. Available: https://axios-http.com/"),
      emptyLine(),
      body("[10] REST API Design Guidelines (Microsoft). Available: https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design"),
      emptyLine(),
      body("[11] WebSockets MDN Documentation. Available: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API"),
      emptyLine(),
      body("[12] Market Data Concepts - Investopedia. Available: https://www.investopedia.com/"),
      emptyLine(),
      body("[13] Financial Charting Concepts - TradingView Documentation."),
      emptyLine(),
      body("[14] Yahoo Finance API Reference Documentation."),
    ]
  };
}

// Helper: Test case row
function tcRow(id, scenario, expected, status) {
  return [new TableRow({ children: [
    dataCell(id, 700), dataCell(scenario, 2500), dataCell(expected, 2700), dataCell(status, 775, AlignmentType.CENTER)
  ]})];
}

// ── Build Document ─────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  sections: [
    makeCoverSection(),
    makePreliminarySection(),
    makeChaptersSection(),
  ]
});



console.log("Starting DOCX generation...");

Packer.toBuffer(doc)
  .then(buffer => {
    console.log("Buffer created");

    fs.writeFileSync("Final_Training_Report_SG22316.docx", buffer);

    console.log("Done: Final_Training_Report_SG22316.docx");
  })
  .catch(err => {
    console.error("Error:", err);
    process.exit(1);
  });
