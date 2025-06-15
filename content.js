// Disney+ Speed Controller - Content Script

// Keep track of our speed setting
let currentSpeed = 1.0;
let speedInterval = null;
let videoElements = [];
let speedButton = null;
let speedButtonAdded = false;

// Available speeds for the toggle button
const speedOptions = [1.0, 1.5, 2.0];
let currentSpeedIndex = 0;

// Function to find and store all video elements
function findVideoElements() {
    videoElements = document.querySelectorAll('video');
    return videoElements.length > 0;
}

// Function to apply speed to all found videos
function applySpeed(speed) {
    if (!videoElements.length) {
        findVideoElements();
    }
    
    videoElements.forEach(video => {
        if (video && video.playbackRate !== speed) {
            video.playbackRate = speed;
            console.log(`Disney+ Speed Controller: Set speed to ${speed}x`);
        }
    });
    
    currentSpeed = speed;
}



// Start a mutation observer to detect when new video elements are added
function setupObserver() {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                const hasNewVideo = findVideoElements();
                if (hasNewVideo) {
                    applySpeed(currentSpeed);
                }
            }
        }
    });

    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
}

// Start monitoring for video elements
function startVideoSpeedMonitor() {
    // Clear any existing interval
    if (speedInterval) {
        clearInterval(speedInterval);
    }
    
    // Set an interval to constantly check and apply the playback speed
    // (Disney+ may reset the speed after ads or when navigating)
    speedInterval = setInterval(() => {
        applySpeed(currentSpeed);
    }, 1000);
}

// Handle messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setSpeed') {
        applySpeed(request.speed);
        sendResponse({ success: true, speed: currentSpeed });
    }
    else if (request.action === 'getSpeed') {
        sendResponse({ success: true, speed: currentSpeed });
    }
    return true; // Required for async sendResponse
});

// Create and inject the speed toggle button into the player controls
function injectSpeedToggleButton() {
    // If button already exists, don't add another one
    if (speedButtonAdded) return false;
    
    // Look for the controls center panel
    const controlsCenter = document.querySelector('.controls__center');
    if (!controlsCenter) {
        // If we can't find it yet, we'll try again later
        return false;
    }
    
    // Create the speed toggle button
    speedButton = document.createElement('button');
    speedButton.className = 'control-icon-btn play-pause-icon speed-toggle-btn';
    speedButton.style.fontSize = '12px';
    speedButton.style.padding = '0 8px';
    speedButton.style.margin = '0 5px';
    speedButton.style.borderRadius = '4px';
    speedButton.style.backgroundColor = 'transparent';
    speedButton.style.border = 'none';
    speedButton.style.color = 'white';
    speedButton.style.fontWeight = 'bold';
    speedButton.style.cursor = 'pointer';
    speedButton.style.display = 'flex';
    speedButton.style.alignItems = 'center';
    speedButton.style.justifyContent = 'center';
    speedButton.style.height = '32px';
    speedButton.style.transition = 'all 0.2s ease';
    speedButton.textContent = currentSpeed.toFixed(1) + 'x';
    
    // Add hover effects
    speedButton.addEventListener('mouseenter', function() {
        this.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        this.style.transform = 'scale(1.05)';
    });
    
    speedButton.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
        this.style.transform = 'scale(1)';
    });
    
    // Add click event listener to toggle speeds
    speedButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Cycle to the next speed
        currentSpeedIndex = (currentSpeedIndex + 1) % speedOptions.length;
        currentSpeed = speedOptions[currentSpeedIndex];
        
        // Update the button text
        speedButton.textContent = currentSpeed.toFixed(1) + 'x';
        
        // Apply the new speed to video elements
        applySpeed(currentSpeed);
    });
    
    // Add the button to the controls
    controlsCenter.appendChild(speedButton);
    speedButtonAdded = true;
    console.log('Disney+ Speed Controller: Added speed toggle button to player controls');
    return true;
}

// Check for player controls periodically
function checkForPlayerControls() {
    // Reset button added flag if the button is no longer in the DOM
    if (speedButtonAdded && !document.querySelector('.speed-toggle-btn')) {
        speedButtonAdded = false;
    }
    
    // Try to inject the button if not already added
    if (!speedButtonAdded) {
        injectSpeedToggleButton();
    }
}

// Initialize
(function init() {
    console.log('Disney+ Speed Controller: Initialized');
    
    // Initial search for video elements
    findVideoElements();
    
    // Setup mutation observer to detect new videos
    setupObserver();
    
    // Start the speed monitoring
    startVideoSpeedMonitor();
    
    // Check for player controls periodically to add our button
    setInterval(checkForPlayerControls, 1000);
})();
