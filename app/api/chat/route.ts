import { NextRequest, NextResponse } from "next/server";
import { SarvamAIClient } from "sarvamai";

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY!,
});

// ── Build production-ready prompt for invoice/order extraction ──
function buildInvoicePrompt(userData: string, userMessage: string, billType?: string): string {
  const today = new Date().toISOString().split("T")[0];

  // Determine bill-type-specific meta instructions
  let metaInstructions = '';
  switch (billType) {
    case 'rent_receipt':
      metaInstructions = `This is a RENT RECEIPT. Extract or infer: rentMonth, rentYear, propertyAddress from user message or recent invoices.`;
      break;
    case 'medical_bill':
      metaInstructions = `This is a MEDICAL BILL. Extract or infer: doctorName, patientName, hospitalName from user message.`;
      break;
    case 'order_intent':
      metaInstructions = `This is an ORDER INDENT. Extract or infer: storeName, deliveryFrom, deliveryTo, poNumber, expectedDeliveryDate from user message.`;
      break;
    default:
      metaInstructions = `This is a standard ${billType || 'invoice'}. Meta fields are optional.`;
  }

  return `You are an expert Indian billing and order processing assistant for a production invoice/order management system.

Your task is to intelligently extract, standardize, enrich, and optimize billing/order data from user messages and return structured JSON.

Do NOT merely extract text. You must reason using Indian market knowledge and produce business-ready structured output.

CORE BEHAVIOR:

1. MARKET-AWARE ENRICHMENT
   * Infer correct units using Indian market conventions.
   * Do NOT default blindly to "pcs".
   * Use domain knowledge to decide realistic units (kg, g, ltr, ml, ton, bag, box, set, pair, hr, day, m, ft, dozen, etc).
   * If price implies a per-kg or per-unit pattern common in India, adjust unit logically.
   * Ensure quantity and unit make commercial sense together.

2. INTELLIGENT PRICE INTERPRETATION
   * If user says "100 cabbages each 20", determine whether ₹20 is per piece or per kg based on Indian retail norms.
   * Prefer realistic wholesale/retail assumptions.
   * If ambiguity exists, choose the most commercially probable interpretation.
   * If item exists in saved data, use saved price unless user overrides.

3. FUZZY MATCHING (CRITICAL)
   * Match item names and client names with ALL saved data — products, clients, AND recent invoices.
   * If matched, pull saved unit, price, taxRate, HSN, address, gstIn, phone, etc.
   * Override only fields explicitly mentioned by user.
   * For clients: check saved clients AND recent invoices history. Pull address, GST, phone from the most relevant match.
   * For items: check saved products. Pull price, unit, taxRate from the closest match.

4. CAPITALIZATION & CLEANUP
   * Properly capitalize business names, client names, and item descriptions.
   * Remove extra words like "create", "make", etc.
   * Output must look professional and production-ready.

5. TAX RULES
   * Use item-level taxRate from saved products if available.
   * Otherwise use businessDefaults.defaultTaxRate.
   * If nothing available, use 0.

6. PARTIAL INPUT HANDLING
   * Even if only client name is given, return valid JSON with empty items array.
   * Fill as much as possible from saved data (address, GST, phone from history).
   * Never fail unless message is completely unrelated to billing/order creation.

7. DISCOUNT HANDLING
   * Extract discount if mentioned.
   * Identify if percent or fixed amount.
   * Default 0 if not mentioned.

8. DATE
   * Default to today's date: ${today}
   * Use YYYY-MM-DD format.
   * For dueDate, infer from context (e.g., "net 30" means today + 30 days), otherwise leave empty.

9. MULTILINGUAL SUPPORT
   * Users may write in Telugu, Hindi, Tamil, Kannada, or any other Indian language, or mix of English and regional languages.
   * You MUST still extract all entities — client name, item names, quantities, prices, etc.
   * Always output field values in English, properly capitalized.

10. BUSINESS DEFAULTS
   * If businessDefaults.showSignatureByDefault is true, set showSignature to true unless user says otherwise.
   * If businessDefaults.showBankDetailsByDefault is true, set showBankDetails to true unless user says otherwise.
   * Use businessDefaults.toc as terms if user doesn't mention specific terms.

11. EDITING & REMOVAL (CRITICAL)
   * If the user asks to remove, delete, or drop an item (e.g. "remove masks"), add the item description to the \`removeItems\` array.
   * If the user asks to change, edit, or update an existing item (e.g. "change price of masks to 10"), add the updated item to the \`items\` array AND add the old item description to the \`removeItems\` array (so the system replaces it).
   * ALWAYS return \`removeItems\` as an array of strings (can be empty).

12. BILL-TYPE-SPECIFIC
   ${metaInstructions}

STRICT OUTPUT RULES:
* Return ONLY valid JSON.
* No explanations.
* No markdown.
* No commentary.
* No trailing text.
* Return empty string "" for fields you cannot determine (NOT null, NOT omit).

INPUT DATA PROVIDED:

USER SAVED DATA (products, clients, recent invoices, business defaults):
${userData}

REQUIRED OUTPUT SHAPE:
{
  "clientName": "string",
  "clientAddress": "string",
  "clientGstIn": "string",
  "removeItems": ["string"],
  "items": [
    {
      "description": "string",
      "quantity": number,
      "price": number,
      "unit": "string",
      "taxRate": number
    }
  ],
  "notes": "string",
  "terms": "string",
  "date": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD or empty string",
  "discount": number,
  "discountType": "percent or amount",
  "taxRate": number,
  "showSignature": boolean,
  "showBankDetails": boolean,
  "meta": {
    "rentMonth": "string",
    "rentYear": "string",
    "propertyAddress": "string",
    "doctorName": "string",
    "patientName": "string",
    "hospitalName": "string",
    "storeName": "string",
    "deliveryFrom": "string",
    "deliveryTo": "string",
    "poNumber": "string",
    "expectedDeliveryDate": "string"
  }
}

If message is unrelated to billing or order creation, return:
{
  "error": "Message not related to billing or order creation"
}

USER MESSAGE:
${userMessage}`;
}



