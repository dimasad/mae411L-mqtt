# AI Development Guide

## Project Overview
This is an MQTT dashboard for the Advanced Mechatronics course (MAE 411L) at West Virginia University. The dashboard displays real-time temperature readings from student projects via MQTT.

## Architecture
- **Frontend**: Static HTML/CSS/JavaScript webpage
- **MQTT Client**: Browser-based MQTT client using mqtt.js library
- **Default Broker**: EMQX public MQTT5 broker (broker.emqx.io:8083/mqtt)
- **Data Format**: Temperature readings on topic pattern "wvu-mae411L/group_*"

## Key Components
1. **Connection Manager**: Handles MQTT broker connection/disconnection
2. **Gauge System**: Temperature display gauges with real-time updates
3. **Configuration Panel**: Advanced settings accessible via hamburger menu
4. **Topic Manager**: Dynamic addition of new temperature monitoring topics

## Development Guidelines
- Keep the codebase simple and focused on the core MQTT dashboard functionality
- Use vanilla JavaScript to minimize dependencies
- Ensure responsive design for desktop and mobile
- Follow web accessibility best practices
- Test with multiple MQTT topics and connection scenarios

## File Structure
```
/
├── index.html          # Main dashboard page
├── css/
│   └── style.css       # Styling and layout
├── js/
│   ├── mqtt-client.js  # MQTT connection handling
│   ├── gauge.js        # Temperature gauge components
│   └── dashboard.js    # Main dashboard logic
└── assets/             # Images and other static assets
```

## Testing
- Test MQTT connectivity with the default EMQX broker
- Verify gauge updates with simulated temperature data
- Test responsive layout on different screen sizes
- Validate adding/removing gauges dynamically

## Deployment
This is a static web application that can be hosted on any web server or served locally.