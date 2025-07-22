// AssemblyScript unit tests for MessagePack encoder
import { Format } from "../format";
import { MessagePackEncoder } from "../encoder";
import { 
    MessagePackNull, 
    MessagePackBoolean, 
    MessagePackInteger, 
    MessagePackFloat, 
    MessagePackString, 
    MessagePackBinary,
    MessagePackValueType
} from "../types";

/**
 * Test suite for basic type encoding (null and boolean)
 */
export function testBasicTypeEncoding(): boolean {
    console.log("Testing basic type encoding...");

    // Test 1: Null encoding
    let encoder = new MessagePackEncoder();
    let nullValue = new MessagePackNull();
    let nullBytes = encoder.encode(nullValue);

    if (nullBytes.length != 1 || nullBytes[0] != Format.NIL) {
        console.log(`❌ Null encoding test failed: expected [${Format.NIL}], got [${nullBytes[0]}]`);
        return false;
    }
    console.log("✓ Null encoding test passed");

    // Test 2: Boolean encoding (true)
    encoder = new MessagePackEncoder();
    let trueValue = new MessagePackBoolean(true);
    let trueBytes = encoder.encode(trueValue);

    if (trueBytes.length != 1 || trueBytes[0] != Format.TRUE) {
        console.log(`❌ Boolean true encoding test failed: expected [${Format.TRUE}], got [${trueBytes[0]}]`);
        return false;
    }
    console.log("✓ Boolean true encoding test passed");

    // Test 3: Boolean encoding (false)
    encoder = new MessagePackEncoder();
    let falseValue = new MessagePackBoolean(false);
    let falseBytes = encoder.encode(falseValue);

    if (falseBytes.length != 1 || falseBytes[0] != Format.FALSE) {
        console.log(`❌ Boolean false encoding test failed: expected [${Format.FALSE}], got [${falseBytes[0]}]`);
        return false;
    }
    console.log("✓ Boolean false encoding test passed");

    console.log("Basic type encoding tests completed ✅");
    return true;
}

/**
 * Test suite for integer encoding
 */
