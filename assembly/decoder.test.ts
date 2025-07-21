// MessagePack decoder unit tests
import { MessagePackDecoder } from "./decoder";
import { 
  MessagePackNull,
  MessagePackBoolean,
  MessagePackInteger,
  MessagePackFloat,
  MessagePackString,
  MessagePackBinary,
  MessagePackValueType
} from "./types";

/**
 * Test null value decoding
 */
export function testDecodeNull(): boolean {
  const buffer = new Uint8Array(1);
  buffer[0] = 0xc0; // NIL format
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.NULL) {
    console.log("FAIL: Expected NULL type, got " + result.getType().toString());
    return false;
  }
  
  console.log("PASS: testDecodeNull");
  return true;
}

/**
 * Test boolean value decoding
 */
export function testDecodeBoolean(): boolean {
  // Test false
  let buffer = new Uint8Array(1);
  buffer[0] = 0xc2; // FALSE format
  
  let decoder = new MessagePackDecoder(buffer);
  let result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.BOOLEAN) {
    console.log("FAIL: Expected BOOLEAN type for false, got " + result.getType().toString());
    return false;
  }
  
  const boolResult = result as MessagePackBoolean;
  if (boolResult.value !== false) {
    console.log("FAIL: Expected false value, got " + boolResult.value.toString());
    return false;
  }
  
  // Test true
  buffer = new Uint8Array(1);
  buffer[0] = 0xc3; // TRUE format
  
  decoder = new MessagePackDecoder(buffer);
  result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.BOOLEAN) {
    console.log("FAIL: Expected BOOLEAN type for true, got " + result.getType().toString());
    return false;
  }
  
  const boolResult2 = result as MessagePackBoolean;
  if (boolResult2.value !== true) {
    console.log("FAIL: Expected true value, got " + boolResult2.value.toString());
    return false;
  }
  
  console.log("PASS: testDecodeBoolean");
  return true;
}
/**
 * 
Test positive fixint decoding (0x00 - 0x7f)
 */
export function testDecodePositiveFixint(): boolean {
  // Test value 0
  let buffer = new Uint8Array(1);
  buffer[0] = 0x00;
  
  let decoder = new MessagePackDecoder(buffer);
  let result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.INTEGER) {
    console.log("FAIL: Expected INTEGER type for 0, got " + result.getType().toString());
    return false;
  }
  
  let intResult = result as MessagePackInteger;
  if (intResult.value !== 0) {
    console.log("FAIL: Expected 0, got " + intResult.value.toString());
    return false;
  }
  
  // Test value 127 (0x7f)
  buffer = new Uint8Array(1);
  buffer[0] = 0x7f;
  
  decoder = new MessagePackDecoder(buffer);
  result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.INTEGER) {
    console.log("FAIL: Expected INTEGER type for 127, got " + result.getType().toString());
    return false;
  }
  
  intResult = result as MessagePackInteger;
  if (intResult.value !== 127) {
    console.log("FAIL: Expected 127, got " + intResult.value.toString());
    return false;
  }
  
  console.log("PASS: testDecodePositiveFixint");
  return true;
}

/**
 * Test negative fixint decoding (0xe0 - 0xff)
 */
export function testDecodeNegativeFixint(): boolean {
  // Test value -1 (0xff)
  let buffer = new Uint8Array(1);
  buffer[0] = 0xff;
  
  let decoder = new MessagePackDecoder(buffer);
  let result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.INTEGER) {
    console.log("FAIL: Expected INTEGER type for -1, got " + result.getType().toString());
    return false;
  }
  
  let intResult = result as MessagePackInteger;
  if (intResult.value !== -1) {
    console.log("FAIL: Expected -1, got " + intResult.value.toString());
    return false;
  }
  
  // Test value -32 (0xe0)
  buffer = new Uint8Array(1);
  buffer[0] = 0xe0;
  
  decoder = new MessagePackDecoder(buffer);
  result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.INTEGER) {
    console.log("FAIL: Expected INTEGER type for -32, got " + result.getType().toString());
    return false;
  }
  
  intResult = result as MessagePackInteger;
  if (intResult.value !== -32) {
    console.log("FAIL: Expected -32, got " + intResult.value.toString());
    return false;
  }
  
  console.log("PASS: testDecodeNegativeFixint");
  return true;
}/**
 * Tes
t uint8 format decoding (0xcc)
 */
