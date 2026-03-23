# ProfitPilot — Complete Design Specification
**App Name:** ProfitPilot
**Type:** SaaS Dashboard — Shopify Profit Tracking
**Tagline:** "Real-time profit tracking across all your stores"
**Target User:** Shopify store owners managing 1-5 stores, tracking profitability across orders, shipping, ads, tax, and custom costs.

---

## Design System

### Brand Identity
- **Logo:** Bar chart icon (BarChart3) inside a rounded square, primary color background with white icon
- **Font:** Geist Sans (or Inter as fallback)
- **Style:** Clean, minimal, data-dense SaaS dashboard. Think Linear, Vercel, or Stripe Dashboard aesthetic.

### Color Tokens
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| Primary | #171717 (zinc-900) | #FAFAFA (zinc-50) | Buttons, active nav, logo bg |
| Background | #FFFFFF | #09090B | Page background |
| Card | #FFFFFF | #171717 | Card surfaces |
| Muted | #F4F4F5 (zinc-100) | #27272A (zinc-800) | Secondary backgrounds, tags |
| Muted Foreground | #71717A (zinc-500) | #A1A1AA (zinc-400) | Secondary text, descriptions |
| Border | #E4E4E7 (zinc-200) | #27272A (zinc-800) | Card borders, dividers |
| Destructive | #EF4444 (red-500) | #EF4444 | Errors, negative values, alerts |
| Success | #16A34A (green-600) | #22C55E (green-500) | Positive profit, active states |
| Warning | #EAB308 (yellow-500) | #FACC15 (yellow-400) | Pending states, cautions |
| Chart Blue | #2563EB | | Revenue line |
| Chart Green | #16A34A | | Profit line |
| Chart Violet | #8B5CF6 | | COGS/expenses |
| Chart Orange | #F97316 | | Ad spend |
| Chart Pink | #EC4899 | | Shipping |

### Typography Scale
| Style | Weight | Size | Usage |
|-------|--------|------|-------|
| Page Title | Bold 700 | 30px | Page headings |
| Page Description | Regular 400 | 14px | Subtitle under titles |
| Card Title | Medium 500 | 14px | Card headers |
| Metric Value | Bold 700 | 24px | Large numbers in cards |
| Metric Label | Regular 400 | 12px | Labels above/below metrics |
| Table Header | Medium 500 | 13px | Column headers |
| Table Cell | Regular 400 | 14px | Table data |
| Nav Item | Medium 500 | 14px | Sidebar links |
| Button | Medium 500 | 14px | Button text |

### Spacing
- Page padding: 24px
- Card padding: 16px
- Card gap: 16px
- Section gap: 24px
- Grid: 4-column desktop (1280px+), 2-column tablet (768-1279px), 1-column mobile (<768px)

### Components
- Cards: 1px border, 8px radius, subtle shadow on hover
- Buttons: 8px radius, 32px height default, 28px small
- Inputs: 8px radius, 32px height, 1px border
- Tables: Row hover highlight, sticky header
- Badges: 4px radius, 6px horizontal padding
- Sidebar: Fixed 256px width, full viewport height

---

## Global Layout

### Desktop Structure
```
+------------------+------------------------------------------------+
|                  |  HEADER (64px height)                          |
|   SIDEBAR        |  [Store Selector]          [Theme] [Bell] [Av] |
|   (256px fixed)  +------------------------------------------------+
|                  |                                                 |
|   Logo + Name    |  MAIN CONTENT AREA                             |
|   Nav Items      |  (scrollable, bg: muted/40)                    |
|                  |  padding: 24px                                 |
|                  |                                                 |
+------------------+------------------------------------------------+
```

### Sidebar Navigation (Fixed Left, 256px)
**Header (64px):** Logo (32x32 rounded square) + "ProfitPilot" text

**Navigation Items (each 40px tall, 8px radius, icon + label):**
| Icon | Label | Route |
|------|-------|-------|
| BarChart3 | Overview | / |
| Store | Stores | /stores |
| ShoppingCart | Orders | /orders |
| Package | Products | /products |
| Users | Customers | /customers |
| FileText | P&L Report | /pnl |
| Megaphone | Ad Spend | /ads |
| Truck | Shipping Agent | /shipping |
| Receipt | Tax Portal | /tax |
| AlertTriangle | Cost Alerts | /alerts |
| Settings | Settings | /settings |

