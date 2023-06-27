import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useCompletion } from "ai/react";

type CompanyOnboardModalProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const CompanyOnboardModal = ({ open, setOpen }: CompanyOnboardModalProps) => {
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

  const onboardCompanyResponse: Record<string, any> = useMemo(() => {
    console.log("response", completion, isLoading);
    // the string will not be valid JSON until it is finished loading
    if (!completion || isLoading) return null;
    try {
      return JSON.parse(completion);
    } catch (e) {
      console.error(e);
    }
    return null;
  }, [completion, isLoading]);
  console.log("onboardCompanyResponse", onboardCompanyResponse);

  return (
    <Transition.Root show={open} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed z-10 inset-0 overflow-y-auto"
        onClose={setOpen}
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:p-6 w-full max-w-3xl">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-auto">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Company Onboard Modal
              </Dialog.Title>
              <form onSubmit={handleSubmit}>
                <div className="mt-4">
                  <label
                    htmlFor="topic"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Topic or Suggestion
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="topic"
                      id="topic"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md text-gray-900"
                      value={input}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                  <h3 className="text-lg font-medium text-gray-900">
                    Generated Company:
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {onboardCompanyResponse.companyName}
                  </p>
                  <h3 className="text-lg font-medium text-gray-900 mt-4">
                    Service:
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {onboardCompanyResponse.serviceName}
                  </p>
                  <h3 className="text-lg font-medium text-gray-900 mt-4">
                    Description:
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {onboardCompanyResponse.serviceDescription}
                  </p>
                  <h3 className="text-lg font-medium text-gray-900 mt-4">
                    Features:
                  </h3>
                  <ul className="mt-2 text-sm text-gray-500">
                    {onboardCompanyResponse.features ? onboardCompanyResponse.features.map((feature: string, i: string) => (
                        <li key={i}>{feature}</li>
                        )
                    ) : null}
                  </ul>                  
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CompanyOnboardModal;
