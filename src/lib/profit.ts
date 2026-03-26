/**
 * Profit Calculation Engine
 *
 * Net Profit = Revenue - COGS - Actual Shipping (or charged if no actual)
 *            - Transaction Fees - Custom Costs - Allocated Ad Spend
 *
 * Tax is tracked separately (collected on behalf of the state, not revenue)
 */

export interface OrderCosts {
  subtotal: number;
  totalCogs: number;
  shippingCharged: number;
  actualShippingCost: number | null;
  transactionFee: number;
  customCostsTotal: number;
  allocatedAdSpend: number;
  totalTax: number;
}

export interface ProfitResult {
  revenue: number;
  cogs: number;
  shippingCost: number; // actual if available, charged otherwise
  transactionFee: number;
  customCosts: number;
  adSpend: number;
  grossProfit: number; // revenue - cogs
  netProfit: number;
  margin: number; // net profit / revenue as percentage
  shippingVariance: number; // actual - charged (positive = overpaying)
}

export function calculateOrderProfit(costs: OrderCosts): ProfitResult {
  // Revenue includes subtotal + shipping charged to customer
  const revenue = costs.subtotal + costs.shippingCharged;
  const cogs = costs.totalCogs;
  const shippingCost = costs.actualShippingCost ?? costs.shippingCharged;
  const transactionFee = costs.transactionFee;
  const customCosts = costs.customCostsTotal;
  const adSpend = costs.allocatedAdSpend;

  const grossProfit = revenue - cogs;
  const netProfit =
    revenue - cogs - shippingCost - transactionFee - customCosts - adSpend;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const shippingVariance =
    costs.actualShippingCost !== null
      ? costs.actualShippingCost - costs.shippingCharged
      : 0;

  return {
    revenue,
    cogs,
    shippingCost,
    transactionFee,
    customCosts,
    adSpend,
    grossProfit,
    netProfit,
    margin,
    shippingVariance,
  };
}

export interface AggregatedMetrics {
  totalRevenue: number;
  totalCogs: number;
  totalShippingCharged: number;
  totalActualShipping: number;
  totalTransactionFees: number;
  totalCustomCosts: number;
  totalAdSpend: number;
  totalTax: number;
  grossProfit: number;
  netProfit: number;
  margin: number;
  orderCount: number;
  shippingVariance: number;
}

export function aggregateMetrics(
  orders: OrderCosts[]
): AggregatedMetrics {
  const totals = orders.reduce(
    (acc, order) => {
      acc.totalRevenue += order.subtotal + order.shippingCharged;
      acc.totalCogs += order.totalCogs;
      acc.totalShippingCharged += order.shippingCharged;
      acc.totalActualShipping += order.actualShippingCost ?? order.shippingCharged;
      acc.totalTransactionFees += order.transactionFee;
      acc.totalCustomCosts += order.customCostsTotal;
      acc.totalAdSpend += order.allocatedAdSpend;
      acc.totalTax += order.totalTax;
      return acc;
    },
    {
      totalRevenue: 0,
      totalCogs: 0,
      totalShippingCharged: 0,
      totalActualShipping: 0,
      totalTransactionFees: 0,
      totalCustomCosts: 0,
      totalAdSpend: 0,
      totalTax: 0,
    }
  );

  const grossProfit = totals.totalRevenue - totals.totalCogs;
  const netProfit =
    totals.totalRevenue -
    totals.totalCogs -
    totals.totalActualShipping -
    totals.totalTransactionFees -
    totals.totalCustomCosts -
    totals.totalAdSpend;

  return {
    ...totals,
    grossProfit,
    netProfit,
    margin:
      totals.totalRevenue > 0
        ? (netProfit / totals.totalRevenue) * 100
        : 0,
    orderCount: orders.length,
    shippingVariance: totals.totalActualShipping - totals.totalShippingCharged,
  };
}

/**
 * Check if a cost discrepancy should trigger an alert
 */
export function checkCostAlert(
  expectedCost: number,
  actualCost: number,
  percentThreshold: number,
  dollarThreshold: number
): { shouldAlert: boolean; difference: number; percentOver: number; severity: "low" | "medium" | "high" } | null {
  if (actualCost <= expectedCost) return null;

  const difference = actualCost - expectedCost;
  const percentOver =
    expectedCost > 0 ? (difference / expectedCost) * 100 : 100;

  const exceedsPercent = percentOver >= percentThreshold;
  const exceedsDollar = difference >= dollarThreshold;

  if (!exceedsPercent && !exceedsDollar) return null;

  let severity: "low" | "medium" | "high" = "low";
  if (percentOver >= percentThreshold * 2 || difference >= dollarThreshold * 3) {
    severity = "high";
  } else if (percentOver >= percentThreshold * 1.5 || difference >= dollarThreshold * 2) {
    severity = "medium";
  }

  return { shouldAlert: true, difference, percentOver, severity };
}
