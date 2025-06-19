"use client";

import { useState, useEffect } from "react";
import NavMenu from "./components/NavMenu";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Cinzel } from "next/font/google";

const cinzel = Cinzel({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const router = useRouter();
  const url =
    process.env.NODE_ENV === "production"
      ? "https://api.sohankumar.com"
      : "http://localhost:8000";

  useEffect(() => {
    // Set page as loaded when component mounts
    setPageLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setImageUrl(null); // Clear previous image

    try {
      const formData = new FormData(e.currentTarget);
      const prompt = formData.get("prompt") as string;
      const genre = formData.get("genre") as string;
      const style = formData.get("style") as string;
      const exclude = (formData.get("exclude") as string) || "violence";

      console.log("Cookie present:", document.cookie.includes("token"));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 30 second timeout

      const response = await fetch(url + "/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          user_theme: prompt,
          genre,
          style,
          dont_include: exclude,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Server is currently busy processing other requests. Please try again in a few moments."
          );
        }
        if (response.status === 503) {
          throw new Error(
            "Service is temporarily unavailable. Please try again later."
          );
        }
        if (response.status === 408 || response.status === 504) {
          throw new Error(
            "Request timed out. The server is taking too long to respond."
          );
        }
        if (response.status === 400) {
          throw new Error(
            "Profanity detected ! Inappropriate request. Please check your input and try again."
          );
        }
        throw new Error(
          "Failed to generate comic. Please try again or modify your request."
        );
      }

      const result = await response.json();
      if (!result.image_url) {
        throw new Error(
          "No comic was generated. Please try again with different parameters."
        );
      }

      setImageUrl(result.image_url);
    } catch (error: any) {
      console.error("Generation error:", error);
      if (error.name === "AbortError") {
        setError(
          "Request timed out. The server is busy. Urge to try again later."
        );
      } else {
        setError(error instanceof Error ? error.message : "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <NavMenu />
      <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 pb-24">
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-purple-200/50 mb-6 sm:mb-12">
          <div className="text-center mb-6 sm:mb-8 relative">
            <div className="relative z-10">
              <h1
                className={`text-2xl sm:text-4xl md:text-5xl font-bold text-center tracking-wide ${cinzel.className}`}
              >
                <span className="bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 text-transparent bg-clip-text animate-gradient drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                  EDUTAINMENT COMICS
                </span>
              </h1>
              <p className="mt-3 text-sm sm:text-base md:text-lg text-gray-600 font-medium tracking-wide">
                Master the concepts through visual learning
              </p>
            </div>
            <div className="flex justify-center mt-4">
              <div className="h-0.5 w-40 bg-gradient-to-r from-purple-300 via-blue-300 to-purple-300"></div>
            </div>
            <style jsx>{`
              @keyframes gradient {
                0% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
                100% {
                  background-position: 0% 50%;
                }
              }
              .animate-gradient {
                background-size: 200% auto;
                animation: gradient 4s ease infinite;
              }
            `}</style>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-3 sm:space-y-5 max-w-lg mx-auto font-montserrat"
          >
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm text-center rounded">
                <p>{error}</p>
                {error.includes("GitHub") && (
                  <a
                    href="https://github.com/kumarsohan18/" // need to change this later, important
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-red-300 ml-1"
                  >
                    Visit GitHub
                  </a>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="prompt"
                className="block text-xs text-purple-900 uppercase tracking-wider font-semibold"
              >
                User Prompt
              </label>
              <textarea
                id="prompt"
                name="prompt"
                rows={4}
                required
                className="w-full p-2 bg-purple-50/80 text-purple-900 placeholder-purple-400 border-2 border-purple-200 focus:outline-none focus:border-purple-400 transition-colors text-sm rounded-lg font-medium min-h-[120px] sm:min-h-[160px] resize-none"
                placeholder="Describe your prompt. A single sentence should suffice. Example: 'Explain the concept of white blood cells.'"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="genre"
                className="block text-xs text-purple-900 uppercase tracking-wider font-semibold"
              >
                Genre
              </label>
              <select
                id="genre"
                name="genre"
                required
                className="w-full p-2 bg-purple-50/80 text-purple-900 border-2 border-purple-200 focus:outline-none focus:border-purple-400 transition-colors rounded-lg appearance-none text-sm font-medium h-10"
              >
                <option value="" className="bg-white">
                  Select a genre...
                </option>
                <option value="science" className="bg-white">
                  Science
                </option>
                <option value="social" className="bg-white">
                  Social
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="style"
                className="block text-xs text-purple-900 uppercase tracking-wider font-semibold"
              >
                Style
              </label>
              <select
                id="style"
                name="style"
                required
                className="w-full p-2 bg-purple-50/80 text-purple-900 border-2 border-purple-200 focus:outline-none focus:border-purple-400 transition-colors rounded-lg appearance-none text-sm font-medium h-10"
              >
                <option value="" className="bg-white">
                  Select a style...
                </option>
                <option value="american" className="bg-white">
                  American Comic
                </option>
                <option value="japanese" className="bg-white">
                  Japanese Manga
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="exclude"
                className="block text-xs text-purple-900 uppercase tracking-wider font-semibold"
              >
                Don't Want to Include
              </label>
              <input
                type="text"
                id="exclude"
                name="exclude"
                className="w-full p-2 bg-purple-50/80 text-purple-900 placeholder-purple-400 border-2 border-purple-200 focus:outline-none focus:border-purple-400 transition-colors rounded-lg text-sm font-medium h-10"
                placeholder="Elements to exclude. Example: 'blood, gore' default will be violence"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 px-5 mt-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-bold text-sm uppercase tracking-widest transition-all border-2 border-transparent shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                ${
                  isLoading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:from-purple-600 hover:to-blue-600"
                }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                "Generate"
              )}
            </button>

            {/* Premium service info */}
            <div className="mt-6 text-center border-t border-purple-100 pt-6">
              <p className="text-gray-600 text-sm mb-2">
                To generate more comic panels or to access more generation
                functionalty,checkout our premium services. Login required.
              </p>
              <p className="text-gray-500 text-xs">
                (Upon clicking, you will be redirected to a secure Razorpay
                Payment gateway ,currently set to demo mode so no actual payment
                will be allowed. )
              </p>
              <button
                onClick={() => router.push("/payment")} // check needed
                className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium hover:underline transition-colors"
              >
                Upgrade to Premium →
              </button>
            </div>
          </form>

          {imageUrl && (
            <div className="mt-4 sm:mt-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2 sm:mb-4 uppercase tracking-widest font-montserrat">
                Your Generated Comic
              </h2>
              <div className="relative border-2 sm:border-4 border-white/20 shadow-xl bg-black/30 min-h-[150px] sm:min-h-[200px] flex items-center justify-center">
                {isLoading ? (
                  <div className="text-white text-lg">Loading image...</div>
                ) : (
                  <>
                    <Image
                      src={imageUrl}
                      alt="Generated comic"
                      width={800}
                      height={600}
                      className="w-full h-auto"
                      priority
                      onLoadingComplete={() => {}}
                      onError={(e) => {
                        console.error("Image failed to load:", imageUrl);
                        const target = e.target as HTMLImageElement;
                        if (target) {
                          target.style.display = "none";
                          document.getElementById(
                            "image-fallback"
                          )!.style.display = "flex";
                        }
                      }}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center text-white text-center p-4"
                      id="image-fallback"
                      style={{ display: "none" }}
                    >
                      <p>
                        Image is available but cannot be displayed directly.
                        <br />
                        Please use the &quot;View Full Image&quot; button below.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {imageUrl && !isLoading && (
                <div className="mt-2 sm:mt-4 flex justify-center">
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 sm:px-4 bg-purple-600 text-white text-sm sm:text-base font-bold rounded-none hover:bg-purple-700 transition-colors"
                  >
                    View Full Image
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
