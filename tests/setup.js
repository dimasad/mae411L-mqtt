// Jest setup file
require('jest-environment-jsdom');

// Add custom jest matchers if needed
expect.extend({
    toBeValidTopic(received) {
        const pass = received && 
                    typeof received === 'string' && 
                    received.length > 0 && 
                    !received.includes('#') && 
                    !received.includes('+');
        
        return {
            message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid MQTT topic`,
            pass,
        };
    }
});

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Only mock MQTT for unit tests, not integration tests
if (!process.env.INTEGRATION_TEST) {
    // Mock the MQTT library globally for unit tests
    global.mqtt = {
        connect: jest.fn()
    };
}

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
});