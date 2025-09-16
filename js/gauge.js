/**
 * Temperature Gauge Component
 * Creates and manages temperature display gauges
 */

class TemperatureGauge {
    constructor(topic, container) {
        this.topic = topic;
        this.container = container;
        this.currentValue = null;
        this.lastUpdate = null;
        this.isActive = false;
        
        this.createElement();
        this.updateDisplay();
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'temperature-gauge';
        this.element.innerHTML = `
            <div class="gauge-header">
                <h3 class="gauge-title">${this.getGaugeTitle()}</h3>
                <button class="gauge-remove" title="Remove gauge">×</button>
            </div>
            <div class="gauge-status"></div>
            <div class="gauge-topic">${this.topic}</div>
            <div class="gauge-display">
                <div class="gauge-circle">
                    <div class="gauge-value">
                        <span class="temperature-number">--</span>
                        <span class="gauge-unit">°C</span>
                    </div>
                </div>
            </div>
            <div class="gauge-timestamp">No data received</div>
        `;
        
        // Add remove functionality
        const removeBtn = this.element.querySelector('.gauge-remove');
        removeBtn.addEventListener('click', () => this.remove());
        
        this.container.appendChild(this.element);
    }
    
    getGaugeTitle() {
        // Extract group number from topic for display
        const match = this.topic.match(/group[_-]?(\d+)/i);
        if (match) {
            return `Group ${match[1]}`;
        }
        return this.topic.split('/').pop() || 'Temperature';
    }
    
    updateValue(temperature) {
        this.currentValue = parseFloat(temperature);
        this.lastUpdate = new Date();
        this.isActive = true;
        this.updateDisplay();
    }
    
    updateDisplay() {
        const tempElement = this.element.querySelector('.temperature-number');
        const timestampElement = this.element.querySelector('.gauge-timestamp');
        const statusElement = this.element.querySelector('.gauge-status');
        const circleElement = this.element.querySelector('.gauge-circle');
        
        if (this.currentValue !== null) {
            tempElement.textContent = this.currentValue.toFixed(1);
            timestampElement.textContent = `Updated: ${this.lastUpdate.toLocaleTimeString()}`;
            statusElement.classList.add('active');
            
            // Update gauge color based on temperature
            this.updateGaugeColor(circleElement, this.currentValue);
        } else {
            tempElement.textContent = '--';
            timestampElement.textContent = 'No data received';
            statusElement.classList.remove('active');
        }
    }
    
    updateGaugeColor(circleElement, temperature) {
        // Color coding: Blue (cold) -> Green (comfortable) -> Yellow -> Orange -> Red (hot)
        let color1, color2;
        
        if (temperature < 15) {
            // Cold - Blue shades
            color1 = '#3498db';
            color2 = '#2980b9';
        } else if (temperature < 20) {
            // Cool - Blue to Green
            color1 = '#3498db';
            color2 = '#2ecc71';
        } else if (temperature < 25) {
            // Comfortable - Green
            color1 = '#2ecc71';
            color2 = '#27ae60';
        } else if (temperature < 30) {
            // Warm - Green to Yellow
            color1 = '#2ecc71';
            color2 = '#f1c40f';
        } else if (temperature < 35) {
            // Hot - Yellow to Orange
            color1 = '#f1c40f';
            color2 = '#e67e22';
        } else {
            // Very Hot - Orange to Red
            color1 = '#e67e22';
            color2 = '#e74c3c';
        }
        
        circleElement.style.background = `conic-gradient(from 0deg, ${color1} 0deg, ${color2} 360deg)`;
    }
    
    setInactive() {
        this.isActive = false;
        const statusElement = this.element.querySelector('.gauge-status');
        statusElement.classList.remove('active');
    }
    
    remove() {
        // Emit custom event for dashboard to handle MQTT unsubscription
        const event = new CustomEvent('gaugeRemoved', {
            detail: { topic: this.topic, gauge: this }
        });
        document.dispatchEvent(event);
        
        // Remove element from DOM
        this.element.remove();
    }
    
    getTopic() {
        return this.topic;
    }
    
    isReceivingData() {
        return this.isActive && this.lastUpdate && 
               (Date.now() - this.lastUpdate.getTime()) < 60000; // Active if updated within last minute
    }
}

// Gauge Manager - handles multiple gauges
class GaugeManager {
    constructor(container) {
        this.container = container;
        this.gauges = new Map();
    }
    
    addGauge(topic) {
        if (this.gauges.has(topic)) {
            console.warn(`Gauge for topic ${topic} already exists`);
            return null;
        }
        
        const gauge = new TemperatureGauge(topic, this.container);
        this.gauges.set(topic, gauge);
        
        // Listen for gauge removal
        document.addEventListener('gaugeRemoved', (event) => {
            if (event.detail.topic === topic) {
                this.gauges.delete(topic);
            }
        });
        
        return gauge;
    }
    
    removeGauge(topic) {
        const gauge = this.gauges.get(topic);
        if (gauge) {
            gauge.remove();
            this.gauges.delete(topic);
        }
    }
    
    updateGauge(topic, temperature) {
        const gauge = this.gauges.get(topic);
        if (gauge) {
            gauge.updateValue(temperature);
            return true;
        }
        return false;
    }
    
    getAllTopics() {
        return Array.from(this.gauges.keys());
    }
    
    getGauge(topic) {
        return this.gauges.get(topic);
    }
    
    clear() {
        this.gauges.forEach(gauge => gauge.remove());
        this.gauges.clear();
    }
    
    setAllInactive() {
        this.gauges.forEach(gauge => gauge.setInactive());
    }
}