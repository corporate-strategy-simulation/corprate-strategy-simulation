import { useState } from "react";

interface SalesDemoSimulationProps {
  features: string[];
}

export function SalesDemoSimulation({ features }: SalesDemoSimulationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % features.length);
  };

  const handlePrev = () => {
    setCurrentSlide(
      (prevSlide) => (prevSlide - 1 + features.length) % features.length
    );
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Sales Demo</h2>
      <div className="w-full max-w-md p-4 border rounded shadow">
        <h3 className="text-xl font-semibold">{features[currentSlide]}</h3>
        <img
          src="https://via.placeholder.com/300"
          alt="Placeholder"
          className="my-4 w-full"
        />
        <p className="text-gray-600">
          This is a demo of the feature: {features[currentSlide]}
        </p>
      </div>
      <div className="flex mt-4">
        <button
          onClick={handlePrev}
          className="px-4 py-2 mr-2 bg-blue-500 text-white rounded"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}
