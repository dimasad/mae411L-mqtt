/**
 * Debug Pane Component
 * Provides event logging and message publishing functionality for debugging MQTT operations
 */

class DebugPane {
    constructor() {
        this.isMinimized = true;
        this.events = [];
        this.maxEvents = 100; // Limit to prevent memory issues
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.debugPane = document.getElementById('debug-pane');
        this.debugHeader = document.getElementById('debug-header');
        this.debugContent = document.getElementById('debug-content');
        this.toggleBtn = document.getElementById('debug-toggle');
        this.clearBtn = document.getElementById('debug-clear');
        this.eventsList = document.getElementById('debug-events');
        this.latestEvent = document.getElementById('debug-latest-event');
        
        // Message publishing elements
        this.publishTopic = document.getElementById('publish-topic');
        this.publishMessage = document.getElementById('publish-message');
        this.publishBtn = document.getElementById('publish-btn');
        
        // Set initial state
        this.updateDisplay();
    }
    
    bindEvents() {
        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.clearBtn.addEventListener('click', () => this.clearEvents());
        this.publishBtn.addEventListener('click', () => this.publishMsg());
        
        // Enter key to publish message
        this.publishMessage.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.publishMsg();
            }
        });
        
        // Auto-resize message textarea
        this.publishMessage.addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        });
    }
    
    toggle() {
        this.isMinimized = !this.isMinimized;
        this.updateDisplay();
    }
    
    updateDisplay() {
        if (this.isMinimized) {
            this.debugPane.classList.add('minimized');
            this.toggleBtn.textContent = '▲';
            this.toggleBtn.title = 'Expand debug pane';
        } else {
            this.debugPane.classList.remove('minimized');
            this.toggleBtn.textContent = '▼';
            this.toggleBtn.title = 'Minimize debug pane';
        }
        
        this.updateLatestEvent();
    }
    
    updateLatestEvent() {
        if (this.events.length > 0) {
            const latest = this.events[this.events.length - 1];
            this.latestEvent.textContent = `${latest.timestamp.toLocaleTimeString()} - ${latest.message}`;
        } else {
            this.latestEvent.textContent = 'No events logged';
        }
    }
    
    logEvent(type, message, data = null) {
        const event = {
            type: type,
            message: message,
            data: data,
            timestamp: new Date()
        };
        
        this.events.push(event);
        
        // Limit events to prevent memory issues
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }
        
        this.addEventToDisplay(event);
        this.updateLatestEvent();
        
        console.log(`[Debug] ${type}: ${message}`, data || '');
    }
    
    addEventToDisplay(event) {
        const eventElement = document.createElement('div');
        eventElement.className = `debug-event debug-event-${event.type}`;
        
        const timestamp = event.timestamp.toLocaleTimeString();
        const typeLabel = this.getTypeLabel(event.type);
        
        eventElement.innerHTML = `
            <span class="debug-event-time">${timestamp}</span>
            <span class="debug-event-type">${typeLabel}</span>
            <span class="debug-event-message">${event.message}</span>
            ${event.data ? `<span class="debug-event-data">${this.formatEventData(event.data)}</span>` : ''}
        `;
        
        this.eventsList.appendChild(eventElement);
        
        // Auto-scroll to latest event
        this.eventsList.scrollTop = this.eventsList.scrollHeight;
        
        // Remove old events from display if too many
        while (this.eventsList.children.length > this.maxEvents) {
            this.eventsList.removeChild(this.eventsList.firstChild);
        }
    }
    
    getTypeLabel(type) {
        const labels = {
            'connect': 'CONNECT',
            'connected': 'CONNECTED',
            'disconnect': 'DISCONNECT',
            'disconnected': 'DISCONNECTED',
            'message': 'MESSAGE',
            'publish': 'PUBLISH',
            'subscribe': 'SUBSCRIBE',
            'unsubscribe': 'UNSUBSCRIBE',
            'error': 'ERROR',
            'info': 'INFO'
        };
        return labels[type] || type.toUpperCase();
    }
    
    formatEventData(data) {
        if (typeof data === 'object') {
            return JSON.stringify(data, null, 2);
        }
        return String(data);
    }
    
    clearEvents() {
        this.events = [];
        this.eventsList.innerHTML = '';
        this.updateLatestEvent();
        this.logEvent('info', 'Event log cleared');
    }
    
    publishMsg() {
        const topic = this.publishTopic.value.trim();
        const message = this.publishMessage.value.trim();
        
        if (!topic) {
            this.logEvent('error', 'Cannot publish: Topic is required');
            return;
        }
        
        if (!message) {
            this.logEvent('error', 'Cannot publish: Message is required');
            return;
        }
        
        // Emit custom event for dashboard to handle
        const publishEvent = new CustomEvent('debugPublishMessage', {
            detail: { topic, message }
        });
        document.dispatchEvent(publishEvent);
        
        // Clear message after publishing
        this.publishMessage.value = '';
        this.publishMessage.style.height = 'auto';
    }
    
    // Public methods for logging different types of events
    logConnection(host, port, path, secure) {
        const protocol = secure ? 'wss' : 'ws';
        this.logEvent('connect', `Attempting to connect to ${protocol}://${host}:${port}${path}`);
    }
    
    logConnected(host, port, path, secure) {
        const protocol = secure ? 'wss' : 'ws';
        this.logEvent('connected', `Connected to ${protocol}://${host}:${port}${path}`);
    }
    
    logDisconnected() {
        this.logEvent('disconnected', 'Disconnected from MQTT broker');
    }
    
    logMessageReceived(topic, message) {
        this.logEvent('message', `Received message on topic: ${topic}`, message);
    }
    
    logMessagePublished(topic, message) {
        this.logEvent('publish', `Published message to topic: ${topic}`, message);
    }
    
    logSubscribed(topic) {
        this.logEvent('subscribe', `Subscribed to topic: ${topic}`);
    }
    
    logUnsubscribed(topic) {
        this.logEvent('unsubscribe', `Unsubscribed from topic: ${topic}`);
    }
    
    logError(message, error = null) {
        this.logEvent('error', message, error);
    }
    
    logInfo(message, data = null) {
        this.logEvent('info', message, data);
    }
}