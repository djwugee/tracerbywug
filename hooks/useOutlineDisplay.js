import React from 'react';

export function useOutlineDisplay(aspectRatio) {
    const outlineCanvasRef = React.useRef(null);
    const outlineContainerRef = React.useRef(null);
    const [outlineCanvasWidth, setOutlineCanvasWidth] = React.useState(400);
    const [outlineCanvasHeight, setOutlineCanvasHeight] = React.useState(300);

    React.useEffect(() => {
        const updateCanvasDimensions = () => {
            if (outlineContainerRef.current) {
                const containerWidth = outlineContainerRef.current.clientWidth;
                const containerHeight = aspectRatio > 0 ? containerWidth / aspectRatio : containerWidth * (9/16); // Default fallback
                setOutlineCanvasWidth(containerWidth);
                setOutlineCanvasHeight(containerHeight);
            }
        };
        updateCanvasDimensions(); // Initial call
        window.addEventListener("resize", updateCanvasDimensions);
        return () => window.removeEventListener("resize", updateCanvasDimensions);
    }, [aspectRatio, outlineContainerRef]);

    const drawImageToOutlineCanvas = React.useCallback(async (imageUrl, displayWidth, displayHeight) => {
        if (!outlineCanvasRef.current || !imageUrl) return false;
        const canvas = outlineCanvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
            console.error("Could not get 2D context from outline canvas");
            return false;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        try {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = (err) => {
                    console.error("Image load error for outline canvas:", err);
                    reject(err);
                };
                img.src = imageUrl;
            });

            canvas.width = displayWidth; // Set canvas internal drawing size
            canvas.height = displayHeight;
            ctx.fillStyle = "#FFFFFF"; // Ensure background for transparency in source image
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw image filling this internal size
            return true;
        } catch (error) {
            console.error("Failed to draw image to outline canvas:", error);
            return false;
        }
    }, []);


    return {
        outlineCanvasRef,
        outlineContainerRef,
        outlineCanvasWidth,
        outlineCanvasHeight,
        drawImageToOutlineCanvas,
    };
}