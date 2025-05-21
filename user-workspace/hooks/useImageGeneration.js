import React from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

export function useImageGeneration(canvasRef, apiKey, prompt, setShowErrorModal, setErrorMessage) {
    const [generatedImage, setGeneratedImage] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [progress, setProgress] = React.useState(0); 
    const abortControllerRef = React.useRef(null);
    
    React.useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleSubmit = React.useCallback(async (e) => {
        if (e) e.preventDefault();

        if (!canvasRef.current || !apiKey) {
            setErrorMessage("Missing canvas or API key");
            setShowErrorModal(true);
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        
        setIsLoading(true);
        setProgress(10); 
        
        try {
            const canvas = canvasRef.current;

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });

            tempCtx.fillStyle = "#FFFFFF";
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(canvas, 0, 0);

            setProgress(30); 
            
            const drawingData = tempCanvas.toDataURL("image/png").split(",")[1];

            const refinedPrompt = prompt.trim() || "Create a simple drawing";
            console.log("Generating with prompt:", refinedPrompt);

            let contents = [
                {
                    role: "USER",
                    parts: [{ text: refinedPrompt }],
                }
            ];

            if (drawingData) {
                contents = [
                    {
                        role: "USER",
                        parts: [{inlineData: {data: drawingData, mimeType: "image/png"}}],
                    },
                    {
                        role: "USER",
                        parts: [{ text: `${refinedPrompt}. Keep the same minimal line doodle style.` }],
                    },
                ];
            }

            setProgress(50); 

            const aiInstance = new GoogleGenAI({apiKey});
            const response = await aiInstance.models.generateContent({
                model: "gemini-2.0-flash-preview-image-generation",
                contents,
                config: {
                    responseModalities: [Modality.TEXT, Modality.IMAGE],
                },
            }, { signal: abortControllerRef.current.signal });

            setProgress(80); 

            const data = {
                success: true,
                message: "",
                imageData: null,
                error: undefined,
            };

            if (response && response.candidates && response.candidates[0] && response.candidates[0].content) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.text) {
                        data.message = part.text;
                        console.log("Received text response:", part.text);
                    } else if (part.inlineData) {
                        const imageData = part.inlineData.data;
                        console.log("Received image data, length:", imageData.length);
                        data.imageData = imageData;
                    }
                }
            } else {
                throw new Error("Invalid response format from Gemini API");
            }

            setProgress(90); 

            if (data.success && data.imageData) {
                const imageUrl = `data:image/png;base64,${data.imageData}`;
                setGeneratedImage(imageUrl);
                setProgress(100); 
            } else {
                console.error("Failed to generate image:", data.error);
                setErrorMessage("Failed to generate image. No image data received from API.");
                setShowErrorModal(true);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Image generation was cancelled');
                return;
            }
            
            console.error("Error submitting drawing:", error);
            setErrorMessage(error.message || "An unexpected error occurred.");
            setShowErrorModal(true);
        } finally {
            setIsLoading(false);
            setProgress(0); 
            abortControllerRef.current = null;
        }
    }, [canvasRef, apiKey, prompt, setShowErrorModal, setErrorMessage]);

    const cancelGeneration = React.useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
            setProgress(0);
        }
    }, []);

    return {
        generatedImage,
        isLoading,
        progress,
        handleSubmit,
        cancelGeneration,
        setGeneratedImage
    };
}