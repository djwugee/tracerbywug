import React from 'react';
import { Info } from 'lucide-react';

const TracingSettingsPanel = ({
    traceMode,
    setTraceMode,
    lineThickness,
    setLineThickness,
    detailLevel,
    setDetailLevel,
    simplifyLevel,
    setSimplifyLevel,
    enhanceEdges,
    setEnhanceEdges,
    directVectorMode,
    setDirectVectorMode
}) => {
    const [showVectorInfo, setShowVectorInfo] = React.useState(false);
    
    return (
        React.createElement("div", {className: "mt-4 p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm"},
            React.createElement("h4", {className: "font-medium mb-3 text-base text-gray-800"}, "Tracing Settings"),
            React.createElement("div", {className: "mb-3 space-y-4"},
                React.createElement("div", null,
                    React.createElement("label", {className: "block text-sm font-medium text-gray-700 mb-1"}, "Trace Mode"),
                    React.createElement("select", {
                            value: traceMode,
                            onChange: (e) => setTraceMode(e.target.value),
                            className: "w-full p-2 border border-gray-300 rounded-md text-sm focus:ring focus:ring-primary/20 focus:border-primary"
                        },
                        React.createElement("option", {value: "outline"}, "Outline (Simple contours)"),
                        React.createElement("option", {value: "sketch"}, "Sketch (Hand-drawn style)"),
                        React.createElement("option", {value: "detailed"}, "Detailed (Fine details)")
                    )
                ),
                React.createElement("div", null,
                    React.createElement("label", {className: "block text-sm font-medium text-gray-700 mb-1 flex justify-between"},
                        React.createElement("span", null, "Line Thickness"),
                        React.createElement("span", {className: "text-gray-500"}, lineThickness)
                    ),
                    React.createElement("input", {
                        type: "range",
                        min: "1",
                        max: "5",
                        value: lineThickness,
                        onChange: (e) => setLineThickness(Number.parseInt(e.target.value)),
                        className: "w-full accent-primary"
                    })
                ),
                React.createElement("div", null,
                    React.createElement("label", {className: "block text-sm font-medium text-gray-700 mb-1 flex justify-between"},
                        React.createElement("span", null, "Detail Level"),
                        React.createElement("span", {className: "text-gray-500"}, `${detailLevel}%`)
                    ),
                    React.createElement("input", {
                        type: "range",
                        min: "0",
                        max: "100",
                        value: detailLevel,
                        onChange: (e) => setDetailLevel(Number.parseInt(e.target.value)),
                        className: "w-full accent-primary"
                    })
                ),
                React.createElement("div", null,
                    React.createElement("label", {className: "block text-sm font-medium text-gray-700 mb-1 flex justify-between"},
                        React.createElement("span", null, "Simplify Level"),
                        React.createElement("span", {className: "text-gray-500"}, `${simplifyLevel}%`)
                    ),
                    React.createElement("input", {
                        type: "range",
                        min: "0",
                        max: "100",
                        value: simplifyLevel,
                        onChange: (e) => setSimplifyLevel(Number.parseInt(e.target.value)),
                        className: "w-full accent-primary"
                    })
                ),
                React.createElement("div", {className: "flex items-center justify-between"},
                    React.createElement("div", {className: "flex items-center"},
                        React.createElement("input", {
                            type: "checkbox",
                            id: "enhanceEdges",
                            checked: enhanceEdges,
                            onChange: (e) => setEnhanceEdges(e.target.checked),
                            className: "w-4 h-4 mr-2 accent-primary"
                        }),
                        React.createElement("label", {htmlFor: "enhanceEdges", className: "text-sm font-medium text-gray-700"}, "Enhance Edges")
                    ),
                    React.createElement("div", {className: "flex items-center"},
                        React.createElement("input", {
                            type: "checkbox",
                            id: "directVectorMode",
                            checked: directVectorMode,
                            onChange: (e) => setDirectVectorMode(e.target.checked),
                            className: "w-4 h-4 mr-2 accent-primary"
                        }),
                        React.createElement("label", {
                            htmlFor: "directVectorMode", 
                            className: "text-sm font-medium text-gray-700 flex items-center"
                        }, 
                            "Direct Vector Mode",
                            React.createElement("button", {
                                onClick: () => setShowVectorInfo(!showVectorInfo),
                                className: "ml-1 text-gray-400 hover:text-primary"
                            },
                                React.createElement(Info, {className: "w-3.5 h-3.5"})
                            )
                        )
                    )
                ),
                showVectorInfo && React.createElement("div", {
                    className: "p-2.5 bg-blue-50 text-blue-800 text-xs rounded-md border border-blue-100 animate-fadeIn"
                },
                    "Direct Vector Mode uses AI to generate SVG paths directly, resulting in cleaner vector output. This improves SVG export quality with smoother curves and more accurate outlines."
                )
            )
        )
    );
};

export default TracingSettingsPanel;