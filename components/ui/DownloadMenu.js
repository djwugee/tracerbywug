import React from 'react';
import { Download, FileImage, FileType2, Image as ImageIcon } from 'lucide-react';

const DownloadMenu = ({ setShowDownloadOptions, svgData }) => {
    // Dispatch event for the global handler
    // The global handler in main.js will call window.downloadHandler
    // Pass the svgData (from freehand vectorization) with the event
    const triggerDownload = (format) => {
        const eventDetail = { format };
        if (format === 'svg' && svgData) {
            eventDetail.svgData = svgData;
        }
        window.dispatchEvent(new CustomEvent('downloadCanvas', { detail: eventDetail }));
        setShowDownloadOptions(false); // Close menu after selection
    };

    return (
        React.createElement("div", {className: "absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200 animate-fadeIn overflow-hidden dropdown-menu"},
            React.createElement("ul", {className: "py-1"},
                React.createElement("li", null,
                    React.createElement("button", {
                        onClick: (e) => { e.stopPropagation(); triggerDownload("png"); },
                        className: "flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors dropdown-item"
                    },
                        React.createElement(FileImage, {className: "w-4 h-4 mr-2 text-primary"}),
                        React.createElement("span", {className: "flex-1"}, "PNG Format"),
                        React.createElement("span", {className: "text-xs text-gray-500"}, "High quality")
                    )
                ),
                React.createElement("li", null,
                    React.createElement("button", {
                        onClick: (e) => { e.stopPropagation(); triggerDownload("jpeg"); },
                        className: "flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors dropdown-item"
                    },
                        React.createElement(ImageIcon, {className: "w-4 h-4 mr-2 text-primary"}),
                        React.createElement("span", {className: "flex-1"}, "JPEG Format"),
                        React.createElement("span", {className: "text-xs text-gray-500"}, "Small size")
                    )
                ),
                React.createElement("li", null,
                    React.createElement("button", {
                        onClick: (e) => { e.stopPropagation(); triggerDownload("svg"); },
                        // Disable SVG download if svgData is not available
                        disabled: !svgData,
                        className: `flex items-center w-full text-left px-4 py-2.5 text-sm ${svgData ? "text-gray-700 hover:bg-gray-50" : "text-gray-400 cursor-not-allowed"} transition-colors dropdown-item`
                    },
                        React.createElement(FileType2, {className: "w-4 h-4 mr-2 text-primary"}),
                        React.createElement("span", {className: "flex-1"}, "SVG Format"),
                        React.createElement("span", {className: "text-xs text-gray-500"}, svgData ? "Vector" : "Generating...")
                    )
                )
            )
        )
    );
};

export default DownloadMenu;