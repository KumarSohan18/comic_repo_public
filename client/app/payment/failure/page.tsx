"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const PaymentFailureContent = () => {
  const searchParams = useSearchParams();
  const [errorType, setErrorType] = useState<string>("unknown");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error") || "unknown";
    const code = searchParams.get("code");

    setErrorType(error);
    setErrorCode(code);
  }, [searchParams]);

  // Map error types to user-friendly messages
  const getErrorMessage = () => {
    switch (errorType) {
      case "verification_failed":
        return `Payment was processed but verification failed. Error code: ${
          errorCode || "unknown"
        }`;
      case "cancelled":
        return "Payment was cancelled.";
      case "gateway_error":
        return "The payment gateway encountered an error.";
      default:
        return "An unexpected error occurred during payment processing.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-100 mx-auto rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Payment Failed
        </h2>

        <p className="text-gray-600 mb-6">{getErrorMessage()}</p>

        <div className="flex flex-col gap-3">
          <Link
            href="/payment"
            className="inline-block w-full py-3 px-4 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
          >
            Try Again
          </Link>

          <Link
            href="/"
            className="inline-block w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Return to Home
          </Link>

          <button
            onClick={() =>
              (window.location.href =
                "mailto:support@comicai.app?subject=Payment%20Issue")
            }
            className="inline-block w-full py-3 px-4 bg-white text-gray-500 font-medium rounded-md hover:text-gray-700 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentFailurePage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <PaymentFailureContent />
    </Suspense>
  );
};

export default PaymentFailurePage;
