// MessagePack decoder integration tests
import { MessagePackEncoder, MessagePackDecoder } from "./index";
import { 
  MessagePackNull,
  MessagePackBoolean,
  MessagePackInteger,
  MessagePackFloat,
  MessagePackBinary,
  MessagePackValueType
} from "./types";

/**
 * Test round-trip encoding and decoding for null values
 */
export function testRoundTripNull(): boolean {
  const encoder = new MessagePackEncoder();
  const originalValue = new MessagePackNull();
  
  // Encode
  const encoded = encoder.encode(originalValue);
  
  // Decode
  const decoder = new MessagePackDecoder(encoded);
  const decoded = decoder.decode();
  
  // Verify
  if (decoded.getType() !== MessagePackValueType.NULL) {
    console.log("FAIL: Round-trip null - wrong type");
    return false;
  }
  
  console.log("PASS: testRoundTripNull");
  return true;
}

/**
 * Test round-trip encoding and decoding for boolean values
 */
export function testRoundTripBoolean(): boolean {
  const encoder = new MessagePackEncoder();
  
  // Test true
  let originalValue = new MessagePackBoolean(true);
  let encoded = encoder.encode(originalValue);
  let decoder = new MessagePackDecoder(encoded);
  let decoded = decoder.decode();
  
  if (decoded.getType() !== MessagePackValueType.BOOLEAN) {
    console.log("FAIL: Round-trip boolean true - wrong type");
    return false;
  }
  
  let boolDecoded = decoded as MessagePackBoolean;
  if (boolDecoded.value !== true) {
    console.log("FAIL: Round-trip boolean true - wrong value");
    return false;
  }
  
  // Test false
  originalValue = new MessagePackBoolean(false);
  encoded = encoder.encode(originalValue);
  decoder = new MessagePackDecoder(encoded);
  decoded = decoder.decode();
  
  if (decoded.getType() !== MessagePackValueType.BOOLEAN) {
    console.log("FAIL: Round-trip boolean false - wrong type");
    return false;
  }
  
  boolDecoded = decoded as MessagePackBoolean;
  if (boolDecoded.value !== false) {
    console.log("FAIL: Round-trip boolean false - wrong value");
    return false;
  }
  
  console.log("PASS: testRoundTripBoolean");
  return true;
}

/**
 * Test round-trip encoding and decoding for integer values
 */
export function testRoundTripInteger(): boolean {
  const encoder = new MessagePackEncoder();
  const testValues: i64[] = [0, 1, 127, -1, -32, 255, -128, 65535, -32768, 4294967295, -2147483648];
  
  for (let i = 0; i < testValues.length; i++) {
    const value = testValues[i];
    const originalValue = new MessagePackInteger(value);
    
    // Encode
    const encoded = encoder.encode(originalValue);
    
    // Decode
    const decoder = new MessagePackDecoder(encoded);
    const decoded = decoder.decode();
    
    // Verify
    if (decoded.getType() !== MessagePackValueType.INTEGER) {
      console.log("FAIL: Round-trip integer " + value.toString() + " - wrong type");
      return false;
    }
    
    const intDecoded = decoded as MessagePackInteger;
    if (intDecoded.value !== value) {
      console.log("FAIL: Round-trip integer " + value.toString() + " - expected " + value.toString() + ", got " + intDecoded.value.toString());
      return false;
    }
  }
  
  console.log("PASS: testRoundTripInteger");
  return true;
}

/**
 * Test round-trip encoding and decoding for float values
 */
export function testRoundTripFloat(): boolean {
  const encoder = new MessagePackEncoder();
  const testValues: f64[] = [0.0, 1.0, -1.0, 3.14159, -2.71828];
  
  for (let i = 0; i < testValues.length; i++) {
    const value = testValues[i];
    const originalValue = new MessagePackFloat(value);
    
    // Encode
    const encoded = encoder.encode(originalValue);
    
    // Decode
    const decoder = new MessagePackDecoder(encoded);
    const decoded = decoder.decode();
    
    // Verify
    if (decoded.getType() !== MessagePackValueType.FLOAT) {
      console.log("FAIL: Round-trip float " + value.toString() + " - wrong type");
      return false;
    }
    
    const floatDecoded = decoded as MessagePackFloat;
    // Allow for small floating point precision differences
    const diff = Math.abs(floatDecoded.value - value);
    if (diff > 0.001) {
      console.log("FAIL: Round-trip float " + value.toString() + " - expected " + value.toString() + ", got " + floatDecoded.value.toString());
      return false;
    }
  }
  
  console.log("PASS: testRoundTripFloat");
  return true;
}

