export default class VectorSketchingModel {
    canvas = null;
    ctx = null;
    strokes = [];
    dynamicWindow = {position: {x: 0, y: 0}, size: 128}; // Default window size
    minWindowSize = 32;
    maxWindowSize = 512;
    strokeRegularizationWeight = 0.1; // Default regularization weight

    constructor() {}

    initialize(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        // Reset dynamic window position on initialization
        this.dynamicWindow.position = {x: canvas.width / 2, y: canvas.height / 2};
        // Note: Window size and regularization weight are now set via state in the hook and applied before processing
    }

    async processImage(imageData) {
        // Reset strokes and dynamic window position for a new processing run
        this.strokes = [];
        this.dynamicWindow.position = {x: this.canvas.width / 2, y: this.canvas.height / 2};

        // This part might be slow, consider adding progress or yielding control
        const edges = this.detectEdges(imageData);
        const paths = this.tracePaths(edges);

        for (const path of paths) {
            const strokes = this.pathToBezierStrokes(path);
            this.strokes.push(...strokes);
        }
        this.applyStrokeRegularization(); // Apply regularization based on the current weight setting

        return this.strokes;
    }

    detectEdges(imageData) {
         // Simple Sobel filter for edge detection
        const edgeData = new ImageData(imageData.width, imageData.height);
        const srcData = imageData.data;
        const destData = edgeData.data;
        const width = imageData.width;
        const height = imageData.height;
        const threshold = 30; // Sensitivity threshold

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = (y * width + x) * 4;

                // Grayscale value approximation (avoid alpha)
                const getGray = (px, py) => {
                    const idx = (py * width + px) * 4;
                    return (srcData[idx] + srcData[idx + 1] + srcData[idx + 2]) / 3;
                };

                // Sobel operators
                const Gx =
                    (-1 * getGray(x - 1, y - 1)) +
                    (-2 * getGray(x - 1, y)) +
                    (-1 * getGray(x - 1, y + 1)) +
                    ( 1 * getGray(x + 1, y - 1)) +
                    ( 2 * getGray(x + 1, y)) +
                    ( 1 * getGray(x + 1, y + 1));

                const Gy =
                    (-1 * getGray(x - 1, y - 1)) +
                    (-2 * getGray(x, y - 1)) +
                    (-1 * getGray(x + 1, y - 1)) +
                    ( 1 * getGray(x - 1, y + 1)) +
                    ( 2 * getGray(x, y + 1)) +
                    ( 1 * getGray(x + 1, y + 1));

                const magnitude = Math.sqrt(Gx * Gx + Gy * Gy);
                const value = magnitude > threshold ? 255 : 0; // Apply threshold

                destData[i] = value;
                destData[i + 1] = value;
                destData[i + 2] = value;
                destData[i + 3] = 255; // Full opacity
            }
        }

        return edgeData;
    }

    tracePaths(edgeData) {
        // Basic path tracing - might need optimization for complex images
        const paths = [];
        const visited = new Set();
        const width = edgeData.width;
        const height = edgeData.height;
        const edgeThreshold = 128; // Consider pixels with value > 128 as edge

        const isEdge = (x, y) => {
             if (x < 0 || x >= width || y < 0 || y >= height) return false;
             const idx = (y * width + x) * 4;
             return edgeData.data[idx] > edgeThreshold;
        }

        const tracePath = (startX, startY) => {
            const path = [];
            let currentX = startX;
            let currentY = startY;

            // Prioritized neighbors (straight then diagonal)
            const neighbors = [
                {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, // Cardinal
                {dx: 1, dy: -1}, {dx: 1, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: -1} // Diagonal
            ];

             // Simple greedy path tracing
            while(true) {
                const key = `${currentX},${currentY}`;
                if (visited.has(key)) break; // Stop if we revisit a pixel

                visited.add(key);
                path.push({x: currentX, y: currentY});

                let foundNext = false;
                for (const {dx, dy} of neighbors) {
                    const nextX = currentX + dx;
                    const nextY = currentY + dy;
                    const nextKey = `${nextX},${nextY}`;

                    if (isEdge(nextX, nextY) && !visited.has(nextKey)) {
                        currentX = nextX;
                        currentY = nextY;
                        foundNext = true;
                        break; // Move to the next pixel
                    }
                }

                if (!foundNext) break; // Stop if no valid next pixel found
            }
            return path;
        };


        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const key = `${x},${y}`;
                if (isEdge(x, y) && !visited.has(key)) {
                    const path = tracePath(x, y);
                    if (path.length > 10) { // Minimum path length to filter noise
                        paths.push(path);
                    }
                }
            }
        }

        return paths;
    }

    pathToBezierStrokes(path) {
         // Simple conversion of path points to quadratic bezier strokes
         // This is a very basic approach; typically, curve fitting algorithms
         // like Ramer-Douglas-Peucker + curve fitting would be used.
        const strokes = [];
        if (path.length < 2) return strokes;

        // Start with the first point
        strokes.push({
             curve: {
                 p0: {...path[0]},
                 p1: {...path[0]}, // Control point starts at start
                 p2: {...path[0]},
                 width0: 2.0,
                 width2: 2.0,
             },
             penState: 1, // Pen down
         });

        let currentPointIndex = 0;
        while (currentPointIndex < path.length - 1) {
             const p0 = path[currentPointIndex];
             const p2 = path[currentPointIndex + 1]; // Next point as end point

             // Simple midpoint or slight offset for control point
             const p1 = {
                 x: (p0.x + p2.x) / 2,
                 y: (p0.y + p2.y) / 2,
             };
             // You might want a more sophisticated control point calculation based on local curvature

             strokes.push({
                 curve: {
                     p0: {...p0},
                     p1: p1,
                     p2: {...p2},
                     width0: 2.0, // Assume constant width for simplicity
                     width2: 2.0,
                 },
                 penState: 1, // Pen down
             });

             currentPointIndex++; // Move to the next point
         }


         // The original code had a different loop structure and dynamic window logic
         // The dynamic window concept wasn't fully integrated into path generation.
         // This simplified bezier conversion processes points sequentially.
         // A more advanced implementation would segment paths and fit curves.

        return strokes;
    }


    applyStrokeRegularization() {
         // This method is intended to simplify/smooth the generated strokes.
         // The current implementation does remove redundant points and merge short strokes,
         // but doesn't use the `strokeRegularizationWeight` parameter actively
         // in a gradient descent or optimization process as suggested by the name.
         // It performs two basic cleanup steps.

        if (this.strokes.length <= 2) return;

        // The weight could potentially influence parameters used in removeRedundantStrokes
        // or mergeShortStrokes (e.g., distance thresholds, sampling rate),
        // or be used in a more complex smoothing step.
        // For now, the existing cleanup logic remains.

        this.removeRedundantStrokes();
        this.mergeShortStrokes();
    }

    removeRedundantStrokes() {
         // Removes strokes that cover areas already covered by previous strokes.
         // Basic implementation using a grid-based 'occupiedRegions' set.
         // This might be computationally expensive for large canvases/many strokes.
         // The 'samples' value could potentially be influenced by the regularization weight.

        const newStrokes = [];
        const occupiedRegions = new Set();
        const gridSize = 5; // Define a grid size for checking occupied regions - might need tuning

        const addPointsToOccupied = (p0, p1, p2) => {
             const samples = 10; // Number of points to sample along the curve
             for (let t = 0; t <= 1; t += 1 / samples) {
                 // Quadratic Bezier curve point calculation
                 const x = Math.round((1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x);
                 const y = Math.round((1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y);
                 // Use a grid cell as the key for efficiency
                 const key = `${Math.floor(x / gridSize)},${Math.floor(y / gridSize)}`;
                 occupiedRegions.add(key);
             }
         };

        for (const stroke of this.strokes) {
            if (stroke.penState === 0) { // Handle pen up strokes
                newStrokes.push(stroke);
                continue;
            }

            const {p0, p1, p2} = stroke.curve;
            let isRedundant = false;

            // Check if points along this stroke are already in occupied regions
             const samples = 10; // Same samples as used for adding
             for (let t = 0; t <= 1; t += 1 / samples) {
                 const x = Math.round((1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x);
                 const y = Math.round((1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y);
                 const key = `${Math.floor(x / gridSize)},${Math.floor(y / gridSize)}`;

                 if (occupiedRegions.has(key)) {
                     isRedundant = true;
                     break;
                 }
             }

            if (!isRedundant) {
                newStrokes.push(stroke);
                // Add points of the new stroke to occupied regions
                addPointsToOccupied(p0, p1, p2);
            }
        }

        this.strokes = newStrokes;
    }

    mergeShortStrokes() {
         // Merges consecutive short strokes if their endpoints are close.
         // The distance threshold (5 pixels) is fixed.
         // This threshold could potentially be influenced by the regularization weight.

        if (this.strokes.length <= 2) return;

        const newStrokes = [this.strokes[0]];
        const mergeThreshold = 5; // Distance threshold for merging

        for (let i = 1; i < this.strokes.length; i++) {
            const prevStroke = newStrokes[newStrokes.length - 1];
            const currStroke = this.strokes[i];

            // Don't merge if either is a pen up stroke
            if (prevStroke.penState === 0 || currStroke.penState === 0) {
                newStrokes.push(currStroke);
                continue;
            }

            const prevEnd = prevStroke.curve.p2;
            const currStart = currStroke.curve.p0;

            const distance = Math.sqrt(Math.pow(prevEnd.x - currStart.x, 2) + Math.pow(prevEnd.y - currStart.y, 2));

            if (distance < mergeThreshold) {
                // Merge the strokes
                const mergedStroke = {
                    curve: {
                        p0: prevStroke.curve.p0, // Keep the start of the previous stroke
                        p1: prevStroke.curve.p1, // Keep the control point of the previous stroke (simple merge)
                        p2: currStroke.curve.p2, // Take the end point of the current stroke
                        width0: prevStroke.curve.width0,
                        width2: currStroke.curve.width2,
                    },
                    penState: 1,
                };

                // Replace the last stroke in newStrokes with the merged one
                newStrokes[newStrokes.length - 1] = mergedStroke;
            } else {
                // If not merging, just add the current stroke
                newStrokes.push(currStroke);
            }
        }

        this.strokes = newStrokes;
    }

    renderStrokes(canvas) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply transformation to fit strokes to canvas size if needed
        // This model currently assumes strokes are in canvas coordinates.
        // If the canvas size changes, strokes would need scaling.
        // For now, assume canvas size is set correctly before render.

        for (const stroke of this.strokes) {
            if (stroke.penState === 0) continue; // Skip pen up strokes

            const {p0, p1, p2, width0, width2} = stroke.curve;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y); // Draw as quadratic bezier

            // Use average width for simplicity
            ctx.lineWidth = (width0 + width2) / 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = "#000"; // Draw in black
            ctx.stroke();
        }
    }

    exportSVG() {
        if (!this.canvas) return "";

        const width = this.canvas.width;
        const height = this.canvas.height;

        // SVG header
        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

        // Draw a white background rectangle (optional, but good practice)
        // svg += `<rect width="${width}" height="${height}" fill="white"/>`; // Decide if background is needed in SVG

        for (const stroke of this.strokes) {
            if (stroke.penState === 0) continue; // Skip pen up strokes

            const {p0, p1, p2, width0, width2} = stroke.curve;
            const avgWidth = (width0 + width2) / 2;

            // Define path using MoveTo (M), Quadratic Bezier Curve (Q) commands
            svg += `<path d="M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y}, ${p2.x} ${p2.y}" `;
            svg += `stroke="black" stroke-width="${avgWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
        }

        svg += "</svg>"; // Close SVG tag
        return svg;
    }
}