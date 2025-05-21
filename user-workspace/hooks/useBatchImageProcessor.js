import React from 'react';
import { processImageWithAI } from '../utils/batchProcessingHelpers.js';
import { processBatchFiles, downloadBatchAsZip } from '../utils/batchFileHandlers.js';

export function useBatchImageProcessor(apiKey, tracingSettings, setMainError) {
    const [uploadedImages, setUploadedImages] = React.useState([]);
    const [isBatchProcessing, setIsBatchProcessing] = React.useState(false);
    const [batchError, setBatchError] = React.useState(null);
    const batchFileInputRef = React.useRef(null);

    const [outputResolution, setOutputResolution] = React.useState('xxxl'); 
    const [outputFormat, setOutputFormat] = React.useState('png'); 

    React.useEffect(() => {
        if (!isBatchProcessing) {
             setBatchError(null);
        }
    }, [isBatchProcessing]);

    const abortControllerRef = React.useRef(null);
    React.useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const updateImageStatus = React.useCallback((index, statusUpdate) => {
        setUploadedImages(prev => prev.map((item, i) =>
            i === index ? { ...item, ...statusUpdate } : item
        ));
    }, []);

    const handleBatchFileChange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const newImages = await processBatchFiles(files, setMainError);
        setUploadedImages(prev => [...prev, ...newImages.map(img => ({
            ...img,
            pngOutlineData: null,
            jpegOutlineData: null,
            svgData: null,
            requestedOutputFormat: null, 
            dimensions: { width: img.width, height: img.height } 
        }))]);
        if (batchFileInputRef.current) {
            batchFileInputRef.current.value = '';
        }
    };

    const processBatch = React.useCallback(async (formatToProcessAs = outputFormat) => {
        if (uploadedImages.length === 0 || !apiKey || isBatchProcessing) return;
        
        setIsBatchProcessing(true);
        setBatchError(null);
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        const imagesToProcessThisRun = uploadedImages.map(img => ({...img}));

        for (let i = 0; i < imagesToProcessThisRun.length; i++) {
            if (signal.aborted) {
                setBatchError("Batch processing cancelled.");
                break;
            }
            if (!imagesToProcessThisRun[i].processed && !imagesToProcessThisRun[i].error) {
                updateImageStatus(i, { processing: true }); 

                const result = await processImageWithAI(
                    imagesToProcessThisRun[i],
                    i,
                    signal,
                    apiKey,
                    tracingSettings,
                    outputResolution, 
                    formatToProcessAs,  
                    (idx, status) => updateImageStatus(idx, status) 
                );

                if (result && !imagesToProcessThisRun[i].error) { 
                     updateImageStatus(i, {
                        processed: true,
                        processing: false,
                        pngOutlineData: result.pngOutlineData,
                        jpegOutlineData: result.jpegOutlineData,
                        svgData: result.svgData,
                        requestedOutputFormat: result.requestedOutputFormat,
                        dimensions: result.dimensions,
                        error: null
                    });
                } else if (!imagesToProcessThisRun[i].error) { 
                    updateImageStatus(i, { processing: false, error: "Processing failed" });
                } else {
                    updateImageStatus(i, { processing: false });
                }
            }
        }

        setIsBatchProcessing(false);
        abortControllerRef.current = null;
        if (!signal.aborted && uploadedImages.some(img => img.error && !img.processed)) {
        }
    }, [uploadedImages, apiKey, isBatchProcessing, tracingSettings, outputResolution, updateImageStatus]);

    const cancelBatchProcessing = React.useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    const downloadBatchImages = React.useCallback((formatToDownloadAs = null) => {
        const downloadFormat = formatToDownloadAs || outputFormat; 
        const itemsToDownload = uploadedImages.filter(img => img.processed && !img.error);
        if (itemsToDownload.length === 0) {
            setMainError("No successfully processed images to download.");
            return;
        }
        downloadBatchAsZip(itemsToDownload, downloadFormat, setMainError);
    }, [uploadedImages, outputFormat, setMainError]);

    const removeImageFromBatch = React.useCallback((index) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    }, []);

    const processingCount = uploadedImages.filter(img => img.processed && !img.error).length;
    const totalCount = uploadedImages.length;
    const completionPercentage = totalCount > 0 ? Math.round((uploadedImages.filter(img => img.processed || img.error).length / totalCount) * 100) : 0;

    return {
        uploadedImages,
        setUploadedImages,
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
        outputResolution,
        setOutputResolution,
        outputFormat, 
        setOutputFormat, 
    };
}