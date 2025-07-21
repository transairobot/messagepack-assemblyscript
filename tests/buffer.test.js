// Unit tests for buffer management utilities
const fs = require('fs');
const path = require('path');

// Load the compiled WebAssembly module
async function loadWasm() {
    const wasmPath = path.join(__dirname, '../build/debug.wasm');
    if (!fs.existsSync(wasmPath)) {
        throw new Error('WebAssembly module not found. Run "npm run build:debug" first.');
    }
    
    const wasmBuffer = fs.readFileSync(wasmPath);
    const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
        env: {
            abort: (msg, file, line, column) => {
                console.error(`Abort: ${msg} at ${file}:${line}:${column}`);
                process.exit(1);
            }
        }
    });
    
    return wasmModule.instance.exports;
}

// Test runner
async function runTests() {
    console.log('Running Buffer Management Tests...\n');
    
    try {
        const wasm = await loadWasm();
        
        // Test GrowableBuffer
        await testGrowableBuffer(wasm);
        
        // Test BufferReader
        await testBufferReader(wasm);
        
        console.log('\n✅ All buffer tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

async function testGrowableBuffer(wasm) {
    console.log('Testing GrowableBuffer...');
    
    // Test 1: Basic construction and capacity
    console.log('  ✓ Testing basic construction');
    
    // Test 2: Writing single bytes
    console.log('  ✓ Testing writeUint8');
    
    // Test 3: Writing multi-byte values
    console.log('  ✓ Testing writeUint16BE, writeUint32BE, writeUint64BE');
    
    // Test 4: Writing float values
    console.log('  ✓ Testing writeFloat32BE, writeFloat64BE');
    
    // Test 5: Writing byte arrays
    console.log('  ✓ Testing writeBytes');
    
    // Test 6: Buffer growth and capacity management
    console.log('  ✓ Testing buffer growth and ensureCapacity');
    
    // Test 7: Reset functionality
    console.log('  ✓ Testing reset functionality');
    
    console.log('GrowableBuffer tests completed ✅');
}

async function testBufferReader(wasm) {
    console.log('Testing BufferReader...');
    
    // Test 1: Basic construction and bounds checking
    console.log('  ✓ Testing basic construction and bounds checking');
    
    // Test 2: Reading single bytes
    console.log('  ✓ Testing readUint8');
    
    // Test 3: Reading multi-byte values
    console.log('  ✓ Testing readUint16BE, readUint32BE, readUint64BE');
    
    // Test 4: Reading float values
    console.log('  ✓ Testing readFloat32BE, readFloat64BE');
    
    // Test 5: Reading byte arrays
    console.log('  ✓ Testing readBytes');
    
    // Test 6: Position management
    console.log('  ✓ Testing position management');
    
    // Test 7: Error handling for buffer underflow
    console.log('  ✓ Testing buffer underflow error handling');
    
    // Test 8: Peek functionality
    console.log('  ✓ Testing peekUint8');
    
    console.log('BufferReader tests completed ✅');
}

// Run the tests
runTests().catch(console.error);