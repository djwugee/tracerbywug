import React from 'react';
import { Folder, Plus, Trash2, LoaderCircle, Download, Sliders, ChevronDown, Check, X, Image as ImageIcon } from 'lucide-react';

const BatchProcessingPanel = ({ 
    isProcessing, 
    uploadedImages, 
    setUploadedImages, 
    handleFileChange, 
    processBatch,
    downloadBatchImages,
    traceMode,
    lineThickness,
    detailLevel,
    outputResolution,
    setOutputResolution,
    outputFormat, 
    setOutputFormat, 
    removeImageFromBatch,
    cancelBatchProcessing,
    processingCount,
    totalCount,
    completionPercentage
}) => {
    const batchFileInputRef = React.useRef(null);
    const [showResolutionOptions, setShowResolutionOptions] = React.useState(false);
    const [showFormatOptions, setShowFormatOptions] = React.useState(false); 
    const resolutionButtonRef = React.useRef(null);
    const formatButtonRef = React.useRef(null);
    const resolutionOptionsRef = React.useRef(null);
    const formatOptionsRef = React.useRef(null);

    const handleBatchUploadClick = () => {
        batchFileInputRef.current?.click();
    };

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (resolutionButtonRef.current && !resolutionButtonRef.current.contains(e.target) &&
                resolutionOptionsRef.current && !resolutionOptionsRef.current.contains(e.target)) {
                setShowResolutionOptions(false);
            }
            if (formatButtonRef.current && !formatButtonRef.current.contains(e.target) &&
                formatOptionsRef.current && !formatOptionsRef.current.contains(e.target)) {
                setShowFormatOptions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const resolutionText = {
        'original': 'Original Size',
        'medium': 'Medium (75%)',
        'large': 'Large (150%)',
        'xl': 'XL (200%)',
        'xxl': 'XXL (250%)',
        'xxxl': 'XXXL (300%)',
        'max': 'Maximum (400%)'
    };

    const formatText = {
        'png': 'PNG Format',
        'jpeg': 'JPEG Format',
        'svg': 'SVG Format'
    };

    function getTileFitStyle(img) {
        let tileW = 400; 
        let tileH = 400; 
        
        let srcW = img.dimensions?.width || img.width || tileW;
        let srcH = img.dimensions?.height || img.height || tileH;

        if (srcW === 0 || srcH === 0) { 
            return { width: `${tileW}px`, height: `${tileH}px`, objectFit: 'contain', margin: 'auto' };
        }

        let aspect = srcW / srcH;
        let displayW, displayH;

        if (aspect >= 1) { 
            displayW = tileW;
            displayH = tileW / aspect;
            if (displayH > tileH) { 
                displayH = tileH;
                displayW = tileH * aspect;
            }
        } else { 
            displayH = tileH;
            displayW = tileH * aspect;
            if (displayW > tileW) { 
                displayW = tileW;
                displayH = tileW / aspect;
            }
        }
        return {
            width: `${Math.min(displayW, tileW)}px`, 
            height: `${Math.min(displayH, tileH)}px`, 
            objectFit: 'contain',
            display: 'block',
            margin: 'auto'
        };
    }

    const getPreviewSrc = (img) => {
        if (img.processed) {
            if (img.requestedOutputFormat === 'jpeg' && img.jpegOutlineData) return img.jpegOutlineData;
            if (img.pngOutlineData) return img.pngOutlineData; 
        }
        return img.dataUrl; 
    };

    return React.createElement("div", {className: "mt-6 p-4 border border-gray-200 rounded-md bg-white shadow-sm"},
        React.createElement("div", {className: "flex flex-wrap justify-between items-center mb-4 border-b pb-4 border-gray-200"},
            React.createElement("h4", {className: "font-semibold text-base text-gray-800 mb-2 sm:mb-0"}, "Batch Processing"),
            React.createElement("div", {className: "flex items-center gap-2"},
                React.createElement("div", {className: "relative"},
                    React.createElement("button", {
                            ref: formatButtonRef,
                            onClick: () => setShowFormatOptions(!showFormatOptions),
                            className: "flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm"
                        },
                        React.createElement(Download, {className: "w-3.5 h-3.5"}),
                        formatText[outputFormat], 
                        React.createElement(ChevronDown, {className: "w-3.5 h-3.5 ml-1"})
                    ),
                    showFormatOptions && React.createElement("div", {
                        ref: formatOptionsRef,
                        className: "absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-200 animate-fadeIn"
                    },
                        React.createElement("ul", {className: "py-1"},
                            Object.entries(formatText).map(([value, label]) => (
                                React.createElement("li", {key: value},
                                    React.createElement("button", {
                                            onClick: () => {
                                                setOutputFormat(value); 
                                                setShowFormatOptions(false);
                                            },
                                            className: "flex w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors items-center"
                                        },
                                        React.createElement("span", {className: "flex-1"}, label),
                                        outputFormat === value && React.createElement(Check, {className: "w-4 h-4 text-primary"})
                                    )
                                )
                            ))
                        )
                    )
                ),
                React.createElement("div", {className: "relative"},
                    React.createElement("button", {
                            ref: resolutionButtonRef,
                            onClick: () => setShowResolutionOptions(!showResolutionOptions),
                            className: "flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm"
                        },
                        React.createElement(Sliders, {className: "w-3.5 h-3.5"}),
                        resolutionText[outputResolution],
                        React.createElement(ChevronDown, {className: "w-3.5 h-3.5 ml-1"})
                    ),
                    showResolutionOptions && React.createElement("div", {
                        ref: resolutionOptionsRef,
                        className: "absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-200 animate-fadeIn max-h-60 overflow-y-auto"
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
            )
        ),

        React.createElement("div", {className: "mb-4"},
            React.createElement("p", {className: "text-sm text-gray-600 mb-3"}, 
                "Upload multiple images to process with the same settings."
            ),
            React.createElement("div", {className: "flex flex-wrap gap-3"},
                React.createElement("button", {
                        onClick: handleBatchUploadClick,
                        className: "flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm"
                    },
                    React.createElement(Plus, {className: "w-4 h-4"}),
                    "Add Images"
                ),
                uploadedImages.length > 0 && React.createElement("button", {
                        onClick: () => processBatch(outputFormat), 
                        disabled: isProcessing || uploadedImages.length === 0,
                        className: "flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    },
                    isProcessing ? 
                        React.createElement(LoaderCircle, {className: "w-4 h-4 animate-spin"}) :
                        React.createElement(Folder, {className: "w-4 h-4"})
                    ,
                    isProcessing ? "Processing..." : `Process All (${outputFormat.toUpperCase()})`
                ),
                 (uploadedImages.length > 0 && processingCount > 0) && React.createElement("button", {
                        onClick: () => downloadBatchImages(outputFormat), 
                        disabled: isProcessing, 
                        className: "flex items-center gap-1.5 px-4 py-2 bg-success text-white rounded-md hover:bg-green-700 transition-colors text-sm disabled:bg-gray-300"
                    },
                    React.createElement(Download, {className: "w-4 h-4"}),
                    `Download All (${outputFormat.toUpperCase()})`
                ),
                React.createElement("input", {
                    type: "file",
                    ref: batchFileInputRef,
                    onChange: handleFileChange,
                    accept: "image/*",
                    multiple: true,
                    className: "hidden"
                })
            ),
            
            uploadedImages.length > 0 && React.createElement("div", {className: "mt-3"},
                React.createElement("div", {className: "flex items-center justify-between text-xs text-gray-600 mb-1"},
                    React.createElement("span", null, `Settings: ${traceMode}, Thick ${lineThickness}, Detail ${detailLevel}%, Res ${outputResolution}`),
                    React.createElement("span", null, isProcessing ? `Processing ${processingCount+1}/${totalCount}...` : `${processingCount}/${totalCount} processed`)
                ),
                React.createElement("div", {className: "progress-bar"},
                    React.createElement("div", {
                        className: "progress-bar-fill",
                        style: { width: `${completionPercentage}%` }
                    })
                ),
                 isProcessing && cancelBatchProcessing && React.createElement("button", {
                    onClick: cancelBatchProcessing,
                    className: "mt-2 inline-flex items-center text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded-md"
                    },
                    React.createElement(X, {className: "w-3.5 h-3.5 mr-1"}),
                    "Cancel Batch"
                )
            )
        ),
        
        uploadedImages.length > 0 ? 
            React.createElement("div", {className: "grid xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 items-start batch-processing-container"}, 
                uploadedImages.map((img, index) => 
                    React.createElement("div", {
                            key: img.dataUrl + '-' + index, 
                            className: "group relative rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all border border-gray-200 tile-container",
                            style: { width: '400px', height: '400px', minWidth: '400px', minHeight: '400px' } 
                        },
                        React.createElement("div", {
                            className: "aspect-square w-full h-full overflow-hidden bg-gray-50 relative flex items-center justify-center",
                        },
                           img.requestedOutputFormat === 'svg' && img.svgData ? 
                                React.createElement("div", {
                                    className: "w-full h-full flex items-center justify-center p-2",
                                    style: getTileFitStyle(img),
                                    dangerouslySetInnerHTML: { __html: img.svgData }
                                }) :
                                React.createElement("img", {
                                    src: getPreviewSrc(img),
                                    alt: `Batch image ${index + 1}`,
                                    style: getTileFitStyle(img), 
                                    className: "max-w-full max-h-full object-contain",
                                    draggable: false
                                }),
                            img.processing && React.createElement("div", {
                                className: "absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center"
                            },
                                React.createElement(LoaderCircle, {className: "w-8 h-8 text-white animate-spin"}),
                                React.createElement("p", {className: "text-white text-xs mt-1"}, "Processing...")
                            ),
                            img.error && React.createElement("div", {
                                className: "absolute inset-0 bg-red-500/20 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center"
                            },
                                React.createElement("div", {className: "bg-white/90 rounded-full p-1 mb-1"},
                                    React.createElement(X, {className: "w-5 h-5 text-red-600"})
                                ),
                                React.createElement("p", {className: "text-red-700 text-xs font-medium break-words"}, img.error)
                            )
                        ),
                        React.createElement("div", {className: "absolute top-0 left-0 right-0 flex justify-between items-center p-1.5 bg-gradient-to-b from-black/60 to-transparent"},
                            React.createElement("div", {className: "text-white text-xs font-medium px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm truncate max-w-[calc(100%-30px)]"}, 
                                img.file.name
                            ),
                            !img.processing && React.createElement("button", { 
                                    onClick: () => removeImageFromBatch(index),
                                    className: "bg-red-500 rounded-full p-1 text-white hover:bg-red-600 transition-colors shadow-sm flex-shrink-0"
                                },
                                React.createElement(Trash2, {className: "w-3 h-3"})
                            )
                        ),
                        img.processed && !img.error && React.createElement("div", {
                            className: "absolute bottom-1 left-1 bg-green-500 text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
                        }, 
                            React.createElement(Check, {className: "w-3 h-3"}),
                            "Done"
                        ),
                        img.dimensions && React.createElement("div", {
                            className: "absolute bottom-1 right-1 bg-black/50 text-white text-[10px] py-0.5 px-1.5 rounded-full",
                        }, `${img.dimensions.width}×${img.dimensions.height} (${img.requestedOutputFormat || 'N/A'})`)
                    )
                )
            ) : 
            React.createElement("div", {className: "text-sm text-gray-500 italic text-center py-8 border border-dashed border-gray-300 rounded-md bg-gray-50 flex flex-col items-center justify-center gap-2 h-48"},
                React.createElement(ImageIcon, {className: "w-8 h-8 text-gray-400"}),
                "No images added to batch yet.",
                React.createElement("p", {className: "text-xs"}, "Click 'Add Images' to begin.")
            )
    );
};

export default React.memo(BatchProcessingPanel);