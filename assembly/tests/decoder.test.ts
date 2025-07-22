// MessagePack decoder unit tests
import { MessagePackDecoder } from "../decoder";
import {
  MessagePackNull,
  MessagePackBoolean,
  MessagePackInteger,
  MessagePackFloat,
  MessagePackString,
  MessagePackBinary,
  MessagePackArray,
  MessagePackMap,
  MessagePackValueType
} from "../types";

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
  console.log(strResult.value.length.toString())
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
  allPassed = testDecodeFixarray() && allPassed;
  allPassed = testDecodeArray16() && allPassed;
  allPassed = testDecodeArray32() && allPassed;
  allPassed = testDecodeNestedArrays() && allPassed;
  allPassed = testDecodeFixmap() && allPassed;
  allPassed = testDecodeMap16() && allPassed;
  allPassed = testDecodeMap32() && allPassed;
  allPassed = testDecodeNestedMaps() && allPassed;
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
/**
 * Test fixarray format decoding (0x90 - 0x9f)
 */
export function testDecodeFixarray(): boolean {
  // Test empty array
  let buffer = new Uint8Array(1);
  buffer[0] = 0x90; // fixarray with length 0

  let decoder = new MessagePackDecoder(buffer);
  let result = decoder.decode();

  if (result.getType() !== MessagePackValueType.ARRAY) {
    console.log("FAIL: Expected ARRAY type for empty fixarray, got " + result.getType().toString());
    return false;
  }

  let arrayResult = result as MessagePackArray;
  if (arrayResult.value.length !== 0) {
    console.log("FAIL: Expected empty array, got length " + arrayResult.value.length.toString());
    return false;
  }

  // Test small array with mixed types
  buffer = new Uint8Array(6);
  buffer[0] = 0x93; // fixarray with length 3
  buffer[1] = 0xc0; // nil
  buffer[2] = 0xc3; // true
  buffer[3] = 0x01; // positive fixint 1

  decoder = new MessagePackDecoder(buffer);
  result = decoder.decode();

  if (result.getType() !== MessagePackValueType.ARRAY) {
    console.log("FAIL: Expected ARRAY type for fixarray, got " + result.getType().toString());
    return false;
  }

  arrayResult = result as MessagePackArray;
  if (arrayResult.value.length !== 3) {
    console.log("FAIL: Expected array length 3, got " + arrayResult.value.length.toString());
    return false;
  }

  // Check array elements
  if (arrayResult.value[0].getType() !== MessagePackValueType.NULL) {
    console.log("FAIL: Expected NULL type for first element, got " + arrayResult.value[0].getType().toString());
    return false;
  }

  if (arrayResult.value[1].getType() !== MessagePackValueType.BOOLEAN) {
    console.log("FAIL: Expected BOOLEAN type for second element, got " + arrayResult.value[1].getType().toString());
    return false;
  }

  const boolElement = arrayResult.value[1] as MessagePackBoolean;
  if (boolElement.value !== true) {
    console.log("FAIL: Expected true for second element, got " + boolElement.value.toString());
    return false;
  }

  if (arrayResult.value[2].getType() !== MessagePackValueType.INTEGER) {
    console.log("FAIL: Expected INTEGER type for third element, got " + arrayResult.value[2].getType().toString());
    return false;
  }

  const intElement = arrayResult.value[2] as MessagePackInteger;
  if (intElement.value !== 1) {
    console.log("FAIL: Expected 1 for third element, got " + intElement.value.toString());
    return false;
  }

  console.log("PASS: testDecodeFixarray");
  return true;
}

/**
 * Test array16 format decoding (0xdc)
 */