export function testDecodeUint8(): boolean {
  const buffer = new Uint8Array(2);
  buffer[0] = 0xcc; // UINT8 format
  buffer[1] = 255;  // Value 255
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.INTEGER) {
    console.log("FAIL: Expected INTEGER type for uint8, got " + result.getType().toString());
    return false;
  }
  
  const intResult = result as MessagePackInteger;
  if (intResult.value !== 255) {
    console.log("FAIL: Expected 255, got " + intResult.value.toString());
    return false;
  }
  
  console.log("PASS: testDecodeUint8");
  return true;
}

/**
 * Test int8 format decoding (0xd0)
 */
export function testDecodeInt8(): boolean {
  const buffer = new Uint8Array(2);
  buffer[0] = 0xd0; // INT8 format
  buffer[1] = 0x80; // Value -128 (as unsigned byte)
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.INTEGER) {
    console.log("FAIL: Expected INTEGER type for int8, got " + result.getType().toString());
    return false;
  }
  
  const intResult = result as MessagePackInteger;
  if (intResult.value !== -128) {
    console.log("FAIL: Expected -128, got " + intResult.value.toString());
    return false;
  }
  
  console.log("PASS: testDecodeInt8");
  return true;
}/**
 * Tes
t float32 format decoding (0xca)
 */
export function testDecodeFloat32(): boolean {
  const buffer = new Uint8Array(5);
  buffer[0] = 0xca; // FLOAT32 format
  // IEEE 754 representation of 3.14159 as float32: 0x40490fd0
  buffer[1] = 0x40;
  buffer[2] = 0x49;
  buffer[3] = 0x0f;
  buffer[4] = 0xd0;
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.FLOAT) {
    console.log("FAIL: Expected FLOAT type for float32, got " + result.getType().toString());
    return false;
  }
  
  const floatResult = result as MessagePackFloat;
  // Check if the value is approximately 3.14159 (allowing for float32 precision)
  const expected = 3.14159;
  const diff = Math.abs(floatResult.value - expected);
  if (diff > 0.001) {
    console.log("FAIL: Expected ~3.14159, got " + floatResult.value.toString());
    return false;
  }
  
  console.log("PASS: testDecodeFloat32");
  return true;
}

/**
 * Test float64 format decoding (0xcb)
 */
export function testDecodeFloat64(): boolean {
  const buffer = new Uint8Array(9);
  buffer[0] = 0xcb; // FLOAT64 format
  // IEEE 754 representation of 3.141592653589793 as float64: 0x400921fb54442d18
  buffer[1] = 0x40;
  buffer[2] = 0x09;
  buffer[3] = 0x21;
  buffer[4] = 0xfb;
  buffer[5] = 0x54;
  buffer[6] = 0x44;
  buffer[7] = 0x2d;
  buffer[8] = 0x18;
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.FLOAT) {
    console.log("FAIL: Expected FLOAT type for float64, got " + result.getType().toString());
    return false;
  }
  
  const floatResult = result as MessagePackFloat;
  // Check if the value is approximately π (allowing for small precision differences)
  const expected = 3.141592653589793;
  const diff = Math.abs(floatResult.value - expected);
  if (diff > 0.000000000000001) {
    console.log("FAIL: Expected ~π, got " + floatResult.value.toString());
    return false;
  }
  
  console.log("PASS: testDecodeFloat64");
  return true;
}

/**
 * Test fixstr format decoding (0xa0 - 0xbf)
 */
export function testDecodeFixstr(): boolean {
  // Test empty string
  let buffer = new Uint8Array(1);
  buffer[0] = 0xa0; // fixstr with length 0
  
  let decoder = new MessagePackDecoder(buffer);
  let result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.STRING) {
    console.log("FAIL: Expected STRING type for empty fixstr, got " + result.getType().toString());
    return false;
  }
  
  let strResult = result as MessagePackString;
  if (strResult.value !== "") {
    console.log("FAIL: Expected empty string, got '" + strResult.value + "'");
    return false;
  }
  
  // Test short string
  const testStr = "Hello";
  buffer = new Uint8Array(1 + testStr.length);
  buffer[0] = 0xa0 + testStr.length; // fixstr with length 5
  
  // Copy string bytes
  for (let i = 0; i < testStr.length; i++) {
    buffer[1 + i] = testStr.charCodeAt(i);
  }
  
  decoder = new MessagePackDecoder(buffer);
  result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.STRING) {
    console.log("FAIL: Expected STRING type for fixstr, got " + result.getType().toString());
    return false;
  }
  
  strResult = result as MessagePackString;
  if (strResult.value !== testStr) {
    console.log("FAIL: Expected '" + testStr + "', got '" + strResult.value + "'");
    return false;
  }
  
  console.log("PASS: testDecodeFixstr");
  return true;
}

