import React from 'react';

export function useCanvasDownload(
    canvasRef,
    vectorCanvasRef,
    showVectorPreview,
    setErrorMessage,
    setShowErrorModal
) {
    // Download with quality options and better error handling
    // Receives svgData (for freehand vectorization) via options
    const downloadCanvas = React.useCallback((format, options = {}) => {
        const { quality = 0.9, fileName = 'gemini-drawing', svgData: freehandSvgData } = options;

        // Determine which canvas to use based on preview state
        const canvasToDownload = showVectorPreview && vectorCanvasRef.current
            ? vectorCanvasRef.current
            : canvasRef.current;

        if (format !== 'svg' && !canvasToDownload) {
            setErrorMessage("Canvas not available for download.");
            setShowErrorModal(true);
            return;
        }

        if (format === 'svg' && !freehandSvgData) {
            setErrorMessage("SVG data from freehand drawing not available for download.");
            setShowErrorModal(true);
            return;
        }

        try {
            const a = document.createElement("a");

            if (format === "png") {
                a.href = canvasToDownload.toDataURL("image/png");
                a.download = `${fileName}.png`;
            } else if (format === "jpeg") {
                // Use specified quality
                a.href = canvasToDownload.toDataURL("image/jpeg", quality);
                a.download = `${fileName}.jpg`;
            } else if (format === "svg" && freehandSvgData) {
                // Format the SVG data for better compatibility
                const formattedSvgData = freehandSvgData.replace(/\n\s+/g, ' ').trim();
                const blob = new Blob([formattedSvgData], { type: "image/svg+xml" });
                a.href = URL.createObjectURL(blob);
                a.download = `${fileName}.svg`;
            } else {
                setErrorMessage(`Unsupported format or missing data for ${format}.`);
                setShowErrorModal(true);
                return;
            }

            // Use a more robust download method
            document.body.appendChild(a);
            a.click();
            // Clean up the created elements and URLs after a short delay
            setTimeout(() => {
                document.body.removeChild(a);
                if (a.href.startsWith("blob:")) {
                    URL.revokeObjectURL(a.href);
                }
            }, 100);
        } catch (err) {
            console.error("Error downloading file:", err);
            setErrorMessage(`Error downloading file: ${err.message || "Unknown error"}`);
            setShowErrorModal(true);
        }
    }, [canvasRef, vectorCanvasRef, showVectorPreview, setErrorMessage, setShowErrorModal]); // Removed svgData from dependencies as it's passed via options

    return { downloadCanvas };
}