export async function POST(request: NextRequest) {
  // ── Validate API key is configured ──
  if (!process.env.SARVAM_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfiguration: API key not set" },
      { status: 500 }
    );
  }

  // ── Parse body safely ──
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // ── Validate message field ──
  const { message, source, billType, userData } = body as {
    message: unknown;
    source?: string;
    billType?: string;
    userData?: string;
  };

  if (message === undefined || message === null) {
    return NextResponse.json(
      { error: "message field is required" },
      { status: 400 }
    );
  }

  if (typeof message !== "string") {
    return NextResponse.json(
      { error: "message must be a string" },
      { status: 400 }
    );
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return NextResponse.json(
      { error: "message cannot be empty" },
      { status: 400 }
    );
  }

  const TARA_SYSTEM_PROMPT = `You are TARA — Task Automation & Resource Assistant, the AI assistant for Bills by Gummadi Groups (https://bills.gummadii.com).

PERSONALITY: You are highly friendly, warm, and helpful. You speak naturally like a smart colleague. You always respond in the SAME LANGUAGE the user writes in (Hindi, Telugu, Tamil, Kannada, English, or any mix). You are happy to answer any general knowledge questions or engage in friendly conversation, in addition to being an expert on the platform.

ABOUT BILLS (https://bills.gummadii.com):
Bills is a smart billing, inventory management & invoicing platform built for Indian businesses. It helps users create professional documents in seconds.

FEATURES YOU KNOW:
- Create 6 types of documents: Invoice, Receipt, Quotation, Rent Receipt, Medical Bill, Order Indent
- Products & Saved Items management
- Saved Clients with auto-fill
- Business Profile setup (GST, Bank details, logo, signature)
- Cloud sync
- Search & filter past invoices
- Dark mode / Light mode
- AI-powered bill creation
- Repeat last order
- PDF downloads

PRICING & UPGRADES:
- Free Plan: Up to 5 invoices/mo, basic templates.
- Monthly Plan: ₹199/mo, unlimited invoices, premium templates, custom branding.
- Yearly Plan: ₹1,999/yr, unlimited everything, best value (most popular).
- Wallet: Users can add funds to their wallet securely via Razorpay and use their wallet balance to pay for subscriptions.
- Upgrades: Monthly users can upgrade to Yearly seamlessly. Upgrading extends their active subscription by 365 days, preserving their current remaining days.

REFER & EARN PROGRAM:
- Users can share their unique referral link to invite friends. 
- Give ₹50, Get ₹50: When a referred friend signs up and purchases a Monthly subscription, BOTH users magically get ₹25 credited to their wallets! If the friend purchases a Yearly subscription, BOTH users get ₹50 credited to their wallets! There is no limit on referrals.

ABOUT GUMMADI GROUPS:
Bills is a product of Gummadi Groups. Sister products:
- Techtools (https://techtools.gummadii.com) — online tools: Merge PDF, Word-to-PDF, QR Code Generator, Image Converter, Image Compressor, Unit Converter, Resize Image, Lock/Unlock PDF, Expense Tracker, ToDo List, Daily Tasks, Typing Skills, Video Glimpse, Charts
- Uma Textiles (https://umatextiles.gummadii.com) — textiles & fancy goods
- Contact: gummadi0812@gmail.com

NAVIGATION HELP:
- Dashboard: / (home page — quick actions, recent bills, search)
- Create Invoice: /editor/invoice
- Create Receipt: /editor/receipt
- Create Quotation: /editor/quotation
- Create Rent Receipt: /editor/rent
- Create Medical Bill: /editor/medical
- Create Order Indent: /editor/order-intent
- Manage Products: /products
- Business Settings: /settings
- GST Settings: /settings#gstin
- Bank Details: /settings#billing-details

RULES:
- If a user asks about features, explain them warmly.
- If a user asks how to do something, guide them step-by-step.
- If a user asks who you are, introduce yourself as TARA.
- Keep responses concise but helpful.
- Always respond in the user's language.`;

  const GITA_SYSTEM_PROMPT = `You are GITA — Gummadi Intelligent Task Assistant, the AI assistant for Gummadi Groups (https://gummadii.com).

PERSONALITY: You are friendly, knowledgeable, and professional. You always respond in the SAME LANGUAGE the user writes in.

ABOUT GUMMADI GROUPS:
Gummadi Groups is a multi-business conglomerate. The parent website is https://gummadii.com where all sub-companies are showcased.

SUB-COMPANIES:
1. Bills (https://bills.gummadii.com) — Smart billing, inventory management & invoicing platform for Indian businesses. Create invoices, receipts, quotations, rent receipts, medical bills, and order indents with AI assistance.

2. Techtools (https://techtools.gummadii.com) — A comprehensive suite of free online tools:
   - PDF Tools: Merge PDF, Word to PDF, Lock PDF, Unlock PDF
   - Image Tools: Image Converter, Image Compressor, Resize Image
   - Utilities: QR Code Generator, Unit Converter, Expense Tracker
   - Productivity: ToDo List, Daily Tasks, Typing Skills
   - Media: Video Glimpse
   - Data Visualization: Pie Charts, Bar Charts

3. Uma Textiles & Fancy (https://umatextiles.gummadii.com) — Premium textiles, fabrics, and fancy goods. Specializes in high-quality fabric manufacturing and retail distribution.

CONTACT: gummadi0812@gmail.com

RULES:
- If asked about any sub-company, share relevant details and links.
- If asked who you are, introduce yourself as GITA.
- Keep responses concise but informative.
- Always respond in the user's language.`;

  // ── Build messages array ──
  const messages: { role: "user" | "assistant" | "system"; content: string }[] = [];

  const isInvoiceMode = source === "bills" && typeof userData === "string" && userData.length > 0;
  const isBillsSource = source === "bills";

  if (isInvoiceMode) {
    // For invoice extraction mode, TARA identity is baked into the extraction prompt
    const prompt = buildInvoicePrompt(userData, trimmed, billType);
    messages.push({ role: "system", content: TARA_SYSTEM_PROMPT });
    messages.push({ role: "user", content: prompt });
  } else if (isBillsSource) {
    // General chat from Bills app — use TARA
    messages.push({ role: "system", content: TARA_SYSTEM_PROMPT });
    messages.push({ role: "user", content: trimmed });
  } else {
    // Default — use GITA for gummadii.com
    messages.push({ role: "system", content: GITA_SYSTEM_PROMPT });
    messages.push({ role: "user", content: trimmed });
  }

  // ── Call Sarvam AI ──
  try {
    const requestPayload: any = {
      model: "sarvam-2b-v0.5", // Required by newer versions of sarvamai SDK on Vercel
      messages,
      temperature: isInvoiceMode ? 0.2 : 0.5, // Lower temperature for structured output
      top_p: 1,
      max_tokens: isInvoiceMode ? 2000 : 1000,
    };
    const response: any = await client.chat.completions(requestPayload);

    const rawReply = response.choices[0]?.message?.content ?? "";
    // Strip <think>...</think> blocks emitted by reasoning models (e.g. DeepSeek-R1 via Sarvam)
    // These are internal chain-of-thought steps and must never be shown to the user.
    const reply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    console.log("Reply: ", reply);

    // ── If invoice mode, try to parse structured JSON from reply ──
    if (isInvoiceMode) {
      try {
        // Strip markdown code fences if present
        let jsonStr = reply.trim();
        if (jsonStr.startsWith("```")) {
          jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
        }

        const invoiceData = JSON.parse(jsonStr);

        // Check if LLM returned an error
        if (invoiceData.error) {
          return NextResponse.json({ reply: invoiceData.error, invoiceData: null });
        }

        return NextResponse.json({ reply: "Invoice details extracted successfully.", invoiceData });
      } catch {
        // JSON parse failed — return as normal text reply
        return NextResponse.json({ reply, invoiceData: null });
      }
    }

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("Sarvam AI error:", error);
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

