// removed function parseError() {...}

/**
 * Path simplification using Douglas-Peucker algorithm
 * @param {Array<{x: number, y: number}>} points - Array of points
 * @param {number} epsilon - The maximum distance from a point to the line segment
 * @returns {Array<{x: number, y: number}>} - Simplified array of points
 */
export const simplifyPath = (points, epsilon) => {
    if (points.length <= 2) return points;

    // Find the point with the maximum distance
    let maxDistance = 0;
    let index = 0;

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
        const distance = perpendicularDistance(points[i], firstPoint, lastPoint);
        if (distance > maxDistance) {
            maxDistance = distance;
            index = i;
        }
    }

    // If max distance is greater than epsilon, recursively simplify
    if (maxDistance > epsilon) {
        // Recursive call
        const firstHalf = simplifyPath(points.slice(0, index + 1), epsilon);
        const secondHalf = simplifyPath(points.slice(index), epsilon);

        // Concat the two arrays but remove duplicate middle point
        return firstHalf.slice(0, -1).concat(secondHalf);
    } else {
        // Return just the end points
        return [firstPoint, lastPoint];
    }
};

/**
 * Calculate perpendicular distance from point to line
 * @param {{x: number, y: number}} point - The point to measure distance from
 * @param {{x: number, y: number}} lineStart - The start point of the line segment
 * @param {{x: number, y: number}} lineEnd - The end point of the line segment
 * @returns {number} - The perpendicular distance
 */
export const perpendicularDistance = (point, lineStart, lineEnd) => {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    // Handle case when line is just a point
    const lineLengthSquared = dx * dx + dy * dy;
    if (lineLengthSquared === 0) {
        return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
    }

    // Calculate projection of point onto line
    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLengthSquared;
    const projectionX = lineStart.x + t * dx;
    const projectionY = lineStart.y + t * dy;

    // Return distance between point and its projection
    return Math.sqrt((point.x - projectionX) ** 2 + (point.y - projectionY) ** 2);
};

/**
 * Generates SVG markup from an array of path data strings.
 * @param {string[]} paths - Array of SVG path data strings (e.g., ["M 0 0 L 10 10", ...])
 * @param {number} width - The desired width of the SVG viewBox.
 * @param {number} height - The desired height of the SVG viewBox.
 * @param {number} strokeWidth - The stroke-width for the paths.
 * @returns {string} - The complete SVG markup.
 */
export const generateSvgFromPaths = (paths, width, height, strokeWidth) => {
    let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"
            xmlns="http://www.w3.org/2000/svg" version="1.1">
            <rect width="${width}" height="${height}" fill="white"/>`; // Include white background

    for (const pathData of paths) {
        // Ensure path data is valid and not empty
        if (pathData && pathData.trim().length > 0) {
             svg += `<path d="${pathData}" stroke="black" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
    }

    svg += `</svg>`;
    return svg;
};


/**
 * Generates SVG data (as a string) from canvas image data.
 * Performs edge detection, path tracing, and simplification.
 * @param {ImageData} imageData - The ImageData object from the canvas.
 * @param {number} lineThickness - The desired stroke width for SVG paths.
 * @param {number} simplifyLevel - A value influencing path simplification (0-100).
 * @returns {string | null} - The generated SVG string, or null if tracing fails.
 */
export const generateSVGFromImageData = (imageData, lineThickness, simplifyLevel) => {
    if (!imageData || !imageData.data || imageData.width === 0 || imageData.height === 0) {
        console.error("Invalid ImageData provided for SVG generation.");
        return null;
    }

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const threshold = 50; // Threshold for black pixels (adjust as needed)

    const isBlack = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        const idx = (y * width + x) * 4;
        // Check if pixel is predominantly black (low average RGB)
        const avg = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        return avg < threshold;
    };

    const visited = new Set();
    const paths = [];

    // Basic path tracing algorithm
    const tracePath = (startX, startY) => {
        const points = [];
        let current = {x: startX, y: startY};
        const stack = [current]; // Use a stack for a simple depth-first like trace

        while (stack.length > 0) {
            current = stack.pop();
            const key = `${current.x},${current.y}`;

            if (visited.has(key)) continue;

            visited.add(key);
            points.push(current);

            // Check 8 directions (clockwise)
            const directions = [
                {dx: 0, dy: -1}, {dx: 1, dy: -1}, {dx: 1, dy: 0}, {dx: 1, dy: 1},
                {dx: 0, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: 0}, {dx: -1, dy: -1}
            ];

            // Find next unvisited black pixel
            for (const dir of directions) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                const nkey = `${nx},${ny}`;

                if (isBlack(nx, ny) && !visited.has(nkey)) {
                    stack.push({x: nx, y: ny});
                    // Optional: Remove current point from stack if only following one path segment at a time
                    // For complex images, a more robust path following algorithm (e.g., from Potrace or similar logic) might be needed
                    break; // Move along this path segment
                }
            }
        }
        return points;
    };

    // Scan the image for black pixels to start tracing
    // Step by a few pixels for efficiency, especially on large images
    const scanStep = Math.max(1, Math.round(50 / lineThickness)); // Step size can depend on line thickness? Or fixed? Let's use a fixed step for now.
    const fixedScanStep = 3; // Use a fixed step of 3 pixels

    for (let y = 0; y < height; y += fixedScanStep) {
        for (let x = 0; x < width; x += fixedScanStep) {
            const key = `${x},${y}`;
            // Check if it's a black pixel and hasn't been visited as part of another path
            if (isBlack(x, y) && !visited.has(key)) {
                 // Start tracing from this point
                 const pathPoints = tracePath(x, y);

                 // Add path if it's long enough to be significant
                 // Minimum path length to filter noise or isolated pixels
                 const minPathLength = 10; // Adjust minimum path length
                 if (pathPoints.length > minPathLength) {
                     // Simplify the path using Douglas-Peucker
                     // Epsilon value needs tuning - simplifyLevel (0-100) maps to epsilon
                     const epsilon = simplifyLevel / 100 * 2; // Map 0-100 to epsilon 0-2? Or 0-5? Needs testing.
                                                              // Let's map 0-100 to an epsilon range like 0.5 to 5.
                     const mappedEpsilon = 0.5 + (simplifyLevel / 100) * 4.5; // Maps 0-100 to 0.5-5
                     const simplifiedPoints = simplifyPath(pathPoints, mappedEpsilon);

                     // Only add if simplification didn't reduce it too much (e.g. to 1 point)
                     if (simplifiedPoints.length > 1) {
                        // Create SVG path data string
                        let pathData = `M ${simplifiedPoints[0].x},${simplifiedPoints[0].y}`;
                        for (let i = 1; i < simplifiedPoints.length; i++) {
                            pathData += ` L ${simplifiedPoints[i].x},${simplifiedPoints[i].y}`;
                        }
                        paths.push(pathData);
                     }
                 }
            }
        }
    }

    // Generate the final SVG string
    const svg = generateSvgFromPaths(paths, width, height, lineThickness);

    // Basic validation - check if any paths were generated
    if (paths.length === 0) {
        console.warn("SVG generation resulted in no paths. The image might be blank or settings too aggressive.");
        // Return a minimal SVG or null, depending on desired behavior
        return generateSvgFromPaths([], width, height, lineThickness); // Return empty SVG with background
    }

    return svg;
};