/**
 * Main Dashboard Controller
 * Orchestrates MQTT client, gauge manager, and UI interactions
 */

class Dashboard {
    constructor() {
        this.mqttClient = new MQTTClient();
        this.gaugeManager = null;
        this.debugPane = null;
        this.isConnecting = false;
        
        this.initializeElements();
        this.bindEvents();
        this.setupMQTTCallbacks();
        this.loadConfiguration();
        this.initializeGauges();
        this.initializeDebugPane();
    }
    
    initializeElements() {
        // Connection controls
        this.connectBtn = document.getElementById('connect-btn');
        this.statusDot = document.getElementById('status-dot');
        this.statusText = document.getElementById('status-text');
        this.brokerUrl = document.getElementById('broker-url');
        
        // Configuration panel
        this.hamburgerBtn = document.getElementById('hamburger-menu');
        this.configPanel = document.getElementById('config-panel');
        this.saveConfigBtn = document.getElementById('save-config');
        this.cancelConfigBtn = document.getElementById('cancel-config');
        
        // Configuration inputs
        this.mqttHost = document.getElementById('mqtt-host');
        this.mqttPort = document.getElementById('mqtt-port');
        this.mqttPath = document.getElementById('mqtt-path');
        this.mqttSecure = document.getElementById('mqtt-secure');
        this.mqttUsername = document.getElementById('mqtt-username');
        this.mqttPassword = document.getElementById('mqtt-password');
        this.topicPrefix = document.getElementById('topic-prefix');
        
        // Gauge controls
        this.addGaugeBtn = document.getElementById('add-gauge-btn');
        this.gaugesGrid = document.getElementById('gauges-grid');
        
        // Add gauge modal
        this.addGaugeModal = document.getElementById('add-gauge-modal');
        this.gaugeGroup = document.getElementById('gauge-group');
        this.gaugeTopic = document.getElementById('gauge-topic');
        this.createGaugeBtn = document.getElementById('create-gauge');
        this.cancelGaugeBtn = document.getElementById('cancel-gauge');
        
        // Initialize gauge manager
        this.gaugeManager = new GaugeManager(this.gaugesGrid);
    }
    
