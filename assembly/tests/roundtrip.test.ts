// MessagePack comprehensive round-trip testing and validation
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
 * Performance benchmark result structure
 */
class BenchmarkResult {
  operation: string;
  iterations: i32;
  totalTimeMs: f64;
  avgTimeMs: f64;
  throughputOpsPerSec: f64;

  constructor(operation: string, iterations: i32, totalTimeMs: f64) {
    this.operation = operation;
    this.iterations = iterations;
    this.totalTimeMs = totalTimeMs;
    this.avgTimeMs = totalTimeMs / (iterations as f64);
    this.throughputOpsPerSec = ((iterations as f64) * 1000.0) / totalTimeMs;
  }
}

/**
 * Helper function to calculate time difference as f64
 */
function timeDiff(endTime: i64, startTime: i64): f64 {
  return (endTime - startTime) as f64;
}

/**
 * Helper function to format f64 numbers for display
 */
function formatFloat(value: f64, decimals: i32): string {
  // Simple formatting for AssemblyScript - convert to string and truncate
  const str = value.toString();
  const dotIndex = str.indexOf('.');
  if (dotIndex === -1) {
    return str + ".0";
  }
  const endIndex = Math.min(str.length, dotIndex + decimals + 1) as i32;
  return str.substring(0, endIndex);
}
/*
*
 * Test data integrity for all basic types with edge cases
 */