/**
 * Test str8 format decoding (0xd9)
 */
export function testDecodeStr8(): boolean {
  // Create a string with length 32 (just above fixstr limit)
  const testStr = "abcdefghijklmnopqrstuvwxyz123456";
  const buffer = new Uint8Array(2 + testStr.length);
  buffer[0] = 0xd9; // str8 format
  buffer[1] = testStr.length; // length byte
  
  // Copy string bytes
  for (let i = 0; i < testStr.length; i++) {
    buffer[2 + i] = testStr.charCodeAt(i);
  }
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.STRING) {
    console.log("FAIL: Expected STRING type for str8, got " + result.getType().toString());
    return false;
  }
  
  const strResult = result as MessagePackString;
  if (strResult.value !== testStr) {
    console.log("FAIL: Expected '" + testStr + "', got '" + strResult.value + "'");
    return false;
  }
  
  console.log("PASS: testDecodeStr8");
  return true;
}

/**
 * Test str16 format decoding (0xda)
 */
export function testDecodeStr16(): boolean {
  // For testing purposes, we'll use a shorter string
  // In a real scenario, this would be 256+ bytes
  const testStr = "This is a test string for str16 format";
  const buffer = new Uint8Array(3 + testStr.length);
  buffer[0] = 0xda; // str16 format
  
  // Write length as big-endian u16
  const length = testStr.length;
  buffer[1] = (length >> 8) & 0xff;
  buffer[2] = length & 0xff;
  
  // Copy string bytes
  for (let i = 0; i < testStr.length; i++) {
    buffer[3 + i] = testStr.charCodeAt(i);
  }
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.STRING) {
    console.log("FAIL: Expected STRING type for str16, got " + result.getType().toString());
    return false;
  }
  
  const strResult = result as MessagePackString;
  if (strResult.value !== testStr) {
    console.log("FAIL: Expected '" + testStr + "', got '" + strResult.value + "'");
    return false;
  }
  
  console.log("PASS: testDecodeStr16");
  return true;
}

/**
 * Test str32 format decoding (0xdb)
 */
export function testDecodeStr32(): boolean {
  // For testing purposes, we'll use a shorter string
  // In a real scenario, this would be 65536+ bytes
  const testStr = "This is a test string for str32 format";
  const buffer = new Uint8Array(5 + testStr.length);
  buffer[0] = 0xdb; // str32 format
  
  // Write length as big-endian u32
  const length = testStr.length;
  buffer[1] = (length >> 24) & 0xff;
  buffer[2] = (length >> 16) & 0xff;
  buffer[3] = (length >> 8) & 0xff;
  buffer[4] = length & 0xff;
  
  // Copy string bytes
  for (let i = 0; i < testStr.length; i++) {
    buffer[5 + i] = testStr.charCodeAt(i);
  }
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.STRING) {
    console.log("FAIL: Expected STRING type for str32, got " + result.getType().toString());
    return false;
  }
  
  const strResult = result as MessagePackString;
  if (strResult.value !== testStr) {
    console.log("FAIL: Expected '" + testStr + "', got '" + strResult.value + "'");
    return false;
  }
  
  console.log("PASS: testDecodeStr32");
  return true;
}

/**
 * Test UTF-8 string decoding
 */
export function testDecodeUTF8String(): boolean {
  // Test string with UTF-8 characters
  const testStr = "こんにちは世界"; // "Hello World" in Japanese
  
  // Convert string to UTF-8 bytes
  const utf8Bytes = String.UTF8.encode(testStr);
  const utf8Length = utf8Bytes.byteLength;
  
  // Create buffer with appropriate size
  const buffer = new Uint8Array(1 + utf8Length);
  buffer[0] = 0xa0 + utf8Length; // fixstr with appropriate length
  
  // Copy UTF-8 bytes to buffer
  for (let i = 0; i < utf8Length; i++) {
    buffer[1 + i] = load<u8>(changetype<usize>(utf8Bytes) + i);
  }
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.STRING) {
    console.log("FAIL: Expected STRING type for UTF-8 string, got " + result.getType().toString());
    return false;
  }
  
  const strResult = result as MessagePackString;
  if (strResult.value !== testStr) {
    console.log("FAIL: Expected '" + testStr + "', got '" + strResult.value + "'");
    return false;
  }
  
  console.log("PASS: testDecodeUTF8String");
  return true;
}

