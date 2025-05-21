import React from 'react';
import { Upload, ImageIcon, Sliders, Maximize2 } from 'lucide-react';

const ImageUploaderPanel = ({
    uploadedImage,
    previewContainerRef,
    previewCanvasRef,
    previewCanvasWidth,
    previewCanvasHeight,
    handleUploadClick,
    fileInputRef,
    handleFileChange,
    setShowSettings,
    showSettings,
    aspectRatio
}) => {
    return (
        React.createElement(React.Fragment, null,
            React.createElement("div", {className: "mb-4"},
                React.createElement("h4", {className: "font-medium mb-2 text-base text-gray-800"}, "Original Image"),
                React.createElement("div", {
                        ref: previewContainerRef,
                        className: "border border-gray-200 rounded-md h-64 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-white shadow-sm",
                        onClick: handleUploadClick
                    },
                    uploadedImage ?
                        React.createElement("canvas", {
                            ref: previewCanvasRef,
                            width: previewCanvasWidth,
                            height: previewCanvasHeight,
                            className: "w-full h-full object-contain"
                        }) :
                        React.createElement("div", {className: "text-center p-4"},
                            React.createElement(ImageIcon, {className: "w-10 h-10 mx-auto text-gray-400 mb-2"}),
                            React.createElement("p", {className: "text-gray-600 text-base"}, "Click to upload an image"),
                            React.createElement("p", {className: "text-gray-400 text-sm"}, "JPEG, PNG (max 5MB)")
                        ),
                    React.createElement("input", {type: "file", ref: fileInputRef, onChange: handleFileChange, accept: "image/*", className: "hidden"})
                )
            ),
            React.createElement("div", {className: "flex flex-wrap gap-2"},
                React.createElement("button", {
                        onClick: handleUploadClick,
                        className: "flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm"
                    },
                    React.createElement(Upload, {className: "w-4 h-4"}),
                    "Upload Image"
                ),
                React.createElement("button", {
                        onClick: () => setShowSettings(!showSettings),
                        className: "flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm"
                    },
                    React.createElement(Sliders, {className: "w-4 h-4"}),
                    showSettings ? "Hide Settings" : "Show Settings"
                ),
                uploadedImage && React.createElement("div", {className: "flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-sm border border-gray-200 ml-auto"},
                    React.createElement(Maximize2, {className: "w-3.5 h-3.5"}),
                    aspectRatio.toFixed(2)
                )
            )
        )
    );
};

export default ImageUploaderPanel;