- **Active:** Primary/10 background, primary text
- **Hover:** Muted background
- **Default:** Muted-foreground text

### Header Bar (64px)
- **Left:** Store Selector dropdown (220px, shows "All Stores" + chevron, dropdown lists connected stores)
- **Right:** Theme toggle (sun/moon), Notification bell (with optional red dot), User avatar dropdown (name, email, Settings link, Sign out)

### Responsive Behavior
| Breakpoint | Sidebar | Grid | Tables |
|-----------|---------|------|--------|
| Desktop 1280px+ | Full 256px | 4-column | Full columns |
| Tablet 768-1279px | Collapsed to 64px icons | 2-column | Full columns |
| Mobile <768px | Hamburger menu sheet | 1-column | Horizontal scroll |

---

## Page 1: Login (`/login`)

Centered card on muted background, max-width 400px.

```
+------------------------------------------+
|            [Logo Icon 48x48]             |
|          "Welcome back"  (24px bold)     |
|    "Sign in to your profit dashboard"    |
|                                          |
|   [Error banner - red bg, if shown]     |
|                                          |
|   Email                                  |
|   [________________________]             |
|                                          |
|   Password                               |
|   [________________________]             |
|                                          |
|   [====== Sign in ======]  (full width) |
|                                          |
|   Don't have an account? Sign up         |
+------------------------------------------+
```

**States:** Loading (button disabled, "Signing in..."), Error (red banner with message)

---

## Page 2: Register (`/register`)

Same centered card layout as login.

- Title: "Create your account"
- Subtitle: "Start tracking your profit across all stores"
- Fields: Name (optional), Email (required), Password (required, min 8 chars)
- Button: "Create account"
- Link: "Already have an account? Sign in"

---

## Page 3: Landing Page (`/landing`)

Full marketing page with these sections in order:

1. **Navbar:** Logo + "Sign in" + "Get Started" buttons
2. **Hero:** Badge "Trusted by 1,200+ Shopify merchants", H1 "Know Your Real Profit, Not Just Revenue", subtitle, CTA buttons ("Start Free Trial" + "Watch Demo"), "No credit card required" note, dashboard preview mockup showing 4 metric cards
3. **Stats Bar:** $2.4M+ Profit Tracked | 1,200+ Active Users | 99.9% Uptime | <5min Setup Time
4. **Demo Video:** Embedded video player with play button overlay, 3 benefit cards below
5. **Features Grid (3x2):** Real-Time Profit Tracking, Multi-Store Dashboard, Advanced Analytics, AI-Powered Reconciliation, Tax Compliance, Cost Alerts — each with icon, title, description
6. **How It Works:** 3 numbered steps — Connect Your Store, Automatic Sync, Track Real Profit
7. **Testimonials:** 3 cards with avatar, quote, name, role
8. **Pricing:** 3 tiers — Starter $29/mo, Pro $79/mo (Popular badge), Enterprise $199/mo — each with feature list and CTA
9. **Final CTA:** "Ready to maximize your profit?" with button
10. **Footer:** Logo, description, 3 link columns (Product, Company, Legal), copyright

---

## Page 4: Overview Dashboard (`/`)

The main dashboard. Data-dense, shows the big picture at a glance.

### Page Header
- Title: "Dashboard"
- Description: "Real-time profit tracking"
- Right: "Last sync: 5min ago" + [Sync Now] button

### Metric Cards — Row 1 (4-column grid)
Each card: icon in top-right corner, muted title, large bold dollar value, small description below.

| Card | Icon | Title | Value | Description |
|------|------|-------|-------|-------------|
| 1 | DollarSign | Total Revenue | $XX,XXX.XX | "+X% from X orders" |
| 2 | Package | Total COGS | $XX,XXX.XX | "cost of goods sold" |
| 3 | Truck | Shipping Costs | $XX,XXX.XX | "charged: $X | actual: $X" |
| 4 | CreditCard | Transaction Fees | $XX,XXX.XX | "payment processing" |

### Metric Cards — Row 2 (4-column grid)
| Card | Icon | Title | Value | Description |
|------|------|-------|-------|-------------|
| 5 | Megaphone | Ad Spend | $XX,XXX.XX | "across X platforms" |
| 6 | ShoppingCart | Custom Costs | $XX,XXX.XX | "X active rules" |
| 7 | TrendingUp | Net Profit | $XX,XXX.XX | "margin: XX.X%" — **green left border accent** |
| 8 | AlertTriangle | Cost Alerts | X | "X discrepancies found" |