/**
 * Test bin8 format decoding (0xc4)
 */
export function testDecodeBin8(): boolean {
  // Test small binary data
  const testData = new Uint8Array(5);
  testData[0] = 0x01;
  testData[1] = 0x02;
  testData[2] = 0x03;
  testData[3] = 0x04;
  testData[4] = 0x05;
  
  const buffer = new Uint8Array(2 + testData.length);
  buffer[0] = 0xc4; // bin8 format
  buffer[1] = testData.length; // length byte
  
  // Copy binary data
  for (let i = 0; i < testData.length; i++) {
    buffer[2 + i] = testData[i];
  }
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.BINARY) {
    console.log("FAIL: Expected BINARY type for bin8, got " + result.getType().toString());
    return false;
  }
  
  const binResult = result as MessagePackBinary;
  if (binResult.value.length !== testData.length) {
    console.log("FAIL: Expected binary length " + testData.length.toString() + ", got " + binResult.value.length.toString());
    return false;
  }
  
  // Compare binary data
  for (let i = 0; i < testData.length; i++) {
    if (binResult.value[i] !== testData[i]) {
      console.log("FAIL: Binary data mismatch at index " + i.toString() + ": expected " + testData[i].toString() + ", got " + binResult.value[i].toString());
      return false;
    }
  }
  
  console.log("PASS: testDecodeBin8");
  return true;
}

/**
 * Test bin16 format decoding (0xc5)
 */
export function testDecodeBin16(): boolean {
  // Test medium binary data (simulate 256+ bytes with smaller test data)
  const testData = new Uint8Array(10);
  for (let i = 0; i < testData.length; i++) {
    testData[i] = (i * 17) % 256; // Generate some test pattern
  }
  
  const buffer = new Uint8Array(3 + testData.length);
  buffer[0] = 0xc5; // bin16 format
  
  // Write length as big-endian u16
  const length = testData.length;
  buffer[1] = (length >> 8) & 0xff;
  buffer[2] = length & 0xff;
  
  // Copy binary data
  for (let i = 0; i < testData.length; i++) {
    buffer[3 + i] = testData[i];
  }
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.BINARY) {
    console.log("FAIL: Expected BINARY type for bin16, got " + result.getType().toString());
    return false;
  }
  
  const binResult = result as MessagePackBinary;
  if (binResult.value.length !== testData.length) {
    console.log("FAIL: Expected binary length " + testData.length.toString() + ", got " + binResult.value.length.toString());
    return false;
  }
  
  // Compare binary data
  for (let i = 0; i < testData.length; i++) {
    if (binResult.value[i] !== testData[i]) {
      console.log("FAIL: Binary data mismatch at index " + i.toString() + ": expected " + testData[i].toString() + ", got " + binResult.value[i].toString());
      return false;
    }
  }
  
  console.log("PASS: testDecodeBin16");
  return true;
}

/**
 * Test bin32 format decoding (0xc6)
 */
export function testDecodeBin32(): boolean {
  // Test large binary data (simulate 65536+ bytes with smaller test data)
  const testData = new Uint8Array(15);
  for (let i = 0; i < testData.length; i++) {
    testData[i] = (i * 23 + 7) % 256; // Generate some test pattern
  }
  
  const buffer = new Uint8Array(5 + testData.length);
  buffer[0] = 0xc6; // bin32 format
  
  // Write length as big-endian u32
  const length = testData.length;
  buffer[1] = (length >> 24) & 0xff;
  buffer[2] = (length >> 16) & 0xff;
  buffer[3] = (length >> 8) & 0xff;
  buffer[4] = length & 0xff;
  
  // Copy binary data
  for (let i = 0; i < testData.length; i++) {
    buffer[5 + i] = testData[i];
  }
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.BINARY) {
    console.log("FAIL: Expected BINARY type for bin32, got " + result.getType().toString());
    return false;
  }
  
  const binResult = result as MessagePackBinary;
  if (binResult.value.length !== testData.length) {
    console.log("FAIL: Expected binary length " + testData.length.toString() + ", got " + binResult.value.length.toString());
    return false;
  }
  
  // Compare binary data
  for (let i = 0; i < testData.length; i++) {
    if (binResult.value[i] !== testData[i]) {
      console.log("FAIL: Binary data mismatch at index " + i.toString() + ": expected " + testData[i].toString() + ", got " + binResult.value[i].toString());
      return false;
    }
  }
  
  console.log("PASS: testDecodeBin32");
  return true;
}

