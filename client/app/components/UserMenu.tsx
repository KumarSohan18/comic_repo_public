"use client";

import { useState } from "react";

interface ComicGeneration {
  id: string;
  prompt: string;
  genre: string;
  style: string;
  date: string;
  imageUrl: string;
}

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Mock data - replace with actual API calls
  const mockHistory: ComicGeneration[] = [
    {
      id: "1",
      prompt: "A superhero flying through space",
      genre: "Sci-fi",
      style: "American Comic",
      date: "2024-03-10",
      imageUrl: "/mock-comic-1.jpg",
    },
    // Add more mock items as needed
  ];

  return (
    <div className="relative">
      {/* User Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 z-50 bg-white/10 p-2 rounded-full border-2 border-white/20 hover:bg-white/20 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="white"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed top-16 right-6 z-50 w-64 bg-black/90 border-2 border-white/20 shadow-xl">
          {!isLoggedIn ? (
            <div className="p-4 space-y-4">
              <button
                onClick={() => setIsLoggedIn(true)}
                className="w-full py-2 px-4 bg-white text-black font-semibold hover:bg-purple-500 hover:text-white transition-colors"
              >
                Login
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full py-2 px-4 bg-white text-black font-semibold hover:bg-purple-500 hover:text-white transition-colors"
              >
                View History
              </button>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setShowHistory(false);
                }}
                className="w-full py-2 px-4 bg-black text-white border-2 border-white/20 font-semibold hover:bg-white/10 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
          <div className="bg-black/90 border-2 border-white/20 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Generation History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-white hover:text-purple-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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
              </button>
            </div>
            <div className="space-y-4">
              {mockHistory.map((item) => (
                <div
                  key={item.id}
                  className="border-2 border-white/20 p-4 space-y-2"
                >
                  <p className="text-white/80 text-sm">{item.date}</p>
                  <p className="text-white font-medium">{item.prompt}</p>
                  <div className="flex gap-2">
                    <span className="text-purple-400 text-sm">
                      {item.genre}
                    </span>
                    <span className="text-purple-400 text-sm">
                      {item.style}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
