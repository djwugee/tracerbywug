import React from 'react';
import { GoogleGenAI, Modality } from '@google/genai'; 
import { Download, LoaderCircle, X, Upload, ImageIcon, Sliders, Maximize2, ChevronDown } from 'lucide-react';
import ImageUploaderPanel from './tracer/ImageUploaderPanel.js';
import TracingSettingsPanel from './tracer/TracingSettingsPanel.js';
import TracedImagePanel from './tracer/TracedImagePanel.js';
import BatchProcessingPanel from './tracer/BatchProcessingPanel.js';
import { useImageUpload } from '../hooks/useImageUpload.js';
import { useImageProcessor } from '../hooks/useImageProcessor.js';
import { useBatchImageProcessor } from '../hooks/useBatchImageProcessor.js';

const ImageTracer = ({apiKey, onClose, onOutlineGenerated}) => {
    const {
        uploadedImage,
        originalWidth,
        originalHeight,
        aspectRatio,
        error: uploadError, 
        handleFileChange,
        handleUploadClick,
        fileInputRef,
        previewContainerRef,
        previewCanvasRef,
        previewCanvasWidth,
        previewCanvasHeight,
        setError: setUploadError 
    } = useImageUpload();

    const {
        processedOutline,
        isProcessing,
        processingProgress,
        error: processError, 
        outlineCanvasRef,
        outlineContainerRef,
        outlineCanvasWidth,
        outlineCanvasHeight,
        svgData,
        svgGenerationStatus,
        lineThickness,
        setLineThickness,
        detailLevel,
        setDetailLevel,
        simplifyLevel,
        setSimplifyLevel,
        enhanceEdges,
        setEnhanceEdges,
        traceMode,
        setTraceMode,
        directVectorMode,
        setDirectVectorMode,
        processImage: processSingleImage, 
        cancelProcessing,
        downloadOutline,
        outputResolution: singleOutputResolution,
        setOutputResolution: setSingleOutputResolution
    } = useImageProcessor(
        uploadedImage, apiKey, originalWidth, originalHeight, aspectRatio, 
        (outline, ar, ow, oh, svgData) => { onOutlineGenerated(outline, ar, ow, oh, svgData); }
    );

    const tracingSettings = React.useMemo(() => ({
        traceMode,
        lineThickness,
        detailLevel,
        simplifyLevel,
        enhanceEdges,
        directVectorMode
    }), [traceMode, lineThickness, detailLevel, simplifyLevel, enhanceEdges, directVectorMode]);

    const {
        uploadedImages: batchUploadedImages, 
        isBatchProcessing,
        batchFileInputRef,
        handleBatchFileChange,
        processBatch,
        cancelBatchProcessing, 
        downloadBatchImages,
        removeImageFromBatch,
        processingCount,
        totalCount,
        completionPercentage,
        batchError, 
        setUploadedImages: setBatchUploadedImages, 
        outputResolution, 
        setOutputResolution,
        outputFormat,
        setOutputFormat
    } = useBatchImageProcessor(apiKey, tracingSettings, setUploadError); 

    const [showSettings, setShowSettings] = React.useState(false);
    const [showDownloadOptions, setShowDownloadOptions] = React.useState(false);
    const downloadButtonRef = React.useRef(null);

    const combinedError = uploadError || processError || batchError;

    React.useEffect(() => {
        const handleEscapeKey = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        window.addEventListener('keydown', handleEscapeKey);
        return () => window.removeEventListener('keydown', handleEscapeKey);
    }, [onClose]);

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (showDownloadOptions && downloadButtonRef.current && !downloadButtonRef.current.contains(e.target)) {
                const menuContainer = downloadButtonRef.current.closest('.relative');
                if (menuContainer && !menuContainer.contains(e.target)) {
                    setShowDownloadOptions(false);
                } else if (!menuContainer) { 
                    setShowDownloadOptions(false);
                }
            }
        };

        if (showDownloadOptions) {
             document.addEventListener("mousedown", handleClickOutside);
        }
       
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDownloadOptions, downloadButtonRef]);

    const processImageWithSettings = async () => {
        await processSingleImage();
        if (processedOutline) {
            setShowSettings(true);
        }
    };

    React.useEffect(() => {
        if (processedOutline) {
            setShowSettings(true);
        }
    }, [processedOutline]);

    React.useEffect(() => {
        return () => {
            if (isProcessing) {
                cancelProcessing(); 
            }
            if (isBatchProcessing) {
                 cancelBatchProcessing(); 
            }
        };
    }, [isProcessing, cancelProcessing, isBatchProcessing, cancelBatchProcessing]);

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return React.createElement("div", {
            className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto modal-overlay",
            onClick: handleOverlayClick
        },
        React.createElement("div", {
                className: "bg-white rounded-lg shadow-2xl max-w-4xl w-full p-4 sm:p-6 my-2 sm:my-0 max-h-[90vh] overflow-y-auto modal-content",
                onClick: e => e.stopPropagation(),
                style: { scrollbarWidth: 'thin' }
            },
            React.createElement("div", {className: "flex justify-between items-center mb-4 sm:mb-6 sticky top-0 bg-white z-10 pb-3 border-b"},
                React.createElement("h3", {className: "text-xl font-bold text-gray-800"}, "Image Tracer"),
                React.createElement("div", {className: "flex items-center gap-2"},
                    uploadedImage && React.createElement("div", {className: "hidden sm:block text-sm text-gray-500"},
                        `${originalWidth}x${originalHeight} (${aspectRatio.toFixed(2)})`
                    ),
                    React.createElement("button", {
                            onClick: onClose, 
                            className: "text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors",
                            "aria-label": "Close"
                        },
                        React.createElement(X, {className: "w-5 h-5"})
                    )
                )
            ),
            
            React.createElement("div", {className: "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"},
                React.createElement("div", {className: "flex flex-col"},
                    React.createElement(ImageUploaderPanel, {
                        uploadedImage,
                        previewContainerRef,
                        previewCanvasRef,
                        previewCanvasWidth,
                        previewCanvasHeight,
                        handleUploadClick,
                        fileInputRef,
                        handleFileChange,
                        setShowSettings,
                        showSettings,
                        aspectRatio
                    }),
                    
                    showSettings && React.createElement(TracingSettingsPanel, {
                        traceMode,
                        setTraceMode,
                        lineThickness,
                        setLineThickness,
                        detailLevel,
                        setDetailLevel,
                        simplifyLevel,
                        setSimplifyLevel,
                        enhanceEdges,
                        setEnhanceEdges,
                        directVectorMode,
                        setDirectVectorMode
                    })
                ),
                
                React.createElement("div", {className: "flex flex-col"},
                    React.createElement(TracedImagePanel, {
                        isProcessing,
                        processingProgress,
                        processedOutline,
                        outlineContainerRef,
                        outlineCanvasRef,
                        outlineCanvasWidth,
                        outlineCanvasHeight,
                        uploadedImage, 
                        processImage: processSingleImage, 
                        cancelProcessing, 
                        downloadButtonRef,
                        showDownloadOptions,
                        setShowDownloadOptions,
                        downloadOutline, 
                        svgGenerationStatus,
                        outputResolution: singleOutputResolution, 
                        setOutputResolution: setSingleOutputResolution
                    })
                )
            ),
            
            React.createElement(BatchProcessingPanel, {
                isProcessing: isBatchProcessing,
                uploadedImages: batchUploadedImages, 
                setUploadedImages: setBatchUploadedImages, 
                batchFileInputRef, 
                handleFileChange: handleBatchFileChange, 
                processBatch, 
                downloadBatchImages, 
                removeImageFromBatch, 
                traceMode, 
                lineThickness, 
                detailLevel, 
                processingCount, 
                totalCount, 
                completionPercentage, 
                cancelBatchProcessing,
                outputResolution,
                setOutputResolution,
                outputFormat,
                setOutputFormat
            }),
            
            combinedError && React.createElement("div", {className: "mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm animate-fadeIn"},
                React.createElement("p", null, combinedError)
            ),
            
            React.createElement("div", {className: "h-4 md:h-8"})
        )
    );
};

export default React.memo(ImageTracer);