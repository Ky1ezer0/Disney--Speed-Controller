// Disney+ Speed Controller - Popup Script

document.addEventListener('DOMContentLoaded', function() {
    const speedButtons = document.querySelectorAll('.speed-btn');
    const customSpeedInput = document.getElementById('custom-speed-input');
    const applyCustomBtn = document.getElementById('apply-custom-speed');
    const currentSpeedDisplay = document.getElementById('current-speed');
    
    // Function to send speed to the content script
    function setSpeed(speed) {
        // Convert the speed to a number
        speed = parseFloat(speed);
        
        // Validate the speed value
        if (isNaN(speed) || speed <= 0) {
            console.error('Invalid speed value');
            return;
        }
        
        // Update the UI
        currentSpeedDisplay.textContent = speed.toFixed(2);
        
        // Highlight the active button
        speedButtons.forEach(btn => {
            if (parseFloat(btn.dataset.speed) === speed) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Send message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes('disneyplus.com')) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    action: 'setSpeed', 
                    speed: speed 
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('Error:', chrome.runtime.lastError);
                    }
                });
            } else {
                alert('Please navigate to Disney+ before using this extension.');
            }
        });
    }
    
    // Set up click handlers for speed buttons
    speedButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            setSpeed(button.dataset.speed);
        });
    });
    
    // Set up custom speed handler
    applyCustomBtn.addEventListener('click', function() {
        setSpeed(customSpeedInput.value);
    });
    
    // Handle Enter key in custom speed input
    customSpeedInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            setSpeed(customSpeedInput.value);
        }
    });
    
    // Get current speed from content script when popup opens
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('disneyplus.com')) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getSpeed' }, function(response) {
                if (chrome.runtime.lastError) {
                    // Extension was just installed or page was not fully loaded
                    return;
                }
                
                if (response && response.success) {
                    // Update UI with current speed
                    const speed = response.speed;
                    currentSpeedDisplay.textContent = speed.toFixed(2);
                    
                    // Highlight the active button
                    speedButtons.forEach(btn => {
                        if (parseFloat(btn.dataset.speed) === speed) {
                            btn.classList.add('active');
                        }
                    });
                    
                    // Update custom speed input
                    customSpeedInput.value = speed;
                }
            });
        }
    });
});