### Charts Row (7-column grid)
**Left (4/7): Revenue & Profit Trend**
- Dual area chart with gradient fills
- Series: Revenue (blue) + Net Profit (green)
- Toggle tabs top-right: Daily | Weekly | Monthly
- Tooltip on hover with date, revenue, profit
- Empty state: "No data yet — sync your Shopify stores to see trends"

**Right (3/7): Revenue by Store**
- Donut chart (inner radius 60, outer 100)
- Color cycle through chart palette
- Store names with revenue amounts
- Empty state: "No stores connected yet"

### Bottom Row (2-column grid)
**Left: Recent Orders**
- Card title "Recent Orders" + "View all orders" link
- 5 most recent orders: order #, date, customer name, revenue, net profit (green/red), status badge
- Empty state: "Connect a Shopify store to see orders"

**Right: Shipping Cost Variance**
- Bar chart comparing charged vs actual shipping per month
- Badge: "Charged vs. Actual"
- Empty state: "No shipping data yet"

---

## Page 5: Stores (`/stores`)

### Header
- Title: "Stores"
- Description: "Connect and manage your Shopify stores"
- Action: [+ Connect Store] button

### Connect Store Dialog (Modal)
```
+------------------------------------------+
| Connect a Shopify Store              [X] |
| Enter your Shopify store domain          |
|                                          |
| Store Domain                             |
| [mystore___________] .myshopify.com      |
|                                          |
|                          [Connect]        |
+------------------------------------------+
```

### Empty State (no stores)
- Large faded Store icon (48px)
- "No stores connected"
- "Connect your first Shopify store to start tracking profits."
- [+ Connect Your First Store] button

### Store Cards (3-column grid)
Each connected store as a card:
```
+------------------------------------------+
| Store Name              [Active] badge   |
| mystore.myshopify.com                    |
|                                          |
| 1,234 orders synced    Last sync: 2h ago |
|                                          |
| [Sync] [External Link] [Delete]          |
+------------------------------------------+
```
- Active badge: Green with Wifi icon
- Disconnected badge: Red with WifiOff icon
- Sync button: Shows spinner while syncing
- External link: Opens Shopify admin
- Delete: Red text, trash icon

---

## Page 6: Orders (`/orders`)

### Header
- Title: "Orders"
- Description: "All orders across your connected stores"
- Action: [Export CSV] button

### Filter Bar (card)
```
| [Search icon] Search by order #, customer... | [All stores v] | [Status v] |
```
- Search: Full-width input with icon
- Store filter: Dropdown of connected stores
- Status filter: All / Paid / Pending / Authorized / Partially Paid / Partially Refunded / Refunded / Voided

### Orders Table
| Column | Align | Format |
|--------|-------|--------|
| Order # | Left | "#1234" + optional red "Alert" badge |
| Date | Left | "Mar 11, 2026" |
| Customer | Left | Name + email below |
| Revenue | Right | "$123.45" |
| Tax | Right | "$12.34" |
| Shipping | Right | "$8.99" + "(actual: $12.50)" if different |
| COGS | Right | "$45.00" |
| Fees | Right | "$3.50" |
| Net Profit | Right | "$52.11" — bold, green if positive, red if negative |
| Status | Left | Badge (Paid=green, Pending=yellow, Refunded=red) |

- Pagination: "Showing 1-25 of 1,234" + Previous/Next buttons
- Empty state: "No orders found"

---

## Page 7: Product Analytics (`/products`)

### Header
- Title: "Product Analytics"
- Description: "Net profit breakdown by product"
- Action: [Export] button

### Summary Cards (3-column)
| Card | Content |
|------|---------|
| Total Products | Count |
| Most Profitable | Product name + profit (green, TrendingUp icon) |
| Least Profitable | Product name + profit/loss (red, TrendingDown icon) |

### Products Table (searchable)
| Column | Format |
|--------|--------|
| Product | Title + SKU below |
| Units Sold | "1,234" |
| Revenue | "$12,345.00" |
| COGS | "$5,678.00" |
| Net Profit | "$6,123.00" (green/red, bold) |
| Margin | "49.6%" |

Empty state: "No product data — Sync your stores to see product-level profitability."

---

## Page 8: Customer Lifetime Value (`/customers`)

### Header
- Title: "Customer Lifetime Value"
- Description: "Track customer profitability and repeat purchase behavior"
- Action: [Export] button

