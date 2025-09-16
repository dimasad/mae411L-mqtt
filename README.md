# MAE 411L MQTT Dashboard

A real-time MQTT dashboard for monitoring temperature readings from student projects in the Advanced Mechatronics course (MAE 411L) at West Virginia University.

## Features

- 🌡️ Real-time temperature monitoring via MQTT
- 📊 Interactive temperature gauges
- 🔌 Easy MQTT broker connection management
- ➕ Dynamic gauge addition for multiple student groups
- 📱 Responsive design for desktop and mobile
- ⚙️ Advanced configuration options

## Quick Start

1. Open `index.html` in a modern web browser
2. Click "Connect" to connect to the default EMQX broker
3. Temperature readings will automatically appear as they are published to topics following the pattern `wvu-mae411L/group_*`

## Local Development & Testing

For development and testing with a local MQTT broker:

1. **Install and start Mosquitto with WebSocket support:**
```bash
# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# Create config with WebSocket support
cat > mosquitto-local.conf << EOF
listener 1883
listener 9001
protocol websockets
allow_anonymous true
EOF

# Start broker
mosquitto -c mosquitto-local.conf
```

2. **Configure dashboard for local broker:**
   - Click the hamburger menu (☰) 
   - Set Host: `localhost`, Port: `9001`
   - Uncheck "Secure Connection (WSS)"
   - Click "Save" and then "Connect"

3. **Test with command line:**
```bash
# Publish temperature reading
mosquitto_pub -h localhost -t wvu-mae411L/group_1 -m "25.5"
```

See [TESTING.md](TESTING.md) for comprehensive testing instructions.

## Default Configuration

- **MQTT Broker**: broker.emqx.io (EMQX public broker)
- **Port**: 8083 (WebSocket)
- **Default Topic**: `wvu-mae411L/group_1`

## Usage

### Connecting to MQTT Broker
1. The dashboard starts disconnected by default
2. Click the "Connect" button to establish connection
3. Status indicator shows connection state (green = connected, red = disconnected)

### Adding Temperature Gauges
1. Use the "Add Gauge" button to create new temperature monitors
2. Enter the group number or full topic name
3. Gauges automatically update when new temperature data is received

### Configuration
Click the hamburger menu (☰) to access advanced settings:
- Custom MQTT broker URL
- Connection credentials
- Topic patterns
- Gauge display options

## Topics

The dashboard subscribes to topics following this pattern:
```
wvu-mae411L/group_[NUMBER]
```

Temperature data should be published as numeric values (Celsius) to these topics.

## Development

See [AGENTS.md](AGENTS.md) for detailed development guidelines and architecture information.

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

WebSocket support is required for MQTT connectivity.

## License

MIT License - see [LICENSE](LICENSE) for details.
