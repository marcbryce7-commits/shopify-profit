# ProfitPilot — Figma UI/UX Specification
**Version:** 1.1 | **Date:** March 2026
**Purpose:** Complete page-by-page specification for Figma design. Every page, component, data field, and interaction is documented.

---

## Design System Foundation

### Brand
- **App Name:** ProfitPilot
- **Logo:** Bar chart icon inside a rounded square (primary color background, white icon)
- **Tagline:** "Real-time profit tracking across all your stores"

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
| Chart 1 | #2563EB (blue-600) | | Revenue line |
| Chart 2 | #16A34A (green-600) | | Profit line |
| Chart 3 | #8B5CF6 (violet-500) | | COGS/expenses |
| Chart 4 | #F97316 (orange-500) | | Ad spend |
| Chart 5 | #EC4899 (pink-500) | | Shipping |

### Typography
| Style | Font | Weight | Size |
|-------|------|--------|------|
| Page Title | Geist Sans | Bold (700) | 30px / 1.2 |
| Page Description | Geist Sans | Regular (400) | 14px / 1.5 |
| Card Title | Geist Sans | Medium (500) | 14px / 1.4 |
| Metric Value | Geist Sans | Bold (700) | 24px / 1.2 |
| Metric Label | Geist Sans | Regular (400) | 12px / 1.3 |
| Table Header | Geist Sans | Medium (500) | 13px |
| Table Cell | Geist Sans | Regular (400) | 14px |
| Nav Item | Geist Sans | Medium (500) | 14px |
| Button | Geist Sans | Medium (500) | 14px |

### Spacing
- Page padding: 24px
- Card padding: 16px header, 16px content
- Card gap: 16px
- Section gap: 24px
- Grid: 4-column on desktop (1280px+), 2-column on tablet, 1-column on mobile

### Components
- **Cards:** 1px border, 8px radius, subtle shadow on hover
- **Buttons:** 8px radius, 32px height default, 28px small
- **Inputs:** 8px radius, 32px height, 1px border
- **Tables:** Alternating row hover, sticky header
- **Badges:** 4px radius, 6px horizontal padding
- **Sidebar:** Fixed 256px width, full viewport height

---

## Global Layout

