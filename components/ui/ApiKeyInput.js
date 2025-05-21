import React from 'react';

const ApiKeyInput = ({ customApiKey, setCustomApiKey, setIsApiKeySet }) => {
    return (
        React.createElement("div", {
                className: "w-full mb-6 p-5 sm:p-6 rounded-xl bg-white shadow-md border border-gray-200 transition-all animate-fadeIn card"
            },
            React.createElement("h2", {className: "text-xl font-semibold mb-4 text-gray-800"}, "Enter your Google Gemini API Key"),
            React.createElement("div", {className: "flex flex-col sm:flex-row gap-3"},
                React.createElement("input", {
                    type: "password",
                    value: customApiKey,
                    onChange: (e) => setCustomApiKey(e.target.value),
                    placeholder: "Paste your Gemini API key here",
                    className: "flex-grow p-3 border border-gray-300 rounded-md text-sm focus:ring focus:ring-primary/20 focus:border-primary"
                }),
                React.createElement("button", {
                        onClick: () => {
                            if (customApiKey.trim()) {
                                setIsApiKeySet(true);
                            } else {
                                alert("Please enter a valid API key");
                            }
                        },
                        className: "btn-primary p-3 min-w-[120px] sm:min-w-[140px]"
                    },
                    "Set API Key"
                )
            ),
            React.createElement("p", {className: "text-xs mt-3 text-gray-600"}, "Your API key is stored locally in your browser and is never sent to our servers."),
            React.createElement("p", {className: "text-xs mt-2 text-gray-500"}, "Need a key? Visit ", 
                React.createElement("a", {
                    href: "https://aistudio.google.com/app/apikey",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-primary hover:underline"
                }, "Google AI Studio"), " to create one.")
        )
    );
};

export default ApiKeyInput;