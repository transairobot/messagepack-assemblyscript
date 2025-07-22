// AssemblyScript unit tests for buffer utilities
import { GrowableBuffer, BufferReader } from "../buffer";

/**
 * Test suite for GrowableBuffer functionality
 */
export function testGrowableBuffer(): boolean {
    console.log("Testing GrowableBuffer...");
    
    // Test 1: Basic construction
    let buffer = new GrowableBuffer(16);
    if (buffer.getCapacity() != 16 || buffer.getPosition() != 0) {
        console.log("❌ Basic construction test failed");
        return false;
    }
    console.log("✓ Basic construction test passed");
    
    // Test 2: Writing single bytes
    buffer.writeUint8(0x42);
    buffer.writeUint8(0xFF);
    if (buffer.getPosition() != 2) {
        console.log("❌ writeUint8 position test failed");
        return false;
    }
    
    let bytes = buffer.toBytes();
    if (bytes.length != 2 || bytes[0] != 0x42 || bytes[1] != 0xFF) {
        console.log("❌ writeUint8 content test failed");
        return false;
    }
    console.log("✓ writeUint8 test passed");
    
    // Test 3: Writing 16-bit values
    buffer.reset();
    buffer.writeUint16BE(0x1234);
    bytes = buffer.toBytes();
    if (bytes.length != 2 || bytes[0] != 0x12 || bytes[1] != 0x34) {
        console.log("❌ writeUint16BE test failed");
        return false;
    }
    console.log("✓ writeUint16BE test passed");
    
    // Test 4: Writing 32-bit values
    buffer.reset();
    buffer.writeUint32BE(0x12345678);
    bytes = buffer.toBytes();
    if (bytes.length != 4 || bytes[0] != 0x12 || bytes[1] != 0x34 || 
        bytes[2] != 0x56 || bytes[3] != 0x78) {
        console.log("❌ writeUint32BE test failed");
        return false;
    }
    console.log("✓ writeUint32BE test passed");
    
    // Test 5: Writing 64-bit values
    buffer.reset();
    buffer.writeUint64BE(0x123456789ABCDEF0);
    bytes = buffer.toBytes();
    if (bytes.length != 8 || bytes[0] != 0x12 || bytes[1] != 0x34 || 
        bytes[2] != 0x56 || bytes[3] != 0x78 || bytes[4] != 0x9A || 
        bytes[5] != 0xBC || bytes[6] != 0xDE || bytes[7] != 0xF0) {
        console.log("❌ writeUint64BE test failed");
        return false;
    }
    console.log("✓ writeUint64BE test passed");
    
    // Test 6: Writing float values
    buffer.reset();
    buffer.writeFloat32BE(3.14159);
    if (buffer.getPosition() != 4) {
        console.log("❌ writeFloat32BE position test failed");
        return false;
    }
    console.log("✓ writeFloat32BE test passed");
    
    buffer.reset();
    buffer.writeFloat64BE(3.141592653589793);
    if (buffer.getPosition() != 8) {
        console.log("❌ writeFloat64BE position test failed");
        return false;
    }
    console.log("✓ writeFloat64BE test passed");
    
    // Test 7: Writing byte arrays
    buffer.reset();
    let testBytes = new Uint8Array(3);
    testBytes[0] = 0xAA;
    testBytes[1] = 0xBB;
    testBytes[2] = 0xCC;
    buffer.writeBytes(testBytes);
    bytes = buffer.toBytes();
    if (bytes.length != 3 || bytes[0] != 0xAA || bytes[1] != 0xBB || bytes[2] != 0xCC) {
        console.log("❌ writeBytes test failed");
        return false;
    }
    console.log("✓ writeBytes test passed");
    
    // Test 8: Buffer growth
    buffer.reset();
    // Write more data than initial capacity (16 bytes)
    for (let i = 0; i < 20; i++) {
        buffer.writeUint8(i as u8);
    }
    if (buffer.getCapacity() <= 16) {
        console.log("❌ Buffer growth test failed - capacity not increased");
        return false;
    }
    if (buffer.getPosition() != 20) {
        console.log("❌ Buffer growth test failed - position incorrect");
        return false;
    }
    bytes = buffer.toBytes();
    if (bytes.length != 20) {
        console.log("❌ Buffer growth test failed - output length incorrect");
        return false;
    }
    for (let i = 0; i < 20; i++) {
        if (bytes[i] != (i as u8)) {
            console.log("❌ Buffer growth test failed - data corruption");
            return false;
        }
    }
    console.log("✓ Buffer growth test passed");
    
    console.log("GrowableBuffer tests completed ✅");
    return true;
}

/**
 * Test suite for BufferReader functionality
 */
