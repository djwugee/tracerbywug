import React from 'react';

export function useTracingSettings(initialSettings = {}) {
    const [lineThickness, setLineThickness] = React.useState(initialSettings.lineThickness ?? 2);
    const [detailLevel, setDetailLevel] = React.useState(initialSettings.detailLevel ?? 14);
    const [simplifyLevel, setSimplifyLevel] = React.useState(initialSettings.simplifyLevel ?? 52);
    const [enhanceEdges, setEnhanceEdges] = React.useState(initialSettings.enhanceEdges ?? true);
    const [traceMode, setTraceMode] = React.useState(initialSettings.traceMode ?? "outline");
    const [outputResolution, setOutputResolution] = React.useState(initialSettings.outputResolution ?? 'xxxl');
    const [directVectorMode, setDirectVectorMode] = React.useState(initialSettings.directVectorMode ?? true);

    const tracingSettings = React.useMemo(() => ({
        lineThickness,
        detailLevel,
        simplifyLevel,
        enhanceEdges,
        traceMode,
        outputResolution,
        directVectorMode
    }), [lineThickness, detailLevel, simplifyLevel, enhanceEdges, traceMode, outputResolution, directVectorMode]);

    return {
        tracingSettings, 
        lineThickness, setLineThickness,
        detailLevel, setDetailLevel,
        simplifyLevel, setSimplifyLevel,
        enhanceEdges, setEnhanceEdges,
        traceMode, setTraceMode,
        outputResolution, setOutputResolution,
        directVectorMode, setDirectVectorMode,
    };
}