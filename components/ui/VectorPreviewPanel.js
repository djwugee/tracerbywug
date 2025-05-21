import React from 'react';
import { Settings, Sliders, Info } from 'lucide-react';

const VectorPreviewPanel = ({ vectorStrokes }) => {
    const [showHelp, setShowHelp] = React.useState(false);
    
    return (
        React.createElement("div", {className: "mt-4 p-4 border-2 border-gray-200 bg-gray-50 rounded-lg shadow-sm animate-fadeIn"},
            React.createElement("div", {className: "flex justify-between items-center mb-3"},
                React.createElement("h3", {className: "font-bold text-base sm:text-lg flex items-center gap-2"},
                    React.createElement(Settings, {className: "w-4 h-4 text-primary"}),
                    "Vector Settings"
                ),
                React.createElement("button", {
                    onClick: () => setShowHelp(!showHelp),
                    className: "text-gray-500 hover:text-primary p-1 rounded-full hover:bg-gray-100 transition-colors"
                }, 
                    React.createElement(Info, {className: "w-4 h-4"})
                )
            ),
            
            showHelp && React.createElement("div", {className: "mb-3 p-3 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-100 animate-fadeIn"},
                React.createElement("p", null, "Vectorization converts your bitmap drawing to clean vector paths that can be scaled without quality loss. Perfect for SVG export."),
                React.createElement("p", {className: "mt-1.5"}, "Adjust settings below to customize how your drawing is vectorized.")
            ),
                
            React.createElement("div", {className: "flex flex-wrap gap-4"},
                React.createElement("div", {className: "w-full sm:w-auto"},
                    React.createElement("label", {className: "block text-sm font-medium mb-1 text-gray-700"}, "Stroke Regularization"),
                    React.createElement("select", {
                            className: "border border-gray-300 rounded-md p-2 w-full text-sm focus:ring focus:ring-primary/20 focus:border-primary",
                            defaultValue: "0.1",
                            onChange: (e) => {
                                alert("This would update the stroke regularization weight and re-vectorize the drawing");
                            }
                        },
                        React.createElement("option", {value: "0.0"}, "None (0.0)"),
                        React.createElement("option", {value: "0.05"}, "Light (0.05)"),
                        React.createElement("option", {value: "0.1"}, "Medium (0.1)"),
                        React.createElement("option", {value: "0.2"}, "Strong (0.2)")
                    )
                ),
                React.createElement("div", {className: "w-full sm:w-auto"},
                    React.createElement("label", {className: "block text-sm font-medium mb-1 text-gray-700"}, "Window Size"),
                    React.createElement("select", {
                            className: "border border-gray-300 rounded-md p-2 w-full text-sm focus:ring focus:ring-primary/20 focus:border-primary",
                            defaultValue: "128",
                            onChange: (e) => {
                                alert("This would update the window size and re-vectorize the drawing");
                            }
                        },
                        React.createElement("option", {value: "32"}, "Small (32px)"),
                        React.createElement("option", {value: "64"}, "Medium (64px)"),
                        React.createElement("option", {value: "128"}, "Large (128px)")
                    )
                )
            ),
            React.createElement("div", {className: "mt-3 flex justify-between items-center"},
                React.createElement("p", {className: "text-sm text-gray-600"}, 
                    React.createElement("span", {className: "font-medium"}, `${vectorStrokes.length}`), 
                    " vector strokes created"
                ),
                React.createElement("span", {className: "text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full"}, "SVG Export Ready")
            )
        )
    );
};

export default VectorPreviewPanel;