export function testDataIntegrityBasicTypes(): boolean {
  console.log("Testing data integrity for basic types...");
  
  const encoder = new MessagePackEncoder();
  let allPassed = true;

  // Test null
  const nullValue = new MessagePackNull();
  const nullEncoded = encoder.encode(nullValue);
  const nullDecoder = new MessagePackDecoder(nullEncoded);
  const nullDecoded = nullDecoder.decode();
  
  if (nullDecoded.getType() !== MessagePackValueType.NULL) {
    console.log("FAIL: Null round-trip - type mismatch");
    allPassed = false;
  }

  // Test boolean edge cases
  const boolValues = [true, false];
  for (let i = 0; i < boolValues.length; i++) {
    const boolValue = new MessagePackBoolean(boolValues[i]);
    const boolEncoded = encoder.encode(boolValue);
    const boolDecoder = new MessagePackDecoder(boolEncoded);
    const boolDecoded = boolDecoder.decode();
    
    if (boolDecoded.getType() !== MessagePackValueType.BOOLEAN ||
        (boolDecoded as MessagePackBoolean).value !== boolValues[i]) {
      console.log("FAIL: Boolean round-trip - " + boolValues[i].toString());
      allPassed = false;
    }
  }

  // Test integer edge cases
  const intValues: i64[] = [
    0, 1, -1, 127, -32, 128, -128, 255, 256, -129,
    32767, -32768, 32768, -32769, 65535, 65536,
    2147483647, -2147483648, 2147483648, -2147483649,
    4294967295, 4294967296, -4294967296
  ];
  
  for (let i = 0; i < intValues.length; i++) {
    const intValue = new MessagePackInteger(intValues[i]);
    const intEncoded = encoder.encode(intValue);
    const intDecoder = new MessagePackDecoder(intEncoded);
    const intDecoded = intDecoder.decode();
    
    if (intDecoded.getType() !== MessagePackValueType.INTEGER ||
        (intDecoded as MessagePackInteger).value !== intValues[i]) {
      console.log("FAIL: Integer round-trip - " + intValues[i].toString());
      allPassed = false;
    }
  }

  // Test float edge cases
  const floatValues: f64[] = [
    0.0, -0.0, 1.0, -1.0, 3.14159, -2.71828,
    1.7976931348623157e+308, // Max finite value
    2.2250738585072014e-308, // Min positive normal value
    Infinity, -Infinity, NaN
  ];
  
  for (let i = 0; i < floatValues.length; i++) {
    const floatValue = new MessagePackFloat(floatValues[i]);
    const floatEncoded = encoder.encode(floatValue);
    const floatDecoder = new MessagePackDecoder(floatEncoded);
    const floatDecoded = floatDecoder.decode();
    
    if (floatDecoded.getType() !== MessagePackValueType.FLOAT) {
      console.log("FAIL: Float round-trip type - " + floatValues[i].toString());
      allPassed = false;
      continue;
    }
    
    const decodedValue = (floatDecoded as MessagePackFloat).value;
    
    // Special handling for NaN
    if (isNaN(floatValues[i])) {
      if (!isNaN(decodedValue)) {
        console.log("FAIL: Float round-trip NaN");
        allPassed = false;
      }
    } else if (decodedValue !== floatValues[i]) {
      console.log("FAIL: Float round-trip - " + floatValues[i].toString() + " != " + decodedValue.toString());
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("PASS: testDataIntegrityBasicTypes");
  }
  
  return allPassed;
}

/**
 * Test data integrity for string types with various encodings
 */
export function testDataIntegrityStrings(): boolean {
  console.log("Testing data integrity for strings...");
  
  const encoder = new MessagePackEncoder();
  let allPassed = true;

  // Test string edge cases
  const stringValues: string[] = [
    "", // Empty string
    "a", // Single ASCII character
    "Hello, World!", // Basic ASCII
    "MessagePack", // Library name
    "🎉🚀💻", // Unicode emojis
    "こんにちは", // Japanese
    "Здравствуй", // Russian
    "مرحبا", // Arabic
    "A".repeat(31), // fixstr boundary (31 chars)
    "B".repeat(32), // str8 boundary (32 chars)
    "C".repeat(255), // str8 max (255 chars)
    "D".repeat(256), // str16 boundary (256 chars)
    "E".repeat(65535), // str16 max (65535 chars)
    "\x00\x01\x02\x03", // Control characters
    "Line1\nLine2\rLine3\tTabbed", // Whitespace characters
    "\"Quoted\" and 'apostrophed'", // Quote characters
    "\\Backslash\\Path\\", // Backslashes
  ];
  
  for (let i = 0; i < stringValues.length; i++) {
    const stringValue = new MessagePackString(stringValues[i]);
    const stringEncoded = encoder.encode(stringValue);
    const stringDecoder = new MessagePackDecoder(stringEncoded);
    const stringDecoded = stringDecoder.decode();
    
    if (stringDecoded.getType() !== MessagePackValueType.STRING) {
      console.log("FAIL: String round-trip type - index " + i.toString());
      allPassed = false;
      continue;
    }
    
    const decodedValue = (stringDecoded as MessagePackString).value;
    if (decodedValue !== stringValues[i]) {
      console.log("FAIL: String round-trip - index " + i.toString());
      console.log("  Expected length: " + stringValues[i].length.toString());
      console.log("  Actual length: " + decodedValue.length.toString());
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("PASS: testDataIntegrityStrings");
  }
  
  return allPassed;
}

/**
 * Test data integrity for binary data with various sizes
 */
export function testDataIntegrityBinary(): boolean {
  console.log("Testing data integrity for binary data...");
  
  const encoder = new MessagePackEncoder();
  let allPassed = true;

  // Test binary data edge cases
  const binarySizes: i32[] = [0, 1, 255, 256, 65535, 65536];
  
  for (let i = 0; i < binarySizes.length; i++) {
    const size = binarySizes[i];
    const binaryData = new Uint8Array(size);
    
    // Fill with pattern data
    for (let j = 0; j < size; j++) {
      binaryData[j] = (j * 17 + 42) % 256;
    }
    
    const binaryValue = new MessagePackBinary(binaryData);
    const binaryEncoded = encoder.encode(binaryValue);
    const binaryDecoder = new MessagePackDecoder(binaryEncoded);
    const binaryDecoded = binaryDecoder.decode();
    
    if (binaryDecoded.getType() !== MessagePackValueType.BINARY) {
      console.log("FAIL: Binary round-trip type - size " + size.toString());
      allPassed = false;
      continue;
    }
    
    const decodedData = (binaryDecoded as MessagePackBinary).value;
    if (decodedData.length !== binaryData.length) {
      console.log("FAIL: Binary round-trip length - size " + size.toString());
      allPassed = false;
      continue;
    }
    
    // Verify data integrity
    for (let j = 0; j < size; j++) {
      if (decodedData[j] !== binaryData[j]) {
        console.log("FAIL: Binary round-trip data - size " + size.toString() + " at index " + j.toString());
        allPassed = false;
        break;
      }
    }
  }

  if (allPassed) {
    console.log("PASS: testDataIntegrityBinary");
  }
  
  return allPassed;
}/*
*
 * Test data integrity for complex nested structures
 */
export function testDataIntegrityComplexStructures(): boolean {
  console.log("Testing data integrity for complex structures...");
  
  const encoder = new MessagePackEncoder();
  let allPassed = true;

  // Test deeply nested arrays
  let nestedArray: MessagePackValue = new MessagePackInteger(42);
  for (let depth = 0; depth < 10; depth++) {
    nestedArray = new MessagePackArray([nestedArray]);
  }
  
  const nestedEncoded = encoder.encode(nestedArray);
  const nestedDecoder = new MessagePackDecoder(nestedEncoded);
  const nestedDecoded = nestedDecoder.decode();
  
  // Verify nested structure
  let current = nestedDecoded;
  for (let depth = 0; depth < 10; depth++) {
    if (current.getType() !== MessagePackValueType.ARRAY) {
      console.log("FAIL: Nested array depth " + depth.toString());
      allPassed = false;
      break;
    }
    const arr = current as MessagePackArray;
    if (arr.value.length !== 1) {
      console.log("FAIL: Nested array length at depth " + depth.toString());
      allPassed = false;
      break;
    }
    current = arr.value[0];
  }
  
  if (current.getType() !== MessagePackValueType.INTEGER ||
      (current as MessagePackInteger).value !== 42) {
    console.log("FAIL: Nested array final value");
    allPassed = false;
  }

  // Test complex map with mixed types
  const complexMap = new Map<string, MessagePackValue>();
  complexMap.set("null", new MessagePackNull());
  complexMap.set("bool", new MessagePackBoolean(true));
  complexMap.set("int", new MessagePackInteger(123));
  complexMap.set("float", new MessagePackFloat(3.14));
  complexMap.set("string", new MessagePackString("test"));
  
  const binaryData = new Uint8Array(5);
  for (let i = 0; i < 5; i++) {
    binaryData[i] = i + 1;
  }
  complexMap.set("binary", new MessagePackBinary(binaryData));
  
  const innerArray: MessagePackValue[] = [
    new MessagePackInteger(1),
    new MessagePackInteger(2),
    new MessagePackInteger(3)
  ];
  complexMap.set("array", new MessagePackArray(innerArray));
  
  const innerMap = new Map<string, MessagePackValue>();
  innerMap.set("nested", new MessagePackString("value"));
  complexMap.set("map", new MessagePackMap(innerMap));
  
  const complexValue = new MessagePackMap(complexMap);
  const complexEncoded = encoder.encode(complexValue);
  const complexDecoder = new MessagePackDecoder(complexEncoded);
  const complexDecoded = complexDecoder.decode();
  
  if (complexDecoded.getType() !== MessagePackValueType.MAP) {
    console.log("FAIL: Complex map type");
    allPassed = false;
  } else {
    const decodedMap = (complexDecoded as MessagePackMap).value;
    
    // Verify all keys exist and have correct types/values
    if (!decodedMap.has("null") || decodedMap.get("null")!.getType() !== MessagePackValueType.NULL) {
      console.log("FAIL: Complex map null key");
      allPassed = false;
    }
    
    if (!decodedMap.has("bool") || 
        decodedMap.get("bool")!.getType() !== MessagePackValueType.BOOLEAN ||
        (decodedMap.get("bool")! as MessagePackBoolean).value !== true) {
      console.log("FAIL: Complex map bool key");
      allPassed = false;
    }
    
    if (!decodedMap.has("int") || 
        decodedMap.get("int")!.getType() !== MessagePackValueType.INTEGER ||
        (decodedMap.get("int")! as MessagePackInteger).value !== 123) {
      console.log("FAIL: Complex map int key");
      allPassed = false;
    }
    
    if (!decodedMap.has("string") || 
        decodedMap.get("string")!.getType() !== MessagePackValueType.STRING ||
        (decodedMap.get("string")! as MessagePackString).value !== "test") {
      console.log("FAIL: Complex map string key");
      allPassed = false;
    }
    
    // Verify nested array
    if (!decodedMap.has("array") || 
        decodedMap.get("array")!.getType() !== MessagePackValueType.ARRAY) {
      console.log("FAIL: Complex map array key type");
      allPassed = false;
    } else {
      const decodedArray = (decodedMap.get("array")! as MessagePackArray).value;
      if (decodedArray.length !== 3 ||
          (decodedArray[0] as MessagePackInteger).value !== 1 ||
          (decodedArray[1] as MessagePackInteger).value !== 2 ||
          (decodedArray[2] as MessagePackInteger).value !== 3) {
        console.log("FAIL: Complex map array content");
        allPassed = false;
      }
    }
    
    // Verify nested map
    if (!decodedMap.has("map") || 
        decodedMap.get("map")!.getType() !== MessagePackValueType.MAP) {
      console.log("FAIL: Complex map nested map type");
      allPassed = false;
    } else {
      const decodedNestedMap = (decodedMap.get("map")! as MessagePackMap).value;
      if (!decodedNestedMap.has("nested") ||
          (decodedNestedMap.get("nested")! as MessagePackString).value !== "value") {
        console.log("FAIL: Complex map nested map content");
        allPassed = false;
      }
    }
  }

  if (allPassed) {
    console.log("PASS: testDataIntegrityComplexStructures");
  }
  
  return allPassed;
}/**
 
* Performance benchmark for encoding operations
 */
export function benchmarkEncoding(): BenchmarkResult[] {
  console.log("Running encoding performance benchmarks...");
  
  const encoder = new MessagePackEncoder();
  const results: BenchmarkResult[] = [];
  const iterations = 10000;

  // Benchmark null encoding
  const nullValue = new MessagePackNull();
  const nullStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    encoder.encode(nullValue);
  }
  const nullEndTime = Date.now();
  results.push(new BenchmarkResult("Null Encoding", iterations, timeDiff(nullEndTime, nullStartTime)));

  // Benchmark boolean encoding
  const boolValue = new MessagePackBoolean(true);
  const boolStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    encoder.encode(boolValue);
  }
  const boolEndTime = Date.now();
  results.push(new BenchmarkResult("Boolean Encoding", iterations, timeDiff(boolEndTime, boolStartTime)));

  // Benchmark integer encoding
  const intValue = new MessagePackInteger(42);
  const intStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    encoder.encode(intValue);
  }
  const intEndTime = Date.now();
  results.push(new BenchmarkResult("Integer Encoding", iterations, timeDiff(intEndTime, intStartTime)));

  // Benchmark float encoding
  const floatValue = new MessagePackFloat(3.14159);
  const floatStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    encoder.encode(floatValue);
  }
  const floatEndTime = Date.now();
  results.push(new BenchmarkResult("Float Encoding", iterations, timeDiff(floatEndTime, floatStartTime)));

  // Benchmark string encoding
  const stringValue = new MessagePackString("Hello, MessagePack!");
  const stringStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    encoder.encode(stringValue);
  }
  const stringEndTime = Date.now();
  results.push(new BenchmarkResult("String Encoding", iterations, timeDiff(stringEndTime, stringStartTime)));

  // Benchmark binary encoding
  const binaryData = new Uint8Array(100);
  for (let i = 0; i < 100; i++) {
    binaryData[i] = i % 256;
  }
  const binaryValue = new MessagePackBinary(binaryData);
  const binaryStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    encoder.encode(binaryValue);
  }
  const binaryEndTime = Date.now();
  results.push(new BenchmarkResult("Binary Encoding", iterations, timeDiff(binaryEndTime, binaryStartTime)));

  // Benchmark array encoding
  const arrayValue = new MessagePackArray([
    new MessagePackInteger(1),
    new MessagePackInteger(2),
    new MessagePackInteger(3),
    new MessagePackString("test"),
    new MessagePackBoolean(true)
  ]);
  const arrayStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    encoder.encode(arrayValue);
  }
  const arrayEndTime = Date.now();
  results.push(new BenchmarkResult("Array Encoding", iterations, timeDiff(arrayEndTime, arrayStartTime)));

  // Benchmark map encoding
  const mapData = new Map<string, MessagePackValue>();
  mapData.set("key1", new MessagePackInteger(1));
  mapData.set("key2", new MessagePackString("value"));
  mapData.set("key3", new MessagePackBoolean(false));
  const mapValue = new MessagePackMap(mapData);
  const mapStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    encoder.encode(mapValue);
  }
  const mapEndTime = Date.now();
  results.push(new BenchmarkResult("Map Encoding", iterations, timeDiff(mapEndTime, mapStartTime)));

  return results;
}

