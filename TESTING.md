# Testing Guide

## Overview
This project includes comprehensive testing infrastructure to ensure the MQTT dashboard works correctly with local and remote MQTT brokers.

## Test Structure

### Unit Tests
- **Basic Tests** (`tests/basic.test.js`): Core functionality validation
- Tests MQTT topic validation, temperature formatting, and utility functions
- Run with: `npm test -- --selectProjects=unit`

### Integration Tests
- **MQTT Integration** (`tests/mqtt-real.test.js`): Real MQTT broker testing
- Tests actual MQTT connections, message publishing/receiving
- Requires a running Mosquitto broker
- Run with: `npm test -- --selectProjects=integration`

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Install Mosquitto broker (Ubuntu/Debian)
sudo apt-get install mosquitto mosquitto-clients
```

### Local Testing with Mosquitto

1. **Start local MQTT broker with WebSocket support:**
```bash
# Create config file
cat > mosquitto-local.conf << EOF
listener 1883
listener 9001
protocol websockets
allow_anonymous true
log_type warning
EOF

# Start broker
mosquitto -c mosquitto-local.conf
```

2. **Run all tests:**
```bash
npm test
```

3. **Run specific test suites:**
```bash
# Unit tests only
npm test -- --selectProjects=unit

# Integration tests only  
npm test -- --selectProjects=integration

# With coverage
npm run test:coverage
```

### Manual Testing

1. **Start the dashboard:**
```bash
npm start
# Opens on http://localhost:8080
```

2. **Configure for local broker:**
   - Click the hamburger menu (☰)
   - Set Host: `localhost`
   - Set Port: `9001`
   - Uncheck "Secure Connection (WSS)"
   - Click "Save"

3. **Test connection:**
   - Click "Connect" - should show "Connected" status
   - Use debug pane to publish test messages

4. **Test with command line:**
```bash
# Publish temperature reading
mosquitto_pub -h localhost -t wvu-mae411L/group_1 -m "25.5"

# Subscribe to see all messages
mosquitto_sub -h localhost -t "wvu-mae411L/+"
```

## Test Scenarios

### Core Functionality Tests
- ✅ MQTT library loads correctly (local fallback works)
- ✅ Dashboard connects to MQTT broker
- ✅ Messages can be published and received
- ✅ Multiple group topics work correctly
- ✅ Temperature values are validated and formatted
- ✅ Topic validation prevents invalid patterns

### Connection Tests  
- ✅ Connection to local broker (ws://localhost:9001)
- ✅ Connection failure handling
- ✅ Reconnection after configuration changes
- ✅ WebSocket protocol support

### UI/UX Tests
- ✅ Dashboard loads without errors
- ✅ Configuration panel works
- ✅ Debug pane shows events and allows publishing
- ✅ Gauge addition/removal works
- ✅ Temperature display updates

## Continuous Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:

1. **Sets up test environment** with Mosquitto broker
2. **Runs linting** to check code quality
3. **Executes unit tests** for core functionality
4. **Verifies MQTT connectivity** with real broker
5. **Runs integration tests** with live MQTT
6. **Tests dashboard loading** and local library serving
7. **Generates coverage reports**

## Troubleshooting

### Common Issues

**MQTT connection fails:**
- Check if Mosquitto is running: `ps aux | grep mosquitto`
- Verify WebSocket port is listening: `netstat -tlnp | grep 9001`
- Check firewall settings for ports 1883 and 9001

**Tests timeout:**
- Increase Jest timeout in package.json
- Check if broker startup is slow
- Verify network connectivity

**Library loading issues:**
- Ensure `lib/mqtt.min.js` exists
- Check if CDN is blocked by firewall
- Verify local HTTP server is running

### Debug Commands

```bash
# Check MQTT broker status
sudo systemctl status mosquitto

# Test MQTT connectivity
mosquitto_pub -h localhost -t test -m "hello"
mosquitto_sub -h localhost -t test

# Check WebSocket connectivity
curl -v --upgrade websocket http://localhost:9001/

# View broker logs
tail -f /tmp/mosquitto.log
```

## Development

When adding new features:

1. **Add unit tests** for new functions/logic
2. **Update integration tests** for MQTT-related changes  
3. **Test manually** with local broker setup
4. **Verify CI pipeline** passes all checks
5. **Update documentation** as needed

The testing infrastructure ensures that MQTT connectivity issues are caught early and that the dashboard works reliably across different environments.