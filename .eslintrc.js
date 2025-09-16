module.exports = {
    env: {
        browser: true,
        es2021: true,
        jest: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    globals: {
        mqtt: 'readonly',
        DebugPane: 'readonly',
        GaugeManager: 'readonly',
        TemperatureGauge: 'readonly',
        MQTTClient: 'readonly',
        Dashboard: 'readonly'
    },
    rules: {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-unused-vars': ['warn'],
        'no-console': 'off'
    }
};