/**
 * Performance benchmark for decoding operations
 */
export function benchmarkDecoding(): BenchmarkResult[] {
  console.log("Running decoding performance benchmarks...");
  
  const encoder = new MessagePackEncoder();
  const results: BenchmarkResult[] = [];
  const iterations = 10000;

  // Pre-encode test data
  const nullEncoded = encoder.encode(new MessagePackNull());
  const boolEncoded = encoder.encode(new MessagePackBoolean(true));
  const intEncoded = encoder.encode(new MessagePackInteger(42));
  const floatEncoded = encoder.encode(new MessagePackFloat(3.14159));
  const stringEncoded = encoder.encode(new MessagePackString("Hello, MessagePack!"));
  
  const binaryData = new Uint8Array(100);
  for (let i = 0; i < 100; i++) {
    binaryData[i] = i % 256;
  }
  const binaryEncoded = encoder.encode(new MessagePackBinary(binaryData));
  
  const arrayValue = new MessagePackArray([
    new MessagePackInteger(1),
    new MessagePackInteger(2),
    new MessagePackInteger(3),
    new MessagePackString("test"),
    new MessagePackBoolean(true)
  ]);
  const arrayEncoded = encoder.encode(arrayValue);
  
  const mapData = new Map<string, MessagePackValue>();
  mapData.set("key1", new MessagePackInteger(1));
  mapData.set("key2", new MessagePackString("value"));
  mapData.set("key3", new MessagePackBoolean(false));
  const mapEncoded = encoder.encode(new MessagePackMap(mapData));

  // Benchmark null decoding
  const nullStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const decoder = new MessagePackDecoder(nullEncoded);
    decoder.decode();
  }
  const nullEndTime = Date.now();
  results.push(new BenchmarkResult("Null Decoding", iterations, timeDiff(nullEndTime, nullStartTime)));

  // Benchmark boolean decoding
  const boolStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const decoder = new MessagePackDecoder(boolEncoded);
    decoder.decode();
  }
  const boolEndTime = Date.now();
  results.push(new BenchmarkResult("Boolean Decoding", iterations, timeDiff(boolEndTime, boolStartTime)));

  // Benchmark integer decoding
  const intStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const decoder = new MessagePackDecoder(intEncoded);
    decoder.decode();
  }
  const intEndTime = Date.now();
  results.push(new BenchmarkResult("Integer Decoding", iterations, timeDiff(intEndTime, intStartTime)));

  // Benchmark float decoding
  const floatStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const decoder = new MessagePackDecoder(floatEncoded);
    decoder.decode();
  }
  const floatEndTime = Date.now();
  results.push(new BenchmarkResult("Float Decoding", iterations, timeDiff(floatEndTime, floatStartTime)));

  // Benchmark string decoding
  const stringStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const decoder = new MessagePackDecoder(stringEncoded);
    decoder.decode();
  }
  const stringEndTime = Date.now();
  results.push(new BenchmarkResult("String Decoding", iterations, timeDiff(stringEndTime, stringStartTime)));

  // Benchmark binary decoding
  const binaryStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const decoder = new MessagePackDecoder(binaryEncoded);
    decoder.decode();
  }
  const binaryEndTime = Date.now();
  results.push(new BenchmarkResult("Binary Decoding", iterations, timeDiff(binaryEndTime, binaryStartTime)));

  // Benchmark array decoding
  const arrayStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const decoder = new MessagePackDecoder(arrayEncoded);
    decoder.decode();
  }
  const arrayEndTime = Date.now();
  results.push(new BenchmarkResult("Array Decoding", iterations, timeDiff(arrayEndTime, arrayStartTime)));

  // Benchmark map decoding
  const mapStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const decoder = new MessagePackDecoder(mapEncoded);
    decoder.decode();
  }
  const mapEndTime = Date.now();
  results.push(new BenchmarkResult("Map Decoding", iterations, timeDiff(mapEndTime, mapStartTime)));

  return results;
}/**

 * Performance benchmark for round-trip operations
 */
