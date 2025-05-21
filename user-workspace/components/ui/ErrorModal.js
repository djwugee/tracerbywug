import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { parseError } from '../../utils/helpers.js';

const ErrorModal = ({ errorMessage, closeErrorModal }) => {
    // Use React.useEffect to add keyboard support for closing the modal
    React.useEffect(() => {
        const handleEscapeKey = (e) => {
            if (e.key === 'Escape') {
                closeErrorModal();
            }
        };
        
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [closeErrorModal]);

    // Prevent clicking inside the modal from closing it, but clicking outside will close it
    const handleModalClick = (e) => {
        e.stopPropagation();
    };

    return (
        React.createElement("div", {
                className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-overlay",
                onClick: closeErrorModal
            },
            React.createElement("div", {
                    className: "bg-white rounded-xl shadow-xl max-w-md w-full p-5 modal-content",
                    onClick: handleModalClick
                },
                React.createElement("div", {className: "flex justify-between items-start mb-4"},
                    React.createElement("div", {className: "flex items-center gap-2"},
                        React.createElement(AlertCircle, {className: "w-5 h-5 text-red-500"}),
                        React.createElement("h3", {className: "text-xl font-bold text-gray-800"}, "Error")
                    ),
                    React.createElement("button", {
                            onClick: closeErrorModal, 
                            className: "text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors",
                            "aria-label": "Close"
                        },
                        React.createElement(X, {className: "w-5 h-5"})
                    )
                ),
                React.createElement("div", {className: "text-gray-700 mb-4 bg-red-50 p-3 rounded-lg border border-red-100"},
                    React.createElement("p", null, parseError(errorMessage))
                ),
                React.createElement("div", {className: "flex justify-end"},
                    React.createElement("button", {
                            onClick: closeErrorModal,
                            className: "px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                        }, 
                        "Close"
                    )
                )
            )
        )
    );
};

export default React.memo(ErrorModal);