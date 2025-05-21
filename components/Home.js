import React from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Download, LoaderCircle, SendHorizontal, Trash2, VideoIcon as Vector, X, Upload, ImageIcon } from 'lucide-react';
import { parseError } from '../utils/helpers.js';
import VectorSketchingModel from '../models/VectorSketchingModel.js';
import ImageTracer from './ImageTracer.js';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing.js';
import { useVectorization } from '../hooks/useVectorization.js';
import { useImageGeneration } from '../hooks/useImageGeneration.js';
import { useCanvasDownload } from '../hooks/useCanvasDownload.js';
import CanvasControls from './ui/CanvasControls.js';
import VectorPreviewPanel from './ui/VectorPreviewPanel.js';
import ApiKeyInput from './ui/ApiKeyInput.js';
import ErrorModal from './ui/ErrorModal.js';

/** @jsx React.createElement */
const Home = () => {
    const [isApiKeySet, setIsApiKeySet] = React.useState(false);
    const [customApiKey, setCustomApiKey] = React.useState("");
    const canvasRef = React.useRef(null);
    const vectorCanvasRef = React.useRef(null);
    const backgroundImageRef = React.useRef(null);
    const [prompt, setPrompt] = React.useState("");
    const [showErrorModal, setShowErrorModal] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState("");
    const [showImageTracer, setShowImageTracer] = React.useState(false);
    const [canvasAspectRatio, setCanvasAspectRatio] = React.useState(16 / 9); 
    const [canvasWidth, setCanvasWidth] = React.useState(960);
    const [canvasHeight, setCanvasHeight] = React.useState(540);
    const canvasContainerRef = React.useRef(null);
    const downloadButtonRef = React.useRef(null);
    const [penSize, setPenSize] = React.useState(5);
    
    // State to hold SVG data from the traced image (modal)
    const [tracedImageSvgData, setTracedImageSvgData] = React.useState(null);

    const {
        isDrawing,
        penColor,
        colorInputRef,
        startDrawing,
        draw,
        stopDrawing,
        clearCanvas, 
        handleColorChange,
        openColorPicker,
        handleKeyDown,
        initializeCanvas,
        drawImageToCanvas,
        changePenSize
    } = useCanvasDrawing(canvasRef, backgroundImageRef);

    const {
        isVectorizing,
        vectorStrokes,
        showVectorPreview,
        svgData, // This is SVG from freehand vectorization
        vectorModel,
        toggleVectorPreview,
        setShowVectorPreview,
        setVectorStrokes,
        setSvgData 
    } = useVectorization(canvasRef, vectorCanvasRef);

    const {
        generatedImage, // This is the raster outline from API (used as background)
        isLoading,
        progress,
        handleSubmit,
        cancelGeneration,
        setGeneratedImage 
    } = useImageGeneration(canvasRef, customApiKey, prompt, setShowErrorModal, setErrorMessage);

    const { downloadCanvas } = useCanvasDownload(
        canvasRef,
        vectorCanvasRef,
        showVectorPreview,
        svgData, // Freehand SVG data
        tracedImageSvgData, // Pass traced image SVG data
        setErrorMessage,
        setShowErrorModal
    );

    const handleClearCanvas = () => {
        clearCanvas(); 
        setGeneratedImage(null);
        backgroundImageRef.current = null;
        setVectorStrokes([]);
        setShowVectorPreview(false);
        setSvgData(""); // Clear freehand SVG
        setTracedImageSvgData(null); // Clear traced image SVG
        setCanvasAspectRatio(16 / 9); 
    };

    const handleOutlineGenerated = (outlineImageData, aspectRatio, originalWidth, originalHeight, svgDataFromTrace) => {
        if (!outlineImageData) return;

        setCanvasAspectRatio(aspectRatio);
        console.log(`Setting canvas aspect ratio to ${aspectRatio} (${originalWidth}x${originalHeight})`);
        setGeneratedImage(outlineImageData); // Set raster outline as background
        setTracedImageSvgData(svgDataFromTrace); // Store the SVG data from the trace
        setShowImageTracer(false);
    };

    React.useEffect(() => {
        window.downloadHandler = downloadCanvas;
        
        return () => {
            window.downloadHandler = null;
        };
    }, [downloadCanvas]);

    React.useEffect(() => {
        if (canvasRef.current) {
            initializeCanvas();
            vectorModel.initialize(canvasRef.current);
        }
    }, [initializeCanvas, vectorModel]);

    const resizeCanvas = React.useCallback(() => {
        if (canvasContainerRef.current && canvasAspectRatio) {
            const containerWidth = canvasContainerRef.current.clientWidth;
            if (containerWidth <= 0) return;

            const newHeight = containerWidth / canvasAspectRatio;

            setCanvasWidth(containerWidth);
            setCanvasHeight(newHeight);

            if (canvasRef.current) {
                canvasRef.current.width = containerWidth;
                canvasRef.current.height = newHeight;
            }

            if (vectorCanvasRef.current) {
                vectorCanvasRef.current.width = containerWidth;
                vectorCanvasRef.current.height = newHeight;
            }

            if (backgroundImageRef.current) {
                drawImageToCanvas();
            }

            // Re-render vector strokes if they exist when canvas resizes and preview is on
            if (showVectorPreview && vectorStrokes.length > 0 && vectorCanvasRef.current && vectorModel) {
                 vectorModel.renderStrokes(vectorCanvasRef.current);
            }
        }
    }, [canvasAspectRatio, drawImageToCanvas, vectorStrokes, vectorModel, showVectorPreview, vectorCanvasRef]); // Added deps

    React.useEffect(() => {
        resizeCanvas();
        if (canvasRef.current && !backgroundImageRef.current) {
            initializeCanvas();
        }
    }, [canvasAspectRatio, resizeCanvas, initializeCanvas]);

    React.useEffect(() => {
        const handleResize = () => {
            resizeCanvas();
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [resizeCanvas]);

    React.useEffect(() => {
        if (generatedImage && canvasRef.current) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                backgroundImageRef.current = img;
                const imgAspectRatio = img.width / img.height;
                if (img.height > 0) {
                    setCanvasAspectRatio(imgAspectRatio); 
                } else {
                    console.warn("Generated image has zero height, cannot calculate aspect ratio.");
                    setCanvasAspectRatio(16/9); 
                }
            };
            img.onerror = () => {
                console.error("Failed to load generated image for canvas background.");
                setErrorMessage("Failed to load generated image.");
                setShowErrorModal(true);
                backgroundImageRef.current = null; 
            };
            img.src = generatedImage;
        } else if (!generatedImage) {
            backgroundImageRef.current = null;
            if (canvasRef.current) {
                 initializeCanvas();
            }
        }
    }, [generatedImage, initializeCanvas]);

    return (
        React.createElement(React.Fragment, null,
            React.createElement("div", {
                    className: "min-h-screen app-background text-gray-900 flex flex-col justify-start items-center"
                },
                React.createElement("main", {
                        className: "container mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-32 max-w-5xl w-full"
                    },
                    React.createElement("header", {className: "text-center mb-6 sm:mb-10"},
                        React.createElement("h1", {className: "text-3xl sm:text-4xl font-bold mb-1 tracer-title"}, "Tracer by djwugee")
                    ),
                    
                    !isApiKeySet ? (
                        React.createElement(ApiKeyInput, {
                            customApiKey, 
                            setCustomApiKey, 
                            setIsApiKeySet
                        })
                    ) : (
                        React.createElement("div", {className: "w-full mb-6 p-3 sm:p-4 rounded-lg bg-green-50 border border-green-200 flex justify-between items-center shadow-sm animate-slideIn"},
                            React.createElement("p", {className: "text-sm font-medium text-green-700"}, "API key set successfully"),
                            React.createElement("button", {
                                    onClick: () => {
                                        setIsApiKeySet(false);
                                        setCustomApiKey("");
                                    },
                                    className: "text-sm text-primary hover:underline transition-all"
                                },
                                "Change API Key"
                            )
                        )
                    ),
                    
                    React.createElement("div", {className: "flex justify-end mb-3 sm:mb-4"},
                        React.createElement(CanvasControls, {
                            penColor,
                            penSize,
                            changePenSize,
                            openColorPicker,
                            handleKeyDown,
                            colorInputRef,
                            handleColorChange: handleColorChange, 
                            clearCanvas: handleClearCanvas, 
                            isVectorizing,
                            showVectorPreview,
                            toggleVectorPreview,
                            setShowImageTracer,
                            isApiKeySet,
                            downloadButtonRef, 
                            svgData 
                        })
                    ),
                    
                    React.createElement("div", {
                            ref: canvasContainerRef,
                            className: "canvas-container w-full mb-5 sm:mb-6 relative",
                            style: {
                                height: `${canvasHeight > 0 ? canvasHeight : 300}px`, 
                                transition: "height 0.3s ease",
                            }
                        },
                        React.createElement("canvas", {
                            ref: canvasRef,
                            width: canvasWidth > 0 ? canvasWidth : 300, 
                            height: canvasHeight > 0 ? canvasHeight : 300, 
                            onMouseDown: startDrawing,
                            onMouseMove: draw,
                            onMouseUp: stopDrawing,
                            onMouseLeave: stopDrawing,
                            onTouchStart: startDrawing,
                            onTouchMove: draw,
                            onTouchEnd: stopDrawing,
                            className: `w-full h-full hover:cursor-crosshair bg-white touch-none rounded-md ${showVectorPreview ? "hidden" : "block"}`
                        }),
                        
                        React.createElement("canvas", {
                            ref: vectorCanvasRef,
                            width: canvasWidth > 0 ? canvasWidth : 300,
                            height: canvasHeight > 0 ? canvasHeight : 300,
                            className: `w-full h-full bg-white rounded-md ${showVectorPreview ? "block" : "hidden"}`
                        }),
                        
                        isVectorizing && React.createElement(() => (
                            React.createElement("div", {className: "absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm rounded-md"},
                                React.createElement("div", {className: "flex flex-col items-center"},
                                    React.createElement(LoaderCircle, {className: "w-8 h-8 sm:w-10 sm:h-10 animate-spin text-primary"}),
                                    React.createElement("p", {className: "mt-2 font-medium text-sm sm:text-base"}, "Vectorizing drawing...")
                                )
                            )
                        ), null),
                        
                        React.createElement("div", {className: "absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full"},
                            `${canvasWidth > 0 ? canvasWidth : '...'}x${canvasHeight > 0 ? Math.round(canvasHeight) : '...'}`
                        )
                    ),
                    
                    React.createElement("form", {onSubmit: handleSubmit, className: "w-full"},
                        React.createElement("div", {className: "relative"},
                            React.createElement("input", {
                                type: "text",
                                value: prompt,
                                onChange: (e) => setPrompt(e.target.value),
                                placeholder: "Describe what changes you'd like to make...",
                                className: "w-full p-3.5 sm:p-4 pr-12 sm:pr-14 text-sm sm:text-base border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring focus:ring-primary/20 focus:border-primary shadow-sm transition-all",
                                required: true,
                                disabled: !isApiKeySet 
                            }),
                            React.createElement("button", {
                                    type: "submit",
                                    disabled: isLoading || !isApiKeySet,
                                    className: "absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-md bg-primary text-white hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                },
                                isLoading ? (
                                    React.createElement("div", {className: "relative"},
                                        React.createElement(LoaderCircle, {className: "w-5 h-5 animate-spin", "aria-label": "Loading"}),
                                        progress > 0 && (
                                            React.createElement("span", {
                                                className: "absolute inset-0 flex items-center justify-center text-[10px] font-bold",
                                                style: { color: "white" }
                                            }, `${progress}%`)
                                        )
                                    )
                                ) : (
                                    React.createElement(SendHorizontal, {className: "w-5 h-5", "aria-label": "Submit"})
                                )
                            )
                        ),
                        isLoading && (
                            React.createElement("div", {className: "mt-3 flex items-center justify-between"},
                                React.createElement("div", {className: "flex-1 mr-4"},
                                    React.createElement("div", {className: "progress-bar"},
                                        React.createElement("div", {
                                            className: "progress-bar-fill",
                                            style: { width: `${progress}%` }
                                        })
                                    )
                                ),
                                React.createElement("button", {
                                    type: "button",
                                    onClick: cancelGeneration,
                                    className: "flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded-md"
                                },
                                    React.createElement(X, {className: "w-3.5 h-3.5"}),
                                    "Cancel"
                                )
                            )
                        )
                    ),
                    
                    showVectorPreview && React.createElement(VectorPreviewPanel, { vectorStrokes }),
                ),
                
                showErrorModal && React.createElement(ErrorModal, {
                    errorMessage,
                    closeErrorModal: () => setShowErrorModal(false) 
                }),
                
                showImageTracer && isApiKeySet && (
                   React.createElement(ImageTracer, {
                     apiKey: customApiKey,
                     onClose: () => setShowImageTracer(false),
                     onOutlineGenerated: handleOutlineGenerated
                   })
                )
            )
        )
    );
};

export default Home;