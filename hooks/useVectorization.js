import React from 'react';
import VectorSketchingModel from '../models/VectorSketchingModel.js';

export function useVectorization(canvasRef, vectorCanvasRef) {
    const [vectorizationStatus, setVectorizationStatus] = React.useState('idle'); // 'idle', 'processing', 'success', 'error'
    const [vectorStrokes, setVectorStrokes] = React.useState([]);
    const [showVectorPreview, setShowVectorPreview] = React.useState(false);
    const [svgData, setSvgData] = React.useState("");
    const [vectorModel] = React.useState(new VectorSketchingModel());

    // Settings state, initialize from model defaults
    const [strokeRegularizationWeight, setStrokeRegularizationWeight] = React.useState(vectorModel.strokeRegularizationWeight);
    const [dynamicWindowSize, setDynamicWindowSize] = React.useState(vectorModel.dynamicWindow.size);

    // Initialize model when canvas is available or settings change
    React.useEffect(() => {
        if (canvasRef.current) {
            vectorModel.initialize(canvasRef.current);
             // Update model settings from state
            vectorModel.strokeRegularizationWeight = strokeRegularizationWeight;
            vectorModel.dynamicWindow = {...vectorModel.dynamicWindow, size: dynamicWindowSize};
        }
    }, [canvasRef.current, vectorModel, strokeRegularizationWeight, dynamicWindowSize]);

    const vectorizeDrawing = React.useCallback(async () => {
        if (!canvasRef.current) return;

        setVectorizationStatus('processing');
        setSvgData(""); // Clear previous SVG data

        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            // Get image data from the main canvas
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Apply current settings to the model before processing
            vectorModel.strokeRegularizationWeight = strokeRegularizationWeight;
            vectorModel.dynamicWindow = {...vectorModel.dynamicWindow, size: dynamicWindowSize};
            vectorModel.initialize(canvas); // Re-initialize with potential new canvas size/settings

            const strokes = await vectorModel.processImage(imageData);
            setVectorStrokes(strokes);

            const svg = vectorModel.exportSVG();
            setSvgData(svg);

            setVectorizationStatus('success');
            setShowVectorPreview(true); // Show preview automatically on successful vectorization

            if (vectorCanvasRef.current) {
                vectorModel.renderStrokes(vectorCanvasRef.current);
            }

        } catch (error) {
            console.error("Error vectorizing drawing:", error);
            setVectorizationStatus('error');
            // alert("Failed to vectorize drawing. Please try again."); // Avoid alerts
        }
    }, [canvasRef, vectorCanvasRef, vectorModel, strokeRegularizationWeight, dynamicWindowSize]); // Added settings to dependencies

    const toggleVectorPreview = React.useCallback(() => {
        if (showVectorPreview) {
            // If preview is showing, hide it
            setShowVectorPreview(false);
        } else {
            // If preview is not showing, check if we need to vectorize
            if (vectorStrokes.length === 0 || vectorizationStatus === 'error') {
                 // If no strokes or previous error, vectorize
                vectorizeDrawing();
            } else {
                 // If strokes exist and no error, just show the preview
                setShowVectorPreview(true);
                 if (vectorCanvasRef.current) {
                    vectorModel.renderStrokes(vectorCanvasRef.current);
                 }
            }
        }
    }, [showVectorPreview, vectorStrokes, vectorizationStatus, vectorizeDrawing, vectorCanvasRef, vectorModel]);

    // Re-render vector canvas if strokes or settings change while preview is visible
    React.useEffect(() => {
        if (showVectorPreview && vectorCanvasRef.current && vectorStrokes.length > 0) {
             vectorModel.strokeRegularizationWeight = strokeRegularizationWeight;
             vectorModel.dynamicWindow = {...vectorModel.dynamicWindow, size: dynamicWindowSize};
             vectorModel.renderStrokes(vectorCanvasRef.current);
        }
    }, [showVectorPreview, vectorStrokes, vectorCanvasRef.current, vectorModel, strokeRegularizationWeight, dynamicWindowSize]);


    return {
        vectorizationStatus,
        vectorStrokes,
        showVectorPreview,
        svgData,
        vectorModel, // Expose model instance if needed elsewhere (maybe not needed)
        toggleVectorPreview,
        setShowVectorPreview,
        setVectorStrokes, // Allow clearing strokes from Home
        setSvgData,     // Allow clearing SVG from Home
        vectorizeDrawing, // Expose vectorize function for manual trigger if needed
        // Expose settings and their setters
        strokeRegularizationWeight,
        setStrokeRegularizationWeight,
        dynamicWindowSize,
        setDynamicWindowSize
    };
}