export function benchmarkRoundTrip(): BenchmarkResult[] {
  console.log("Running round-trip performance benchmarks...");
  
  const encoder = new MessagePackEncoder();
  const results: BenchmarkResult[] = [];
  const iterations = 5000; // Fewer iterations for round-trip as it's more expensive

  // Benchmark null round-trip
  const nullValue = new MessagePackNull();
  const nullStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const encoded = encoder.encode(nullValue);
    const decoder = new MessagePackDecoder(encoded);
    decoder.decode();
  }
  const nullEndTime = Date.now();
  results.push(new BenchmarkResult("Null Round-trip", iterations, timeDiff(nullEndTime, nullStartTime)));

  // Benchmark boolean round-trip
  const boolValue = new MessagePackBoolean(true);
  const boolStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const encoded = encoder.encode(boolValue);
    const decoder = new MessagePackDecoder(encoded);
    decoder.decode();
  }
  const boolEndTime = Date.now();
  results.push(new BenchmarkResult("Boolean Round-trip", iterations, timeDiff(boolEndTime, boolStartTime)));

  // Benchmark integer round-trip
  const intValue = new MessagePackInteger(42);
  const intStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const encoded = encoder.encode(intValue);
    const decoder = new MessagePackDecoder(encoded);
    decoder.decode();
  }
  const intEndTime = Date.now();
  results.push(new BenchmarkResult("Integer Round-trip", iterations, timeDiff(intEndTime, intStartTime)));

  // Benchmark string round-trip
  const stringValue = new MessagePackString("Hello, MessagePack!");
  const stringStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const encoded = encoder.encode(stringValue);
    const decoder = new MessagePackDecoder(encoded);
    decoder.decode();
  }
  const stringEndTime = Date.now();
  results.push(new BenchmarkResult("String Round-trip", iterations, timeDiff(stringEndTime, stringStartTime)));

  // Benchmark complex structure round-trip
  const complexMap = new Map<string, MessagePackValue>();
  complexMap.set("int", new MessagePackInteger(123));
  complexMap.set("str", new MessagePackString("test"));
  complexMap.set("bool", new MessagePackBoolean(true));
  complexMap.set("array", new MessagePackArray([
    new MessagePackInteger(1),
    new MessagePackInteger(2),
    new MessagePackInteger(3)
  ]));
  const complexValue = new MessagePackMap(complexMap);
  
  const complexStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const encoded = encoder.encode(complexValue);
    const decoder = new MessagePackDecoder(encoded);
    decoder.decode();
  }
  const complexEndTime = Date.now();
  results.push(new BenchmarkResult("Complex Round-trip", iterations, timeDiff(complexEndTime, complexStartTime)));

  return results;
}