/**
 * Test round-trip encoding and decoding for binary values
 */
export function testRoundTripBinary(): boolean {
  const encoder = new MessagePackEncoder();
  
  // Test empty binary data
  let originalData = new Uint8Array(0);
  let originalValue = new MessagePackBinary(originalData);
  let encoded = encoder.encode(originalValue);
  let decoder = new MessagePackDecoder(encoded);
  let decoded = decoder.decode();
  
  if (decoded.getType() !== MessagePackValueType.BINARY) {
    console.log("FAIL: Round-trip empty binary - wrong type");
    return false;
  }
  
  let binaryDecoded = decoded as MessagePackBinary;
  if (binaryDecoded.value.length !== 0) {
    console.log("FAIL: Round-trip empty binary - expected length 0, got " + binaryDecoded.value.length.toString());
    return false;
  }
  
  // Test small binary data (bin8 format)
  originalData = new Uint8Array(10);
  for (let i = 0; i < originalData.length; i++) {
    originalData[i] = (i * 17) % 256;
  }
  
  originalValue = new MessagePackBinary(originalData);
  encoded = encoder.encode(originalValue);
  decoder = new MessagePackDecoder(encoded);
  decoded = decoder.decode();
  
  if (decoded.getType() !== MessagePackValueType.BINARY) {
    console.log("FAIL: Round-trip small binary - wrong type");
    return false;
  }
  
  binaryDecoded = decoded as MessagePackBinary;
  if (binaryDecoded.value.length !== originalData.length) {
    console.log("FAIL: Round-trip small binary - length mismatch");
    return false;
  }
  
  for (let i = 0; i < originalData.length; i++) {
    if (binaryDecoded.value[i] !== originalData[i]) {
      console.log("FAIL: Round-trip small binary - data mismatch at index " + i.toString());
      return false;
    }
  }
  
  // Test medium binary data (bin16 format)
  originalData = new Uint8Array(300);
  for (let i = 0; i < originalData.length; i++) {
    originalData[i] = (i * 23 + 7) % 256;
  }
  
  originalValue = new MessagePackBinary(originalData);
  encoded = encoder.encode(originalValue);
  decoder = new MessagePackDecoder(encoded);
  decoded = decoder.decode();
  
  if (decoded.getType() !== MessagePackValueType.BINARY) {
    console.log("FAIL: Round-trip medium binary - wrong type");
    return false;
  }
  
  binaryDecoded = decoded as MessagePackBinary;
  if (binaryDecoded.value.length !== originalData.length) {
    console.log("FAIL: Round-trip medium binary - length mismatch");
    return false;
  }
  
  for (let i = 0; i < originalData.length; i++) {
    if (binaryDecoded.value[i] !== originalData[i]) {
      console.log("FAIL: Round-trip medium binary - data mismatch at index " + i.toString());
      return false;
    }
  }
  
  // Test binary data with all byte values (0-255)
  originalData = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    originalData[i] = i;
  }
  
  originalValue = new MessagePackBinary(originalData);
  encoded = encoder.encode(originalValue);
  decoder = new MessagePackDecoder(encoded);
  decoded = decoder.decode();
  
  if (decoded.getType() !== MessagePackValueType.BINARY) {
    console.log("FAIL: Round-trip full byte range binary - wrong type");
    return false;
  }
  
  binaryDecoded = decoded as MessagePackBinary;
  if (binaryDecoded.value.length !== originalData.length) {
    console.log("FAIL: Round-trip full byte range binary - length mismatch");
    return false;
  }
  
  for (let i = 0; i < originalData.length; i++) {
    if (binaryDecoded.value[i] !== originalData[i]) {
      console.log("FAIL: Round-trip full byte range binary - data mismatch at index " + i.toString());
      return false;
    }
  }
  
  console.log("PASS: testRoundTripBinary");
  return true;
}

/**
 * Run all decoder integration tests
 */
export function runDecoderIntegrationTests(): boolean {
  console.log("=== MessagePack Decoder Integration Tests ===");
  console.log("Testing round-trip encoding/decoding...");
  
  let allPassed = true;
  
  allPassed = testRoundTripNull() && allPassed;
  allPassed = testRoundTripBoolean() && allPassed;
  allPassed = testRoundTripInteger() && allPassed;
  allPassed = testRoundTripFloat() && allPassed;
  allPassed = testRoundTripBinary() && allPassed;
  
  if (allPassed) {
    console.log("Round-trip tests completed ✅");
    console.log("\n🎉 All decoder integration tests passed!");
  } else {
    console.log("❌ Some decoder integration tests failed!");
  }
  
  return allPassed;
}