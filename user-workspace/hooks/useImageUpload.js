import React from 'react';

export function useImageUpload() {
    const [uploadedImage, setUploadedImage] = React.useState(null);
    const [originalWidth, setOriginalWidth] = React.useState(0);
    const [originalHeight, setOriginalHeight] = React.useState(0);
    const [aspectRatio, setAspectRatio] = React.useState(16 / 9);
    const [error, setError] = React.useState(null);
    
    const [previewCanvasWidth, setPreviewCanvasWidth] = React.useState(400);
    const [previewCanvasHeight, setPreviewCanvasHeight] = React.useState(300);
    
    const fileInputRef = React.useRef(null);
    const previewCanvasRef = React.useRef(null);
    const previewContainerRef = React.useRef(null);
    
    React.useEffect(() => {
        const updateCanvasDimensions = () => {
            if (previewContainerRef.current) {
                const previewWidth = previewContainerRef.current.clientWidth;
                const previewHeight = previewWidth / aspectRatio;
                setPreviewCanvasWidth(previewWidth);
                setPreviewCanvasHeight(previewHeight);
            }
        };
        updateCanvasDimensions();
        window.addEventListener("resize", updateCanvasDimensions);
        return () => {
            window.removeEventListener("resize", updateCanvasDimensions);
        };
    }, [aspectRatio, previewContainerRef]);
    
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.match("image.*")) {
            setError("Please upload an image file (JPEG, PNG, etc.)");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image size should be less than 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imageDataUrl = event.target?.result;
            setUploadedImage(imageDataUrl);
            setError(null);

            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                setOriginalWidth(img.width);
                setOriginalHeight(img.height);
                const imgAspectRatio = img.width / img.height;
                setAspectRatio(imgAspectRatio);
                console.log(`Original image dimensions: ${img.width}x${img.height}, aspect ratio: ${imgAspectRatio}`);
            };
            img.onerror = () => {
                setError("Error loading image dimensions");
            };
            img.src = imageDataUrl;
        };
        reader.onerror = () => {
            setError("Error reading the file");
        };
        reader.readAsDataURL(file);
    };
    
    React.useEffect(() => {
        if (uploadedImage && previewCanvasRef.current) {
            const canvas = previewCanvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = uploadedImage;
        }
    }, [uploadedImage, previewCanvasWidth, previewCanvasHeight]);
    
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    
    return {
        uploadedImage,
        originalWidth,
        originalHeight,
        aspectRatio,
        error,
        handleFileChange,
        handleUploadClick,
        fileInputRef,
        previewContainerRef,
        previewCanvasRef,
        previewCanvasWidth,
        previewCanvasHeight,
        setError
    };
}