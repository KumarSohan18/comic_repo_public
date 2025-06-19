"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}
const url =
  process.env.NODE_ENV === "production"
    ? "https://api.sohankumar.com"
    : "http://localhost:8000";
const Payment = () => {
  const router = useRouter();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      console.log("Attempting to load Razorpay script");

      // Check if already loaded
      if (window.Razorpay) {
        console.log("Razorpay already available on window");
        return resolve(true);
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.id = "razorpay-checkout-js";
      script.async = true;

      script.onload = () => {
        console.log(
          "Razorpay script loaded successfully, window.Razorpay available:",
          !!window.Razorpay
        );
        resolve(true);
      };

      script.onerror = (e) => {
        console.error("Failed to load Razorpay script:", e);
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    console.log("Payment process started");

    // Check authentication first
    try {
      const authResponse = await fetch(url + "/auth/status", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      console.log("Auth status response:", authResponse.status);

      // Check if auth request was successful
      if (!authResponse.ok) {
        console.error("Auth status check failed:", authResponse.status);
        toast.error("Unable to verify authentication status");
        return;
      }

      const authData = await authResponse.json();
      console.log("Auth status data:", authData);

      if (!authData.isAuthenticated) {
        console.error("User is not authenticated");
        toast.error("Please login before making a payment");
        router.push("/login");
        return;
      }
      console.log("Authentication confirmed with user:", authData.user);
    } catch (error) {
      console.error("Failed to check authentication:", error);
      toast.error("Authentication check failed. Please login again.");
      router.push("/login");
      return;
    }

    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      console.error("Failed to load Razorpay script");
      toast.error("Razorpay SDK failed to load");
      return;
    }
    console.log("Razorpay script loaded successfully");

    try {
      console.log("Making API request to create order");
      const orderResponse = await fetch(url + "/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            document.cookie
              .split("; ")
              .find((row) => row.startsWith("token="))
              ?.split("=")[1] || ""
          }`,
        },
        credentials: "include", // Important for sending cookies
        body: JSON.stringify({ planType: "BASIC" }), // Explicitly specify plan type
      });

      console.log("Order API response status:", orderResponse.status);

      if (!orderResponse.ok) {
        let errorMessage = "Failed to create order";
        try {
          const errorData = await orderResponse.json();
          console.error("Order creation failed:", errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }

        if (orderResponse.status === 401) {
          toast.error("Please login first");
          router.push("/login");
          return;
        }
        throw new Error(errorMessage);
      }

      let orderData;
      try {
        orderData = await orderResponse.json();
        console.log("Order created successfully:", orderData);
      } catch (e) {
        console.error("Failed to parse order response:", e);
        throw new Error("Invalid response from server");
      }

      if (!orderData.orderId) {
        console.error("Missing orderId in response:", orderData);
        toast.error("Invalid order data received");
        return;
      }

      if (!orderData.keyId) {
        console.error("Missing keyId in order response:", orderData);
        toast.error("Payment gateway configuration missing");
        return;
      }

      console.log("Got keyId from server:", orderData.keyId);

      // Initialize Razorpay options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ComicAI",
        description: "Purchase Credits",
        order_id: orderData.orderId,
        handler: async (response: any) => {
          console.log("Payment success callback received:", response);
          try {
            // Verify payment
            const verifyResponse = await fetch(
              url + "/api/payments/verify-payment", // call to verify payment
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            if (!verifyResponse.ok) {
              console.error(
                "Payment verification failed with status:",
                verifyResponse.status
              );
              // Redirect to failure page with error details
              router.push(
                `/payment/failure?error=verification_failed&code=${verifyResponse.status}`
              );
              return;
            }

            const verifyData = await verifyResponse.json();
            toast.success(
              `Payment successful! ${verifyData.credits} credits added to your account.`
            );
            // Redirect to success page with credits info
            router.push(`/payment/success?credits=${verifyData.credits}`);
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed");
            // Redirect to failure page with generic error
            router.push("/payment/failure?error=unknown");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#3B82F6",
        },
        // Add modal closed callback
        modal: {
          ondismiss: function () {
            console.log("Payment modal dismissed");
            toast("Payment cancelled");
            // Redirect to failure page when modal is dismissed
            router.push(url + "/payment/failure?error=cancelled");
          },
        },
        // Add notes for domain validation
        notes: {
          merchant_order_id: orderData.orderId,
          // Add any other notes that might help
        },
      };

      console.log("Initializing Razorpay with options:", options);
      try {
        // Validate Razorpay is available
        if (typeof window.Razorpay !== "function") {
          console.error(
            "Razorpay not available as a function. window.Razorpay:",
            window.Razorpay
          );
          // Try to re-load the script as a last resort
          await loadRazorpayScript();
          if (typeof window.Razorpay !== "function") {
            toast.error("Payment gateway not available");
            return;
          }
        }

        console.log("Creating Razorpay instance with key:", options.key);
        console.log("Order ID to be used:", options.order_id);

        try {
          // Create Razorpay instance
          const razorpay = new window.Razorpay(options);
          console.log("Razorpay instance created:", !!razorpay);

          // Setting up event listeners
          razorpay.on("payment.failed", function (response: any) {
            console.error("Payment failed:", response.error);
            toast.error(`Payment failed: ${response.error.description}`);
          });

          // Open the payment modal
          console.log("Opening payment modal...");
          razorpay.open();
          console.log("Payment modal opened successfully");
        } catch (error) {
          console.error("Failed to initialize Razorpay instance:", error);
          toast.error("Could not initialize payment gateway");
        }
      } catch (error) {
        console.error("Failed to initialize Razorpay. Error details:", error);
        // Check if the specific error is related to key
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("key")) {
          console.error("Error appears to be related to the Razorpay key");
          toast.error("Invalid payment configuration. Please contact support.");
        } else {
          toast.error("Failed to open payment gateway");
        }
      }
    } catch (error) {
      console.error("Payment process error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process payment"
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Purchase Credits
        </h2>
        <div className="bg-blue-50/70 p-6 rounded-xl mb-6 transition-all hover:shadow-md">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">
            Basic Package
          </h3>
          <p className="text-gray-600 mb-2">Get 100 credits</p>
          <p className="text-2xl font-bold text-blue-600">₹499</p>
        </div>
        <button
          onClick={handlePayment}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-all hover:shadow-lg transform hover:-translate-y-0.5"
        >
          Purchase Now
        </button>
      </div>
    </div>
  );
};

export default Payment;
