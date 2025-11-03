// Who Am I - IP Information Tool
// This is a basic implementation for you to learn and extend

class WhoAmI {
    constructor() {
        this.ipAddress = null;
        this.locationData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('Who Am I application initialized');
    }

    setupEventListeners() {
        const getIpBtn = document.getElementById('get-ip-btn');
        const getDetailsBtn = document.getElementById('get-details-btn');
        const retryBtn = document.getElementById('retry-btn');

        if (getIpBtn) {
            getIpBtn.addEventListener('click', () => this.getIpAddress());
        }

        if (getDetailsBtn) {
            getDetailsBtn.addEventListener('click', () => this.getLocationDetails());
        }

        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retry());
        }
    }

    // Step 2.1 & 2.2: Get public IP address using IPify API
    async getIpAddress() {
        try {
            this.showLoading('ip');
            this.hideError();

            // TODO: Implement IPify API call
            // For now, using a simple fetch to IPify API
            const response = await fetch('https://api.ipify.org?format=json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.ipAddress = data.ip;

            this.hideLoading('ip');
            this.displayIpAddress(this.ipAddress);
            this.showDetailsSection();

        } catch (error) {
            console.error('Error getting IP address:', error);
            this.hideLoading('ip');
            this.showError('Failed to get your IP address. Please check your internet connection and try again.');
        }
    }

    // Step 2.3 & 2.4: Get additional details using IPinfo API
    async getLocationDetails() {
        if (!this.ipAddress) {
            this.showError('Please get your IP address first.');
            return;
        }

        try {
            this.showLoading('details');
            this.hideError();

            // TODO: You can implement IPinfo API call here
            // For learning purposes, I'm providing a basic structure
            // You might want to get an API key from IPinfo for more detailed data
            
            const response = await fetch(`https://ipinfo.io/${this.ipAddress}/json`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.locationData = data;

            this.hideLoading('details');
            this.displayLocationDetails(data);

        } catch (error) {
            console.error('Error getting location details:', error);
            this.hideLoading('details');
            this.showError('Failed to get location details. The service might be temporarily unavailable.');
        }
    }

    // Display the IP address (Step 2.2)
    displayIpAddress(ip) {
        const ipAddressElement = document.getElementById('ip-address');
        const ipDisplayElement = document.getElementById('ip-display');

        if (ipAddressElement && ipDisplayElement) {
            ipAddressElement.textContent = ip;
            ipDisplayElement.classList.remove('hidden');
            ipDisplayElement.classList.add('fade-in');
        }
    }

    // Display location details (Step 2.4)
    displayLocationDetails(data) {
        const detailsDisplay = document.getElementById('details-display');
        
        // Update individual fields
        this.updateElement('city-value', data.city || 'Unknown');
        this.updateElement('region-value', data.region || 'Unknown');
        this.updateElement('country-value', data.country || 'Unknown');
        this.updateElement('timezone-value', data.timezone || 'Unknown');
        this.updateElement('isp-value', data.org || 'Unknown');
        
        // Format coordinates
        if (data.loc) {
            this.updateElement('coordinates-value', data.loc);
        } else {
            this.updateElement('coordinates-value', 'Unknown');
        }

        if (detailsDisplay) {
            detailsDisplay.classList.remove('hidden');
            detailsDisplay.classList.add('fade-in');
        }
    }

    // Helper method to update element text content
    updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    // Show loading animation
    showLoading(type) {
        const loadingElement = document.getElementById(`${type}-loading`);
        const buttonElement = document.getElementById(`get-${type}-btn`);
        
        if (loadingElement) {
            loadingElement.classList.remove('hidden');
        }
        
        if (buttonElement) {
            buttonElement.disabled = true;
        }
    }

    // Hide loading animation
    hideLoading(type) {
        const loadingElement = document.getElementById(`${type}-loading`);
        const buttonElement = document.getElementById(`get-${type}-btn`);
        
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
        
        if (buttonElement) {
            buttonElement.disabled = false;
        }
    }

    // Show details section after IP is found
    showDetailsSection() {
        const detailsSection = document.getElementById('details-section');
        if (detailsSection) {
            detailsSection.classList.remove('hidden');
            detailsSection.classList.add('fade-in');
        }
    }

    // Show error message
    showError(message) {
        const errorSection = document.getElementById('error-section');
        const errorMessage = document.getElementById('error-message');
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        
        if (errorSection) {
            errorSection.classList.remove('hidden');
            errorSection.classList.add('fade-in');
        }
    }

    // Hide error message
    hideError() {
        const errorSection = document.getElementById('error-section');
        if (errorSection) {
            errorSection.classList.add('hidden');
        }
    }

    // Retry functionality
    retry() {
        this.hideError();
        
        // Reset the state
        this.ipAddress = null;
        this.locationData = null;
        
        // Hide all display elements
        const ipDisplay = document.getElementById('ip-display');
        const detailsSection = document.getElementById('details-section');
        const detailsDisplay = document.getElementById('details-display');
        
        if (ipDisplay) ipDisplay.classList.add('hidden');
        if (detailsSection) detailsSection.classList.add('hidden');
        if (detailsDisplay) detailsDisplay.classList.add('hidden');
        
        // Clear displayed values
        this.updateElement('ip-address', '');
        this.updateElement('city-value', '');
        this.updateElement('region-value', '');
        this.updateElement('country-value', '');
        this.updateElement('timezone-value', '');
        this.updateElement('isp-value', '');
        this.updateElement('coordinates-value', '');
    }

    // Additional methods you can implement for learning:
    
    // TODO: Add method to format and validate IP addresses
    // TODO: Add method to handle different API error responses  
    // TODO: Add method to cache results in localStorage
    // TODO: Add method to export results as JSON
    // TODO: Add geolocation comparison with browser's geolocation API
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.whoAmIApp = new WhoAmI();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhoAmI;
}

/*
Learning Notes for Extension:

1. IPify API: https://www.ipify.org/
   - Free tier: https://api.ipify.org?format=json
   - Returns: {"ip":"your.ip.address"}

2. IPinfo API: https://ipinfo.io/
   - Free tier: https://ipinfo.io/{ip}/json  
   - For production, get API key: https://ipinfo.io/account/token
   - Returns: city, region, country, loc (coordinates), org (ISP), timezone, etc.

3. Next steps you can implement:
   - Error handling for network issues
   - Rate limiting protection
   - Data caching
   - More detailed location information
   - Map integration
   - VPN/Proxy detection
   - Security headers analysis

4. VS Code Extension Integration:
   - The extension should detect when this workspace is opened
   - Show activation notification
   - Optionally provide commands to open the HTML file
   - Add status bar information
*/