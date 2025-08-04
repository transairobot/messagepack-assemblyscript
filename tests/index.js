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
        
        // Check what functions are available
        console.log("Available test functions:", Object.keys(wasmModule).filter(key => key.includes('test') || key.includes('Test')));
        
        let allTestsPassed = true;
        
        // Run export validation tests first
        console.log("Running export validation tests...");
        if (wasmModule.runAllExportTests) {
            const exportTestResult = wasmModule.runAllExportTests();
            if (exportTestResult) {
                console.log("✅ Export validation tests passed!");
            } else {
                console.log("❌ Export validation tests failed!");
                allTestsPassed = false;
            }
        } else {
            console.log("⚠️  Export validation tests not available");
        }
        
        console.log("\n" + "=".repeat(50) + "\n");
        
        // Run class serialization tests
        console.log("Running class serialization tests...");
        const classSerializationTestResult = wasmModule.runAllClassSerializationTests();
        
        if (classSerializationTestResult) {
            console.log("✅ Class serialization tests passed!");
        } else {
            console.log("❌ Class serialization tests failed!");
            allTestsPassed = false;
        }
        
        console.log("\n" + "=".repeat(50) + "\n");
        
        // Final summary
        if (allTestsPassed) {
            console.log("🎉 All test suites passed successfully!");
            console.log("✅ Library exports are working correctly");
            console.log("✅ Class serialization functionality is working correctly");
        } else {
            console.log("❌ Some tests failed. Please check the output above.");
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

runTests().catch(console.error);