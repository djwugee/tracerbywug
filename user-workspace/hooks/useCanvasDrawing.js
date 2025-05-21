import React from 'react';

export function useCanvasDrawing(canvasRef, backgroundImageRef) {
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [penColor, setPenColor] = React.useState("#000000");
    const [penSize, setPenSize] = React.useState(5); 
    const colorInputRef = React.useRef(null);
    const lastPositionRef = React.useRef(null); 

    React.useEffect(() => {
        if (canvasRef.current) {
            initializeCanvas();
        }
    }, [canvasRef]);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        const preventTouchDefault = (e) => {
            if (isDrawing && e.cancelable) {
                e.preventDefault();
            }
        };

        if (canvas) {
            canvas.addEventListener("touchstart", preventTouchDefault, { passive: false });
            canvas.addEventListener("touchmove", preventTouchDefault, { passive: false });
        }

        return () => {
            if (canvas) {
                canvas.removeEventListener("touchstart", preventTouchDefault);
                canvas.removeEventListener("touchmove", preventTouchDefault);
            }
        };
    }, [isDrawing, canvasRef]);

    const initializeCanvas = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d", { willReadFrequently: true }); 
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [canvasRef]);

    const drawImageToCanvas = React.useCallback(() => {
        if (!canvasRef.current || !backgroundImageRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
    }, [canvasRef, backgroundImageRef]);

    const getCoordinates = React.useCallback((e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    }, [canvasRef]);

    const startDrawing = React.useCallback((e) => {
        const event = e.nativeEvent || e;
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const {x, y} = getCoordinates(event);

        if (event.type === "touchstart" && event.cancelable) {
            event.preventDefault();
        }

        lastPositionRef.current = {x, y};
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    }, [getCoordinates]);

    const draw = React.useCallback((e) => {
        if (!isDrawing || !canvasRef.current) return;
        const event = e.nativeEvent || e;

        if (event.type === "touchmove" && event.cancelable) {
            event.preventDefault();
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const {x, y} = getCoordinates(event);
        const lastPos = lastPositionRef.current;

        if (lastPos) {
            ctx.beginPath();
            ctx.moveTo(lastPos.x, lastPos.y);
            
            const midX = (lastPos.x + x) / 2;
            const midY = (lastPos.y + y) / 2;
            ctx.quadraticCurveTo(lastPos.x, lastPos.y, midX, midY);
            
            ctx.lineWidth = penSize;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = penColor;
            ctx.stroke();
            
            lastPositionRef.current = {x, y};
        }
    }, [isDrawing, getCoordinates, penColor, penSize]);

    const stopDrawing = React.useCallback(() => {
        setIsDrawing(false);
        lastPositionRef.current = null;
    }, []);

    const clearCanvas = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [canvasRef]);

    const handleColorChange = React.useCallback((e) => {
        setPenColor(e.target.value);
    }, []);

    const changePenSize = React.useCallback((size) => {
        setPenSize(size);
    }, []);

    const openColorPicker = React.useCallback(() => {
        if (colorInputRef.current) {
            colorInputRef.current.click();
        }
    }, []);

    const handleKeyDown = React.useCallback((e) => {
        if (e.key === "Enter" || e.key === " ") {
            openColorPicker();
        }
    }, [openColorPicker]);

    return {
        isDrawing,
        penColor,
        penSize,
        colorInputRef,
        startDrawing,
        draw,
        stopDrawing,
        clearCanvas,
        handleColorChange,
        changePenSize,
        openColorPicker,
        handleKeyDown,
        initializeCanvas,
        drawImageToCanvas
    };
}