### Structure
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
|                  |                                                 |
+------------------+------------------------------------------------+
```

### Sidebar Navigation
Fixed left panel, 256px wide, full height, card background.

**Header area (64px):**
- Logo: 32x32 rounded-lg primary bg, white bar-chart icon inside
- App name: "ProfitPilot" 18px semibold, right of logo

**Navigation items (scrollable area):**
Each item: 40px height, 12px horizontal padding, 8px radius, 4px icon + 12px gap + label

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

**Active state:** Primary/10 background, primary text color
**Hover state:** Muted background
**Default state:** Muted-foreground text

### Header Bar
64px height, card background, bottom border.

**Left side:**
- Store Selector dropdown (220px wide, outline button style)
  - Store icon + "All Stores" label + chevron
  - Dropdown: list of connected stores with checkmarks, "All Stores" option at top

**Right side (row, 12px gap):**
- Theme toggle button (sun/moon icon, ghost variant, 32x32)
- Notification bell button (ghost variant, 32x32, optional red dot badge)
- User avatar dropdown (32x32 circle)
  - Dropdown shows: name, email, separator, "Settings" link, separator, "Sign out" (destructive)

---

## Page 1: Login (`/login`)

### Layout
Centered on viewport, muted/40 background, max-width 400px card.

### Components
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

### Interactions
- Form validation: email required, password required
- Error state: red banner below header with error message
- Loading state: button shows "Signing in..." and is disabled
- Success: redirect to dashboard

---

## Page 2: Register (`/register`)

### Layout
Same centered card as login.

### Components
Same as login but with additional "Name" field and different copy:
- Title: "Create your account"
- Subtitle: "Start tracking your profit across all stores"
- Fields: Name (optional), Email (required), Password (required, min 8 chars)
- Button: "Create account"
- Link: "Already have an account? Sign in"

---

## Page 3: Overview Dashboard (`/`)

### Header Section
```
+-------------------------------------------------------+
| Dashboard                     Last sync: 5min ago      |
| Real-time profit tracking     [====Sync Now====]       |
+-------------------------------------------------------+
```

### Metric Cards — Row 1 (4-column grid)
Each card: icon top-right, title (muted), large $ value, description below.

| Card | Icon | Title | Value Format | Description |
|------|------|-------|-------------|-------------|
| 1 | DollarSign | Total Revenue | $XX,XXX.XX | "+X% from X orders" |
| 2 | Package | Total COGS | $XX,XXX.XX | "cost of goods sold" |
| 3 | Truck | Shipping Costs | $XX,XXX.XX | "charged: $X | actual: $X" |
| 4 | CreditCard | Transaction Fees | $XX,XXX.XX | "payment processing" |

### Metric Cards — Row 2 (4-column grid)

| Card | Icon | Title | Value Format | Description |
|------|------|-------|-------------|-------------|
| 5 | Megaphone | Ad Spend | $XX,XXX.XX | "across X platforms" |
| 6 | ShoppingCart | Custom Costs | $XX,XXX.XX | "X active rules" |
| 7 | TrendingUp | Net Profit | $XX,XXX.XX | "margin: XX.X%" (green border accent) |
| 8 | AlertTriangle | Cost Alerts | X | "X discrepancies found" |

**Net Profit card:** Should have a green-tinted left border or subtle green border to make it stand out as the key metric.

### Revenue & Profit Trend Chart (spans 4/7 columns)
- **Type:** Dual area chart (filled, gradient)
- **Series:** Revenue (blue) + Net Profit (green)
- **X-axis:** Time labels
- **Y-axis:** Dollar amounts
- **Toggle tabs:** Daily | Weekly | Monthly (small pill tabs, top-right of card)
- **Empty state:** "No data yet — sync your Shopify stores to see trends"
- **Tooltip:** Shows date, revenue, profit on hover

### Revenue by Store Chart (spans 3/7 columns)
- **Type:** Donut chart (inner radius 60, outer 100)
- **Labels:** Store names with revenue amounts
- **Colors:** Cycle through chart-1 through chart-5
- **Empty state:** "No stores connected yet"

### Recent Orders Preview
- Card with "Recent Orders" title + "View all orders" link button
- Shows last 5 orders in compact table (order #, date, revenue, net profit, status)
- Empty state: "Connect a Shopify store to see orders"

### Shipping Cost Variance
- Card with "Shipping Cost Variance" title + "Charged vs. Actual" badge
- Bar chart comparing charged vs actual shipping per month
- Empty state: "No shipping data yet — connect your email or upload invoices"

---

## Page 4: Stores (`/stores`)

### Header
```
Title: "Stores"
Description: "Connect and manage your Shopify stores"
Action: [+ Connect Store] button (opens dialog)
```

### Connect Store Dialog
```
+------------------------------------------+
| Connect a Shopify Store                  |
| Enter your Shopify store domain...       |
|                                          |
| Store Domain                             |
| [mystore___________] .myshopify.com      |
|                                          |
|                          [Connect]        |
+------------------------------------------+
```

### Empty State (no stores)
```
+------------------------------------------+
|         [Store icon, 48px, faded]        |
|       "No stores connected"              |
| "Connect your first Shopify store to     |
|  start tracking profits."                |
|                                          |
|    [+ Connect Your First Store]          |
+------------------------------------------+
```

### Store Cards (grid: 3-column desktop, 2 tablet, 1 mobile)
Each connected store is a card:
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
- **Active badge:** Green, with Wifi icon
- **Disconnected badge:** Red, with WifiOff icon
- **Sync button:** Outline, flex-1
- **External link:** Opens Shopify admin in new tab
- **Delete button:** Outline, destructive text, trash icon

---

## Page 5: Orders (`/orders`)

### Header
```
Title: "Orders"
Description: "All orders across your connected stores"
Action: [Download Export CSV] button
```

### Filter Bar (card)
```
| [Search icon] Search by order #, customer... | [All stores v] | [Status v] |
```
- Search: full-width with icon, 40px height
- Store filter: 180px dropdown
- Status filter: 150px dropdown (All / Paid / Pending / Refunded)

### Orders Table (card)
**Header:** "X,XXX Orders"

| Column | Width | Alignment | Format |
|--------|-------|-----------|--------|
| Order # | 100px | Left | "#1234" + optional red "Alert" badge |
| Date | 100px | Left | "Mar 11, 2026" |
| Revenue | 90px | Right | "$123.45" |
| Tax | 80px | Right | "$12.34" |
| Shipping | 120px | Right | "$8.99" + small "(actual: $12.50)" if different |
| COGS | 90px | Right | "$45.00" |
| Ad Spend | 90px | Right | "$5.00" |
| Net Profit | 100px | Right | "$52.11" green if positive, red if negative, bold |
| Status | 80px | Left | Badge: "Paid" / "Pending" / "Refunded" |

**Empty state:** "No orders yet — sync your Shopify stores to see orders here"

**Pagination:** Bottom of table, "Showing 1-50 of 1,234" + prev/next buttons

---

## Page 6: Product Analytics (`/products`)

### Header
```
Title: "Product Analytics"
Description: "Net profit breakdown by product"
Action: [Download Export] button
```

### Summary Cards (3-column)
| Card | Content |
|------|---------|
| Total Products | Count number |
| Most Profitable | Product name + profit amount (green TrendingUp icon) |
| Least Profitable | Product name + profit/loss amount (red TrendingDown icon) |

### Products Table (card, searchable)
| Column | Format |
|--------|--------|
| Product | Thumbnail image (40x40) + title + SKU |
| Units Sold | "1,234" |
| Revenue | "$12,345.00" |
| COGS | "$5,678.00" |
| Avg Shipping | "$4.50 / unit" |
| Net Profit | "$6,123.00" (green/red) |
| Margin | "49.6%" |

**Empty state:** Package icon + "No product data — Sync your stores to see product-level profitability."

---

## Page 7: Customer Lifetime Value (`/customers`)

### Header
```
Title: "Customer Lifetime Value"
Description: "Track customer profitability and repeat purchase behavior"
Action: [Download Export] button
```

### Summary Cards (4-column)
| Card | Value |
|------|-------|
| Total Customers | "1,234" |
| Avg LTV | "$156.78" |
| Repeat Rate | "34.5%" |
| Avg Orders / Customer | "2.3" |

### Customer Table (card, searchable)
| Column | Format |
|--------|--------|
| Customer | Name + email |
| First Order | "Jan 15, 2026" |
| Last Order | "Mar 10, 2026" |
| Total Orders | "5" |
| Total Revenue | "$789.00" |
| Total COGS | "$345.00" |
| LTV (Net Profit) | "$312.00" (green/red, bold) |

**Sort:** Default by LTV descending (highest value customers first)
**Empty state:** Users icon + "No customer data — Customer LTV is calculated automatically from synced orders."

---

## Page 8: P&L Report (`/pnl`)

### Header
```
Title: "Profit & Loss Report"
Description: "Monthly breakdown of revenue, costs, and net profit"
Actions: [Calendar March 2026 v] [Download Export]
```

### Layout: 2-column on desktop

**Left Column — P&L Statement (card)**
Vertical list of line items with amounts right-aligned:

```
Gross Revenue                          $XX,XXX.XX
Refunds & Returns                      -$X,XXX.XX  (red)
─────────────────────────────────────────────────
Net Revenue                            $XX,XXX.XX  (bold, large)