### Summary Cards (4-column)
| Card | Value |
|------|-------|
| Total Customers | "1,234" |
| Avg LTV | "$156.78" |
| Repeat Rate | "34.5%" |
| Avg Orders / Customer | "2.3" |

### Customer Table (searchable by name/email, sorted by LTV descending)
| Column | Format |
|--------|--------|
| Customer | Name + email |
| First Order | "Jan 15, 2026" |
| Last Order | "Mar 10, 2026" |
| Total Orders | "5" |
| Total Revenue | "$789.00" |
| Total COGS | "$345.00" |
| LTV (Net Profit) | "$312.00" (green/red, bold) |

Empty state: "No customer data — Customer LTV is calculated automatically from synced orders."

---

## Page 9: Profit & Loss Report (`/pnl`)

### Header
- Title: "Profit & Loss Report"
- Description: "Monthly breakdown of revenue, costs, and net profit"
- Actions: [Calendar "March 2026" dropdown] + [Export] button

### Layout: 2-column desktop

**Left Column — P&L Statement (card)**
```
Gross Revenue                          $XX,XXX.XX
Refunds & Returns                      -$X,XXX.XX  (red)
----------------------------------------------------
Net Revenue                            $XX,XXX.XX  (bold, large)

COST OF GOODS
COGS (Product Cost)                    -$XX,XXX.XX (red)
----------------------------------------------------
Gross Profit                           $XX,XXX.XX  (bold, large)

OPERATING EXPENSES
Shipping Costs                         -$X,XXX.XX  (red)
Transaction Fees                       -$X,XXX.XX  (red)
Ad Spend (Google)                      -$X,XXX.XX  (red)
Ad Spend (Meta)                        -$X,XXX.XX  (red)
Ad Spend (TikTok)                      -$X,XXX.XX  (red)
Ad Spend (Other)                       -$X,XXX.XX  (red)
Custom Costs                           -$XXX.XX    (red)
Sales Tax Collected                    -$X,XXX.XX  (red)
----------------------------------------------------
Net Profit                             $XX,XXX.XX  (bold, large, green)
Profit Margin                          XX.X%
```

**Right Column — Monthly Comparison (card)**
- Grouped bar chart: current month vs previous month
- Categories: Revenue, COGS, Shipping, Ads, Net Profit

---

## Page 10: Ad Spend (`/ads`)

### Header
- Title: "Ad Spend"
- Description: "Track ad spend across all platforms"
- Action: [Sync All] button

### Summary Cards (4-column)
| Card | Icon | Value |
|------|------|-------|
| Total Spend | DollarSign | "$XX,XXX.XX" |
| Total Clicks | MousePointerClick | "XX,XXX" |
| Total Impressions | Eye | "XXX,XXX" |
| Blended ROAS | TrendingUp | "X.XXx" |

### Platform Connections (3-column grid of tiles)
Each tile:
```
+------------------------------------------+
| [Logo 40x40]  Platform Name    [Connect] |
|                Not connected              |
+------------------------------------------+
```

6 Platforms with brand colors:
| Platform | Logo Color | Letter |
|----------|-----------|--------|
| Google Ads | #4285F4 (Blue) | G |
| Meta (Facebook) | #1877F2 (Blue) | f |
| TikTok Ads | #000000 (Black) | T |
| Microsoft (Bing) | #00BCF2 (Cyan) | B |
| Snapchat Ads | #FFFC00 (Yellow, black text) | S |
| Amazon Ads | #FF9900 (Orange) | A |

Connected state: Shows account name + "Manage" button instead of "Connect"

### Spend by Platform Chart
- Stacked bar chart, one bar per day/week
- Each platform in its brand color

### Campaign Drill-Down Table
| Column | Format |
|--------|--------|
| Platform | Logo badge + name |
| Campaign | Campaign name |
| Spend | "$X,XXX.XX" |
| Impressions | "XX,XXX" |
| Clicks | "X,XXX" |
| Conversions | "XXX" |
| ROAS | "X.XXx" |

---

## Page 11: Shipping Agent (`/shipping`)

### Header
- Title: "Shipping Agent"
- Description: "AI-powered shipping cost reconciliation from invoices and emails"
- Controls: Auto-scan toggle ("every 6h") + [Run Agent Now] button (Play icon)