export function testBufferReader(): boolean {
    console.log("Testing BufferReader...");
    
    // Create test data
    let testData = new Uint8Array(16);
    testData[0] = 0x42;
    testData[1] = 0xFF;
    testData[2] = 0x12;
    testData[3] = 0x34;
    testData[4] = 0x12;
    testData[5] = 0x34;
    testData[6] = 0x56;
    testData[7] = 0x78;
    testData[8] = 0x12;
    testData[9] = 0x34;
    testData[10] = 0x56;
    testData[11] = 0x78;
    testData[12] = 0x9A;
    testData[13] = 0xBC;
    testData[14] = 0xDE;
    testData[15] = 0xF0;
    
    let reader = new BufferReader(testData);
    
    // Test 1: Basic construction
    if (reader.getPosition() != 0 || reader.remaining() != 16) {
        console.log("❌ BufferReader construction test failed");
        return false;
    }
    console.log("✓ BufferReader construction test passed");
    
    // Test 2: Reading single bytes
    let byte1 = reader.readUint8();
    let byte2 = reader.readUint8();
    if (byte1 != 0x42 || byte2 != 0xFF || reader.getPosition() != 2) {
        console.log("❌ readUint8 test failed");
        return false;
    }
    console.log("✓ readUint8 test passed");
    
    // Test 3: Reading 16-bit values
    let value16 = reader.readUint16BE();
    if (value16 != 0x1234 || reader.getPosition() != 4) {
        console.log("❌ readUint16BE test failed");
        return false;
    }
    console.log("✓ readUint16BE test passed");
    
    // Test 4: Reading 32-bit values
    let value32 = reader.readUint32BE();
    if (value32 != 0x12345678 || reader.getPosition() != 8) {
        console.log("❌ readUint32BE test failed");
        return false;
    }
    console.log("✓ readUint32BE test passed");
    
    // Test 5: Reading 64-bit values
    let value64 = reader.readUint64BE();
    if (value64 != 0x123456789ABCDEF0 || reader.getPosition() != 16) {
        console.log("❌ readUint64BE test failed");
        return false;
    }
    console.log("✓ readUint64BE test passed");
    
    // Test 6: Position management
    reader.setPosition(0);
    if (reader.getPosition() != 0 || reader.remaining() != 16) {
        console.log("❌ Position management test failed");
        return false;
    }
    console.log("✓ Position management test passed");
    
    // Test 7: Reading byte arrays
    let readBytes = reader.readBytes(4);
    if (readBytes.length != 4 || readBytes[0] != 0x42 || readBytes[1] != 0xFF || 
        readBytes[2] != 0x12 || readBytes[3] != 0x34) {
        console.log("❌ readBytes test failed");
        return false;
    }
    console.log("✓ readBytes test passed");
    
    // Test 8: Peek functionality
    reader.setPosition(0);
    let peekedByte = reader.peekUint8();
    if (peekedByte != 0x42 || reader.getPosition() != 0) {
        console.log("❌ peekUint8 test failed");
        return false;
    }
    console.log("✓ peekUint8 test passed");
    
    // Test 9: Bounds checking
    reader.setPosition(15);
    if (!reader.hasRemaining(1) || reader.hasRemaining(2)) {
        console.log("❌ hasRemaining test failed");
        return false;
    }
    console.log("✓ hasRemaining test passed");
    
    console.log("BufferReader tests completed ✅");
    return true;
}

/**
 * Round-trip test: write data with GrowableBuffer and read it back with BufferReader
 */
export function testRoundTrip(): boolean {
    console.log("Testing round-trip functionality...");
    
    let buffer = new GrowableBuffer();
    
    // Write various data types
    buffer.writeUint8(0x42);
    buffer.writeUint16BE(0x1234);
    buffer.writeUint32BE(0x12345678);
    buffer.writeUint64BE(0x123456789ABCDEF0);
    buffer.writeFloat32BE(3.14159);
    buffer.writeFloat64BE(3.141592653589793);
    
    let testBytes = new Uint8Array(3);
    testBytes[0] = 0xAA;
    testBytes[1] = 0xBB;
    testBytes[2] = 0xCC;
    buffer.writeBytes(testBytes);
    
    // Get the written data
    let data = buffer.toBytes();
    
    // Read it back
    let reader = new BufferReader(data);
    
    let readByte = reader.readUint8();
    let readUint16 = reader.readUint16BE();
    let readUint32 = reader.readUint32BE();
    let readUint64 = reader.readUint64BE();
    let readFloat32 = reader.readFloat32BE();
    let readFloat64 = reader.readFloat64BE();
    let readBytes = reader.readBytes(3);
    
    // Verify all values match
    if (readByte != 0x42) {
        console.log("❌ Round-trip uint8 test failed");
        return false;
    }
    
    if (readUint16 != 0x1234) {
        console.log("❌ Round-trip uint16 test failed");
        return false;
    }
    
    if (readUint32 != 0x12345678) {
        console.log("❌ Round-trip uint32 test failed");
        return false;
    }
    
    if (readUint64 != 0x123456789ABCDEF0) {
        console.log("❌ Round-trip uint64 test failed");
        return false;
    }
    
    // Float comparison with small tolerance
    if (Math.abs(readFloat32 - 3.14159) > 0.0001) {
        console.log("❌ Round-trip float32 test failed");
        return false;
    }
    
    if (Math.abs(readFloat64 - 3.141592653589793) > 0.000000000000001) {
        console.log("❌ Round-trip float64 test failed");
        return false;
    }
    
    if (readBytes.length != 3 || readBytes[0] != 0xAA || 
        readBytes[1] != 0xBB || readBytes[2] != 0xCC) {
        console.log("❌ Round-trip bytes test failed");
        return false;
    }
    
    console.log("✓ Round-trip test passed");
    return true;
}

/**
 * Run all buffer tests
 */
export function runAllBufferTests(): boolean {
    console.log("=== Buffer Management Unit Tests ===\n");
    
    let allPassed = true;
    
    allPassed = testGrowableBuffer() && allPassed;
    console.log("");
    
    allPassed = testBufferReader() && allPassed;
    console.log("");
    
    allPassed = testRoundTrip() && allPassed;
    console.log("");
    
    if (allPassed) {
        console.log("🎉 All buffer tests passed!");
    } else {
        console.log("❌ Some buffer tests failed!");
    }
    
    return allPassed;
}