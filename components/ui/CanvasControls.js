import React from 'react';
import { Trash2, VideoIcon as Vector, Upload, Download, ChevronDown, LoaderCircle, Minus, Plus } from 'lucide-react';
import DownloadMenu from './DownloadMenu.js';

const CanvasControls = ({
    penColor,
    penSize,
    changePenSize,
    openColorPicker,
    handleKeyDown,
    colorInputRef,
    handleColorChange,
    clearCanvas,
    isVectorizing,
    showVectorPreview,
    toggleVectorPreview,
    setShowImageTracer,
    isApiKeySet,
    downloadButtonRef, 
    svgData
}) => {
    const [showDownloadOptions, setShowDownloadOptions] = React.useState(false); 
    const [showPenSizeControls, setShowPenSizeControls] = React.useState(false);
    
    // Effect to close menus when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            // Close download menu if clicking outside
            if (downloadButtonRef.current && !downloadButtonRef.current.contains(e.target)) {
                const menuContainer = downloadButtonRef.current.closest('.relative');
                if (menuContainer && !menuContainer.contains(e.target)) {
                    setShowDownloadOptions(false);
                } else if (!menuContainer) { 
                    setShowDownloadOptions(false);
                }
            }
            
            // Close pen size controls if clicking outside
            const penSizeButton = document.getElementById('pen-size-button');
            const penSizeMenu = document.getElementById('pen-size-controls');
            if (penSizeButton && penSizeMenu && !penSizeButton.contains(e.target) && !penSizeMenu.contains(e.target)) {
                setShowPenSizeControls(false);
            }
        };

        if (showDownloadOptions || showPenSizeControls) { 
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDownloadOptions, showPenSizeControls, downloadButtonRef]);

    // Handle pen size change
    const adjustPenSize = (change) => {
        const newSize = Math.max(1, Math.min(20, penSize + change));
        changePenSize(newSize);
    };

    return (
        React.createElement("div", {className: "flex flex-wrap items-center tool-controls-wrapper"},
            // Color picker button
            React.createElement("button", {
                    type: "button",
                    className: "tool-button overflow-hidden flex items-center justify-center border-2 border-white shadow-sm relative",
                    onClick: openColorPicker,
                    onKeyDown: handleKeyDown,
                    "aria-label": "Open color picker",
                    style: {backgroundColor: penColor}
                },
                React.createElement("input", {
                    ref: colorInputRef,
                    type: "color",
                    value: penColor,
                    onChange: handleColorChange,
                    className: "opacity-0 absolute w-px h-px",
                    "aria-label": "Select pen color"
                })
            ),
            
            // Pen size button
            React.createElement("div", {className: "relative"},
                React.createElement("button", {
                        id: "pen-size-button",
                        type: "button",
                        onClick: () => setShowPenSizeControls(!showPenSizeControls),
                        className: `tool-button bg-white shadow-sm relative ${showPenSizeControls ? 'bg-gray-100' : ''}`,
                        "aria-label": "Adjust pen size",
                        title: "Adjust pen size"
                    },
                    React.createElement("div", {
                        className: "rounded-full bg-black",
                        style: { width: `${Math.min(penSize * 1.5, 20)}px`, height: `${Math.min(penSize * 1.5, 20)}px` }
                    })
                ),
                showPenSizeControls && React.createElement("div", {
                    id: "pen-size-controls",
                    className: "absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg z-10 border border-gray-200 animate-fadeIn dropdown-menu"
                },
                    React.createElement("div", {className: "flex items-center gap-3 p-3 w-32"},
                        React.createElement("button", {
                            onClick: () => adjustPenSize(-1),
                            className: "w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 tool-button",
                            disabled: penSize <= 1
                        }, 
                            React.createElement(Minus, {className: "w-4 h-4"})
                        ),
                        React.createElement("div", {className: "flex-1 text-center font-medium"}, penSize),
                        React.createElement("button", {
                            onClick: () => adjustPenSize(1),
                            className: "w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 tool-button",
                            disabled: penSize >= 20
                        }, 
                            React.createElement(Plus, {className: "w-4 h-4"})
                        )
                    )
                )
            ),
            
            // Clear canvas button
            React.createElement("button", {
                    type: "button",
                    onClick: clearCanvas,
                    className: "tool-button bg-white shadow-sm hover:bg-gray-100"
                },
                React.createElement(Trash2, {
                    className: "w-5 h-5 text-gray-700",
                    "aria-label": "Clear Canvas"
                })
            ),
            
            // Image tracer button
            React.createElement("button", {
                type: "button",
                onClick: () => setShowImageTracer(true),
                className: `tool-button bg-white shadow-sm ml-1 ${!isApiKeySet ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`,
                disabled: !isApiKeySet,
                title: isApiKeySet ? "Image Tracer" : "Set API Key first"
            },
                React.createElement(Upload, { className: "w-5 h-5 text-gray-700", "aria-label": "Image Tracer" })
            ),
            
            // Download options menu
            React.createElement("div", {className: "relative ml-1"}, 
              React.createElement("button", {
                ref: downloadButtonRef, 
                type: "button",
                onClick: (e) => {
                  e.stopPropagation(); 
                  setShowDownloadOptions(prev => !prev); 
                },
                className: "tool-button bg-white shadow-sm hover:bg-gray-100",
                "aria-label": "Download Options"
              },
                React.createElement(Download, { className: "w-5 h-5 text-gray-700" })
              ),
              showDownloadOptions && ( 
                React.createElement(DownloadMenu, {
                  setShowDownloadOptions: setShowDownloadOptions,
                  svgData: svgData,
                })
              )
            )
        )
    );
};

export default React.memo(CanvasControls);