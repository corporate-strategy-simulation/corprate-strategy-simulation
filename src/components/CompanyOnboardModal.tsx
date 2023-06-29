import { Dialog, Transition } from "@headlessui/react";
import React, { Dispatch, SetStateAction } from "react";
import CorporateSimulation from "./CorporateSimulation";

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

type CompanyOnboardModalProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const CompanyOnboardModal = ({ open, setOpen }: CompanyOnboardModalProps) => {
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
              <CorporateSimulation />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CompanyOnboardModal;
