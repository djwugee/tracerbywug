import React from 'react';
import { LoaderCircle, Download, ChevronDown, X, Sliders, Check } from 'lucide-react';

const TracedImagePanel = ({
    isProcessing,
    processingProgress,
    processedOutline,
    outlineContainerRef,
    outlineCanvasRef,
    outlineCanvasWidth,
    outlineCanvasHeight,
    uploadedImage,
    processImage,
    cancelProcessing,
    downloadButtonRef,
    showDownloadOptions,
    setShowDownloadOptions,
    downloadOutline,
    svgGenerationStatus,
    outputResolution,
    setOutputResolution
}) => {
    const handleDownload = (format) => {
        downloadOutline(format);
        setShowDownloadOptions(false);
    };

    const [showResolutionOptions, setShowResolutionOptions] = React.useState(false);
    const resolutionButtonRef = React.useRef(null);

    // Resolution display text mapping
    const resolutionText = {
        'original': 'Original Size',
        'medium': 'Medium (75%)',
        'large': 'Large (150%)',
        'xl': 'XL (200%)',
        'xxl': 'XXL (250%)',
        'xxxl': 'XXXL (300%)',
        'max': 'Maximum (400%)'
    };

    // Close resolution dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (resolutionButtonRef.current && !resolutionButtonRef.current.contains(e.target)) {
                setShowResolutionOptions(false);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        React.createElement(React.Fragment, null,
            React.createElement("div", {className: "mb-4"},
                React.createElement("div", {className: "flex justify-between items-center mb-2"},
                    React.createElement("h4", {className: "font-medium text-base text-gray-800"}, "Traced Outline"),
                    processedOutline && React.createElement("div", {className: "relative"},
                        React.createElement("button", {
                                ref: resolutionButtonRef,
                                onClick: () => setShowResolutionOptions(!showResolutionOptions),
                                className: "flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-xs"
                            },
                            React.createElement(Sliders, {className: "w-3 h-3"}),
                            resolutionText[outputResolution || 'original'],
                            React.createElement(ChevronDown, {className: "w-3 h-3 ml-1"})
                        ),
                        showResolutionOptions && React.createElement("div", {
                            className: "absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200 animate-fadeIn max-h-60 overflow-y-auto"
                        },
                            React.createElement("ul", {className: "py-1"},
                                Object.entries(resolutionText).map(([value, label]) => (
                                    React.createElement("li", {key: value},
                                        React.createElement("button", {
                                                onClick: () => {
                                                    setOutputResolution(value);
                                                    setShowResolutionOptions(false);
                                                },
                                                className: "flex w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors items-center"
                                            },
                                            React.createElement("span", {className: "flex-1"}, label),
                                            outputResolution === value && React.createElement(Check, {className: "w-4 h-4 text-primary"})
                                        )
                                    )
                                ))
                            )
                        )
                    )
                ),
                React.createElement("div", {
                        ref: outlineContainerRef,
                        className: "border border-gray-200 rounded-md h-64 flex items-center justify-center bg-white overflow-hidden shadow-sm"
                    },
                    isProcessing ?
                        React.createElement("div", {className: "text-center p-4 w-full"},
                            React.createElement(LoaderCircle, {className: "w-10 h-10 mx-auto text-primary animate-spin mb-3"}),
                            React.createElement("p", {className: "text-gray-600 text-base"}, "Processing image..."),
                            processingProgress > 0 && React.createElement("div", {className: "w-full mt-3 max-w-xs mx-auto"},
                                React.createElement("div", {className: "progress-bar"},
                                    React.createElement("div", {
                                        className: "progress-bar-fill",
                                        style: { width: `${processingProgress}%` }
                                    })
                                ),
                                React.createElement("p", {className: "text-xs text-gray-500 mt-1"}, `${processingProgress}%`)
                            ),
                            React.createElement("button", {
                                onClick: cancelProcessing,
                                className: "mt-3 inline-flex items-center text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded-md"
                            },
                                React.createElement(X, {className: "w-3.5 h-3.5 mr-1"}),
                                "Cancel"
                            )
                        ) :
                        processedOutline ?
                            React.createElement("canvas", {
                                ref: outlineCanvasRef,
                                width: outlineCanvasWidth,
                                height: outlineCanvasHeight,
                                className: "w-full h-full object-contain"
                            }) :
                            React.createElement("div", {className: "text-center p-4"},
                                React.createElement("p", {className: "text-gray-600 text-base"}, "Traced outline will appear here"),
                                React.createElement("p", {className: "text-gray-400 text-sm mt-1"}, "Aspect ratio will match original image")
                            )
                )
            ),
            React.createElement("div", {className: "flex gap-2"},
                React.createElement("button", {
                        onClick: processImage,
                        disabled: !uploadedImage || isProcessing,
                        className: "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    },
                    isProcessing ?
                        React.createElement(React.Fragment, null,
                            React.createElement(LoaderCircle, {className: "w-4 h-4 animate-spin"}),
                            "Processing..."
                        ) :
                        React.createElement(React.Fragment, null, processedOutline ? "Re-Generate Outline" : "Generate Outline")
                ),
                processedOutline && React.createElement("div", {className: "relative"},
                    React.createElement("button", {
                            ref: downloadButtonRef,
                            onClick: (e) => {
                                e.stopPropagation();
                                setShowDownloadOptions(!showDownloadOptions)
                            },
                            className: "flex items-center gap-1.5 px-4 py-2 bg-success text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                        },
                        React.createElement(Download, {className: "w-4 h-4"}),
                        "Download",
                        React.createElement(ChevronDown, {className: "w-4 h-4 ml-0.5"})
                    ),
                    showDownloadOptions && React.createElement("div", {className: "absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 animate-fadeIn"},
                        React.createElement("ul", {className: "py-1"},
                            React.createElement("li", null,
                                React.createElement("button", {
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        handleDownload("png");
                                    },
                                    className: "flex w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors items-center"
                                }, 
                                    React.createElement("span", {className: "flex-1"}, "PNG Format"),
                                    React.createElement("span", {className: "text-xs text-gray-500"}, "Best quality")
                                )
                            ),
                            React.createElement("li", null,
                                React.createElement("button", {
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        handleDownload("jpeg");
                                    },
                                    className: "flex w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors items-center"
                                }, 
                                    React.createElement("span", {className: "flex-1"}, "JPEG Format"),
                                    React.createElement("span", {className: "text-xs text-gray-500"}, "Smaller file")
                                )
                            ),
                            React.createElement("li", null,
                                React.createElement("button", {
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            handleDownload("svg");
                                        },
                                        className: `flex w-full text-left px-4 py-2.5 text-sm ${svgGenerationStatus === "success" ? "text-gray-700 hover:bg-gray-50" : "text-gray-400 cursor-not-allowed"} items-center justify-between transition-colors`,
                                        disabled: svgGenerationStatus !== "success"
                                    },
                                    React.createElement("span", {className: "flex-1"}, "SVG Format"),
                                    svgGenerationStatus === "generating" 
                                        ? React.createElement(LoaderCircle, {className: "w-3.5 h-3.5 animate-spin text-gray-400"})
                                        : svgGenerationStatus === "success"
                                            ? React.createElement("span", {className: "text-xs text-gray-500"}, "Vector graphics")
                                            : React.createElement("span", {className: "text-red-500 text-xs"}, "Failed")
                                )
                            )
                        )
                    )
                )
            ),
            processedOutline && React.createElement("div", {className: "mt-3 flex flex-wrap gap-2"},
                React.createElement("button", {
                    onClick: () => handleDownload("png"),
                    className: "flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-success text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                },
                    React.createElement(Download, {className: "w-3.5 h-3.5"}),
                    "PNG"
                ),
                React.createElement("button", {
                    onClick: () => handleDownload("jpeg"),
                    className: "flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-success text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                },
                    React.createElement(Download, {className: "w-3.5 h-3.5"}),
                    "JPEG"
                ),
                svgGenerationStatus === "success" && React.createElement("button", {
                    onClick: () => handleDownload("svg"),
                    className: "flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-success text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                },
                    React.createElement(Download, {className: "w-3.5 h-3.5"}),
                    "SVG"
                )
            ),
            (processedOutline && svgGenerationStatus !== "idle" && svgGenerationStatus !== "success") &&
            React.createElement("div", {className: "mt-2 text-xs text-gray-500"},
                svgGenerationStatus === "generating" ?
                    React.createElement("div", {className: "flex items-center"},
                        React.createElement(LoaderCircle, {className: "w-3.5 h-3.5 animate-spin mr-1"}),
                        "Generating SVG..."
                    ) :
                    React.createElement("div", {className: "text-red-500"}, "SVG generation failed. Only PNG/JPEG available.")
            )
        )
    );
};

export default React.memo(TracedImagePanel);