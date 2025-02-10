"use client";
import { useState, useRef } from "react";

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [svgResult, setSvgResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setIsProcessing(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:5328/api/process", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Processing failed");
      }

      setSvgResult(data.svg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    await processFile(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDownload = () => {
    if (!svgResult) return;

    const blob = new Blob([svgResult], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "processed-image.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex min-h-screen flex-col  items-center justify-center p-24">
      <div className="flex mb-4 justify-start w-full max-w-2xl">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-lg font-semibold">sketch-to-svg</h1>
          <button
            onClick={() => {
              const link = document.createElement("a");
              link.href = "/frame.svg";
              link.download = "frame.svg";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Download Frame
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-1 mb-4 w-full max-w-2xl">
        (1) download the frame, (2) print it, (3) draw with blank marker within
        the frame borders, (4) take a picture, and (5) upload it to this
        interface.
      </p>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden items-center"
      />

      <div
        className={`w-full max-w-2xl h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-400"}
          ${isProcessing ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Processing image...</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg mb-2">Drag and drop an image here</p>
            <p className="text-sm text-gray-400">or click to select a file</p>
            <p className="text-sm text-gray-400 mt-2">
              Supported formats: PNG, JPG, JPEG
            </p>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-500 rounded-lg">
          error found, try again and if this keeps happening, make the sketch
          simpler
        </div>
      )}
      {svgResult && (
        <div className="mt-8 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Result:</h2>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Download SVG
            </button>
          </div>
          <div
            className="border rounded-lg p-4 bg-white overflow-hidden"
            style={{ maxHeight: "400px" }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div
                className="w-full"
                style={{
                  maxWidth: "100%",
                  maxHeight: "360px", // Accounting for padding
                  display: "flex",
                  justifyContent: "center",
                }}
                dangerouslySetInnerHTML={{
                  __html: svgResult.replace(
                    /<svg/,
                    '<svg style="max-width:100%;height:auto;"'
                  ),
                }}
              />
            </div>
          </div>
        </div>
      )}
      <div className="text-center mt-4 text-sm text-gray-400">
        <p>made by amrit and ritik</p>
        <p className="mt-1">
          forked from{" "}
          <a
            href="https://gitlab.cba.mit.edu/quentinbolsee/aruco-frame"
            className="text-blue-500 hover:underline"
          >
            aruco-frame
          </a>
        </p>
      </div>
    </main>
  );
}
