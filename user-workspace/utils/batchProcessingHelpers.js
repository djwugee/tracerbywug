import { GoogleGenAI, Modality } from '@google/genai';
import { generateSVGFromImageData } from './svgGenerator.js';

/**
 * Processes a single image in a batch with the AI model
 * @param {Object} imageItem - Image object with dataUrl and metadata
 * @param {number} index - Index of image in batch array
 * @param {AbortSignal} signal - AbortController signal for cancellation
 * @param {string} apiKey - Google AI API key
 * @param {Object} tracingSettings - Settings for image tracing
 * @param {string} outputResolution - Resolution setting for output
 * @param {string} outputFormat - Format to generate (png, jpeg, svg)
 * @param {Function} updateImageStatus - Function to update image status in state
 * @returns {Promise<Object|null>} - Processed image data or null on failure
 */
export const processImageWithAI = async (
  imageItem, 
  index, 
  signal, 
  apiKey, 
  tracingSettings, 
  outputResolution,
  outputFormat, 
  updateImageStatus
) => {
  if (!apiKey || !imageItem?.dataUrl) {
    updateImageStatus(index, { processing: false, error: "Invalid image or API key" });
    return null;
  }

  try {
    const imageData = imageItem.dataUrl.split(",")[1];
    const promptText = generatePromptText(imageItem, tracingSettings);

    // First, generate the bitmap trace using Gemini
    const genAI = new GoogleGenAI({apiKey});
    const model = genAI.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [
        {
          role: "USER",
          parts: [{inlineData: {data: imageData, mimeType: "image/jpeg"}}],
        },
        {
          role: "USER",
          parts: [{text: promptText}],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    }, { signal });

    const response = await model;
    let baseRasterOutlineData = null; 

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          baseRasterOutlineData = part.inlineData.data;
          break;
        }
      }
    }

    if (baseRasterOutlineData) {
      const baseRasterOutlineDataUrl = `data:image/png;base64,${baseRasterOutlineData}`;
      
      let svgString = null;
      
      // If SVG format is requested and direct vector mode is enabled, generate SVG directly
      if (outputFormat === 'svg' && tracingSettings.directVectorMode) {
        updateImageStatus(index, { processing: true, statusMessage: "Generating SVG..." });
        
        svgString = await generateDirectSVG(
          imageData, 
          imageItem.width, 
          imageItem.height,
          imageItem.aspectRatio,
          apiKey,
          tracingSettings,
          outputResolution,
          signal
        );
      }
      
      // Process raster formats and fallback SVG generation
      const processedFormats = await generateFormatsFromRasterImage(
        baseRasterOutlineDataUrl, 
        outputResolution, 
        tracingSettings,
        imageItem.width, 
        imageItem.height,
        svgString // Pass any already-generated SVG
      );
      
      return { 
        pngOutlineData: processedFormats.pngDataUrl, 
        jpegOutlineData: processedFormats.jpegDataUrl,
        svgData: processedFormats.svgString,
        requestedOutputFormat: outputFormat, 
        dimensions: processedFormats.dimensions
      };
    }
    
    updateImageStatus(index, { processing: false, error: "No image data from API" });
    return null;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log(`Processing cancelled for ${imageItem.file.name}`);
      updateImageStatus(index, { processing: false, error: "Cancelled" });
      return null;
    }
    
    console.error(`Error processing batch image ${imageItem.file.name}:`, err);
    updateImageStatus(index, { processing: false, error: err.message || "Unknown error" });
    return null;
  }
};

/**
 * Generates the prompt text for the AI model based on image and tracing settings
 */
function generatePromptText(imageItem, tracingSettings) {
  let promptText = `
    Trace this image and create a clean ${tracingSettings.traceMode} drawing.
    Use these parameters:
    - Line thickness: ${tracingSettings.lineThickness} (1-5 scale)
    - Detail level: ${tracingSettings.detailLevel}% (higher means more details)
    - Simplify level: ${tracingSettings.simplifyLevel}% (higher means more simplification)
    - Edge enhancement: ${tracingSettings.enhanceEdges ? "Yes" : "No"}
    IMPORTANT: Maintain the original aspect ratio of ${imageItem.aspectRatio.toFixed(4)} (width/height).
    The original image dimensions are ${imageItem.width}x${imageItem.height} pixels.
    Output should be a black and white line drawing/sketch.
  `;

  if (tracingSettings.traceMode === "outline") {
    promptText += `Focus on clean, essential contours. No shading.`;
  } else if (tracingSettings.traceMode === "sketch") {
    promptText += `Include some texture and line variation for a hand-drawn look.`;
  } else if (tracingSettings.traceMode === "detailed") {
    promptText += `Capture fine internal details and textures with clean lines.`;
  }
  
  return promptText;
}

/**
 * Generate SVG directly from the original image via Gemini
 * @param {string} imageData - Base64 image data
 * @param {number} width - Original image width
 * @param {number} height - Original image height
 * @param {number} aspectRatio - Image aspect ratio
 * @param {string} apiKey - Google AI API key
 * @param {Object} tracingSettings - Tracing settings
 * @param {string} outputResolution - Resolution setting
 * @param {AbortSignal} signal - AbortController signal
 * @returns {Promise<string|null>} - SVG string or null
 */
