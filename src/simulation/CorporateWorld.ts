import { add, isLastDayOfMonth, isWeekend } from "date-fns";
import { Company } from "./Company";

export class CorporateWorld {
  companies: Company[] = [];

  currentTime: number = 0;

  constructor() {
    this.currentTime = new Date(2020, 0, 1).getTime();
  }

  simulateDay(): void {
    this.currentTime = add(this.currentTime, { days: 1 }).getTime();
    for (const company of this.companies) {
      this.updateFeatureDevelopment(company);
      this.updateServiceUsage(company);
      this.updateFinancialAssets(company);
    }
  }
  /**
   * Update financial assets based on service usage and hosting costs
   */
  updateFinancialAssets(company: Company) {
    // Costs, revenue are only realized at the end of each month
    if (!isLastDayOfMonth(this.currentTime)) {
      return;
    }

    // Calculate total hosting costs
    let totalHostingCosts = 0;
    for (const service of company.services) {
      totalHostingCosts += service.hostingCost;
      for (const feature of service.features) {
        totalHostingCosts += feature.perUserHostingCost * service.users;
        totalHostingCosts += feature.perUserLicenseCost * service.users;
      }
    }

    // Calculate total revenue from service subscriptions
    let totalRevenue = 0;
    for (const service of company.services) {
      if (service.subscriptionFee) {
        totalRevenue += service.subscriptionFee * service.users;
      }
    }

    // Calculate total salaries
    let totalSalaries = 0;
    for (const employee of company.employees) {
      totalSalaries += employee.salary / 12;
    }

    // Update financial assets
    company.financialAssets =
      company.financialAssets +
      totalRevenue -
      totalSalaries -
      totalHostingCosts;
  }

  /**
   * Update service usage based on users and existing, maintained features
   */
  updateServiceUsage(company: Company) {
    for (const service of company.services) {
      service.users -= service.users * service.dailyAttritionRate;
      for (const feature of service.features) {
        if (feature.maintained) {
          service.users += feature.popularityMetric;
        }
      }
    }
  }

  /**
   * Update feature development based on plans and employees
   */
  updateFeatureDevelopment(company: Company): void {
    // determine the total capacity of the workforce
    const fractionEngineering = 0.5;
    const weekend = isWeekend(this.currentTime);

    // in general, no development happens on weekends
    if (weekend) {
      return;
    }

    const engineeringCapacity = weekend
      ? 0
      : company.employees.length * fractionEngineering;

    let remainingEngineeringCapacity = engineeringCapacity;

    // first, subtract the capacity required to maintain existing features
    for (const service of company.services) {
      for (const feature of service.features) {
        remainingEngineeringCapacity -=
          feature.maintenanceCostDaysPerMonth / 30;

        feature.maintained = remainingEngineeringCapacity >= 0;
      }
    }

    company.metrics.remainingEngineeringCapacity = remainingEngineeringCapacity;

    // apply any remaining capacity to the development of new features
    for (const service of company.services) {
      const newlyCompletedFeatures = [];
      for (const feature of service.plannedFeatures) {
        if (remainingEngineeringCapacity > 0) {
          const developmentRemaining =
            feature.developmentCostDays - feature.developmentProgress;
          const applicableCapacity = Math.min(
            remainingEngineeringCapacity,
            developmentRemaining
          );
          remainingEngineeringCapacity -= applicableCapacity;
          feature.developmentProgress += applicableCapacity;
          if (feature.developmentProgress >= feature.developmentCostDays) {
            newlyCompletedFeatures.push(feature);
          }
        }
      }

      // move each of the newly completed features from the planned to the
      // maintained list of features
      for (const feature of newlyCompletedFeatures) {
        service.plannedFeatures.splice(
          service.plannedFeatures.indexOf(feature),
          1
        );
        service.features.push(feature);
      }
    }
  }
}