export function testIntegerEncoding(): boolean {
    console.log("Testing integer encoding...");
    let encoder = new MessagePackEncoder();
    let passed = true;

    // Test positive fixint (0x00 - 0x7f)
    const positiveFixintValues: i64[] = [0, 1, 10, 127];
    for (let i = 0; i < positiveFixintValues.length; i++) {
        const value = positiveFixintValues[i];
        const intValue = new MessagePackInteger(value);
        const bytes = encoder.encode(intValue);

        if (bytes.length != 1 || bytes[0] != value) {
            console.log(`❌ Positive fixint encoding test failed for ${value}: expected [${value}], got [${bytes[0]}]`);
            passed = false;
        }
    }
    console.log("✓ Positive fixint encoding tests passed");

    // Test negative fixint (0xe0 - 0xff / -32 to -1)
    const negativeFixintValues: i64[] = [-32, -31, -16, -1];
    for (let i = 0; i < negativeFixintValues.length; i++) {
        const value = negativeFixintValues[i];
        const intValue = new MessagePackInteger(value);
        const bytes = encoder.encode(intValue);
        const expected = (value & 0xff) as u8;

        if (bytes.length != 1 || bytes[0] != expected) {
            console.log(`❌ Negative fixint encoding test failed for ${value}: expected [${expected}], got [${bytes[0]}]`);
            passed = false;
        }
    }
    console.log("✓ Negative fixint encoding tests passed");

    // Test uint8 (0xcc)
    const uint8Values: i64[] = [128, 200, 255];
    for (let i = 0; i < uint8Values.length; i++) {
        const value = uint8Values[i];
        const intValue = new MessagePackInteger(value);
        const bytes = encoder.encode(intValue);

        if (bytes.length != 2 || bytes[0] != Format.UINT8 || bytes[1] != value) {
            console.log(`❌ uint8 encoding test failed for ${value}: expected [${Format.UINT8}, ${value}], got [${bytes[0]}, ${bytes[1]}]`);
            passed = false;
        }
    }
    console.log("✓ uint8 encoding tests passed");

    // Test int8 (0xd0)
    const int8Values: i64[] = [-128, -100, -33];
    for (let i = 0; i < int8Values.length; i++) {
        const value = int8Values[i];
        const intValue = new MessagePackInteger(value);
        const bytes = encoder.encode(intValue);
        const expected = (value & 0xff) as u8;

        if (bytes.length != 2 || bytes[0] != Format.INT8 || bytes[1] != expected) {
            console.log(`❌ int8 encoding test failed for ${value}: expected [${Format.INT8}, ${expected}], got [${bytes[0]}, ${bytes[1]}]`);
            passed = false;
        }
    }
    console.log("✓ int8 encoding tests passed");

    // Test uint16 (0xcd)
    const uint16Values: i64[] = [256, 32000, 65535];
    for (let i = 0; i < uint16Values.length; i++) {
        const value = uint16Values[i];
        const intValue = new MessagePackInteger(value);
        const bytes = encoder.encode(intValue);
        const expectedHigh = ((value >> 8) & 0xff) as u8;
        const expectedLow = (value & 0xff) as u8;

        if (bytes.length != 3 || bytes[0] != Format.UINT16 || bytes[1] != expectedHigh || bytes[2] != expectedLow) {
            console.log(`❌ uint16 encoding test failed for ${value}`);
            passed = false;
        }
    }
    console.log("✓ uint16 encoding tests passed");

    // Test int16 (0xd1)
    const int16Values: i64[] = [-32768, -1000, -129];
    for (let i = 0; i < int16Values.length; i++) {
        const value = int16Values[i];
        const intValue = new MessagePackInteger(value);
        const bytes = encoder.encode(intValue);
        const expectedHigh = ((value >> 8) & 0xff) as u8;
        const expectedLow = (value & 0xff) as u8;

        if (bytes.length != 3 || bytes[0] != Format.INT16 || bytes[1] != expectedHigh || bytes[2] != expectedLow) {
            console.log(`❌ int16 encoding test failed for ${value}`);
            passed = false;
        }
    }
    console.log("✓ int16 encoding tests passed");

    // Test uint32 (0xce)
    const uint32Values: i64[] = [65536, 16777216, 4294967295];
    for (let i = 0; i < uint32Values.length; i++) {
        const value = uint32Values[i];
        const intValue = new MessagePackInteger(value);
        const bytes = encoder.encode(intValue);

        if (bytes.length != 5 || bytes[0] != Format.UINT32) {
            console.log(`❌ uint32 encoding test failed for ${value}`);
            passed = false;
        }
    }
    console.log("✓ uint32 encoding tests passed");

    // Test int32 (0xd2)
    const int32Values: i64[] = [-2147483648, -16777216, -32769];
    for (let i = 0; i < int32Values.length; i++) {
        const value = int32Values[i];
        const intValue = new MessagePackInteger(value);
        const bytes = encoder.encode(intValue);

        if (bytes.length != 5 || bytes[0] != Format.INT32) {
            console.log(`❌ int32 encoding test failed for ${value}`);
            passed = false;
        }
    }
    console.log("✓ int32 encoding tests passed");

    // Test uint64 (0xcf)
    const uint64Values: i64[] = [4294967296, 1099511627776, 9223372036854775807];
    for (let i = 0; i < uint64Values.length; i++) {
        const value = uint64Values[i];
        const intValue = new MessagePackInteger(value);
        const bytes = encoder.encode(intValue);

        if (bytes.length != 9 || bytes[0] != Format.UINT64) {
            console.log(`❌ uint64 encoding test failed for ${value}`);
            passed = false;
        }
    }
    console.log("✓ uint64 encoding tests passed");

    // Test int64 (0xd3)
    const int64Values: i64[] = [-9223372036854775808, -2147483649];
    for (let i = 0; i < int64Values.length; i++) {
        const value = int64Values[i];
        const intValue = new MessagePackInteger(value);
        const bytes = encoder.encode(intValue);

        if (bytes.length != 9 || bytes[0] != Format.INT64) {
            console.log(`❌ int64 encoding test failed for ${value}`);
            passed = false;
        }
    }
    console.log("✓ int64 encoding tests passed");

    console.log("Integer encoding tests completed ✅");
    return passed;
}

/**
 * Test suite for floating point encoding
 */
