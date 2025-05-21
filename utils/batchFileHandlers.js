/**
 * Process files for batch upload, creating image objects with metadata
 * @param {FileList} files - Files from input element
 * @param {Function} setMainError - Function to set main error message
 * @returns {Promise<Array>} - Array of processed image objects
 */
export const processBatchFiles = async (files, setMainError) => {
  if (!files.length) return [];
  
  const validFiles = Array.from(files).filter(file =>
    file.type.match("image.*") && file.size <= 5 * 1024 * 1024
  );

  if (validFiles.length !== files.length) {
    setMainError("Some files were skipped. Images must be under 5MB and in a supported format.");
  }

  const processedFiles = await Promise.all(
    validFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              file,
              dataUrl: e.target.result,
              width: img.width,
              height: img.height,
              aspectRatio: img.width / img.height,
              processed: false,
              processing: false,
              error: null,
              // Initialize new fields for processed data
              pngOutlineData: null,
              jpegOutlineData: null,
              svgData: null,
              requestedOutputFormat: null,
              dimensions: null,
            });
          };
          img.onerror = () => {
            console.warn(`Failed to load image for batch: ${file.name}`);
            resolve(null);
          };
          img.src = e.target.result;
        };
        reader.onerror = () => {
          console.warn(`Failed to read file for batch: ${file.name}`);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    })
  );

  return processedFiles.filter(result => result !== null);
};

/**
 * Package and download batch processed images as a zip file
 * @param {Array} processedItems - Array of processed image objects with pngOutlineData, jpegOutlineData, svgData
 * @param {string} format - File format to download (png, jpeg, svg)
 * @param {Function} setMainError - Function to set main error message
 */
export const downloadBatchAsZip = async (processedItems, format, setMainError) => {
  if (processedItems.length === 0) {
    setMainError("No processed images to download.");
    return;
  }

  try {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    let processedCount = 0;
    const tasks = []; // For any async operations like JPEG conversion (if needed)

    for (const img of processedItems) {
      if (!img.processed) continue; // Skip unprocessed or errored images

      let fileData = null;
      let fileName = img.file.name.replace(/\.[^/.]+$/, ""); // Original name without extension
      let fileExtension = format; // Use the requested download format as extension
      let isBase64 = true;

      if (format === 'png') {
        if (img.pngOutlineData) {
          fileData = img.pngOutlineData.split(',')[1];
        }
      } else if (format === 'svg') {
        if (img.svgData) {
          fileData = img.svgData;
          isBase64 = false;
        }
      } else if (format === 'jpeg') {
        fileExtension = 'jpg'; // Common extension for JPEG
        if (img.jpegOutlineData) { // Prioritize pre-generated JPEG
          fileData = img.jpegOutlineData.split(',')[1];
        } else if (img.pngOutlineData) { // Fallback: convert PNG to JPEG
          const task = new Promise((resolve) => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            const imageToConvert = new Image();
            imageToConvert.onload = () => {
              tempCanvas.width = img.dimensions?.width || imageToConvert.width;
              tempCanvas.height = img.dimensions?.height || imageToConvert.height;
              tempCtx.fillStyle = "#FFFFFF";
              tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
              tempCtx.drawImage(imageToConvert, 0, 0, tempCanvas.width, tempCanvas.height);
              const jpegUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
              const jpegBase64 = jpegUrl.split(',')[1];
              if (jpegBase64) {
                zip.file(`${fileName}_traced.${fileExtension}`, jpegBase64, { base64: true });
                processedCount++; // Increment here as it's added directly to zip
              }
              resolve();
            };
            imageToConvert.onerror = () => {
              console.error(`Error loading image ${img.file.name} for JPEG conversion.`);
              resolve();
            };
            imageToConvert.src = img.pngOutlineData;
          });
          tasks.push(task);
          continue; // Skip direct zipping here, handled by task
        }
      }

      if (fileData) {
        zip.file(`${fileName}_traced.${fileExtension}`, fileData, { base64: isBase64 });
        processedCount++;
      }
    }

    await Promise.all(tasks); // Wait for all conversions

    if (processedCount > 0) {
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `traced_images_${format}.zip`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, 100);
    } else {
      setMainError(`No valid images to download in ${format.toUpperCase()} format.`);
    }
  } catch (err) {
    console.error("Error creating zip file:", err);
    setMainError("Failed to create download package. Try downloading images individually if available.");
  }
};