"use client";
import {
  Company,
  Feature,
  Service,
  calculateValuation,
} from "@/simulation/Company";
import { CorporateWorld } from "@/simulation/CorporateWorld";
import { useCompletion } from "ai/react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useInterval } from "react-timing-hooks";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

type CorporateSimulationProps = {};

const CorporateSimulation = ({}: CorporateSimulationProps) => {
  const {
    completion,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    error,
  } = useCompletion({
    api: "/api/company-onboard",
  });

  const [futureFeaturesBuffer, setFutureFeaturesBuffer] = useState<string[]>(
    []
  );
  const [features, setFeatures] = useState<string[]>([]);
  const [plannedFeatures, setPlannedFeatures] = useState<string[]>([]);
  const onboardCompanyResponse: Record<string, any> = useMemo(() => {
    console.log("response", completion, isLoading);
    // clear features (game state) when onboarding completes
    setFeatures([]);

    // the string will not be valid JSON until it is finished loading
    if (!completion || isLoading) return null;
    try {
      return JSON.parse(completion);
    } catch (e) {
      console.error(e);
    }
    return null;
  }, [completion, isLoading]);

  const [company, setCompany] = useState<Company>();
  const [corporateWorld, setCorporateWorld] = useState<CorporateWorld>();

  const handleOnboard = async () => {
    if (!onboardCompanyResponse) {
      // clear state and return
      simulationInterval.stop();
      setCompany(undefined);
      setCorporateWorld(undefined);
      return;
    }

    setFutureFeaturesBuffer(onboardCompanyResponse.features);
    setFeatures([]);
    setPlannedFeatures([]);

    const newService: Service = {
      name: onboardCompanyResponse.serviceName,
      plannedFeatures: [],
      features: [],
      dailyAttritionRate: 0.01,
      billingModel: "subscription",
      users: 0,
      hostingCost: 1000,
      subscriptionFee: 15,
    };

    // create a Company and a CorporateWorld from the onboardCompanyResponse
    const newCompany: Company = {
      metrics: {},
      financialAssets: 5000000, // 5 million
      employees: Array.from(Array(10)).map((i) => ({ salary: 100000 })), // 10 employees, 100k salary each
      services: [newService],
    };
    setCompany(newCompany);

    const newCorporateWorld = new CorporateWorld();
    newCorporateWorld.companies.push(newCompany);
    setCorporateWorld(newCorporateWorld);
    simulationInterval.start();
  };

  useEffect(() => {
    handleOnboard();
  }, [onboardCompanyResponse]);

  const [simulatedTime, setSimulatedTime] = useState(0);
  const [financialAssets, setFinancialAssets] = useState(0);
  const [users, setUsers] = useState(0);
  const [valuation, setValuation] = useState(0);
  const simulationInterval = useInterval(() => {
    if (company && corporateWorld) {
      corporateWorld.simulateDay();
      setSimulatedTime(corporateWorld.currentTime);
      setPlannedFeatures(
        company.services[0]?.plannedFeatures.map((f) => f.name)
      );
      setFeatures(company.services[0]?.features.map((f) => f.name));
      setCompany(company);
      setFinancialAssets(company.financialAssets);
      setUsers(company.services[0]?.users);
      setValuation(calculateValuation(company, "growing", 0.1));
    }
  }, 200);

  const handleAddFeature = () => {
    setPlannedFeatures((prevFeatures) => {
      const additionalFeature = futureFeaturesBuffer.shift();
      if (!additionalFeature) {
        // TODO get more features from the server when we are out or nearly out
        return prevFeatures;
      }
      setFutureFeaturesBuffer([...futureFeaturesBuffer]);

      const newFeatureName = additionalFeature;
      const newFeature: Feature = {
        name: newFeatureName,
        developmentCostDays: 30,
        perUserHostingCost: 0.03,
        perUserLicenseCost: 0.01,
        popularityMetric: 100,
        developmentProgress: 0,
        maintenanceCostDaysPerMonth: 2,
        maintained: true,
      };

      // also update the company's planned features
      company?.services[0].plannedFeatures.push(newFeature);
      return [...prevFeatures, additionalFeature];
    });
  };

  const renderFeatures = (targetFeatures: string[]) => {
    if (targetFeatures.length === 0) {
      return <p className="text-gray-500">No features currently.</p>;
    }

    return (
      <>
        <ul>
          {targetFeatures.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-3xl">
        <form onSubmit={handleSubmit}>
          <div className="mt-4">
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-300"
            >
              Topic or Suggestion
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="topic"
                id="topic"
                className="w-full flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm focus:outline-none sm:text-sm sm:leading-6 min-w-[300px]"
                value={input}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Submit"}
            </button>
          </div>
        </form>
        {error && (
          <p className="text-red-500 mt-4">
            An error occurred while generating the company.
          </p>
        )}
        {onboardCompanyResponse && (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-100">
              Generated Company:
            </h3>
            <p className="mt-2 text-sm text-gray-300">
              {onboardCompanyResponse.companyName}
            </p>
            <h3 className="text-lg font-medium text-gray-100 mt-4">Service:</h3>
            <p className="mt-2 text-sm text-gray-300">
              {onboardCompanyResponse.serviceName}
            </p>
            <h3 className="text-lg font-medium text-gray-100 mt-4">
              Description:
            </h3>
            <p className="mt-2 text-sm text-gray-300">
              {onboardCompanyResponse.serviceDescription}
            </p>
            <h3 className="text-lg font-medium text-gray-100 mt-4">
              Simuated Date:
            </h3>
            <p className="mt-2 text-sm text-gray-300">
              {format(simulatedTime, "yyyy-MM-dd")}
            </p>
            <h3 className="text-lg font-medium text-gray-100 mt-4">
              Assets :: Users :: Valuation
            </h3>
            <p className="mt-2 text-sm text-gray-300">
              {currencyFormatter.format(financialAssets)} ::&nbsp;
              {numberFormatter.format(users)} ::&nbsp;
              {currencyFormatter.format(valuation)}
            </p>
            <button
              onClick={handleAddFeature}
              disabled={isLoading}
              className="mt-4 flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {isLoading ? "Loading..." : "Plan Feature"}
            </button>
            <h3 className="text-lg font-medium text-gray-100 mt-4">
              Planned Features:
            </h3>
            <ul className="mt-2 text-sm text-gray-300">
              {renderFeatures(plannedFeatures)}
            </ul>
            <h3 className="text-lg font-medium text-gray-100 mt-4">
              Implemented Features:
            </h3>
            <ul className="mt-2 text-sm text-gray-300">
              {renderFeatures(features)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateSimulation;