    bindEvents() {
        // Connection button
        this.connectBtn.addEventListener('click', () => this.toggleConnection());
        
        // Configuration panel
        this.hamburgerBtn.addEventListener('click', () => this.toggleConfigPanel());
        this.saveConfigBtn.addEventListener('click', () => this.saveConfiguration());
        this.cancelConfigBtn.addEventListener('click', () => this.hideConfigPanel());
        
        // Add gauge
        this.addGaugeBtn.addEventListener('click', () => this.showAddGaugeModal());
        this.createGaugeBtn.addEventListener('click', () => this.createGauge());
        this.cancelGaugeBtn.addEventListener('click', () => this.hideAddGaugeModal());
        
        // Modal close on outside click
        this.addGaugeModal.addEventListener('click', (e) => {
            if (e.target === this.addGaugeModal) {
                this.hideAddGaugeModal();
            }
        });
        
        // Auto-generate topic when group number changes
        this.gaugeGroup.addEventListener('input', () => this.updateTopicPreview());
        
        // Listen for gauge removal
        document.addEventListener('gaugeRemoved', (event) => {
            this.handleGaugeRemoved(event.detail.topic);
        });
        
        // Listen for debug pane publish message events
        document.addEventListener('debugPublishMessage', (event) => {
            this.handleDebugPublish(event.detail);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAddGaugeModal();
                this.hideConfigPanel();
            }
        });
    }
    
    setupMQTTCallbacks() {
        this.mqttClient.onConnectionChange = (connected) => {
            this.updateConnectionStatus(connected);
            if (connected) {
                // Subscribe to all existing gauge topics
                if (this.gaugeManager) {
                    const topics = this.gaugeManager.getAllTopics();
                    topics.forEach(topic => {
                        this.mqttClient.subscribe(topic);
                        if (this.debugPane) {
                            this.debugPane.logSubscribed(topic);
                        }
                    });
                }
                
                if (this.debugPane) {
                    this.debugPane.logConnected(
                        this.mqttClient.config.host,
                        this.mqttClient.config.port,
                        this.mqttClient.config.path,
                        this.mqttClient.config.secure
                    );
                }
            } else if (!connected && this.debugPane) {
                this.debugPane.logDisconnected();
            }
        };
        
        this.mqttClient.onConnectionAttempt = (host, port, path, secure) => {
            if (this.debugPane) {
                this.debugPane.logConnection(host, port, path, secure);
            }
        };
        
        this.mqttClient.onMessage = (topic, message) => {
            this.handleMQTTMessage(topic, message);
            if (this.debugPane) {
                this.debugPane.logMessageReceived(topic, message);
            }
        };
    }
    
    loadConfiguration() {
        // Load configuration from localStorage
        const savedConfig = localStorage.getItem('mae411L-mqtt-config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                this.mqttClient.updateConfig(config);
                this.updateConfigInputs(config);
            } catch (e) {
                console.error('Failed to load saved configuration:', e);
            }
        }
        
        this.updateBrokerUrlDisplay();
    }
    
    saveConfiguration() {
        const config = {
            host: this.mqttHost.value.trim() || 'broker.emqx.io',
            port: parseInt(this.mqttPort.value) || 8084,
            path: this.mqttPath.value.trim() || '/',
            secure: this.mqttSecure.checked,
            username: this.mqttUsername.value.trim(),
            password: this.mqttPassword.value.trim(),
            topicPrefix: this.topicPrefix.value.trim() || 'wvu-mae411L'
        };
        
        // Validate configuration
        if (config.port < 1 || config.port > 65535) {
            alert('Please enter a valid port number (1-65535)');
            return;
        }
        
        // Ensure path starts with /
        if (!config.path.startsWith('/')) {
            config.path = '/' + config.path;
        }
        
        this.mqttClient.updateConfig(config);
        localStorage.setItem('mae411L-mqtt-config', JSON.stringify(config));
        this.updateBrokerUrlDisplay();
        this.hideConfigPanel();
        
        if (this.debugPane) {
            this.debugPane.logInfo('Configuration updated', config);
        }
        
        // Reconnect if currently connected
        if (this.mqttClient.isConnected) {
            this.reconnect();
        }
    }
    
    updateConfigInputs(config) {
        this.mqttHost.value = config.host || 'broker.emqx.io';
        this.mqttPort.value = config.port || 8084;
        this.mqttPath.value = config.path || '/mqtt';
        this.mqttSecure.checked = config.secure !== undefined ? config.secure : true;
        this.mqttUsername.value = config.username || '';
        this.mqttPassword.value = config.password || '';
        this.topicPrefix.value = config.topicPrefix || 'wvu-mae411L';
    }
    
    updateBrokerUrlDisplay() {
        this.brokerUrl.textContent = this.mqttClient.getBrokerUrl();
    }
    
    initializeGauges() {
        // Load saved gauges from localStorage
        const savedGauges = localStorage.getItem('mae411L-mqtt-gauges');
        if (savedGauges) {
            try {
                const topics = JSON.parse(savedGauges);
                topics.forEach(topic => this.addGauge(topic, false));
            } catch (e) {
                console.error('Failed to load saved gauges:', e);
            }
        } else {
            // Add default gauge for group 1
            this.addGauge(this.mqttClient.getGroupTopic(1), false);
        }
    }
    
    saveGauges() {
        const topics = this.gaugeManager.getAllTopics();
        localStorage.setItem('mae411L-mqtt-gauges', JSON.stringify(topics));
    }
    
    async toggleConnection() {
        if (this.isConnecting) {
            return;
        }
        
        if (this.mqttClient.isConnected) {
            await this.disconnect();
        } else {
            await this.connect();
        }
    }
    
    async connect() {
        this.isConnecting = true;
        this.connectBtn.textContent = 'Connecting...';
        this.connectBtn.disabled = true;
        
        try {
            await this.mqttClient.connect();
            console.log('Successfully connected to MQTT broker');
        } catch (error) {
            console.error('Failed to connect to MQTT broker:', error);
            alert(`Failed to connect to MQTT broker: ${error.message}`);
        } finally {
            this.isConnecting = false;
            this.connectBtn.disabled = false;
        }
    }
    
    async disconnect() {
        this.isConnecting = true;
        this.connectBtn.textContent = 'Disconnecting...';
        this.connectBtn.disabled = true;
        
        try {
            await this.mqttClient.disconnect();
            this.gaugeManager.setAllInactive();
            console.log('Successfully disconnected from MQTT broker');
        } catch (error) {
            console.error('Failed to disconnect from MQTT broker:', error);
        } finally {
            this.isConnecting = false;
            this.connectBtn.disabled = false;
        }
    }
    
    async reconnect() {
        await this.disconnect();
        setTimeout(() => this.connect(), 1000);
    }
    
    updateConnectionStatus(connected) {
        if (connected) {
            this.connectBtn.textContent = 'Disconnect';
            this.connectBtn.classList.add('connected');
            this.statusDot.classList.add('connected');
            this.statusText.textContent = 'Connected';
        } else {
            this.connectBtn.textContent = 'Connect';
            this.connectBtn.classList.remove('connected');
            this.statusDot.classList.remove('connected');
            this.statusText.textContent = 'Disconnected';
        }
    }
    
    toggleConfigPanel() {
        this.configPanel.classList.toggle('hidden');
        if (!this.configPanel.classList.contains('hidden')) {
            // Refresh config inputs when showing panel
            const config = this.mqttClient.getConfig();
            this.updateConfigInputs(config);
        }
    }
    
    hideConfigPanel() {
        this.configPanel.classList.add('hidden');
    }
    
    showAddGaugeModal() {
        this.addGaugeModal.classList.remove('hidden');
        this.gaugeGroup.focus();
        this.updateTopicPreview();
    }
    
    hideAddGaugeModal() {
        this.addGaugeModal.classList.add('hidden');
        this.gaugeGroup.value = '';
        this.gaugeTopic.value = '';
    }
    
    updateTopicPreview() {
        const groupNum = this.gaugeGroup.value;
        if (groupNum) {
            this.gaugeTopic.placeholder = this.mqttClient.getGroupTopic(groupNum);
        } else {
            this.gaugeTopic.placeholder = 'wvu-mae411L/group_1';
        }
    }
    
    createGauge() {
        let topic = this.gaugeTopic.value.trim();
        const groupNum = this.gaugeGroup.value;
        
        // Use group number to generate topic if custom topic not provided
        if (!topic && groupNum) {
            topic = this.mqttClient.getGroupTopic(groupNum);
        }
        
        if (!topic) {
            alert('Please enter a group number or custom topic');
            return;
        }
        
        if (!this.mqttClient.isValidTopic(topic)) {
            alert('Please enter a valid topic name');
            return;
        }
        
        if (this.gaugeManager.getGauge(topic)) {
            alert('A gauge for this topic already exists');
            return;
        }
        
        this.addGauge(topic, true);
        this.hideAddGaugeModal();
    }
    
    addGauge(topic, subscribe = true) {
        const gauge = this.gaugeManager.addGauge(topic);
        if (!gauge) {
            return false;
        }
        
        // Subscribe to MQTT topic if connected
        if (subscribe && this.mqttClient.isConnected) {
            this.mqttClient.subscribe(topic);
            if (this.debugPane) {
                this.debugPane.logSubscribed(topic);
            }
        }
        
        this.saveGauges();
        return true;
    }
    
    handleGaugeRemoved(topic) {
        // Unsubscribe from MQTT topic
        if (this.mqttClient.isConnected) {
            this.mqttClient.unsubscribe(topic);
            if (this.debugPane) {
                this.debugPane.logUnsubscribed(topic);
            }
        }
        
        this.saveGauges();
    }
    
    handleMQTTMessage(topic, message) {
        // Update gauge with new temperature reading
        if (typeof message === 'number') {
            this.gaugeManager.updateGauge(topic, message);
        } else {
            console.warn(`Received non-numeric message on ${topic}:`, message);
        }
    }
    
    handleDebugPublish(detail) {
        const { topic, message } = detail;
        
        if (!this.mqttClient.isConnected) {
            if (this.debugPane) {
                this.debugPane.logError('Cannot publish: Not connected to MQTT broker');
            }
            return;
        }
        
        const success = this.mqttClient.publish(topic, message);
        if (success && this.debugPane) {
            this.debugPane.logMessagePublished(topic, message);
        }
    }
    
    initializeDebugPane() {
        // Initialize debug pane after DOM is ready
        this.debugPane = new DebugPane();
        this.debugPane.logInfo('Debug pane initialized');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});