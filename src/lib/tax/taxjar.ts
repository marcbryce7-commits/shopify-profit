/**
 * TaxJar API client for automated sales tax calculation, filing, and nexus management.
 * Docs: https://developers.taxjar.com/api/reference/
 */

const TAXJAR_API_BASE = "https://api.taxjar.com/v2";
const TAXJAR_SANDBOX_BASE = "https://api.sandbox.taxjar.com/v2";

function getApiBase(): string {
  return process.env.TAXJAR_SANDBOX === "true"
    ? TAXJAR_SANDBOX_BASE
    : TAXJAR_API_BASE;
}

function getApiKey(): string {
  const key = process.env.TAXJAR_API_KEY;
  if (!key) throw new Error("TAXJAR_API_KEY is not configured");
  return key;
}

async function taxjarRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`TaxJar API error ${res.status}: ${errorBody}`);
  }

  return res.json();
}

// ─── Tax Calculation ────────────────────────────────────────────────────────

export interface TaxCalculationParams {
  fromCountry?: string;
  fromZip?: string;
  fromState?: string;
  fromCity?: string;
  toCountry: string;
  toZip: string;
  toState: string;
  toCity?: string;
  amount: number;
  shipping: number;
  lineItems?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    productTaxCode?: string;
  }>;
}

export interface TaxCalculationResult {
  orderTotalAmount: number;
  shipping: number;
  taxableAmount: number;
  amountToCollect: number;
  rate: number;
  hasNexus: boolean;
  freightTaxable: boolean;
  breakdown?: {
    stateTaxableAmount: number;
    stateTaxRate: number;
    stateTaxCollectable: number;
    countyTaxableAmount: number;
    countyTaxRate: number;
    countyTaxCollectable: number;
    cityTaxableAmount: number;
    cityTaxRate: number;
    cityTaxCollectable: number;
    specialDistrictTaxableAmount: number;
    specialDistrictTaxRate: number;
    specialTaxCollectable: number;
  };
}

export async function calculateTax(
  params: TaxCalculationParams
): Promise<TaxCalculationResult> {
  const response = await taxjarRequest<{ tax: Record<string, unknown> }>(
    "POST",
    "/taxes",
    {
      from_country: params.fromCountry ?? "US",
      from_zip: params.fromZip,
      from_state: params.fromState,
      from_city: params.fromCity,
      to_country: params.toCountry,
      to_zip: params.toZip,
      to_state: params.toState,
      to_city: params.toCity,
      amount: params.amount,
      shipping: params.shipping,
      line_items: params.lineItems?.map((li) => ({
        id: li.id,
        quantity: li.quantity,
        unit_price: li.unitPrice,
        product_tax_code: li.productTaxCode,
      })),
    }
  );

  const tax = response.tax;
  const breakdown = tax.breakdown as Record<string, unknown> | undefined;

  return {
    orderTotalAmount: tax.order_total_amount as number,
    shipping: tax.shipping as number,
    taxableAmount: tax.taxable_amount as number,
    amountToCollect: tax.amount_to_collect as number,
    rate: tax.rate as number,
    hasNexus: tax.has_nexus as boolean,
    freightTaxable: tax.freight_taxable as boolean,
    breakdown: breakdown
      ? {
          stateTaxableAmount: (breakdown.state_taxable_amount as number) ?? 0,
          stateTaxRate: (breakdown.state_tax_rate as number) ?? 0,
          stateTaxCollectable:
            (breakdown.state_tax_collectable as number) ?? 0,
          countyTaxableAmount:
            (breakdown.county_taxable_amount as number) ?? 0,
          countyTaxRate: (breakdown.county_tax_rate as number) ?? 0,
          countyTaxCollectable:
            (breakdown.county_tax_collectable as number) ?? 0,
          cityTaxableAmount: (breakdown.city_taxable_amount as number) ?? 0,
          cityTaxRate: (breakdown.city_tax_rate as number) ?? 0,
          cityTaxCollectable:
            (breakdown.city_tax_collectable as number) ?? 0,
          specialDistrictTaxableAmount:
            (breakdown.special_district_taxable_amount as number) ?? 0,
          specialDistrictTaxRate:
            (breakdown.special_tax_rate as number) ?? 0,
          specialTaxCollectable:
            (breakdown.special_district_tax_collectable as number) ?? 0,
        }
      : undefined,
  };
}

// ─── Tax Rate Lookup ────────────────────────────────────────────────────────

export interface TaxRate {
  zip: string;
  state: string;
  stateRate: number;
  county: string;
  countyRate: number;
  city: string;
  cityRate: number;
  combinedDistrictRate: number;
  combinedRate: number;
  freightTaxable: boolean;
}