export function testDecodeArray16(): boolean {
  // For testing purposes, we'll use a smaller array
  // In a real scenario, this would be 16+ elements
  const arraySize = 5;
  const buffer = new Uint8Array(3 + arraySize);
  buffer[0] = 0xdc; // array16 format

  // Write length as big-endian u16
  buffer[1] = 0x00;
  buffer[2] = arraySize;

  // Fill array with integers 0-4
  for (let i = 0; i < arraySize; i++) {
    buffer[3 + i] = i;
  }

  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();

  if (result.getType() !== MessagePackValueType.ARRAY) {
    console.log("FAIL: Expected ARRAY type for array16, got " + result.getType().toString());
    return false;
  }

  const arrayResult = result as MessagePackArray;
  if (arrayResult.value.length !== arraySize) {
    console.log("FAIL: Expected array length " + arraySize.toString() + ", got " + arrayResult.value.length.toString());
    return false;
  }

  // Check array elements
  for (let i = 0; i < arraySize; i++) {
    if (arrayResult.value[i].getType() !== MessagePackValueType.INTEGER) {
      console.log("FAIL: Expected INTEGER type for element " + i.toString() + ", got " + arrayResult.value[i].getType().toString());
      return false;
    }

    const intElement = arrayResult.value[i] as MessagePackInteger;
    if (intElement.value !== i) {
      console.log("FAIL: Expected " + i.toString() + " for element " + i.toString() + ", got " + intElement.value.toString());
      return false;
    }
  }

  console.log("PASS: testDecodeArray16");
  return true;
}

/**
 * Test array32 format decoding (0xdd)
 */
export function testDecodeArray32(): boolean {
  // For testing purposes, we'll use a smaller array
  // In a real scenario, this would be 65536+ elements
  const arraySize = 7;
  const buffer = new Uint8Array(5 + arraySize);
  buffer[0] = 0xdd; // array32 format

  // Write length as big-endian u32
  buffer[1] = 0x00;
  buffer[2] = 0x00;
  buffer[3] = 0x00;
  buffer[4] = arraySize;

  // Fill array with integers 0-6
  for (let i = 0; i < arraySize; i++) {
    buffer[5 + i] = i;
  }

  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();

  if (result.getType() !== MessagePackValueType.ARRAY) {
    console.log("FAIL: Expected ARRAY type for array32, got " + result.getType().toString());
    return false;
  }

  const arrayResult = result as MessagePackArray;
  if (arrayResult.value.length !== arraySize) {
    console.log("FAIL: Expected array length " + arraySize.toString() + ", got " + arrayResult.value.length.toString());
    return false;
  }

  // Check array elements
  for (let i = 0; i < arraySize; i++) {
    if (arrayResult.value[i].getType() !== MessagePackValueType.INTEGER) {
      console.log("FAIL: Expected INTEGER type for element " + i.toString() + ", got " + arrayResult.value[i].getType().toString());
      return false;
    }

    const intElement = arrayResult.value[i] as MessagePackInteger;
    if (intElement.value !== i) {
      console.log("FAIL: Expected " + i.toString() + " for element " + i.toString() + ", got " + intElement.value.toString());
      return false;
    }
  }

  console.log("PASS: testDecodeArray32");
  return true;
}

/**
 * Test nested array decoding
 */
export function testDecodeNestedArrays(): boolean {
  // Create a buffer for an array containing another array
  // [1, [2, 3]]
  const buffer = new Uint8Array(5);
  buffer[0] = 0x92;       // fixarray with length 2
  buffer[1] = 0x01;       // positive fixint 1
  buffer[2] = 0x92;       // fixarray with length 2
  buffer[3] = 0x02;       // positive fixint 2
  buffer[4] = 0x03;       // positive fixint 3

  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();

  if (result.getType() !== MessagePackValueType.ARRAY) {
    console.log("FAIL: Expected ARRAY type for outer array, got " + result.getType().toString());
    return false;
  }

  const outerArray = result as MessagePackArray;
  if (outerArray.value.length !== 2) {
    console.log("FAIL: Expected outer array length 2, got " + outerArray.value.length.toString());
    return false;
  }

  // Check first element (integer 1)
  if (outerArray.value[0].getType() !== MessagePackValueType.INTEGER) {
    console.log("FAIL: Expected INTEGER type for first element, got " + outerArray.value[0].getType().toString());
    return false;
  }

  const firstElement = outerArray.value[0] as MessagePackInteger;
  if (firstElement.value !== 1) {
    console.log("FAIL: Expected 1 for first element, got " + firstElement.value.toString());
    return false;
  }

  // Check second element (inner array)
  if (outerArray.value[1].getType() !== MessagePackValueType.ARRAY) {
    console.log("FAIL: Expected ARRAY type for second element, got " + outerArray.value[1].getType().toString());
    return false;
  }

  const innerArray = outerArray.value[1] as MessagePackArray;
  if (innerArray.value.length !== 2) {
    console.log("FAIL: Expected inner array length 2, got " + innerArray.value.length.toString());
    return false;
  }

  // Check inner array elements
  const innerFirst = innerArray.value[0] as MessagePackInteger;
  if (innerFirst.value !== 2) {
    console.log("FAIL: Expected 2 for inner array first element, got " + innerFirst.value.toString());
    return false;
  }

  const innerSecond = innerArray.value[1] as MessagePackInteger;
  if (innerSecond.value !== 3) {
    console.log("FAIL: Expected 3 for inner array second element, got " + innerSecond.value.toString());
    return false;
  }

  console.log("PASS: testDecodeNestedArrays");
  return true;
}/**

 * Test fixmap format decoding (0x80 - 0x8f)
 */
