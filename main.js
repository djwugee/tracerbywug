import React from 'react';
import ReactDOM from 'react-dom/client';
import Home from './components/Home.js';

// Add global event listener for downloads
// The event detail now includes the format and potentially svgData
window.addEventListener('downloadCanvas', (e) => {
    if (window.downloadHandler) {
        // Pass the format and any additional options (like svgData) from the event detail
        window.downloadHandler(e.detail.format, { svgData: e.detail.svgData });
    }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(Home));