### Status Cards (4-column)
| Card | Icon | Content |
|------|------|---------|
| Email Accounts | Mail | Count connected, or "Connect emails in Settings" link |
| Last Scan | Clock | "2 hours ago" or "Never" |
| Matched | CheckCircle (green) | "47 invoices matched" |
| Pending Review | AlertCircle (yellow) | "3 need approval" |

### 4 Tabs

**Tab 1: Review Queue**
Bulk actions bar: "3 selected" + [Approve All] + [Reject All]

| Column | Format |
|--------|--------|
| Checkbox | Select for bulk action |
| Invoice # | "INV-2026-0451" |
| Supplier | "FedEx" |
| Amount | "$45.67" |
| Matched Order | "#1234" (link) |
| Confidence | "92%" with colored progress bar (green >80%, yellow 50-80%, red <50%) |
| Actions | [Approve] [Reject] [Edit] |

**Tab 2: Processing History**
| Column | Format |
|--------|--------|
| Date | "Mar 11, 2026 2:30 PM" |
| Emails Scanned | "156" |
| Invoices Found | "12" |
| Matched | "9" |
| Errors | "1" (red if >0) |
| Duration | "2m 34s" |

**Tab 3: Manual Upload**
```
+----------------------------------------------------+
|        [Upload icon, large, faded]                  |
|     "Drop a PDF or CSV invoice here"                |
|     "Supported: PDF, CSV (FedEx billing format)"    |
|              [Choose File] button                    |
+----------------------------------------------------+
```
Dashed border, drag-and-drop hover: blue border + light blue bg

**Tab 4: FedEx**
- Yellow/amber warning banner about FedEx API limitations
- [Connect FedEx Account] + [Upload FedEx Billing CSV] buttons

---

## Page 12: Tax Portal (`/tax`)

### Header
- Title: "Tax Portal"
- Description: "Sales tax tracking, nexus monitoring, and automated filing"
- Actions: [Calendar period selector] + [Export Tax Report]

### Summary Cards (4-column)
| Card | Icon | Value |
|------|------|-------|
| Tax Collected (Period) | DollarSign | "$X,XXX.XX" |
| States with Nexus | MapPin | "5 of 50 states" |
| Filing Due Soon | AlertTriangle | "2 next 30 days" |
| Auto-Filing | Receipt | "Active" (green) or "Off — Connect TaxJar" |

### TaxJar Integration Card
```
+----------------------------------------------------+
| Automated Tax Filing              [Connect TaxJar]  |
| Connect TaxJar to auto-calculate, report,           |
| and file state sales tax returns                     |
|                                                      |
| - Auto-calculate tax liability per state             |
| - File and remit returns on your behalf              |
| - Monitor economic nexus thresholds                  |
| - Product tax categorization                         |
+----------------------------------------------------+
```

### Economic Nexus Tracker Table
| Column | Format |
|--------|--------|
| State | "California (CA)" |
| Revenue | "$87,500" + progress bar toward threshold |
| Threshold | "$100,000" |
| Transactions | "156 / 200" |
| Nexus Status | Badge: "Nexus" (red) or "Below threshold" (gray) |
| Registered | Badge: "Yes" (green) or "No" (outline) |

Rows with nexus crossed: highlighted with subtle red/warning background

### Tax Collected by State Chart
- Horizontal bar chart, sorted by tax collected descending
- State name on left, dollar amount on right

---

## Page 13: Cost Alerts (`/alerts`)

### Header
- Title: "Cost Alerts"
- Description: "Monitor cost discrepancies and get notified of anomalies"
- Badge (right): "X active alerts" (red)

### Alert Settings Card
**Two side-by-side sections:**

Shipping Cost Discrepancy:
- Percentage threshold input (default: 20%)
- Dollar threshold input (default: $10)

COGS Discrepancy:
- Percentage threshold input (default: 15%)
- Dollar threshold input (default: $25)

**Notification Preferences (toggle rows):**
| Channel | Toggle | Description |
|---------|--------|-------------|
| In-App | ON (default) | "Show alerts in the dashboard" |
| Email | OFF | "Send alerts via email for high-severity" |
| SMS/Text | OFF | "Text for urgent cost overruns ($50+)" |

[Save Settings] button

### Alert History Table (filterable: All / Active / Resolved / Dismissed)
| Column | Format |
|--------|--------|
| Type | "Shipping Discrepancy" or "COGS Discrepancy" with icon |
| Order | "#1234" (link) |
| Expected | "$12.50" |
| Actual | "$18.75" |
| Difference | "+$6.25 (+50%)" (red, bold) |
| Severity | Badge: "High" (red) / "Medium" (yellow) / "Low" (gray) |
| Status | Badge: "Active" / "Resolved" / "Dismissed" |
| Date | "Mar 11, 2026" |
| Actions | [Resolve] [Dismiss] (only for Active alerts) |

