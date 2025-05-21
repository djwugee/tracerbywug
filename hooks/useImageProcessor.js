import React from 'react';
import { useTracingSettings } from './useTracingSettings.js';
import { useOutlineDisplay } from './useOutlineDisplay.js';
import {
    generateBitmapOutlineFromAPI,
    generateDirectSvgFromAPI,
    generateSvgFromRasterCanvas,
    adjustSvgResolutionUtil
} from '../services/imageProcessingService.js';

export function useImageProcessor(
    uploadedImage, apiKey, originalWidth, originalHeight, aspectRatio, onOutlineGenerated
) {
    const {
        tracingSettings, 
        lineThickness, setLineThickness,
        detailLevel, setDetailLevel,
        simplifyLevel, setSimplifyLevel,
        enhanceEdges, setEnhanceEdges,
        traceMode, setTraceMode,
        outputResolution, setOutputResolution, 
        directVectorMode, setDirectVectorMode
    } = useTracingSettings({
    });

    const {
        outlineCanvasRef,
        outlineContainerRef,
        outlineCanvasWidth,
        outlineCanvasHeight,
        drawImageToOutlineCanvas
    } = useOutlineDisplay(aspectRatio);

    const [processedOutline, setProcessedOutline] = React.useState(null); 
    const [svgData, setSvgData] = React.useState(null); 
    const [svgGenerationStatus, setSvgGenerationStatus] = React.useState("idle");
    
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [processingProgress, setProcessingProgress] = React.useState(0);
    const [error, setError] = React.useState(null);
    const abortControllerRef = React.useRef(null);

    const processImage = React.useCallback(async () => {
        if (!uploadedImage || !apiKey) return false;

        setIsProcessing(true);
        setProcessingProgress(0);
        setProcessedOutline(null);
        setSvgData(null);
        setSvgGenerationStatus("idle");
        setError(null);

        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            const base64ImageData = uploadedImage.split(",")[1];
            setProcessingProgress(20);

            const bitmapOutlineDataUrl = await generateBitmapOutlineFromAPI(
                base64ImageData, apiKey, tracingSettings, aspectRatio, originalWidth, originalHeight, signal
            );
            setProcessedOutline(bitmapOutlineDataUrl);
            setProcessingProgress(50);

            await drawImageToOutlineCanvas(bitmapOutlineDataUrl, outlineCanvasWidth, outlineCanvasHeight);
            setProcessingProgress(70);

            let tempSvgString = null; 
            setSvgGenerationStatus("generating");

            if (tracingSettings.directVectorMode) {
                const initialSvgDimensions = { width: outlineCanvasWidth, height: outlineCanvasHeight };
                tempSvgString = await generateDirectSvgFromAPI(
                    base64ImageData, apiKey, tracingSettings, initialSvgDimensions, aspectRatio, signal
                );
                
                if (!tempSvgString && outlineCanvasRef.current) { 
                    console.warn("Direct SVG generation failed or returned null, falling back to raster-based SVG generation.");
                    tempSvgString = generateSvgFromRasterCanvas(outlineCanvasRef.current, tracingSettings.lineThickness, tracingSettings.simplifyLevel);
                }
            } else if (outlineCanvasRef.current) { 
                tempSvgString = generateSvgFromRasterCanvas(outlineCanvasRef.current, tracingSettings.lineThickness, tracingSettings.simplifyLevel);
            }

            let finalSvgString = null;
            if (tempSvgString) {
                finalSvgString = adjustSvgResolutionUtil(tempSvgString, tracingSettings.outputResolution, outlineCanvasWidth, outlineCanvasHeight);
                setSvgData(finalSvgString);
                setSvgGenerationStatus("success");
            } else {
                setSvgData(null);
                setSvgGenerationStatus("error");
                console.warn("SVG generation resulted in null or empty string.");
            }
            
            setProcessingProgress(100);

            if (typeof onOutlineGenerated === 'function') {
                onOutlineGenerated(bitmapOutlineDataUrl, aspectRatio, originalWidth, originalHeight, finalSvgString);
            }
            return true;

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Image processing was cancelled by user.');
                setError(null); 
            } else {
                console.error("Error during image processing:", err);
                setError(`Processing error: ${err.message || "Unknown error"}`);
                setSvgGenerationStatus("error"); 
            }
            setProcessingProgress(0); 
            setProcessedOutline(null); 
            setSvgData(null); 
            if (typeof onOutlineGenerated === 'function') { 
                onOutlineGenerated(null, aspectRatio, originalWidth, originalHeight, null);
            }
            return false;
        } finally {
            setIsProcessing(false);
            abortControllerRef.current = null; 
        }
    }, [
        uploadedImage, apiKey, tracingSettings, aspectRatio, originalWidth, originalHeight,
        outlineCanvasWidth, outlineCanvasHeight, drawImageToOutlineCanvas, outlineCanvasRef,
        onOutlineGenerated 
    ]);

    const cancelProcessing = React.useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    const downloadOutline = React.useCallback((format) => {
        if (!processedOutline && format !== 'svg') {
            setError("No processed image to download."); 
            return;
        }
        if (format === 'svg' && (!svgData || svgGenerationStatus !== 'success')) {
            setError("SVG data not available or generation failed."); 
            return;
        }

        try {
            const a = document.createElement("a");
            let fileName = "traced-outline";
            if (uploadedImage && typeof uploadedImage === 'string' && uploadedImage.startsWith('data:image')) {
            }

            if (format === "png") {
                if (!processedOutline) throw new Error("PNG data not available.");
                a.href = processedOutline; 
                a.download = `${fileName}.png`;
            } else if (format === "svg") {
                if (!svgData) throw new Error("SVG data not available.");
                const blob = new Blob([svgData], {type: "image/svg+xml"});
                a.href = URL.createObjectURL(blob);
                a.download = `${fileName}.svg`;
            } else if (format === "jpeg") {
                if (outlineCanvasRef.current) {
                    a.href = outlineCanvasRef.current.toDataURL("image/jpeg", 0.9); 
                    a.download = `${fileName}.jpg`;
                } else {
                   throw new Error("Outline canvas not available for JPEG export.");
                }
            } else {
                throw new Error(`Unsupported download format: ${format}`);
            }
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            if (a.href.startsWith("blob:")) { 
                URL.revokeObjectURL(a.href);
            }
        } catch (err) {
            console.error("Error downloading file:", err);
            setError(`Download error: ${err.message || "Unknown error"}`);
        }
    }, [processedOutline, svgData, svgGenerationStatus, outlineCanvasRef, uploadedImage]);
    

    return {
        processedOutline, 
        svgData,         
        svgGenerationStatus,
        isProcessing,
        processingProgress,
        error,
        outlineCanvasRef,
        outlineContainerRef,
        outlineCanvasWidth,
        outlineCanvasHeight,
        tracingSettings, 
        lineThickness, setLineThickness,
        detailLevel, setDetailLevel,
        simplifyLevel, setSimplifyLevel,
        enhanceEdges, setEnhanceEdges,
        traceMode, setTraceMode,
        outputResolution, setOutputResolution,
        directVectorMode, setDirectVectorMode,
        processImage,
        cancelProcessing,
        downloadOutline,
    };
}