export function testDecodeFixmap(): boolean {
  // Test empty map
  let buffer = new Uint8Array(1);
  buffer[0] = 0x80; // fixmap with size 0

  let decoder = new MessagePackDecoder(buffer);
  let result = decoder.decode();

  if (result.getType() !== MessagePackValueType.MAP) {
    console.log("FAIL: Expected MAP type for empty fixmap, got " + result.getType().toString());
    return false;
  }

  let mapResult = result as MessagePackMap;
  if (mapResult.value.size !== 0) {
    console.log("FAIL: Expected empty map, got size " + mapResult.value.size.toString());
    return false;
  }

  // Test small map with string keys and mixed values
  // {"a": 1, "b": true}
  buffer = new Uint8Array(7);
  buffer[0] = 0x82;       // fixmap with size 2
  buffer[1] = 0xa1;       // fixstr with length 1
  buffer[2] = 0x61;       // "a"
  buffer[3] = 0x01;       // positive fixint 1
  buffer[4] = 0xa1;       // fixstr with length 1
  buffer[5] = 0x62;       // "b"
  buffer[6] = 0xc3;       // true

  decoder = new MessagePackDecoder(buffer);
  result = decoder.decode();

  if (result.getType() !== MessagePackValueType.MAP) {
    console.log("FAIL: Expected MAP type for fixmap, got " + result.getType().toString());
    return false;
  }

  mapResult = result as MessagePackMap;
  if (mapResult.value.size !== 2) {
    console.log("FAIL: Expected map size 2, got " + mapResult.value.size.toString());
    return false;
  }

  // Check map entries
  const value1 = mapResult.value.get("a");
  if (!value1 || value1.getType() !== MessagePackValueType.INTEGER) {
    console.log("FAIL: Expected INTEGER type for key 'a'");
    return false;
  }

  const intValue = value1 as MessagePackInteger;
  if (intValue.value !== 1) {
    console.log("FAIL: Expected 1 for key 'a', got " + intValue.value.toString());
    return false;
  }

  const value2 = mapResult.value.get("b");
  if (!value2 || value2.getType() !== MessagePackValueType.BOOLEAN) {
    console.log("FAIL: Expected BOOLEAN type for key 'b'");
    return false;
  }

  const boolValue = value2 as MessagePackBoolean;
  if (boolValue.value !== true) {
    console.log("FAIL: Expected true for key 'b', got " + boolValue.value.toString());
    return false;
  }

  console.log("PASS: testDecodeFixmap");
  return true;
}/**
 *
 Test map16 format decoding (0xde)
 */