export function testFloatEncoding(): boolean {
    console.log("Testing floating point encoding...");
    let encoder = new MessagePackEncoder();
    let passed = true;

    // Test float32 encoding (simple values that should use float32)
    const float32Values: f64[] = [0.0, 1.0, -1.0];
    for (let i = 0; i < float32Values.length; i++) {
        const value = float32Values[i];
        const floatValue = new MessagePackFloat(value);
        const bytes = encoder.encode(floatValue);

        if (bytes.length != 5 || bytes[0] != Format.FLOAT32) {
            console.log(`❌ float32 encoding test failed for ${value}: expected format byte ${Format.FLOAT32}, got ${bytes[0]}`);
            passed = false;
        }
    }
    console.log("✓ Simple float32 encoding tests passed");

    // Test float64 encoding (values that need full double precision)
    const float64Values: f64[] = [
        3.14,
        -3.14,
        1.23e10,
        1.1,
        1.23456789012345,
        -1.23456789012345,
        1.7976931348623157e+308 * 0.1, // Large but valid float64
        -1.7976931348623157e+308 * 0.1
    ];
    
    for (let i = 0; i < float64Values.length; i++) {
        const value = float64Values[i];
        const floatValue = new MessagePackFloat(value);
        const bytes = encoder.encode(floatValue);

        if (bytes.length != 9 || bytes[0] != Format.FLOAT64) {
            console.log(`❌ float64 encoding test failed for ${value}: expected format byte ${Format.FLOAT64}, got ${bytes[0]}`);
            passed = false;
        }
    }
    console.log("✓ float64 encoding tests passed");

    // Test special values (NaN, Infinity, -Infinity)
    const specialValues: f64[] = [NaN, Infinity, -Infinity];
    const specialNames: string[] = ["NaN", "Infinity", "-Infinity"];
    
    for (let i = 0; i < specialValues.length; i++) {
        const value = specialValues[i];
        const floatValue = new MessagePackFloat(value);
        const bytes = encoder.encode(floatValue);

        if (bytes.length != 5 || bytes[0] != Format.FLOAT32) {
            console.log(`❌ Special value encoding test failed for ${specialNames[i]}: expected format byte ${Format.FLOAT32}, got ${bytes[0]}`);
            passed = false;
        }
    }
    console.log("✓ Special values encoding tests passed");

    console.log("Floating point encoding tests completed ✅");
    return passed;
}

/**
 * Test suite for string encoding
 */
export function testStringEncoding(): boolean {
    console.log("Testing string encoding...");
    let encoder = new MessagePackEncoder();
    let passed = true;

    // Test empty string
    const emptyStr = new MessagePackString("");
    const emptyBytes = encoder.encode(emptyStr);
    if (emptyBytes.length != 1 || emptyBytes[0] != Format.FIXSTR_PREFIX) {
        console.log(`❌ Empty string encoding test failed: expected [${Format.FIXSTR_PREFIX}], got [${emptyBytes[0]}]`);
        passed = false;
    }
    console.log("✓ Empty string encoding test passed");

    // Test fixstr format (0xa0-0xbf) for strings up to 31 bytes
    const fixstrValues: string[] = [
        "a",                    // 1 byte
        "hello",                // 5 bytes
        "MessagePack",          // 11 bytes
        "This is a test",       // 14 bytes
        "0123456789abcdefghij", // 20 bytes
        "0123456789abcdefghijklmnopqrstu" // 31 bytes
    ];
    
    for (let i = 0; i < fixstrValues.length; i++) {
        const value = fixstrValues[i];
        const strValue = new MessagePackString(value);
        const bytes = encoder.encode(strValue);
        
        // First byte should be 0xa0 + length
        const expectedFirstByte = Format.FIXSTR_PREFIX | value.length;
        
        if (bytes.length != value.length + 1 || bytes[0] != expectedFirstByte) {
            console.log(`❌ fixstr encoding test failed for "${value}": expected first byte ${expectedFirstByte}, got ${bytes[0]}`);
            passed = false;
        }
    }
    console.log("✓ fixstr encoding tests passed");

    // Test str8 format (0xd9) for strings up to 255 bytes
    let str8Value = "";
    for (let i = 0; i < 100; i++) {
        str8Value += "ab"; // Build a 200-byte string
    }
    
    const str8 = new MessagePackString(str8Value);
    const str8Bytes = encoder.encode(str8);
    
    if (str8Bytes.length != str8Value.length + 2 || str8Bytes[0] != Format.STR8 || str8Bytes[1] != str8Value.length) {
        console.log(`❌ str8 encoding test failed: expected format byte ${Format.STR8}, got ${str8Bytes[0]}`);
        passed = false;
    }
    console.log("✓ str8 encoding test passed");

    // Test str16 format (0xda) for strings up to 65535 bytes
    let str16Value = "";
    for (let i = 0; i < 300; i++) {
        str16Value += "abcdefghij"; // Build a 3000-byte string
    }
    
    const str16 = new MessagePackString(str16Value);
    const str16Bytes = encoder.encode(str16);
    
    if (str16Bytes[0] != Format.STR16) {
        console.log(`❌ str16 encoding test failed: expected format byte ${Format.STR16}, got ${str16Bytes[0]}`);
        passed = false;
    }
    console.log("✓ str16 encoding test passed");

    // Test Unicode characters
    const unicodeValues: string[] = [
        "こんにちは",           // Japanese "hello"
        "你好",                 // Chinese "hello"
        "Привет",               // Russian "hello"
        "😀😁😂",              // Emoji
        "áéíóúñ",               // Spanish characters
        "αβγδε"                 // Greek characters
    ];
    
    for (let i = 0; i < unicodeValues.length; i++) {
        const value = unicodeValues[i];
        const strValue = new MessagePackString(value);
        const bytes = encoder.encode(strValue);
        
        // Just check that encoding doesn't throw an error
        if (bytes.length <= 1) {
            console.log(`❌ Unicode encoding test failed for "${value}": encoded bytes too short`);
            passed = false;
        }
    }
    console.log("✓ Unicode encoding tests passed");

    console.log("String encoding tests completed ✅");
    return passed;
}