Empty state: "No alerts — Cost alerts will appear here when discrepancies are detected."

---

## Page 14: Settings (`/settings`)

### 5 Tabs

**Tab 1: Account**
- Name input
- Email input (disabled, shows current)
- [Save Changes] button

**Tab 2: Custom Costs**
- Header: "Cost Rules" + [+ Add Cost Rule] button
- Add Rule Dialog:
  - Rule Name (text)
  - Cost Type (dropdown: Per Order / Percentage of Revenue / Fixed Monthly)
  - Amount (number, $ or % based on type)
  - Applies To (dropdown: All Orders / Specific SKU, then SKU input)
- Rules Table:
  | Column | Format |
  |--------|--------|
  | Name | "Packaging Cost" |
  | Type | Badge: "Per Order" / "% Revenue" / "Fixed Monthly" |
  | Amount | "$1.50" or "2.5%" or "$500/mo" |
  | Applies To | "All orders" or SKU |
  | Active | Toggle switch |
  | Actions | Delete (trash icon) |

**Tab 3: Email Connection**
- Header: "Email Accounts (Shipping Agent)" + [+ Add Email] button
- Add Email Dialog:
  - Provider dropdown (Gmail OAuth / Outlook OAuth / IMAP)
  - Label input (optional, e.g. "FedEx Invoices")
  - Assign to Store dropdown (All Stores or specific store)
  - Custom Scan Keywords (comma-separated, optional)
  - [Connect via OAuth] button
- Connected email cards (vertical stack):
  ```
  +----------------------------------------------------+
  | [Provider logo]  shipping@mystore.com               |
  |   (Gmail)        [Store A] badge                    |
  |   Label: "FedEx Invoices" - Last scan: 2h ago       |
  |                                   [Toggle] [Delete]  |
  +----------------------------------------------------+
  ```
- Provider logos: Gmail=#EA4335 "G", Outlook=#0078D4 "O", IMAP=#525252 "@"
- How it works: 6 numbered steps explaining the flow

**Tab 4: API Keys**
- TaxJar API Key (password input)
- FedEx Client ID (text input)
- FedEx Client Secret (password input)
- [Save API Keys] button

**Tab 5: Notifications**
- Alert Email Address input
- SMS Phone Number input
- [Save Notification Settings] button

---

## Interaction States (All Pages)

### Loading
- Skeleton cards (gray pulsing rectangles matching layout)
- Skeleton rows in tables
- Button: "Loading..." + disabled + optional spinner

### Empty States
Every page has a unique empty state:
1. Large faded icon (48px, muted-foreground at 50% opacity)
2. Bold title (e.g., "No stores connected")
3. Description text (muted)
4. Call-to-action button when applicable

### Error States
- Toast notification: Bottom-right, auto-dismiss 5s
- Inline red banner for form validation
- Full-page centered error for critical failures with retry button

### Success States
- Toast notification with green accent
- Inline green checkmark for form saves

### Dark Mode
All pages support dark mode via class toggle. Key changes:
- Cards: #171717 vs #09090B page background
- Chart gradients: reduced opacity
- Borders: darker tones
- Green/red profit indicators: maintain contrast in both modes

---

## Data Architecture Summary

This app tracks **real Shopify profit** by calculating:

**Net Profit = Revenue - COGS - Actual Shipping - Transaction Fees - Ad Spend - Custom Costs**

Key data flows:
- **Shopify API** syncs orders, products, and customer data hourly
- **AI Shipping Agent** scans connected email inboxes for shipping invoices (FedEx, UPS, DHL, USPS), extracts costs via LLM, and matches them to orders
- **Ad Platforms** (Google, Meta, TikTok, Bing, Snapchat, Amazon) sync daily spend
- **Custom Cost Rules** let users add per-order fees, percentage costs, or fixed monthly costs
- **Cost Alerts** trigger when actual costs exceed expected by configurable thresholds
- **Tax Tracking** monitors sales tax collected by state and economic nexus thresholds
- **TaxJar** integration for automated tax filing (optional)

All sensitive tokens (Shopify, OAuth, API keys) are encrypted at rest with AES-256-GCM.