/**
 * Print benchmark results in a formatted table
 */
export function printBenchmarkResults(results: BenchmarkResult[]): void {
  console.log("\n=== Performance Benchmark Results ===");
  console.log("Operation                | Iterations | Total (ms) | Avg (ms)  | Ops/sec");
  console.log("-------------------------|------------|------------|-----------|----------");
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const operation = result.operation.padEnd(24);
    const iterations = result.iterations.toString().padStart(10);
    const totalTime = formatFloat(result.totalTimeMs, 2).padStart(10);
    const avgTime = formatFloat(result.avgTimeMs, 4).padStart(9);
    const throughput = formatFloat(result.throughputOpsPerSec, 0).padStart(9);
    
    console.log(operation + " | " + iterations + " | " + totalTime + " | " + avgTime + " | " + throughput);
  }
  console.log("");
}

/**
 * Test round-trip operations with comprehensive validation
 */
export function testComprehensiveRoundTrip(): boolean {
  console.log("Running comprehensive round-trip validation...");
  
  let allPassed = true;
  
  // Test data integrity for all types
  allPassed = testDataIntegrityBasicTypes() && allPassed;
  allPassed = testDataIntegrityStrings() && allPassed;
  allPassed = testDataIntegrityBinary() && allPassed;
  allPassed = testDataIntegrityComplexStructures() && allPassed;
  
  if (allPassed) {
    console.log("✅ All comprehensive round-trip tests passed!");
  } else {
    console.log("❌ Some comprehensive round-trip tests failed!");
  }
  
  return allPassed;
}

/**
 * Run all performance benchmarks
 */
export function runPerformanceBenchmarks(): boolean {
  console.log("=== MessagePack Performance Benchmarks ===");
  
  // Run encoding benchmarks
  const encodingResults = benchmarkEncoding();
  printBenchmarkResults(encodingResults);
  
  // Run decoding benchmarks
  const decodingResults = benchmarkDecoding();
  printBenchmarkResults(decodingResults);
  
  // Run round-trip benchmarks
  const roundTripResults = benchmarkRoundTrip();
  printBenchmarkResults(roundTripResults);
  
  console.log("✅ Performance benchmarks completed!");
  return true;
}

/**
 * Main function to run all round-trip tests and benchmarks
 */
export function runRoundTripTests(): boolean {
  console.log("=== MessagePack Round-trip Testing and Validation ===");
  
  let allPassed = true;
  
  // Run comprehensive round-trip validation
  allPassed = testComprehensiveRoundTrip() && allPassed;
  
  // Run performance benchmarks
  runPerformanceBenchmarks();
  
  if (allPassed) {
    console.log("\n🎉 All round-trip tests and benchmarks completed successfully!");
  } else {
    console.log("\n❌ Some round-trip tests failed!");
  }
  
  return allPassed;
}