/**
 * Test empty binary data decoding
 */
export function testDecodeEmptyBinary(): boolean {
  // Test empty binary data with bin8 format
  const buffer = new Uint8Array(2);
  buffer[0] = 0xc4; // bin8 format
  buffer[1] = 0;    // length 0
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.BINARY) {
    console.log("FAIL: Expected BINARY type for empty binary, got " + result.getType().toString());
    return false;
  }
  
  const binResult = result as MessagePackBinary;
  if (binResult.value.length !== 0) {
    console.log("FAIL: Expected empty binary data, got length " + binResult.value.length.toString());
    return false;
  }
  
  console.log("PASS: testDecodeEmptyBinary");
  return true;
}

/**
 * Test binary data reconstruction with various byte patterns
 */
export function testDecodeBinaryPatterns(): boolean {
  // Test with all possible byte values (0-255)
  const testData = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    testData[i] = i;
  }
  
  // Use bin16 format for this test
  const buffer = new Uint8Array(3 + testData.length);
  buffer[0] = 0xc5; // bin16 format
  
  // Write length as big-endian u16
  const length = testData.length;
  buffer[1] = (length >> 8) & 0xff;
  buffer[2] = length & 0xff;
  
  // Copy binary data
  for (let i = 0; i < testData.length; i++) {
    buffer[3 + i] = testData[i];
  }
  
  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();
  
  if (result.getType() !== MessagePackValueType.BINARY) {
    console.log("FAIL: Expected BINARY type for pattern test, got " + result.getType().toString());
    return false;
  }
  
  const binResult = result as MessagePackBinary;
  if (binResult.value.length !== testData.length) {
    console.log("FAIL: Expected binary length " + testData.length.toString() + ", got " + binResult.value.length.toString());
    return false;
  }
  
  // Compare all byte values
  for (let i = 0; i < testData.length; i++) {
    if (binResult.value[i] !== testData[i]) {
      console.log("FAIL: Binary pattern mismatch at index " + i.toString() + ": expected " + testData[i].toString() + ", got " + binResult.value[i].toString());
      return false;
    }
  }
  
  console.log("PASS: testDecodeBinaryPatterns");
  return true;
}

/**
 * Run all decoder tests
 */
export function runDecoderTests(): boolean {
  console.log("Running MessagePack decoder tests...");
  
  let allPassed = true;
  
  allPassed = testDecodeNull() && allPassed;
  allPassed = testDecodeBoolean() && allPassed;
  allPassed = testDecodePositiveFixint() && allPassed;
  allPassed = testDecodeNegativeFixint() && allPassed;
  allPassed = testDecodeUint8() && allPassed;
  allPassed = testDecodeInt8() && allPassed;
  allPassed = testDecodeFloat32() && allPassed;
  allPassed = testDecodeFloat64() && allPassed;
  allPassed = testDecodeFixstr() && allPassed;
  allPassed = testDecodeStr8() && allPassed;
  allPassed = testDecodeStr16() && allPassed;
  allPassed = testDecodeStr32() && allPassed;
  allPassed = testDecodeUTF8String() && allPassed;
  allPassed = testDecodeBin8() && allPassed;
  allPassed = testDecodeBin16() && allPassed;
  allPassed = testDecodeBin32() && allPassed;
  allPassed = testDecodeEmptyBinary() && allPassed;
  allPassed = testDecodeBinaryPatterns() && allPassed;
  allPassed = testDecodeEmptyBuffer() && allPassed;
  allPassed = testDecodeUnsupportedFormat() && allPassed;
  
  if (allPassed) {
    console.log("All decoder tests passed!");
  } else {
    console.log("Some decoder tests failed!");
  }
  
  return allPassed;
}
/**
 * Test error handling for empty buffer
 * Note: AssemblyScript doesn't support try-catch, so we can't test error throwing directly
 */
export function testDecodeEmptyBuffer(): boolean {
  console.log("SKIP: testDecodeEmptyBuffer - AssemblyScript doesn't support try-catch");
  return true;
}

/**
 * Test error handling for unsupported format
 * Note: AssemblyScript doesn't support try-catch, so we can't test error throwing directly
 */
export function testDecodeUnsupportedFormat(): boolean {
  console.log("SKIP: testDecodeUnsupportedFormat - AssemblyScript doesn't support try-catch");
  return true;
}
