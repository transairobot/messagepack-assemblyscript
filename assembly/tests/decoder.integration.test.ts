// MessagePack decoder integration tests
import { MessagePackEncoder, MessagePackDecoder } from "../index";
import {
  MessagePackValue,
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
 * Test round-trip encoding and decoding for string values
 */
export function testRoundTripString(): boolean {
  const encoder = new MessagePackEncoder();
  const testStrings: string[] = ["", "hello", "world", "MessagePack", "🎉 Unicode test! 🚀"];

  for (let i = 0; i < testStrings.length; i++) {
    const value = testStrings[i];
    const originalValue = new MessagePackString(value);

    // Encode
    const encoded = encoder.encode(originalValue);

    // Decode
    const decoder = new MessagePackDecoder(encoded);
    const decoded = decoder.decode();

    // Verify
    if (decoded.getType() !== MessagePackValueType.STRING) {
      console.log("FAIL: Round-trip string '" + value + "' - wrong type");
      return false;
    }

    const stringDecoded = decoded as MessagePackString;
    if (stringDecoded.value !== value) {
      console.log("FAIL: Round-trip string '" + value + "' - expected '" + value + "', got '" + stringDecoded.value + "'");
      return false;
    }
  }

  console.log("PASS: testRoundTripString");
  return true;
}

/**
 * Test round-trip encoding and decoding for array values
 */
export function testRoundTripArray(): boolean {
  const encoder = new MessagePackEncoder();

  // Test empty array
  const originalArray: MessagePackValue[] = [];
  let originalValue = new MessagePackArray(originalArray);
  let encoded = encoder.encode(originalValue);
  let decoder = new MessagePackDecoder(encoded);
  let decoded = decoder.decode();

  if (decoded.getType() !== MessagePackValueType.ARRAY) {
    console.log("FAIL: Round-trip empty array - wrong type");
    return false;
  }

  let arrayDecoded = decoded as MessagePackArray;
  if (arrayDecoded.value.length !== 0) {
    console.log("FAIL: Round-trip empty array - expected length 0, got " + arrayDecoded.value.length.toString());
    return false;
  }

  // Test simple array with mixed types
  let originalArray1 = [
    new MessagePackNull(),
    new MessagePackBoolean(true),
    new MessagePackInteger(42),
    new MessagePackString("test")
  ];
  originalValue = new MessagePackArray(originalArray1);
  encoded = encoder.encode(originalValue);
  decoder = new MessagePackDecoder(encoded);
  decoded = decoder.decode();

  if (decoded.getType() !== MessagePackValueType.ARRAY) {
    console.log("FAIL: Round-trip mixed array - wrong type");
    return false;
  }

  arrayDecoded = decoded as MessagePackArray;
  if (arrayDecoded.value.length !== originalArray1.length) {
    console.log("FAIL: Round-trip mixed array - length mismatch");
    return false;
  }

  // Verify each element
  if (arrayDecoded.value[0].getType() !== MessagePackValueType.NULL) {
    console.log("FAIL: Round-trip mixed array - element 0 wrong type");
    return false;
  }

  if (arrayDecoded.value[1].getType() !== MessagePackValueType.BOOLEAN ||
    (arrayDecoded.value[1] as MessagePackBoolean).value !== true) {
    console.log("FAIL: Round-trip mixed array - element 1 wrong value");
    return false;
  }

  if (arrayDecoded.value[2].getType() !== MessagePackValueType.INTEGER ||
    (arrayDecoded.value[2] as MessagePackInteger).value !== 42) {
    console.log("FAIL: Round-trip mixed array - element 2 wrong value");
    return false;
  }

  if (arrayDecoded.value[3].getType() !== MessagePackValueType.STRING ||
    (arrayDecoded.value[3] as MessagePackString).value !== "test") {
    console.log("FAIL: Round-trip mixed array - element 3 wrong value");
    return false;
  }

  console.log("PASS: testRoundTripArray");
  return true;
}

/**
 * Test round-trip encoding and decoding for map values
 */
export function testRoundTripMap(): boolean {
  const encoder = new MessagePackEncoder();

  // Test empty map
  let originalMap = new Map<string, MessagePackValue>();
  let originalValue = new MessagePackMap(originalMap);
  let encoded = encoder.encode(originalValue);
  let decoder = new MessagePackDecoder(encoded);
  let decoded = decoder.decode();

  if (decoded.getType() !== MessagePackValueType.MAP) {
    console.log("FAIL: Round-trip empty map - wrong type");
    return false;
  }

  let mapDecoded = decoded as MessagePackMap;
  if (mapDecoded.value.size !== 0) {
    console.log("FAIL: Round-trip empty map - expected size 0, got " + mapDecoded.value.size.toString());
    return false;
  }

  // Test simple map with mixed value types
  originalMap = new Map<string, MessagePackValue>();
  originalMap.set("null_key", new MessagePackNull());
  originalMap.set("bool_key", new MessagePackBoolean(false));
  originalMap.set("int_key", new MessagePackInteger(123));
  originalMap.set("str_key", new MessagePackString("value"));

  originalValue = new MessagePackMap(originalMap);
  encoded = encoder.encode(originalValue);
  decoder = new MessagePackDecoder(encoded);
  decoded = decoder.decode();

  if (decoded.getType() !== MessagePackValueType.MAP) {
    console.log("FAIL: Round-trip mixed map - wrong type");
    return false;
  }

  mapDecoded = decoded as MessagePackMap;
  if (mapDecoded.value.size !== originalMap.size) {
    console.log("FAIL: Round-trip mixed map - size mismatch");
    return false;
  }

  // Verify each key-value pair
  if (!mapDecoded.value.has("null_key") ||
    mapDecoded.value.get("null_key")!.getType() !== MessagePackValueType.NULL) {
    console.log("FAIL: Round-trip mixed map - null_key wrong");
    return false;
  }

  if (!mapDecoded.value.has("bool_key") ||
    mapDecoded.value.get("bool_key")!.getType() !== MessagePackValueType.BOOLEAN ||
    (mapDecoded.value.get("bool_key")! as MessagePackBoolean).value !== false) {
    console.log("FAIL: Round-trip mixed map - bool_key wrong");
    return false;
  }

  if (!mapDecoded.value.has("int_key") ||
    mapDecoded.value.get("int_key")!.getType() !== MessagePackValueType.INTEGER ||
    (mapDecoded.value.get("int_key")! as MessagePackInteger).value !== 123) {
    console.log("FAIL: Round-trip mixed map - int_key wrong");
    return false;
  }

  if (!mapDecoded.value.has("str_key") ||
    mapDecoded.value.get("str_key")!.getType() !== MessagePackValueType.STRING ||
    (mapDecoded.value.get("str_key")! as MessagePackString).value !== "value") {
    console.log("FAIL: Round-trip mixed map - str_key wrong");
    return false;
  }

  console.log("PASS: testRoundTripMap");
  return true;
}

/**
 * Test round-trip encoding and decoding for complex nested structures
 */
export function testRoundTripNestedStructures(): boolean {
  const encoder = new MessagePackEncoder();

  // Create a complex nested structure: array containing maps with arrays
  const innerArray1: MessagePackValue[] = [
    new MessagePackInteger(1),
    new MessagePackInteger(2),
    new MessagePackInteger(3)
  ];

  const innerArray2: MessagePackValue[] = [
    new MessagePackString("a"),
    new MessagePackString("b"),
    new MessagePackString("c")
  ];

  const innerMap = new Map<string, MessagePackValue>();
  innerMap.set("numbers", new MessagePackArray(innerArray1));
  innerMap.set("letters", new MessagePackArray(innerArray2));
  innerMap.set("nested_bool", new MessagePackBoolean(true));

  const outerArray: MessagePackValue[] = [
    new MessagePackString("outer_string"),
    new MessagePackMap(innerMap),
    new MessagePackInteger(999)
  ];

  const originalValue = new MessagePackArray(outerArray);

  // Encode
  const encoded = encoder.encode(originalValue);

  // Decode
  const decoder = new MessagePackDecoder(encoded);
  const decoded = decoder.decode();

  // Verify structure
  if (decoded.getType() !== MessagePackValueType.ARRAY) {
    console.log("FAIL: Round-trip nested - root not array");
    return false;
  }

  const decodedArray = decoded as MessagePackArray;
  if (decodedArray.value.length !== 3) {
    console.log("FAIL: Round-trip nested - root array wrong length");
    return false;
  }

  // Check first element (string)
  if (decodedArray.value[0].getType() !== MessagePackValueType.STRING ||
    (decodedArray.value[0] as MessagePackString).value !== "outer_string") {
    console.log("FAIL: Round-trip nested - first element wrong");
    return false;
  }

  // Check second element (map)
  if (decodedArray.value[1].getType() !== MessagePackValueType.MAP) {
    console.log("FAIL: Round-trip nested - second element not map");
    return false;
  }

  const decodedMap = decodedArray.value[1] as MessagePackMap;
  if (decodedMap.value.size !== 3) {
    console.log("FAIL: Round-trip nested - inner map wrong size");
    return false;
  }

  // Check nested arrays in map
  if (!decodedMap.value.has("numbers") ||
    decodedMap.value.get("numbers")!.getType() !== MessagePackValueType.ARRAY) {
    console.log("FAIL: Round-trip nested - numbers array missing");
    return false;
  }

  const numbersArray = decodedMap.value.get("numbers")! as MessagePackArray;
  if (numbersArray.value.length !== 3 ||
    (numbersArray.value[0] as MessagePackInteger).value !== 1 ||
    (numbersArray.value[1] as MessagePackInteger).value !== 2 ||
    (numbersArray.value[2] as MessagePackInteger).value !== 3) {
    console.log("FAIL: Round-trip nested - numbers array content wrong");
    return false;
  }

  // Check third element (integer)
  if (decodedArray.value[2].getType() !== MessagePackValueType.INTEGER ||
    (decodedArray.value[2] as MessagePackInteger).value !== 999) {
    console.log("FAIL: Round-trip nested - third element wrong");
    return false;
  }

  console.log("PASS: testRoundTripNestedStructures");
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
  allPassed = testRoundTripString() && allPassed;
  allPassed = testRoundTripArray() && allPassed;
  allPassed = testRoundTripMap() && allPassed;
  allPassed = testRoundTripNestedStructures() && allPassed;

  if (allPassed) {
    console.log("Round-trip tests completed ✅");
    console.log("\n🎉 All decoder integration tests passed!");
  } else {
    console.log("❌ Some decoder integration tests failed!");
  }

  return allPassed;
}