"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LoadingSpinner from "./LoadingSpinner";

interface UserImage {
  image_url: string;
  created_at: string;
}

const NavMenu = () => {
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [isUserDashboardOpen, setIsUserDashboardOpen] = useState(false);
  const [userImages, setUserImages] = useState<UserImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const router = useRouter();
  const url =
    process.env.NODE_ENV === "production"
      ? "https://api.sohankumar.com"
      : "http://localhost:8000";

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(url + "/auth/status", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
      setError(null);
    } catch (error) {
      console.error("Auth status check failed:", error);
      setIsAuthenticated(false);
      setError("Failed to check authentication status");
    }
  };

  const handleLogin = () => {
    window.location.href = url + "/auth/google";
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(url + "/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(false);
        setUserDropdownOpen(false);
        setIsUserDashboardOpen(false);
        setError(null);
      } else {
        throw new Error(data.message || "Logout failed");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to logout. Please try again.");
    }
  };

  const fetchUserImages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(url + "user/images", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch images");
      const data = await response.json();
      setUserImages(data.images || []);
    } catch (error) {
      console.error("Error fetching user images:", error);
      setError("Failed to fetch images");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserImages();
    }
  }, [isAuthenticated]);

  const buttonBaseClasses =
    "px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-md transition-all duration-300 shadow-lg flex items-center gap-1 sm:gap-1.5";

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.25, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 }); // Reset position when fully zoomed out
      }
      return newScale;
    });
  };
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <>
      {error && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-center text-sm">
          {error}
        </div>
      )}
      <div className="fixed top-2 sm:top-3 left-2 sm:left-3 z-40">
        <div className="relative group">
          <button
            onClick={() => router.push("/payment")}
            className={`${buttonBaseClasses} bg-gradient-to-r from-rose-100 to-teal-100 text-gray-700 hover:from-rose-200 hover:to-teal-200 hover:shadow-teal-500/20`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-4 sm:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Pricing</span>
          </button>
        </div>
      </div>

      <div className="fixed top-2 sm:top-3 right-2 sm:right-3 flex flex-row gap-1.5 sm:gap-3 z-40">
        <div className="relative group">
          <button
            onClick={() => setIsResumeOpen(true)}
            className={`${buttonBaseClasses} bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-800 hover:from-amber-500 hover:to-yellow-600`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-4 sm:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="hidden sm:inline">Resume</span>
          </button>
        </div>

        <div className="relative group">
          <a
            href="https://www.linkedin.com/in/kmrsohan/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonBaseClasses} bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-700 hover:to-blue-900`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-4 sm:w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            <span className="hidden sm:inline">LinkedIn</span>
          </a>
        </div>

        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className={`${buttonBaseClasses} bg-gradient-to-r from-gray-100 to-white text-gray-900 hover:from-gray-200 hover:to-gray-100`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 sm:h-4 sm:w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 sm:w-48 bg-black/90 border-2 border-white/20 shadow-xl">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setIsUserDashboardOpen(true);
                  }}
                  className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white hover:bg-white/10 text-left"
                >
                  My Comics
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white hover:bg-white/10 text-left"
                >
                  {isLoading ? "..." : "Logout"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className={`${buttonBaseClasses} bg-gradient-to-r from-gray-100 to-white text-gray-900 hover:from-gray-200 hover:to-gray-100`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-4 sm:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Login with Google</span>
            <span className="inline sm:hidden">Login</span>
          </button>
        )}
      </div>

      <Modal isOpen={isResumeOpen} onClose={() => setIsResumeOpen(false)}>
        <div className="bg-white rounded-lg overflow-hidden max-w-5xl w-[95vw]">
          <div className="flex justify-between items-center bg-gray-100 px-4 py-2">
            <h3 className="font-semibold text-gray-800">Resume</h3>
            <div className="flex items-center space-x-2">
              <a
                href="https://comicimages3upload.s3.us-east-1.amazonaws.com/Sohan+resume+draft+2.0.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Open in New Tab
              </a>
              <button
                onClick={() => setIsResumeOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
          <iframe
            src={`https://comicimages3upload.s3.us-east-1.amazonaws.com/Sohan+resume+draft+2.0.pdf#view=FitH&toolbar=0`}
            title="My Resume"
            className="w-full border-none"
            style={{
              width: "100%",
              height: "85vh",
              minHeight: "500px",
            }}
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
            <a
              href="https://comicimages3upload.s3.us-east-1.amazonaws.com/Sohan+resume+draft+2.0.pdf"
              download
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              Download
            </a>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isUserDashboardOpen}
        onClose={() => setIsUserDashboardOpen(false)}
      >
        <div className="p-6 w-[90vw] max-w-7xl h-[90vh] overflow-y-auto bg-gray-900 rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              My Generated Comics
            </h2>
            <button
              onClick={() => setIsUserDashboardOpen(false)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userImages.length > 0 ? (
              userImages.map((image, index) => (
                <div
                  key={index}
                  className="border border-white/20 rounded-lg p-4 bg-black/50 cursor-pointer hover:border-white/40 transition-all"
                  onClick={() => {
                    setSelectedImage(image.image_url);
                    setShowModal(true);
                    setIsUserDashboardOpen(false);
                    setImageLoading(true);
                  }}
                >
                  <div className="relative w-full h-[300px]">
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <LoadingSpinner />
                      </div>
                    )}
                    <Image
                      src={image.image_url}
                      alt={`Generated comic ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={index < 4}
                      onLoadingComplete={() => setImageLoading(false)}
                      onLoadStart={() => setImageLoading(true)}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {new Date(image.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-400 py-8">
                No generated comics yet. Try creating one!
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="relative w-[95vw] max-w-7xl mx-auto">
          <div
            className="relative w-full h-[90vh] overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {selectedImage && (
              <>
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                    <LoadingSpinner />
                  </div>
                )}
                <div
                  className="absolute w-full h-full"
                  style={{
                    transform: `scale(${scale}) translate(${
                      position.x / scale
                    }px, ${position.y / scale}px)`,
                    transition: isDragging ? "none" : "transform 0.2s",
                    cursor:
                      scale > 1
                        ? isDragging
                          ? "grabbing"
                          : "grab"
                        : "default",
                  }}
                >
                  <Image
                    src={selectedImage}
                    alt="Full size comic"
                    fill
                    className="object-contain"
                    sizes="95vw"
                    priority
                    onLoadingComplete={() => setImageLoading(false)}
                    onLoadStart={() => setImageLoading(true)}
                    draggable={false}
                  />
                </div>
              </>
            )}
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
            <button
              onClick={(e) => {
                e.stopPropagation();
                zoomOut();
              }}
              className="bg-black/50 text-white p-2 rounded-full hover:bg-black/75"
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
                  d="M20 12H4"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetZoom();
              }}
              className="bg-black/50 text-white px-3 py-2 rounded-full hover:bg-black/75"
            >
              Reset
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                zoomIn();
              }}
              className="bg-black/50 text-white p-2 rounded-full hover:bg-black/75"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          <button
            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 z-30"
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(false);
              setIsUserDashboardOpen(true);
              resetZoom();
            }}
          >
            ✕
          </button>
        </div>
      </Modal>
    </>
  );
};

export default NavMenu;
