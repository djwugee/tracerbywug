import { GoogleGenAI, Modality } from '@google/genai';
import { generateSVGFromImageData } from '../utils/svgGenerator.js';

function constructBitmapPrompt(tracingSettings, aspectRatio, originalWidth, originalHeight) {
    let promptText = `
        Trace this image and create a clean ${tracingSettings.traceMode} drawing.
        Use these parameters:
        - Line thickness: ${tracingSettings.lineThickness} (1-5 scale)
        - Detail level: ${tracingSettings.detailLevel}% (higher means more details)
        - Simplify level: ${tracingSettings.simplifyLevel}% (higher means more simplification)
        - Edge enhancement: ${tracingSettings.enhanceEdges ? "Yes" : "No"}

        IMPORTANT: Maintain the original aspect ratio of ${aspectRatio.toFixed(4)} (width/height).
        The original image dimensions are ${originalWidth}x${originalHeight} pixels.
        Output should be a black and white line drawing/sketch.
    `;

    if (tracingSettings.traceMode === "outline") {
        promptText += `
            Focus on clean, essential contours. No shading. Create a clear line drawing with no shading or color.
        `;
    } else if (tracingSettings.traceMode === "sketch") {
        promptText += `
            Include some texture and line variation for a hand-drawn look.
        `;
    } else if (tracingSettings.traceMode === "detailed") {
        promptText += `
            Capture fine internal details and textures with clean lines.
        `;
    }
    return promptText;
}

function constructDirectSvgPrompt(tracingSettings, outputDimensions, aspectRatio) {
    const { width: scaledWidth, height: scaledHeight } = outputDimensions;
    const svgPrompt = `
      Create a clean vector SVG trace of this image.
      
      Technical requirements:
      - Return ONLY valid SVG XML code with no other text or explanation.
      - Output width: ${scaledWidth}, height: ${scaledHeight}.
      - Maintain aspect ratio: ${aspectRatio.toFixed(4)}.
      - Line thickness: ${tracingSettings.lineThickness}px.
      - Detail level: ${tracingSettings.detailLevel}% (higher means more details).
      - Path simplification: ${tracingSettings.simplifyLevel}% (higher means more simplified paths).
      
      Style requirements:
      - ${tracingSettings.traceMode === "outline" ? "Simple outlines with clean, minimal strokes" : 
         tracingSettings.traceMode === "sketch" ? "Hand-drawn sketch style with natural line variation" : 
         "Detailed vector drawing with internal features and textures"}.
      - Black stroke on white background.
      - ${tracingSettings.enhanceEdges ? "Enhanced edge detection for clearer contours" : "Natural edges"}.
      - No fills, just strokes.
      - Use <path> elements with appropriate stroke attributes.
      - Include a white background rectangle like <rect width="100%" height="100%" fill="white"/>.
      
      IMPORTANT: Your response must be ONLY the complete SVG code in XML format, starting with <svg ...> and ending with </svg>.
    `;
    return svgPrompt;
}

export async function generateBitmapOutlineFromAPI(
    base64ImageData, apiKey, tracingSettings, aspectRatio, originalWidth, originalHeight, signal
) {
    const promptText = constructBitmapPrompt(tracingSettings, aspectRatio, originalWidth, originalHeight);
    const genAI = new GoogleGenAI({ apiKey });
    const model = genAI.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: [
            { role: "USER", parts: [{ inlineData: { data: base64ImageData, mimeType: "image/jpeg" } }] },
            { role: "USER", parts: [{ text: promptText }] },
        ],
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    }, { signal });

    const response = await model;
    let outlineImageData = null;
    if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                outlineImageData = part.inlineData.data;
                break;
            }
        }
    }
    if (!outlineImageData) throw new Error("Failed to generate bitmap outline from API. No image data received.");
    return `data:image/png;base64,${outlineImageData}`;
}

export async function generateDirectSvgFromAPI(
    base64ImageData, apiKey, tracingSettings, outputDimensions, aspectRatio, signal
) {
    const svgPrompt = constructDirectSvgPrompt(tracingSettings, outputDimensions, aspectRatio);
    const genAI = new GoogleGenAI({ apiKey });
    const model = genAI.models.generateContent({
        model: "gemini-2.0-flash-preview", // Using text model for SVG generation
        contents: [
            { role: "USER", parts: [{ inlineData: { data: base64ImageData, mimeType: "image/jpeg" } }] },
            { role: "USER", parts: [{ text: svgPrompt }] },
        ],
    }, { signal });

    const response = await model;
    if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                const svgContent = part.text.trim();
                // Basic validation for SVG structure
                if (svgContent.startsWith('<svg') && svgContent.endsWith('</svg>')) {
                    // Extract just the SVG content in case there's any surrounding markdown/text
                    const svgStartIdx = svgContent.indexOf('<svg');
                    const svgEndIdx = svgContent.lastIndexOf('</svg>') + 6; // Length of '</svg>'
                    return svgContent.substring(svgStartIdx, svgEndIdx);
                }
            }
        }
    }
    console.warn("Failed to get valid SVG from Gemini API for direct generation.");
    return null; // Indicate failure
}

export function generateSvgFromRasterCanvas(canvas, lineThickness, simplifyLevel) {
    if (!canvas) {
        console.error("Canvas not provided for client-side SVG generation.");
        return null;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
        console.error("Could not get canvas context for client-side SVG generation.");
        return null;
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return generateSVGFromImageData(imageData, lineThickness, simplifyLevel);
}

const RESOLUTION_FACTORS = {
    'original': 1.0,
    'medium': 0.75,
    'large': 1.5,
    'xl': 2.0,
    'xxl': 2.5,
    'xxxl': 3.0,
    'max': 4.0
};

export function adjustSvgResolutionUtil(svgString, outputResolutionKey, baseWidth, baseHeight) {
    if (!svgString) return svgString;
        
    try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
        const svgElement = svgDoc.documentElement;

        if (svgElement.nodeName === 'parsererror' || !svgElement) {
            console.error("Failed to parse SVG for resolution adjustment. SVG content:", svgString.substring(0, 200));
            return svgString; 
        }
        
        let currentWidth = parseFloat(svgElement.getAttribute('width'));
        let currentHeight = parseFloat(svgElement.getAttribute('height'));

        // If width/height are not on the <svg> tag, use baseWidth/baseHeight
        if (isNaN(currentWidth) || currentWidth <= 0) currentWidth = baseWidth;
        if (isNaN(currentHeight) || currentHeight <= 0) currentHeight = baseHeight;
        
        const factor = RESOLUTION_FACTORS[outputResolutionKey] || 1.0;
        const newWidth = Math.round(currentWidth * factor);
        const newHeight = Math.round(currentHeight * factor);
        
        svgElement.setAttribute('width', newWidth);
        svgElement.setAttribute('height', newHeight);

        // Ensure viewBox is present to maintain scaling relative to original artboard
        if (!svgElement.getAttribute('viewBox') && currentWidth > 0 && currentHeight > 0) {
            svgElement.setAttribute('viewBox', `0 0 ${currentWidth} ${currentHeight}`);
        }
        
        return new XMLSerializer().serializeToString(svgDoc);
        
    } catch (err) {
        console.error("Error adjusting SVG resolution:", err);
        return svgString;
    }
}