export async function getTaxRateForLocation(
  zip: string,
  country: string = "US",
  city?: string,
  state?: string
): Promise<TaxRate> {
  const params = new URLSearchParams({ country });
  if (city) params.set("city", city);
  if (state) params.set("state", state);

  const response = await taxjarRequest<{ rate: Record<string, unknown> }>(
    "GET",
    `/rates/${zip}?${params}`
  );

  const rate = response.rate;
  return {
    zip: rate.zip as string,
    state: rate.state as string,
    stateRate: parseFloat(rate.state_rate as string),
    county: rate.county as string,
    countyRate: parseFloat(rate.county_rate as string),
    city: rate.city as string,
    cityRate: parseFloat(rate.city_rate as string),
    combinedDistrictRate: parseFloat(
      rate.combined_district_rate as string
    ),
    combinedRate: parseFloat(rate.combined_rate as string),
    freightTaxable: rate.freight_taxable as boolean,
  };
}

// ─── Transaction Reporting (for auto-filing) ────────────────────────────────

export interface TransactionParams {
  transactionId: string;
  transactionDate: string; // YYYY-MM-DD
  toCountry: string;
  toZip: string;
  toState: string;
  toCity?: string;
  amount: number;
  shipping: number;
  salesTax: number;
  lineItems?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    salesTax: number;
    productTaxCode?: string;
  }>;
}

export async function createTransaction(
  params: TransactionParams
): Promise<{ transactionId: string }> {
  const response = await taxjarRequest<{
    order: { transaction_id: string };
  }>("POST", "/transactions/orders", {
    transaction_id: params.transactionId,
    transaction_date: params.transactionDate,
    to_country: params.toCountry,
    to_zip: params.toZip,
    to_state: params.toState,
    to_city: params.toCity,
    amount: params.amount,
    shipping: params.shipping,
    sales_tax: params.salesTax,
    line_items: params.lineItems?.map((li) => ({
      id: li.id,
      quantity: li.quantity,
      unit_price: li.unitPrice,
      sales_tax: li.salesTax,
      product_tax_code: li.productTaxCode,
    })),
  });

  return { transactionId: response.order.transaction_id };
}

export async function deleteTransaction(
  transactionId: string
): Promise<void> {
  await taxjarRequest("DELETE", `/transactions/orders/${transactionId}`);
}

// ─── Nexus Regions ──────────────────────────────────────────────────────────

export interface NexusRegion {
  id: string;
  country: string;
  state: string;
}

export async function getNexusRegions(): Promise<NexusRegion[]> {
  const response = await taxjarRequest<{
    regions: Array<{ id: string; country_code: string; region_code: string }>;
  }>("GET", "/nexus/regions");

  return response.regions.map((r) => ({
    id: r.id,
    country: r.country_code,
    state: r.region_code,
  }));
}

export async function addNexusRegion(
  country: string,
  state: string
): Promise<NexusRegion> {
  const response = await taxjarRequest<{
    region: { id: string; country_code: string; region_code: string };
  }>("POST", "/nexus/regions", {
    country_code: country,
    region_code: state,
  });

  return {
    id: response.region.id,
    country: response.region.country_code,
    state: response.region.region_code,
  };
}

export async function removeNexusRegion(regionId: string): Promise<void> {
  await taxjarRequest("DELETE", `/nexus/regions/${regionId}`);
}

// ─── Validation ─────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  exists: boolean;
  details?: {
    country: string;
    state: string;
    zip: string;
    city: string;
  };
}

export async function validateAddress(address: {
  country: string;
  state: string;
  zip: string;
  city?: string;
  street?: string;
}): Promise<ValidationResult> {
  try {
    const response = await taxjarRequest<{
      addresses: Array<{
        country: string;
        state: string;
        zip: string;
        city: string;
      }>;
    }>("POST", "/addresses/validate", {
      country: address.country,
      state: address.state,
      zip: address.zip,
      city: address.city,
      street: address.street,
    });

    return {
      valid: true,
      exists: response.addresses.length > 0,
      details: response.addresses[0],
    };
  } catch {
    return { valid: false, exists: false };
  }
}

// ─── Summary Rates (for tax portal) ────────────────────────────────────────

export interface SummaryRate {
  countryCode: string;
  country: string;
  regionCode: string;
  region: string;
  minimumRate: {
    label: string;
    rate: number;
  };
  averageRate: {
    label: string;
    rate: number;
  };
}

export async function getSummaryRates(): Promise<SummaryRate[]> {
  const response = await taxjarRequest<{
    summary_rates: Array<{
      country_code: string;
      country: string;
      region_code: string;
      region: string;
      minimum_rate: { label: string; rate: number };
      average_rate: { label: string; rate: number };
    }>;
  }>("GET", "/summary_rates");

  return response.summary_rates.map((r) => ({
    countryCode: r.country_code,
    country: r.country,
    regionCode: r.region_code,
    region: r.region,
    minimumRate: r.minimum_rate,
    averageRate: r.average_rate,
  }));
}