async function generateDirectSVG(
  imageData,
  width,
  height,
  aspectRatio,
  apiKey,
  tracingSettings,
  outputResolution,
  signal
) {
  try {
    // Apply resolution factor to dimensions
    const resolutionFactors = {
      'original': 1.0,
      'medium': 0.75,
      'large': 1.5,
      'xl': 2.0,
      'xxl': 2.5,
      'xxxl': 3.0,
      'max': 4.0
    };
    const factor = resolutionFactors[outputResolution] || 1.0;
    const scaledWidth = Math.round(width * factor);
    const scaledHeight = Math.round(height * factor);
    
    // Create the SVG generation prompt
    const svgPrompt = `
      Create a clean vector SVG trace of this image.
      
      Technical requirements:
      - Return ONLY valid SVG XML code with no other text or explanation
      - Output width: ${scaledWidth}, height: ${scaledHeight}
      - Maintain aspect ratio: ${aspectRatio.toFixed(4)}
      - Line thickness: ${tracingSettings.lineThickness}px
      - Detail level: ${tracingSettings.detailLevel}% (higher means more details)
      - Path simplification: ${tracingSettings.simplifyLevel}% (higher means more simplified paths)
      
      Style requirements:
      - ${tracingSettings.traceMode === "outline" ? "Simple outlines with clean, minimal strokes" : 
         tracingSettings.traceMode === "sketch" ? "Hand-drawn sketch style with natural line variation" : 
         "Detailed vector drawing with internal features and textures"}
      - Black stroke on white background
      - ${tracingSettings.enhanceEdges ? "Enhanced edge detection for clearer contours" : "Natural edges"}
      - No fills, just strokes
      - Use <path> elements with appropriate stroke attributes
      - Include a white background rectangle
      
      IMPORTANT: Your response must be ONLY the complete SVG code in XML format.
    `;

    const genAI = new GoogleGenAI({apiKey});
    const model = genAI.models.generateContent({
      model: "gemini-2.0-flash-preview", // Using text model for SVG generation
      contents: [
        {
          role: "USER",
          parts: [{inlineData: {data: imageData, mimeType: "image/jpeg"}}],
        },
        {
          role: "USER",
          parts: [{text: svgPrompt}],
        },
      ],
    }, { signal });

    const response = await model;
    
    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          const svgContent = part.text.trim();
          
          // Verify it's valid SVG by checking for opening and closing SVG tags
          if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
            // Extract just the SVG content in case there's any surrounding text
            const svgStartIdx = svgContent.indexOf('<svg');
            const svgEndIdx = svgContent.lastIndexOf('</svg>') + 6;
            return svgContent.substring(svgStartIdx, svgEndIdx);
          }
        }
      }
    }
    
    console.warn("Failed to get valid SVG from API");
    return null;
    
  } catch (err) {
    console.error("Error generating direct SVG:", err);
    return null;
  }
}

/**
 * Generates PNG, JPEG, and SVG from a base raster image (typically PNG from AI).
 * @param {string} baseRasterDataUrl - Data URL of the base raster image.
 * @param {string} outputResolution - Resolution setting for output ('original', 'medium', etc.).
 * @param {Object} tracingSettings - Settings for SVG generation (lineThickness, simplifyLevel).
 * @param {number} originalImageWidth - Original width of the source image for sizing.
 * @param {number} originalImageHeight - Original height of the source image for sizing.
 * @param {string|null} existingSvgString - Existing SVG string if already generated
 * @returns {Promise<Object|null>} - Object with pngDataUrl, jpegDataUrl, svgString, dimensions, or null on error.
 */
async function generateFormatsFromRasterImage(
  baseRasterDataUrl, 
  outputResolution, 
  tracingSettings, 
  originalImageWidth, 
  originalImageHeight,
  existingSvgString = null
) {
  try {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return null;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = baseRasterDataUrl;
    });
    
    let canvasWidth = img.width;
    let canvasHeight = img.height;
    
    const baseWidthForScaling = img.width || originalImageWidth;
    const baseHeightForScaling = img.height || originalImageHeight;

    const resolutionFactors = {
        'original': 1.0,
        'medium': 0.75,
        'large': 1.5,
        'xl': 2.0,
        'xxl': 2.5,
        'xxxl': 3.0,
        'max': 4.0
    };
    const factor = resolutionFactors[outputResolution] || 1.0;

    canvasWidth = Math.round(baseWidthForScaling * factor);
    canvasHeight = Math.round(baseHeightForScaling * factor);
    
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    tempCtx.fillStyle = "#FFFFFF"; 
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Generate SVG if not already provided and we need it
    let svgString = existingSvgString;
    if (!svgString) {
      const tempImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      svgString = generateSVGFromImageData(
        tempImageData,
        tracingSettings.lineThickness,
        tracingSettings.simplifyLevel
      );
    }
    
    const pngDataUrl = tempCanvas.toDataURL('image/png');
    const jpegDataUrl = tempCanvas.toDataURL('image/jpeg', 0.9); 
    
    return {
      svgString,
      pngDataUrl,
      jpegDataUrl,
      dimensions: {
        width: tempCanvas.width,
        height: tempCanvas.height
      }
    };
  } catch (err) {
    console.error("Error generating derived image formats:", err);
    return { 
      pngDataUrl: baseRasterDataUrl, 
      jpegDataUrl: null, 
      svgString: existingSvgString, 
      dimensions: { 
        width: originalImageWidth, 
        height: originalImageHeight 
      } 
    }; 
  }
}