/**
 * Test suite for binary data encoding
 */
export function testBinaryEncoding(): boolean {
    console.log("Testing binary data encoding...");
    let encoder = new MessagePackEncoder();
    let passed = true;

    // Test empty binary data
    const emptyBin = new MessagePackBinary(new Uint8Array(0));
    const emptyBytes = encoder.encode(emptyBin);
    
    if (emptyBytes.length != 2 || emptyBytes[0] != Format.BIN8 || emptyBytes[1] != 0) {
        console.log(`❌ Empty binary encoding test failed: expected [${Format.BIN8}, 0], got [${emptyBytes[0]}, ${emptyBytes[1]}]`);
        passed = false;
    }
    console.log("✓ Empty binary encoding test passed");

    // Test bin8 format (0xc4) for binary data up to 255 bytes
    const bin8Sizes: i32[] = [1, 10, 100, 255];
    
    for (let i = 0; i < bin8Sizes.length; i++) {
        const size = bin8Sizes[i];
        const data = new Uint8Array(size);
        
        // Fill with test pattern
        for (let j = 0; j < size; j++) {
            data[j] = (j % 256) as u8;
        }
        
        const binValue = new MessagePackBinary(data);
        const bytes = encoder.encode(binValue);
        
        if (bytes.length != size + 2 || bytes[0] != Format.BIN8 || bytes[1] != size) {
            console.log(`❌ bin8 encoding test failed for size ${size}: expected format byte ${Format.BIN8}, got ${bytes[0]}`);
            passed = false;
        }
        
        // Verify data was encoded correctly
        let dataCorrect = true;
        for (let j = 0; j < size; j++) {
            if (bytes[j + 2] != data[j]) {
                dataCorrect = false;
                break;
            }
        }
        
        if (!dataCorrect) {
            console.log(`❌ bin8 data verification failed for size ${size}`);
            passed = false;
        }
    }
    console.log("✓ bin8 encoding tests passed");

    // Test bin16 format (0xc5) for binary data up to 65535 bytes
    const bin16Sizes: i32[] = [256, 1000, 10000];
    
    for (let i = 0; i < bin16Sizes.length; i++) {
        const size = bin16Sizes[i];
        const data = new Uint8Array(size);
        
        // Fill with test pattern
        for (let j = 0; j < size; j++) {
            data[j] = (j % 256) as u8;
        }
        
        const binValue = new MessagePackBinary(data);
        const bytes = encoder.encode(binValue);
        
        if (bytes.length != size + 3 || bytes[0] != Format.BIN16) {
            console.log(`❌ bin16 encoding test failed for size ${size}: expected format byte ${Format.BIN16}, got ${bytes[0]}`);
            passed = false;
        }
        
        // Verify length bytes
        const expectedHigh = ((size >> 8) & 0xff) as u8;
        const expectedLow = (size & 0xff) as u8;
        
        if (bytes[1] != expectedHigh || bytes[2] != expectedLow) {
            console.log(`❌ bin16 length encoding failed for size ${size}: expected [${expectedHigh}, ${expectedLow}], got [${bytes[1]}, ${bytes[2]}]`);
            passed = false;
        }
        
        // Verify sample bytes (first, middle, last)
        if (bytes[3] != data[0] || 
            bytes[3 + size/2] != data[size/2] || 
            bytes[3 + size - 1] != data[size - 1]) {
            console.log(`❌ bin16 data verification failed for size ${size}`);
            passed = false;
        }
    }
    console.log("✓ bin16 encoding tests passed");

    // Test bin32 format (0xc6) for binary data over 65535 bytes
    // Note: We'll use a smaller size for testing to avoid memory issues
    const bin32Size: i32 = 70000; // Just over 65535 to trigger bin32 format
    
    if (bin32Size <= 65535) {
        console.log("⚠️ Skipping bin32 test as test size is not large enough");
    } else {
        const data = new Uint8Array(bin32Size);
        
        // Fill with test pattern (just a few values to save memory)
        data[0] = 0x01;
        data[bin32Size / 2] = 0x02;
        data[bin32Size - 1] = 0x03;
        
        const binValue = new MessagePackBinary(data);
        const bytes = encoder.encode(binValue);
        
        if (bytes.length != bin32Size + 5 || bytes[0] != Format.BIN32) {
            console.log(`❌ bin32 encoding test failed: expected format byte ${Format.BIN32}, got ${bytes[0]}`);
            passed = false;
        }
        
        // Verify length bytes (big-endian)
        const expectedByte1 = ((bin32Size >> 24) & 0xff) as u8;
        const expectedByte2 = ((bin32Size >> 16) & 0xff) as u8;
        const expectedByte3 = ((bin32Size >> 8) & 0xff) as u8;
        const expectedByte4 = (bin32Size & 0xff) as u8;
        
        if (bytes[1] != expectedByte1 || bytes[2] != expectedByte2 || 
            bytes[3] != expectedByte3 || bytes[4] != expectedByte4) {
            console.log(`❌ bin32 length encoding failed`);
            passed = false;
        }
        
        // Verify sample bytes
        if (bytes[5] != 0x01 || 
            bytes[5 + bin32Size/2] != 0x02 || 
            bytes[5 + bin32Size - 1] != 0x03) {
            console.log(`❌ bin32 data verification failed`);
            passed = false;
        }
        
        console.log("✓ bin32 encoding test passed");
    }

    console.log("Binary data encoding tests completed ✅");
    return passed;
}