export function testDecodeMap16(): boolean {
  // For testing purposes, we'll use a smaller map
  // In a real scenario, this would be 16+ key-value pairs

  // Create a buffer for a map with 3 entries
  // {"key1": 1, "key2": 2, "key3": 3}
  const buffer = new Uint8Array(21);
  buffer[0] = 0xde;       // map16 format
  buffer[1] = 0x00;       // high byte of size (0)
  buffer[2] = 0x03;       // low byte of size (3)

  // Key 1: "key1"
  buffer[3] = 0xa4;       // fixstr with length 4
  buffer[4] = 0x6b;       // "k"
  buffer[5] = 0x65;       // "e"
  buffer[6] = 0x79;       // "y"
  buffer[7] = 0x31;       // "1"
  buffer[8] = 0x01;       // value: positive fixint 1

  // Key 2: "key2"
  buffer[9] = 0xa4;       // fixstr with length 4
  buffer[10] = 0x6b;      // "k"
  buffer[11] = 0x65;      // "e"
  buffer[12] = 0x79;      // "y"
  buffer[13] = 0x32;      // "2"
  buffer[14] = 0x02;      // value: positive fixint 2

  // Key 3: "key3"
  buffer[15] = 0xa4;      // fixstr with length 4
  buffer[16] = 0x6b;      // "k"
  buffer[17] = 0x65;      // "e"
  buffer[18] = 0x79;      // "y"
  buffer[19] = 0x33;      // "3"
  buffer[20] = 0x03;      // value: positive fixint 3

  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();

  if (result.getType() !== MessagePackValueType.MAP) {
    console.log("FAIL: Expected MAP type for map16, got " + result.getType().toString());
    return false;
  }

  const mapResult = result as MessagePackMap;
  if (mapResult.value.size !== 3) {
    console.log("FAIL: Expected map size 3, got " + mapResult.value.size.toString());
    return false;
  }

  // Check map entries
  for (let i = 1; i <= 3; i++) {
    const key = "key" + i.toString();
    const value = mapResult.value.get(key);

    if (!value || value.getType() !== MessagePackValueType.INTEGER) {
      console.log("FAIL: Expected INTEGER type for key '" + key + "'");
      return false;
    }

    const intValue = value as MessagePackInteger;
    if (intValue.value !== i) {
      console.log("FAIL: Expected " + i.toString() + " for key '" + key + "', got " + intValue.value.toString());
      return false;
    }
  }

  console.log("PASS: testDecodeMap16");
  return true;
}/*
*
 * Test map32 format decoding (0xdf)
 */
export function testDecodeMap32(): boolean {
  // For testing purposes, we'll use a smaller map
  // In a real scenario, this would be 65536+ key-value pairs

  // Create a buffer for a map with 2 entries
  // {"name": "MessagePack", "format": "binary"}
  const buffer = new Uint8Array(36);
  buffer[0] = 0xdf;       // map32 format
  buffer[1] = 0x00;       // highest byte of size (0)
  buffer[2] = 0x00;       // high byte of size (0)
  buffer[3] = 0x00;       // low byte of size (0)
  buffer[4] = 0x02;       // lowest byte of size (2)

  // Key 1: "name"
  buffer[5] = 0xa4;       // fixstr with length 4
  buffer[6] = 0x6e;       // "n"
  buffer[7] = 0x61;       // "a"
  buffer[8] = 0x6d;       // "m"
  buffer[9] = 0x65;       // "e"

  // Value 1: "MessagePack"
  buffer[10] = 0xab;      // fixstr with length 11
  buffer[11] = 0x4d;      // "M"
  buffer[12] = 0x65;      // "e"
  buffer[13] = 0x73;      // "s"
  buffer[14] = 0x73;      // "s"
  buffer[15] = 0x61;      // "a"
  buffer[16] = 0x67;      // "g"
  buffer[17] = 0x65;      // "e"
  buffer[18] = 0x50;      // "P"
  buffer[19] = 0x61;      // "a"
  buffer[20] = 0x63;      // "c"
  buffer[21] = 0x6b;      // "k"

  // Key 2: "format"
  buffer[22] = 0xa6;      // fixstr with length 6
  buffer[23] = 0x66;      // "f"
  buffer[24] = 0x6f;      // "o"
  buffer[25] = 0x72;      // "r"
  buffer[26] = 0x6d;      // "m"
  buffer[27] = 0x61;      // "a"
  buffer[28] = 0x74;      // "t"

  // Value 2: "binary"
  buffer[29] = 0xa6;      // fixstr with length 6
  buffer[30] = 0x62;      // "b"
  buffer[31] = 0x69;      // "i"
  buffer[32] = 0x6e;      // "n"
  buffer[33] = 0x61;      // "a"
  buffer[34] = 0x72;      // "r"
  buffer[35] = 0x79;      // "y"

  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();

  if (result.getType() !== MessagePackValueType.MAP) {
    console.log("FAIL: Expected MAP type for map32, got " + result.getType().toString());
    return false;
  }

  const mapResult = result as MessagePackMap;
  if (mapResult.value.size !== 2) {
    console.log("FAIL: Expected map size 2, got " + mapResult.value.size.toString());
    return false;
  }

  // Check "name" entry
  const nameValue = mapResult.value.get("name");
  if (!nameValue || nameValue.getType() !== MessagePackValueType.STRING) {
    console.log("FAIL: Expected STRING type for key 'name'");
    return false;
  }

  const nameStrValue = nameValue as MessagePackString;
  if (nameStrValue.value !== "MessagePack") {
    console.log("FAIL: Expected 'MessagePack' for key 'name', got '" + nameStrValue.value + "'");
    return false;
  }

  // Check "format" entry
  const formatValue = mapResult.value.get("format");
  if (!formatValue || formatValue.getType() !== MessagePackValueType.STRING) {
    console.log("FAIL: Expected STRING type for key 'format'");
    return false;
  }

  const formatStrValue = formatValue as MessagePackString;
  if (formatStrValue.value !== "binary") {
    console.log("FAIL: Expected 'binary' for key 'format', got '" + formatStrValue.value + "'");
    return false;
  }

  console.log("PASS: testDecodeMap32");
  return true;
}

