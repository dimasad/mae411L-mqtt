/**
 * MQTT Client Manager
 * Handles MQTT connection, subscription, and message handling
 */

class MQTTClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.config = {
            host: 'broker.emqx.io',
            port: 8083,
            username: '',
            password: '',
            topicPrefix: 'wvu-mae411L'
        };
        this.subscribedTopics = new Set();
        this.messageHandlers = new Map();
        
        // Connection status callbacks
        this.onConnectionChange = null;
        this.onMessage = null;
    }
    
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    
    connect() {
        if (this.isConnected) {
            console.warn('Already connected to MQTT broker');
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            try {
                const brokerUrl = `ws://${this.config.host}:${this.config.port}/mqtt`;
                
                const options = {
                    clientId: `mae411L_dashboard_${Math.random().toString(16).substr(2, 8)}`,
                    clean: true,
                    connectTimeout: 10000,
                    reconnectPeriod: 0, // Disable automatic reconnection
                };
                
                // Add credentials if provided
                if (this.config.username) {
                    options.username = this.config.username;
                }
                if (this.config.password) {
                    options.password = this.config.password;
                }
                
                console.log('Connecting to MQTT broker:', brokerUrl);
                this.client = mqtt.connect(brokerUrl, options);
                
                this.client.on('connect', () => {
                    console.log('Connected to MQTT broker');
                    this.isConnected = true;
                    this.notifyConnectionChange(true);
                    
                    // Resubscribe to all topics
                    this.resubscribeAll();
                    resolve();
                });
                
                this.client.on('error', (error) => {
                    console.error('MQTT connection error:', error);
                    this.isConnected = false;
                    this.notifyConnectionChange(false);
                    reject(error);
                });
                
                this.client.on('close', () => {
                    console.log('MQTT connection closed');
                    this.isConnected = false;
                    this.notifyConnectionChange(false);
                });
                
                this.client.on('message', (topic, message) => {
                    this.handleMessage(topic, message.toString());
                });
                
                this.client.on('offline', () => {
                    console.log('MQTT client offline');
                    this.isConnected = false;
                    this.notifyConnectionChange(false);
                });
                
            } catch (error) {
                console.error('Failed to create MQTT client:', error);
                reject(error);
            }
        });
    }
    
    disconnect() {
        if (!this.client || !this.isConnected) {
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            this.client.end(false, {}, () => {
                console.log('Disconnected from MQTT broker');
                this.isConnected = false;
                this.client = null;
                this.subscribedTopics.clear();
                this.notifyConnectionChange(false);
                resolve();
            });
        });
    }
    
    subscribe(topic, messageHandler) {
        if (!this.isConnected) {
            console.warn('Cannot subscribe: not connected to MQTT broker');
            return false;
        }
        
        this.client.subscribe(topic, (error) => {
            if (error) {
                console.error(`Failed to subscribe to ${topic}:`, error);
            } else {
                console.log(`Subscribed to topic: ${topic}`);
                this.subscribedTopics.add(topic);
                if (messageHandler) {
                    this.messageHandlers.set(topic, messageHandler);
                }
            }
        });
        
        return true;
    }
    
    unsubscribe(topic) {
        if (!this.isConnected || !this.subscribedTopics.has(topic)) {
            return false;
        }
        
        this.client.unsubscribe(topic, (error) => {
            if (error) {
                console.error(`Failed to unsubscribe from ${topic}:`, error);
            } else {
                console.log(`Unsubscribed from topic: ${topic}`);
                this.subscribedTopics.delete(topic);
                this.messageHandlers.delete(topic);
            }
        });
        
        return true;
    }
    
    resubscribeAll() {
        if (!this.isConnected) {
            return;
        }
        
        const topics = Array.from(this.subscribedTopics);
        this.subscribedTopics.clear();
        
        topics.forEach(topic => {
            const handler = this.messageHandlers.get(topic);
            this.subscribe(topic, handler);
        });
    }
    
    handleMessage(topic, message) {
        console.log(`Received message on ${topic}:`, message);
        
        // Try to parse as number for temperature readings
        let parsedMessage = message;
        const numValue = parseFloat(message);
        if (!isNaN(numValue)) {
            parsedMessage = numValue;
        }
        
        // Call topic-specific handler if exists
        const handler = this.messageHandlers.get(topic);
        if (handler) {
            handler(topic, parsedMessage);
        }
        
        // Call global message handler
        if (this.onMessage) {
            this.onMessage(topic, parsedMessage);
        }
    }
    
    notifyConnectionChange(connected) {
        if (this.onConnectionChange) {
            this.onConnectionChange(connected);
        }
    }
    
    isTopicSubscribed(topic) {
        return this.subscribedTopics.has(topic);
    }
    
    getSubscribedTopics() {
        return Array.from(this.subscribedTopics);
    }
    
    getBrokerUrl() {
        return `${this.config.host}:${this.config.port}`;
    }
    
    getConfig() {
        return { ...this.config };
    }
    
    // Helper method to generate topic name for a group
    getGroupTopic(groupNumber) {
        return `${this.config.topicPrefix}/group_${groupNumber}`;
    }
    
    // Helper method to validate topic format
    isValidTopic(topic) {
        // Basic topic validation - no empty, no wildcards for subscription
        return topic && topic.length > 0 && !topic.includes('#') && !topic.includes('+');
    }
    
    // Publish method (for testing purposes)
    publish(topic, message) {
        if (!this.isConnected) {
            console.warn('Cannot publish: not connected to MQTT broker');
            return false;
        }
        
        this.client.publish(topic, message.toString(), (error) => {
            if (error) {
                console.error(`Failed to publish to ${topic}:`, error);
            } else {
                console.log(`Published to ${topic}: ${message}`);
            }
        });
        
        return true;
    }
}