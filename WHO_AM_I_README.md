# Who Am I Extension - Learning Project

A VS Code extension that creates and manages "Who Am I" workspaces for discovering your public IP address and location information.

## Features

### Step 1: Workspace Creation ✅
- Creates a directory containing `who_am_i.html` file (mandatory)
- All HTML tags have unique ID attributes
- Separates JavaScript and CSS into `who_am_i.js` and `who_am_i.css` files
- Directory name is arbitrary, but must contain `who_am_i.html` to form valid workspace

### Step 2: Web Page Functionality (Basic Implementation - Ready for Learning)
- **2.1 & 2.2**: Get public IP address using IPify API and display it ✅ (Basic)
- **2.3 & 2.4**: Get additional location details using IPinfo API and display them ✅ (Basic)
- Responsive design ✅
- Error handling ✅ (Basic)

### Step 3: Extension Activation ✅
- Extension activates only when valid workspace (containing `who_am_i.html`) is opened
- Shows information dialog when "Who Am I" extension becomes active
- Provides options to open HTML file or view in browser

## How to Use

1. **Install the Extension**: Load this extension in VS Code development mode (F5)

2. **Create a Workspace**: 
   - Open Command Palette (Ctrl+Shift+P)
   - Run "Create Who Am I Workspace"
   - Choose location and name for your workspace

3. **Open the Workspace**: 
   - Open the created folder as a workspace in VS Code
   - Extension will automatically detect and activate
   - You'll see a notification with options to open the HTML file

4. **Use the Web Application**:
   - Open `who_am_i.html` in a browser
   - Click "Find My IP Address" to get your public IP
   - Click "Get Location Details" to get additional information

## Learning Opportunities

The basic implementation is provided, but you can extend it by implementing:

### JavaScript Enhancements:
- Better error handling for different API responses
- Data caching in localStorage
- Export functionality for results
- Integration with browser geolocation API
- VPN/Proxy detection
- Rate limiting protection

### API Integration:
- Get IPinfo API key for more detailed data
- Add support for other IP geolocation services
- Implement IPv6 support
- Add network security analysis

### UI/UX Improvements:
- Add loading animations
- Implement dark/light theme toggle
- Add map visualization for location
- Create charts for connection analysis
- Mobile-first responsive improvements

### VS Code Extension Features:
- Add status bar information
- Create custom views/panels
- Implement file watchers
- Add configuration settings
- Create custom commands for IP operations

## APIs Used

- **IPify**: Free public IP detection (https://www.ipify.org/)
- **IPinfo**: Location and ISP information (https://ipinfo.io/)

## File Structure

```
workspace_name/
├── who_am_i.html    # Main HTML file (required for workspace detection)
├── who_am_i.css     # Responsive styles
└── who_am_i.js      # JavaScript functionality
```

## Development Notes

- All HTML tags have unique IDs for easy JavaScript manipulation
- CSS uses modern features (Grid, Flexbox, CSS Variables ready)
- JavaScript is class-based and modular
- Extension uses VS Code API for workspace detection
- Template files are stored in `templates/who_am_i_workspace/`

## Next Steps for Learning

1. **Enhance API Integration**: Add error handling for rate limits and API failures
2. **Improve UI**: Add more interactive elements and better user feedback  
3. **Add Features**: Implement caching, export, and advanced network analysis
4. **Extend Extension**: Add more VS Code integration features
5. **Security**: Implement input validation and secure API key handling

Happy learning! 🚀