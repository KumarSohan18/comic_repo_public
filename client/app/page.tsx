"use client";

import { useState, useEffect } from "react";
import NavMenu from "./components/NavMenu";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Cinzel } from "next/font/google";
import React from "react";

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
  const [imageLoading, setImageLoading] = useState(false);
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

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

      //console.log("Cookie present:", document.cookie.includes("token"));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 30 second timeout

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

      // MCQ handling
      if (result.mcqs && result.mcqs.length > 0) {
        const parsed = parseMcqs(result.mcqs);
        setMcqs(parsed);
        setSelectedAnswers(Array(parsed.length).fill(-1));
        setShowResults(false);
      } else {
        setMcqs([]);
      }
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

  // Helper: Parse MCQ string array to array of questions
  function parseMcqs(mcqArr: string[]): any[] {
    if (!mcqArr || !mcqArr.length) return [];
    const mcqStr = mcqArr.join("\n");
    // Split by question number (e.g., 4. **Question 4: ...)
    const questionBlocks = mcqStr
      .split(/\n\d+\.\s+\*\*Question.*?\*\*/g)
      .filter(Boolean);

    // Find all question headers
    const questionHeaders = [
      ...mcqStr.matchAll(/\n(\d+)\.\s+\*\*Question.*?\*\*\n/g),
    ].map((m) => m[0]);

    return questionBlocks.map((block, idx) => {
      // Get question text
      const questionMatch = block.match(/^\s*(.*?)\n\s*-\s*A\)/s);
      const question = questionHeaders[idx]
        ? questionHeaders[idx]
            .replace(/\n|\*\*/g, "")
            .replace(/^\d+\.\s+/, "")
            .trim()
        : questionMatch
        ? questionMatch[1].trim()
        : "";

      // Get options
      const options = [];
      const optionRegex = /-\s([A-D])\)\s(.+)/g;
      let match;
      while ((match = optionRegex.exec(block))) {
        options.push(match[2].trim());
      }

      // Get correct answer
      const correctMatch = block.match(/- Correct Answer:\s([A-D])\)/);
      const correct = correctMatch ? "ABCD".indexOf(correctMatch[1]) : -1;

      return { question, options, correct };
    });
  }

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
                    {imageLoading && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to blue animate-pulse z-20"></div>
                    )}
                    <Image
                      src={imageUrl}
                      alt="Generated comic"
                      width={800}
                      height={600}
                      className="w-full h-auto"
                      priority
                      onLoadStart={() => setImageLoading(true)}
                      onLoadingComplete={() => setImageLoading(false)}
                      onError={(e) => {
                        setImageLoading(false);
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
                        Image is available but failed to load. please check your
                        internet connection or try again later.
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

          {imageUrl && mcqs.length > 0 && (
            <div className="mt-8 bg-purple-50/80 border border-purple-200 rounded-lg p-6 shadow-inner">
              <h3 className="text-lg sm:text-xl font-bold text-purple-700 mb-4 text-center">
                Test Your Knowledge!
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowResults(true);
                }}
              >
                {mcqs.map((mcq, qIdx) => (
                  <div key={qIdx} className="mb-6">
                    <div className="font-semibold text-purple-900 mb-2">
                      {qIdx + 1}. {mcq.question}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mcq.options.map((opt: string, oIdx: number) => {
                        const isSelected = selectedAnswers[qIdx] === oIdx;
                        const isCorrect = mcq.correct === oIdx;
                        const showFeedback = showResults && isSelected;
                        return (
                          <label
                            key={oIdx}
                            className={`flex items-center p-2 rounded cursor-pointer border transition
                    ${
                      showResults
                        ? isCorrect
                          ? "bg-green-100 border-green-400"
                          : isSelected
                          ? "bg-red-100 border-red-400"
                          : "bg-white border-gray-200"
                        : isSelected
                        ? "bg-blue-100 border-blue-400"
                        : "bg-white border-gray-200"
                    }
                  `}
                          >
                            <input
                              type="radio"
                              name={`mcq-${qIdx}`}
                              value={oIdx}
                              checked={isSelected}
                              disabled={showResults}
                              onChange={() => {
                                if (showResults) return;
                                const updated = [...selectedAnswers];
                                updated[qIdx] = oIdx;
                                setSelectedAnswers(updated);
                              }}
                              className="mr-2 accent-purple-600"
                            />
                            <span className="text-black">{opt}</span>
                            {showFeedback && isCorrect && (
                              <span className="ml-2 text-green-600 font-bold">
                                ✓ Correct
                              </span>
                            )}
                            {showFeedback && !isCorrect && isSelected && (
                              <span className="ml-2 text-red-600 font-bold">
                                ✗ Incorrect
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {!showResults && (
                  <button
                    type="submit"
                    className="w-full py-2 mt-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-bold text-sm uppercase tracking-widest transition-all border-2 border-transparent shadow-lg hover:shadow-xl"
                  >
                    Check Answers
                  </button>
                )}
                {showResults && (
                  <div className="text-center mt-4 text-purple-700 font-semibold">
                    You got{" "}
                    {
                      mcqs.filter(
                        (mcq, idx) => selectedAnswers[idx] === mcq.correct
                      ).length
                    }{" "}
                    out of {mcqs.length} correct!
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
