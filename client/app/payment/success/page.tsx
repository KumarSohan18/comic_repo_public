"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const PaymentSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [credits, setCredits] = useState<string | null>(null);

  useEffect(() => {
    const creditsParam = searchParams.get("credits");
    setCredits(creditsParam);

    // If no credits param is provided, assume something went wrong
    if (!creditsParam) {
      console.warn("No credits parameter found in success page URL");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 mx-auto rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Payment Successful!
        </h2>

        <p className="text-gray-600 mb-6">
          {credits
            ? `${credits} credits have been added to your account.`
            : "Your payment has been processed successfully."}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-block w-full py-3 px-4 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
          >
            Return to Home
          </Link>

          <Link
            href="/profile"
            className="inline-block w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            View My Credits
          </Link>
        </div>
      </div>
    </div>
  );
};

const PaymentSuccessPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
};

export default PaymentSuccessPage;
