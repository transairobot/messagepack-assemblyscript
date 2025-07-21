// Test runner for the MessagePack library
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
    console.log("MessagePack AssemblyScript Library - Test Suite\n");
    
    try {
        // Import the generated JavaScript module
        const debugJsPath = path.join(__dirname, '../build/debug.js');
        if (!fs.existsSync(debugJsPath)) {
            console.error('Debug module not found. Run "npm run build:debug" first.');
            process.exit(1);
        }
        
        // Use dynamic import to load the ES module
        const wasmModule = await import(`file://${path.resolve(debugJsPath)}`);
        
        // Run buffer tests
        console.log("Running buffer management tests...");
        const bufferTestResult = wasmModule.runAllBufferTests();
        console.log("\n");
        
        // Run encoder tests
        console.log("Running encoder tests...");
        const encoderTestResult = wasmModule.runAllEncoderTests();
        
        // Run decoder tests
        console.log("Running decoder tests...");
        const decoderTestResult = wasmModule.runDecoderTests();
        
        // Run decoder integration tests
        const decoderIntegrationTestResult = wasmModule.runDecoderIntegrationTests();
        console.log("\n");
        
        if (bufferTestResult && encoderTestResult && decoderTestResult && decoderIntegrationTestResult) {
            console.log("✅ All tests passed!");
        } else {
            console.log("❌ Some tests failed!");
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

runTests().catch(console.error);