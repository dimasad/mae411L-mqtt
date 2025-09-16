/**
 * Simplified integration tests with MQTT broker
 * This file bypasses Jest setup to use real MQTT library
 */

// Import MQTT before any jest setup interferes
const mqtt = require('mqtt');

describe('MQTT Integration Tests (No Mocks)', () => {
    let testClient;
    const MQTT_HOST = 'localhost';
    const MQTT_PORT = 1883;

    beforeAll(async () => {
        // Connect to the existing mosquitto broker
        testClient = mqtt.connect(`mqtt://${MQTT_HOST}:${MQTT_PORT}`);
        
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
            testClient.on('connect', () => {
                clearTimeout(timeout);
                resolve();
            });
            testClient.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }, 15000);

    afterAll(async () => {
        if (testClient && testClient.connected) {
            testClient.end();
        }
    });

    test('should connect to MQTT broker', () => {
        expect(testClient.connected).toBe(true);
    });

    test('should publish and receive messages', async () => {
        const topic = 'test/temperature';
        const message = '25.5';
        let receivedMessage;

        await new Promise((resolve) => {
            testClient.subscribe(topic);
            testClient.on('message', (receivedTopic, msg) => {
                if (receivedTopic === topic) {
                    receivedMessage = msg.toString();
                    resolve();
                }
            });
            
            // Publish after a short delay
            setTimeout(() => {
                testClient.publish(topic, message);
            }, 100);
        });

        expect(receivedMessage).toBe(message);
    });

    test('should handle dashboard group topics', async () => {
        const topics = [
            'wvu-mae411L/group_1',
            'wvu-mae411L/group_2'
        ];
        const temperatures = ['20.5', '22.0'];
        const received = new Map();

        await new Promise((resolve) => {
            topics.forEach(topic => testClient.subscribe(topic));
            
            const messageHandler = (receivedTopic, msg) => {
                if (topics.includes(receivedTopic)) {
                    received.set(receivedTopic, msg.toString());
                    if (received.size === topics.length) {
                        testClient.off('message', messageHandler);
                        resolve();
                    }
                }
            };
            
            testClient.on('message', messageHandler);

            // Publish to each topic
            topics.forEach((topic, index) => {
                setTimeout(() => {
                    testClient.publish(topic, temperatures[index]);
                }, index * 100);
            });
        });

        topics.forEach((topic, index) => {
            expect(received.get(topic)).toBe(temperatures[index]);
        });
    });

    test('should validate numeric temperature values', () => {
        const validTemperatures = ['25.5', '0', '-10.5', '100.0'];
        const invalidTemperatures = ['abc', 'twenty-five', '', 'NaN'];

        validTemperatures.forEach(temp => {
            const num = parseFloat(temp);
            expect(isNaN(num)).toBe(false);
        });

        invalidTemperatures.forEach(temp => {
            const num = parseFloat(temp);
            expect(isNaN(num)).toBe(true);
        });
    });
});