// Import array tests
import { testArrayEncoding } from "./encoder.array.test";
// Import map tests
import { testMapEncoding } from "./encoder.map.test";
// Import integration tests
import { runIntegrationTests } from "./encoder.integration.test";

/**
 * Test suite for convenience methods and direct value encoding
 */
export function testConvenienceMethods(): boolean {
    console.log("Testing convenience methods...");
    let passed = true;

    // Test direct null encoding
    const encoder = new MessagePackEncoder();
    const nullBytes = encoder.encodeNull();
    
    if (nullBytes.length != 1 || nullBytes[0] != Format.NIL) {
        console.log(`❌ Direct null encoding test failed: expected [${Format.NIL}], got [${nullBytes[0]}]`);
        passed = false;
    }
    console.log("✓ Direct null encoding test passed");

    // Test direct boolean encoding
    const trueBytes = encoder.encodeBoolean(true);
    const falseBytes = encoder.encodeBoolean(false);
    
    if (trueBytes.length != 1 || trueBytes[0] != Format.TRUE) {
        console.log(`❌ Direct boolean true encoding test failed: expected [${Format.TRUE}], got [${trueBytes[0]}]`);
        passed = false;
    }
    
    if (falseBytes.length != 1 || falseBytes[0] != Format.FALSE) {
        console.log(`❌ Direct boolean false encoding test failed: expected [${Format.FALSE}], got [${falseBytes[0]}]`);
        passed = false;
    }
    console.log("✓ Direct boolean encoding tests passed");

    // Test direct integer encoding
    const intBytes = encoder.encodeInteger(42);
    
    if (intBytes.length != 1 || intBytes[0] != 42) {
        console.log(`❌ Direct integer encoding test failed: expected [42], got [${intBytes[0]}]`);
        passed = false;
    }
    console.log("✓ Direct integer encoding test passed");

    // Test direct float encoding
    const floatBytes = encoder.encodeFloat(3.14);
    
    if (floatBytes.length != 9 || floatBytes[0] != Format.FLOAT64) {
        console.log(`❌ Direct float encoding test failed: expected format byte ${Format.FLOAT64}, got ${floatBytes[0]}`);
        passed = false;
    }
    console.log("✓ Direct float encoding test passed");

    // Test direct string encoding
    const strBytes = encoder.encodeString("hello");
    
    if (strBytes.length != 6 || strBytes[0] != (Format.FIXSTR_PREFIX | 5)) {
        console.log(`❌ Direct string encoding test failed: expected format byte ${Format.FIXSTR_PREFIX | 5}, got ${strBytes[0]}`);
        passed = false;
    }
    console.log("✓ Direct string encoding test passed");

    // Test direct binary encoding
    const binData = new Uint8Array(3);
    binData[0] = 1;
    binData[1] = 2;
    binData[2] = 3;
    
    const binBytes = encoder.encodeBinary(binData);
    
    if (binBytes.length != 5 || binBytes[0] != Format.BIN8 || binBytes[1] != 3) {
        console.log(`❌ Direct binary encoding test failed: expected format byte ${Format.BIN8}, got ${binBytes[0]}`);
        passed = false;
    }
    console.log("✓ Direct binary encoding test passed");

    // Test static factory methods
    const nullValue = MessagePackEncoder.fromNull();
    if (nullValue.getType() !== MessagePackValueType.NULL) {
        console.log(`❌ fromNull test failed: wrong type`);
        passed = false;
    }
    
    const boolValue = MessagePackEncoder.fromBoolean(true);
    if (boolValue.getType() !== MessagePackValueType.BOOLEAN || 
        boolValue.value !== true) {
        console.log(`❌ fromBoolean test failed: wrong type or value`);
        passed = false;
    }
    
    const intValue = MessagePackEncoder.fromInteger(42);
    if (intValue.getType() !== MessagePackValueType.INTEGER || 
        intValue.value !== 42) {
        console.log(`❌ fromInteger test failed: wrong type or value`);
        passed = false;
    }
    
    const floatValue = MessagePackEncoder.fromFloat(3.14);
    if (floatValue.getType() !== MessagePackValueType.FLOAT || 
        floatValue.value !== 3.14) {
        console.log(`❌ fromFloat test failed: wrong type or value`);
        passed = false;
    }
    
    const strValue = MessagePackEncoder.fromString("hello");
    if (strValue.getType() !== MessagePackValueType.STRING || 
        strValue.value !== "hello") {
        console.log(`❌ fromString test failed: wrong type or value`);
        passed = false;
    }
    
    console.log("✓ Static factory methods tests passed");

    console.log("Convenience methods tests completed ✅");
    return passed;
}

/**
 * Run all encoder tests
 */
export function runAllEncoderTests(): boolean {
    console.log("=== MessagePack Encoder Unit Tests ===\n");

    let allPassed = true;

    allPassed = testBasicTypeEncoding() && allPassed;
    console.log("");
    
    allPassed = testIntegerEncoding() && allPassed;
    console.log("");
    
    allPassed = testFloatEncoding() && allPassed;
    console.log("");
    
    allPassed = testStringEncoding() && allPassed;
    console.log("");
    
    allPassed = testBinaryEncoding() && allPassed;
    console.log("");
    
    allPassed = testArrayEncoding() && allPassed;
    console.log("");
    
    allPassed = testMapEncoding() && allPassed;
    console.log("");
    
    allPassed = testConvenienceMethods() && allPassed;
    console.log("");
    
    // Run integration tests
    allPassed = runIntegrationTests() && allPassed;
    console.log("");

    if (allPassed) {
        console.log("🎉 All encoder tests passed!");
    } else {
        console.log("❌ Some encoder tests failed!");
    }

    return allPassed;
}