COST OF GOODS (section label, muted uppercase)
COGS (Product Cost)                    -$XX,XXX.XX (red)
─────────────────────────────────────────────────
Gross Profit                           $XX,XXX.XX  (bold, large)

OPERATING EXPENSES (section label)
Shipping Costs                         -$X,XXX.XX  (red)
Transaction Fees                       -$X,XXX.XX  (red)
Ad Spend (Google)                      -$X,XXX.XX  (red)
Ad Spend (Meta)                        -$X,XXX.XX  (red)
Ad Spend (TikTok)                      -$X,XXX.XX  (red)
Ad Spend (Other)                       -$X,XXX.XX  (red)
Custom Costs                           -$XXX.XX    (red)
Sales Tax Collected                    -$X,XXX.XX  (red)
─────────────────────────────────────────────────
Net Profit                             $XX,XXX.XX  (bold, large, green)
Profit Margin                          XX.X%
```

**Right Column — Monthly Comparison (card)**
- Grouped bar chart: current month vs previous month
- Bars for: Revenue, COGS, Shipping, Ads, Net Profit
- Empty state if < 2 months of data

---

## Page 9: Ad Spend (`/ads`)

### Header
```
Title: "Ad Spend"
Description: "Track ad spend across all platforms"
Action: [Sync All] button
```

### Summary Cards (4-column)
| Card | Icon | Value |
|------|------|-------|
| Total Spend | DollarSign | "$XX,XXX.XX" |
| Total Clicks | MousePointerClick | "XX,XXX" |
| Total Impressions | Eye | "XXX,XXX" |
| Blended ROAS | TrendingUp | "X.XXx" |

### Platform Connections (card, 3-column grid)
Each platform tile:
```
+------------------------------------------+
| [Logo 40x40]  Platform Name    [Connect] |
|                Not connected              |
+------------------------------------------+
```

**6 Platforms:**
| Platform | Logo Color | Icon Letter |
|----------|-----------|-------------|
| Google Ads | Blue (#4285F4) | G |
| Meta (Facebook) | Blue (#1877F2) | f |
| TikTok Ads | Black | T |
| Microsoft (Bing) | Cyan (#00BCF2) | B |
| Snapchat Ads | Yellow (#FFFC00, black text) | S |
| Amazon Ads | Orange (#FF9900) | A |

**Connected state:** Shows "Connected" + account name, button changes to "Manage"

### Spend by Platform Chart (card)
- **Type:** Stacked bar chart, one bar per day/week
- **Colors:** Each platform gets its brand color
- **Empty state:** "Connect an ad platform to see spend data"

### Campaign Drill-Down Table
| Column | Format |
|--------|--------|
| Platform | Logo + name |
| Campaign | Campaign name |
| Spend | "$X,XXX.XX" |
| Impressions | "XX,XXX" |
| Clicks | "X,XXX" |
| Conversions | "XXX" |
| ROAS | "X.XXx" |

---

## Page 10: Shipping Agent (`/shipping`)

### Header
```
Title: "Shipping Agent"
Description: "AI-powered shipping cost reconciliation from invoices and emails"
Actions: [Auto-scan toggle "every 6h"] [Run Agent Now] button (primary, Play icon)
```

### Status Cards (4-column)
| Card | Icon | Content |
|------|------|---------|
| Email Accounts | Mail | Count of connected emails (e.g., "3") + link "Connect emails in Settings" if 0, or "X accounts active" |
| Last Scan | Clock | "2 hours ago" or "Never" |
| Matched | CheckCircle (green) | "47 invoices matched" |
| Pending Review | AlertCircle (yellow) | "3 need approval" |

### Tab Navigation
4 tabs: **Review Queue** | Processing History | Manual Upload | FedEx

#### Tab: Review Queue
Table of pending invoice matches:
| Column | Format |
|--------|--------|
| Invoice # | "INV-2026-0451" |
| Supplier | "FedEx" |
| Amount | "$45.67" |
| Matched Order | "#1234" (link) |
| Confidence | "92%" with colored progress bar (green >80, yellow 50-80, red <50) |
| Actions | [Approve] [Reject] [Edit] buttons |

Bulk actions bar at top: "3 selected" + [Approve All] + [Reject All]

#### Tab: Processing History
Table of past agent runs:
| Column | Format |
|--------|--------|
| Date | "Mar 11, 2026 2:30 PM" |
| Emails Scanned | "156" |
| Invoices Found | "12" |
| Matched | "9" |
| Errors | "1" (red if >0) |
| Duration | "2m 34s" |

#### Tab: Manual Upload
```
+----------------------------------------------------+
|                                                      |
|        [Upload icon, large, faded]                  |
|     "Drop a PDF or CSV invoice here"                |
|     "Supported: PDF, CSV (FedEx billing format)"    |
|                                                      |
|              [Choose File] button                    |
|                                                      |
+----------------------------------------------------+
```
- Dashed border (2px), rounded corners
- Drag-and-drop hover state: blue border, light blue bg

#### Tab: FedEx
- **Limitation notice:** Yellow/amber info banner
  > "FedEx public APIs do not expose actual billed amounts or post-shipment adjustments. Use the email agent or upload FedEx billing CSV for 100% accuracy."
- Two action buttons: [Connect FedEx Account] [Upload FedEx Billing CSV]
- If connected: shows tracking lookup table with status

---

## Page 11: Tax Portal (`/tax`)

### Header
```
Title: "Tax Portal"
Description: "Sales tax tracking, nexus monitoring, and automated filing"
Actions: [Calendar period selector] [Download Export Tax Report]
```

### Summary Cards (4-column)
| Card | Icon | Value |
|------|------|-------|
| Tax Collected (Period) | DollarSign | "$X,XXX.XX" |
| States with Nexus | MapPin | "5 of 50 states" |
| Filing Due Soon | AlertTriangle | "2" + "next 30 days" |
| Auto-Filing | Receipt | "Active" (green) or "Off — Connect TaxJar" |

### TaxJar Integration (card)
```
+----------------------------------------------------+
| Automated Tax Filing              [Connect TaxJar]  |
| Connect TaxJar to auto-calculate, report,           |
| and file state sales tax returns                     |
|                                                      |
| TaxJar handles:                                      |
| - Auto-calculate tax liability per state             |
| - File and remit returns on your behalf              |
| - Monitor economic nexus thresholds                  |
| - Product tax categorization                         |
+----------------------------------------------------+
```

### Economic Nexus Tracker (card, table)
| Column | Format |
|--------|--------|
| State | "California (CA)" |
| Revenue | "$87,500" + progress bar toward threshold |
| Threshold | "$100,000" or "$500,000" (varies by state) |
| Transactions | "156 / 200" |
| Nexus Status | Badge: "Nexus" (red) or "Below threshold" (gray) |
| Registered | Badge: "Yes" (green) or "No" (outline) |

States that have crossed nexus threshold should be highlighted with a subtle red/warning row background.

### Tax Collected by State (card)
- **Type:** Horizontal bar chart, sorted by tax collected descending
- Each bar: state name on left, dollar amount on right
- Color: gradient from primary to muted based on amount

---

## Page 12: Cost Alerts (`/alerts`)

### Header
```
Title: "Cost Alerts"
Description: "Monitor cost discrepancies and get notified of anomalies"
Badge: "X active alerts" (large, right-aligned)
```

### Alert Settings (card)
Two sections side-by-side:

**Shipping Cost Discrepancy:**
- Percentage threshold input (default: 20%) + description
- Dollar threshold input (default: $10) + description

**COGS Discrepancy:**
- Percentage threshold input (default: 15%)
- Dollar threshold input (default: $25)

**Notification Preferences (below, bordered rows):**
| Notification | Toggle | Description |
|-------------|--------|-------------|
| In-App | Switch (on by default) | "Show alerts in the dashboard" |
| Email | Switch (off) | "Send alerts via email for high-severity" |
| SMS/Text | Switch (off) | "Text for urgent cost overruns ($50+)" |

Save button at bottom.

### Alert History (card, filterable)
Filter dropdown: All | Active | Resolved | Dismissed

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
| Actions | [Resolve] [Dismiss] buttons |

**Empty state:** AlertTriangle icon + "No alerts — Cost alerts will appear here when discrepancies are detected."

---

## Page 13: Settings (`/settings`)

### Tab Navigation
5 tabs: **Account** | Custom Costs | Email Connection | API Keys | Notifications

#### Tab: Account
Simple form card:
- Name input
- Email input (disabled, shows current email)
- [Save Changes] button

#### Tab: Custom Costs
**Header area:** Title + description + [+ Add Cost Rule] button (opens dialog)

**Add Cost Rule Dialog:**
| Field | Type | Options |
|-------|------|---------|
| Rule Name | Text input | e.g., "Packaging Cost" |
| Cost Type | Select | Per Order / Percentage of Revenue / Fixed Monthly |
| Amount | Number input | $ or % depending on type |
| Applies To | Select | All Orders / Specific SKU (then SKU input) |

**Cost Rules Table:**
| Column | Format |
|--------|--------|
| Name | "Packaging Cost" |
| Type | Badge: "Per Order" / "% Revenue" / "Fixed Monthly" |
| Amount | "$1.50" or "2.5%" or "$500/mo" |
| Applies To | "All orders" or specific SKU |
| Active | Toggle switch |
| Actions | Delete (trash icon) button |

**Empty state:** "No custom cost rules yet. Add one to include recurring costs in your profit calculations."

#### Tab: Email Connection
**Multi-Email Management** — Users can connect multiple email accounts and assign each to a specific store for targeted invoice scanning.

**Card header area:**
- Title: "Email Accounts (Shipping Agent)" with Mail icon
- Description: "Connect multiple email accounts to scan for supplier invoices. Assign each to a specific store or scan across all."
- Action: [+ Add Email] button (opens dialog)

**Add Email Dialog:**
```
+----------------------------------------------------+
| Connect an Email Account                            |
|                                                      |
| Email Provider                                       |
| [Select provider ▾]                                 |
|   Options: Gmail (OAuth) | Outlook (OAuth) | IMAP   |
|                                                      |
| Label (optional)                                     |
| [e.g., "FedEx Invoices" or "Store A Shipping"___]   |
|                                                      |
| Assign to Store                                      |
| [All stores (scan everything) ▾]                    |
|   Options: All Stores | Store A | Store B | ...     |
|   Helper: "Assign to a specific store to only match  |
|   invoices from this email to that store's orders"   |
|                                                      |
| Custom Scan Keywords (optional)                      |
| [FedEx, UPS, DHL, invoice, shipping___]             |
|   Helper: "Comma-separated keywords to filter which  |
|   emails to scan. Leave empty to use defaults."      |
|                                                      |
|                             [Connect via OAuth]       |
+----------------------------------------------------+
```

**Empty state (no emails connected):**
```
+----------------------------------------------------+
|         [Mail icon, 40px, faded]                    |
|     "No email accounts connected"                   |
| "Connect one or more email accounts so the AI       |
|  shipping agent can scan for supplier invoices       |
|  and match them to your orders."                     |
+----------------------------------------------------+
```

**Connected email account cards (vertical stack):**
Each connected email is a bordered card row:
```
+----------------------------------------------------+
| [Provider logo 40x40]  shipping@mystore.com         |
|   (Gmail)              [Store A] badge (secondary)  |
|   Label: "FedEx Invoices" · Last scan: 2h ago       |
|                                   [Switch] [Delete]  |
+----------------------------------------------------+
```

**Provider logos:**
| Provider | Background Color | Letter |
|----------|-----------------|--------|
| Gmail | Red (#EA4335) | G |
| Outlook | Blue (#0078D4) | O |
| IMAP | Gray (#525252) | @ |

- **Store badge:** Secondary badge showing assigned store name, or "All Stores" if unscoped
- **Switch toggle:** Enable/disable scanning for this account (without removing it)
- **Delete button:** Ghost variant, trash icon, destructive color

**Supported providers panel (muted bg card):**
- 3-column grid showing Gmail (OAuth recommended), Outlook (OAuth), IMAP (any provider)
- Each with provider logo, name, and auth method tag

**How it works panel (muted bg card):**
Numbered steps list:
1. Connect one or more email accounts via OAuth or IMAP
2. Optionally assign each email to a specific store
3. The AI agent scans each inbox for shipping invoices
4. Extracts costs from PDF attachments using AI
5. Matches invoices to orders (scoped to assigned store if set)
6. You review and approve the matches

#### Tab: API Keys
Form with masked password inputs:
- TaxJar API Key
- FedEx Client ID
- FedEx Client Secret
- [Save API Keys] button

#### Tab: Notifications
- Alert Email Address input
- SMS Phone Number input
- [Save Notification Settings] button

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|-----------|-------|----------------|
| Desktop | 1280px+ | Sidebar visible, 4-column metric grids, 7-column chart layout |
| Tablet | 768-1279px | Sidebar collapses to icons only (64px), 2-column grids |
| Mobile | <768px | Sidebar becomes hamburger menu sheet, 1-column grids, simplified tables |

### Mobile Adaptations
- Sidebar: Hidden, accessible via hamburger icon in header
- Metric cards: Stack vertically, full width
- Tables: Horizontal scroll with sticky first column
- Charts: Full width, reduced height (200px vs 300px)
- Header: Store selector becomes icon-only, user menu stays

---

## Interaction States

### Loading States
- **Page load:** Skeleton cards (gray pulsing rectangles matching card layout)
- **Data fetch:** Skeleton rows in tables, skeleton bars in charts
- **Button loading:** "Loading..." text + disabled state + optional spinner

### Empty States
Every page has a unique empty state with:
1. Large faded icon (48px, muted-foreground/50)
2. Bold title ("No stores connected")
3. Description text (muted-foreground)
4. Call-to-action button (when applicable)

### Error States
- Toast notification for transient errors (bottom-right, auto-dismiss 5s)
- Inline error banners for form validation (red background, red text)
- Full-page error for critical failures (centered, retry button)

### Success States
- Toast notification for actions (green accent, "Order synced successfully")
- Inline success for form saves (green checkmark animation)

---

## Dark Mode
All pages must support dark mode via the `class` strategy (toggled by theme button in header). Every color token has a dark mode variant listed in the Color Tokens section above.

Key dark mode considerations:
- Cards get a slightly elevated background (#171717 vs #09090B page bg)
- Chart gradients reduce opacity
- Borders switch to darker tones
- Green/red profit indicators maintain good contrast in both modes
