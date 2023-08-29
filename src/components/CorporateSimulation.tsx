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
import Image from "next/image";
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
  const [futureAiFeaturesBuffer, setFutureAiFeaturesBuffer] = useState<
    string[]
  >([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [plannedFeatures, setPlannedFeatures] = useState<string[]>([]);
  const onboardCompanyResponse: Record<string, any> = useMemo(() => {
    console.log("/api/company-onboard response", completion, isLoading);
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

  const {
    completion: generateFeaturesCompletion,
    isLoading: generateFeaturesIsLoading,
    complete: generateFeaturesComplete,
  } = useCompletion({
    api: "/api/generate-conventional-features",
  });

  const generatedFeatures: string[] = useMemo(() => {
    console.log(
      "/api/generate-conventional-features response",
      generateFeaturesCompletion,
      generateFeaturesIsLoading
    );
    if (!generateFeaturesCompletion || generateFeaturesIsLoading) return [];
    try {
      const completionObject: { suggestions: string[] } = JSON.parse(
        generateFeaturesCompletion
      );
      return completionObject.suggestions;
    } catch (e) {
      console.error(e);
    }
    return [];
  }, [generateFeaturesCompletion, generateFeaturesIsLoading]);

  // when there are new generated features, add them to the buffer
  useEffect(() => {
    if (generatedFeatures && generatedFeatures.length > 0) {
      setFutureFeaturesBuffer([...futureFeaturesBuffer, ...generatedFeatures]);
    }
  }, [generatedFeatures]);

  const {
    completion: generateAiFeaturesCompletion,
    isLoading: generateAiFeaturesIsLoading,
    complete: generateAiFeaturesComplete,
  } = useCompletion({
    api: "/api/generate-ai-features",
  });

  const generatedAiFeatures: string[] = useMemo(() => {
    console.log(
      "/api/generate-ai-features response",
      generateAiFeaturesCompletion,
      generateAiFeaturesIsLoading
    );
    if (!generateAiFeaturesCompletion || generateAiFeaturesIsLoading) return [];
    try {
      const completionObject: { suggestions: string[] } = JSON.parse(
        generateAiFeaturesCompletion
      );
      return completionObject.suggestions;
    } catch (e) {
      console.error(e);
    }
    return [];
  }, [generateAiFeaturesCompletion, generateAiFeaturesIsLoading]);

  // when there are new generated AI features, add them to the buffer
  useEffect(() => {
    if (generatedAiFeatures && generatedAiFeatures.length > 0) {
      setFutureAiFeaturesBuffer([
        ...futureAiFeaturesBuffer,
        ...generatedAiFeatures,
      ]);
    }
  }, [generatedAiFeatures]);

  const [company, setCompany] = useState<Company>();
  const [corporateWorld, setCorporateWorld] = useState<CorporateWorld>();

  const handleOnboard = async () => {
    if (!onboardCompanyResponse) {
      // clear state and return
      simulationInterval.stop();
      setCompany(undefined);
      setCorporateWorld(undefined);
      setLogoImgSrc("");
      return;
    }

    setFutureFeaturesBuffer(onboardCompanyResponse.features);
    setFutureAiFeaturesBuffer([]);
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
      startGenerateAiFeatures();
      if (
        !generateFeaturesIsLoading &&
        futureFeaturesBuffer.length < 20 &&
        company &&
        company.services[0]
      ) {
        // don't wait for the promise; this can proceed asynchronously
        const generatePromiseIgnored = generateFeaturesComplete(
          JSON.stringify({
            companyName: onboardCompanyResponse.companyName,
            serviceName: onboardCompanyResponse.serviceName,
            serviceDescription: onboardCompanyResponse.serviceDescription,
            features: [
              ...[
                ...company.services[0].features,
                ...company.services[0].plannedFeatures,
              ].map((f) => f.name),
              ...futureFeaturesBuffer,
            ],
          })
        );
      }
      if (!additionalFeature) {
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

  /**
   * Check to see if mroe AI features should be generated, and if so generate them
   */
  function startGenerateAiFeatures() {
    if (
      !generateAiFeaturesIsLoading &&
      futureAiFeaturesBuffer.length < 20 &&
      company &&
      company.services[0]
    ) {
      // don't wait for the promise; this can proceed asynchronously
      const promiseIgnored = generateAiFeaturesComplete(
        JSON.stringify({
          companyName: onboardCompanyResponse.companyName,
          serviceName: onboardCompanyResponse.serviceName,
          serviceDescription: onboardCompanyResponse.serviceDescription,
          features: [
            ...[
              ...company.services[0].features,
              ...company.services[0].plannedFeatures,
            ].map((f) => f.name),
            ...futureAiFeaturesBuffer,
          ],
        })
      );
    }
  }

  const handleAddAiFeature = () => {
    setPlannedFeatures((prevFeatures) => {
      const additionalAiFeature = futureAiFeaturesBuffer.shift();
      startGenerateAiFeatures();
      if (!additionalAiFeature) {
        return prevFeatures;
      }
      setFutureAiFeaturesBuffer([...futureAiFeaturesBuffer]);

      const newAiFeatureName = additionalAiFeature;
      const newAiFeature: Feature = {
        name: newAiFeatureName,
        developmentCostDays: 60,
        perUserHostingCost: 0.09,
        perUserLicenseCost: 0.03,
        popularityMetric: 130,
        developmentProgress: 0,
        maintenanceCostDaysPerMonth: 4,
        maintained: true,
      };

      // also update the company's planned features
      company?.services[0].plannedFeatures.push(newAiFeature);
      return [...prevFeatures, additionalAiFeature];
    });
  };

  const renderFeatures = (targetFeatures: string[]) => {
    if (targetFeatures.length === 0) {
      return <p className="text-gray-500">No features currently.</p>;
    }

    return (
      <ol className="mt-2 text-sm text-gray-300 list-decimal">
        {targetFeatures.map((feature, index) => (
          <li className="list-item" key={index}>
            {feature}
          </li>
        ))}
      </ol>
    );
  };

  const [logoImgSrc, setLogoImgSrc] = useState("");
  const [logoError, setLogoError] = useState<Error | undefined>();
  const [logoDescription, setLogoDescription] = useState("");
  const [generateLogoLoading, setGenerateLogoLoading] = useState(false);
  const generateLogo = async (e: any) => {
    e.preventDefault();
    setLogoError();
    setGenerateLogoLoading(true);
    try {
      const response = await fetch("/api/generate-logo", {
        method: "POST",
        body: JSON.stringify({
          // prompt: e.target.value,
          companyName: onboardCompanyResponse.companyName,
          serviceName: onboardCompanyResponse.serviceName,
          serviceDescription: onboardCompanyResponse.serviceDescription,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setLogoImgSrc(data[0].source);
      setLogoDescription(data[0].description);
    } catch (error: any) {
      setLogoImgSrc("");
      setLogoDescription("");
      setLogoError(error);
      console.error(error);
    }
    setGenerateLogoLoading(false);
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
            <div className="mt-4">
              <button
                onClick={generateLogo}
                className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                disabled={generateLogoLoading}
              >
                {generateLogoLoading ? "Loading..." : "Generate Logo"}
              </button>
            </div>
            {logoImgSrc && !generateLogoLoading && (
              <Image
                width={512}
                height={512}
                src={logoImgSrc}
                alt={logoDescription}
                title={logoDescription}
                className="object-contain"
              />
            )}
            {generateLogoLoading && (
              <p className="flex items-center justify-center mt-4">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </p>
            )}
            {logoError && (
              <div>
                <p className="text-red-500 mt-4">
                  An error occurred while generating the logo.
                </p>
              </div>
            )}
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
            <span className="ml-2 text-gray-400 text-sm">
              ({futureFeaturesBuffer.length})
            </span>
            <button
              onClick={handleAddAiFeature}
              disabled={isLoading || users < 1000}
              className="mt-4 ml-2 flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {isLoading ? "Loading..." : "Plan AI Feature"}
            </button>
            <span className="ml-2 text-gray-400 text-sm">
              ({futureAiFeaturesBuffer.length})
            </span>
            <h3 className="text-lg font-medium text-gray-100 mt-4">
              Planned Features:
            </h3>
            {renderFeatures(plannedFeatures)}
            <h3 className="text-lg font-medium text-gray-100 mt-4">
              Implemented Features:
            </h3>
            {renderFeatures(features)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorporateSimulation;
