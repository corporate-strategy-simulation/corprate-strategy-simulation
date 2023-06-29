// Define the models
export interface Feature {
  name: string;
  /**
   * The cost to host this feature, per user per month, in dollars.
   */
  perUserHostingCost: number;
  /**
   * The total cost of third party licenses to run this feature, per user per month, in dollars.
   */
  perUserLicenseCost: number;
  /**
   * The number of users who will sign up for the service per day as a result of the feature being available.
   */
  popularityMetric: number;
  /**
   * The number of engineering days it takes to develop this feature.
   */
  developmentCostDays: number;
  /**
   * The number of engineering days that have been spent developing this feature.
   */
  developmentProgress: number;
  /**
   * Per month, the number of engineering days it takes to maintain this feature.
   */
  maintenanceCostDaysPerMonth: number;

  /**
   * Is the feature currently maintained?
   */
  maintained: boolean;
}

export interface Service {
  /**
   * Percentage of current users that will stop using the service per day.
   */
  dailyAttritionRate: number;
  name: string;
  billingModel: "free" | "freemium" | "subscription";
  users: number;
  /**
   * Baseline hosting cost for the service (regardless of features) per month, in dollars.
   */
  hostingCost: number;
  /**
   * The amount paid by users to use the service, per user per month, in dollars.
   */
  subscriptionFee?: number;
  features: Feature[];
  plannedFeatures: Feature[];
}

export interface Employee {
  salary: number;
}

export interface Company {
  metrics: Record<string, number>;
  financialAssets: number;
  employees: Employee[];
  services: Service[];
}

// Function to calculate company valuation
export function calculateValuation(
  company: Company,
  marketCondition: "growing" | "shrinking",
  peRatio: number
): number {
  let totalRevenue = 0;
  let totalCost = 0;

  // Calculate revenue and cost from services
  for (const service of company.services) {
    if (service.billingModel === "subscription" && service.subscriptionFee) {
      totalRevenue += service.subscriptionFee * 12 * service.users;
    }
    totalCost += service.hostingCost;
    for (const feature of service.features) {
      totalCost += feature.perUserHostingCost * 12 * service.users;
      totalCost += feature.perUserLicenseCost * 12 * service.users;
    }
  }

  // Calculate cost from workforce
  for (const employee of company.employees) {
    totalCost += employee.salary;
  }

  // Calculate profit
  const profit = totalRevenue - totalCost;

  // Calculate valuation
  let valuation = profit * peRatio;

  // Adjust valuation based on market conditions
  if (marketCondition === "growing") {
    valuation *= 1.1; // Increase valuation by 10% if market is growing
  } else if (marketCondition === "shrinking") {
    valuation *= 0.9; // Decrease valuation by 10% if market is shrinking
  }

  // Adjust valuation based on popularity metrics
  for (const service of company.services) {
    for (const feature of service.features) {
      valuation *= 1 + feature.popularityMetric / 100; // Increase valuation based on popularity metric
    }
  }

  return valuation;
}