/**
 * Test nested map decoding
 */
export function testDecodeNestedMaps(): boolean {
  // Create a buffer for a map containing another map
  // {"outer": {"inner": 42}}
  const buffer = new Uint8Array(15);
  buffer[0] = 0x81;       // fixmap with size 1

  // Key: "outer"
  buffer[1] = 0xa5;       // fixstr with length 5
  buffer[2] = 0x6f;       // "o"
  buffer[3] = 0x75;       // "u"
  buffer[4] = 0x74;       // "t"
  buffer[5] = 0x65;       // "e"
  buffer[6] = 0x72;       // "r"

  // Value: inner map
  buffer[7] = 0x81;       // fixmap with size 1

  // Inner key: "inner"
  buffer[8] = 0xa5;       // fixstr with length 5
  buffer[9] = 0x69;       // "i"
  buffer[10] = 0x6e;      // "n"
  buffer[11] = 0x6e;      // "n"
  buffer[12] = 0x65;      // "e"
  buffer[13] = 0x72;      // "r"

  // Inner value: 42
  buffer[14] = 0x2a;      // positive fixint 42

  const decoder = new MessagePackDecoder(buffer);
  const result = decoder.decode();

  if (result.getType() !== MessagePackValueType.MAP) {
    console.log("FAIL: Expected MAP type for outer map, got " + result.getType().toString());
    return false;
  }

  const outerMap = result as MessagePackMap;
  if (outerMap.value.size !== 1) {
    console.log("FAIL: Expected outer map size 1, got " + outerMap.value.size.toString());
    return false;
  }

  // Check outer map entry
  const innerMapValue = outerMap.value.get("outer");
  if (!innerMapValue || innerMapValue.getType() !== MessagePackValueType.MAP) {
    console.log("FAIL: Expected MAP type for key 'outer'");
    return false;
  }

  const innerMap = innerMapValue as MessagePackMap;
  if (innerMap.value.size !== 1) {
    console.log("FAIL: Expected inner map size 1, got " + innerMap.value.size.toString());
    return false;
  }

  // Check inner map entry
  const innerValue = innerMap.value.get("inner");
  if (!innerValue || innerValue.getType() !== MessagePackValueType.INTEGER) {
    console.log("FAIL: Expected INTEGER type for key 'inner'");
    return false;
  }

  const intValue = innerValue as MessagePackInteger;
  if (intValue.value !== 42) {
    console.log("FAIL: Expected 42 for key 'inner', got " + intValue.value.toString());
    return false;
  }

  console.log("PASS: testDecodeNestedMaps");
  return true;
}