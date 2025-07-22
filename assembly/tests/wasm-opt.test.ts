// WebAssembly-specific optimizations and tests
import { MessagePackEncoder, MessagePackDecoder } from "../index";
import {
  MessagePackInteger,
  MessagePackString,
  MessagePackValueType
} from "../types";

/**
 * Test WebAssembly memory alignment optimizations
 */
export function testMemoryAlignment(): boolean {
  console.log("Testing WebAssembly memory alignment optimizations...");

  let allPassed = true;

  // Test aligned memory access
  const encoder = new MessagePackEncoder(1024);

  // Create test data with various alignments
  const testStrings = [
    "a".repeat(1),    // 1-byte alignment
    "a".repeat(2),    // 2-byte alignment
    "a".repeat(4),    // 4-byte alignment
    "a".repeat(8),    // 8-byte alignment
    "a".repeat(16),   // 16-byte alignment
    "a".repeat(32),   // 32-byte alignment
  ];

  // Encode and decode each string
  for (let i = 0; i < testStrings.length; i++) {
    const str = testStrings[i];
    const encoded = encoder.encode(new MessagePackString(str));

    // Decode and verify
    const decoder = new MessagePackDecoder(encoded);
    const decoded = decoder.decode();

    if (decoded.getType() !== MessagePackValueType.STRING) {
      console.log(`FAIL: Memory alignment test - wrong type for ${str.length}-byte string`);
      allPassed = false;
      continue;
    }

    const decodedStr = (decoded as MessagePackString).value;
    if (decodedStr !== str) {
      console.log(`FAIL: Memory alignment test - wrong value for ${str.length}-byte string`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("PASS: Memory alignment tests");
  }

  return allPassed;
}

/**
 * Test WebAssembly memory growth handling
 */
export function testMemoryGrowth(): boolean {
  console.log("Testing WebAssembly memory growth handling...");

  let allPassed = true;

  // Create a large string that will require memory growth
  const largeString = "x".repeat(1000000); // 1MB string

  // Encode the large string
  const encoder = new MessagePackEncoder(1024); // Start with small buffer
  const encoded = encoder.encode(new MessagePackString(largeString));

  // Decode and verify
  const decoder = new MessagePackDecoder(encoded);
  const decoded = decoder.decode();

  if (decoded.getType() !== MessagePackValueType.STRING) {
    console.log("FAIL: Memory growth test - wrong type");
    allPassed = false;
  } else {
    const decodedStr = (decoded as MessagePackString).value;
    if (decodedStr.length !== largeString.length) {
      console.log(`FAIL: Memory growth test - wrong length: ${decodedStr.length} vs ${largeString.length}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("PASS: Memory growth tests");
  }

  return allPassed;
}

/**
 * Test buffer management with WebAssembly memory
 */
export function testWasmBufferManagement(): boolean {
  console.log("Testing WebAssembly buffer management...");

  let allPassed = true;

  // Create multiple buffers with different capacities
  const encoder1 = new MessagePackEncoder(1024);
  const encoder2 = new MessagePackEncoder(2048);
  const encoder3 = new MessagePackEncoder(4096);

  // Test buffer capacity
  if (encoder1.getBufferCapacity() < 1024) {
    console.log(`FAIL: Buffer capacity should be at least 1024, got ${encoder1.getBufferCapacity()}`);
    allPassed = false;
  }

  if (encoder2.getBufferCapacity() < 2048) {
    console.log(`FAIL: Buffer capacity should be at least 2048, got ${encoder2.getBufferCapacity()}`);
    allPassed = false;
  }

  if (encoder3.getBufferCapacity() < 4096) {
    console.log(`FAIL: Buffer capacity should be at least 4096, got ${encoder3.getBufferCapacity()}`);
    allPassed = false;
  }

  // Test buffer growth
  const largeString = "x".repeat(2000);
  encoder1.encode(new MessagePackString(largeString));
  
  if (encoder1.getBufferCapacity() < 2000) {
    console.log(`FAIL: Buffer should have grown to accommodate string, capacity: ${encoder1.getBufferCapacity()}`);
    allPassed = false;
  }

  if (allPassed) {
    console.log("PASS: WebAssembly buffer management tests");
  }

  return allPassed;
}

/**
 * Test WebAssembly-specific performance optimizations
 */
export function testWasmPerformanceOptimizations(): boolean {
  console.log("Testing WebAssembly performance optimizations...");

  let allPassed = true;

  // Test integer encoding performance (should use optimized paths)
  const encoder = new MessagePackEncoder();
  const iterations = 10000;

  // Benchmark integer encoding
  const intStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    encoder.encode(new MessagePackInteger(i));
  }
  const intEndTime = Date.now();
  const intTime = intEndTime - intStartTime;

  console.log(`Integer encoding time: ${intTime}ms for ${iterations} iterations`);

  // Benchmark string encoding
  const strStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    encoder.encode(new MessagePackString("test" + i.toString()));
  }
  const strEndTime = Date.now();
  const strTime = strEndTime - strStartTime;

  console.log(`String encoding time: ${strTime}ms for ${iterations} iterations`);

  // Benchmark reusing encoder vs creating new ones
  const reuseStartTime = Date.now();
  const reuseEncoder = new MessagePackEncoder(1024);
  for (let i = 0; i < iterations; i++) {
    reuseEncoder.encode(new MessagePackInteger(i));
    reuseEncoder.reset();
  }
  const reuseEndTime = Date.now();
  const reuseTime = reuseEndTime - reuseStartTime;

  const newStartTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const encoder = new MessagePackEncoder(1024);
    encoder.encode(new MessagePackInteger(i));
  }
  const newEndTime = Date.now();
  const newTime = newEndTime - newStartTime;

  console.log(`Reusing encoder time: ${reuseTime}ms for ${iterations} iterations`);
  console.log(`Creating new encoders time: ${newTime}ms for ${iterations} iterations`);

  // Check that performance is reasonable
  if (intTime > 1000 || strTime > 2000) {
    console.log("FAIL: Performance is below expected levels");
    allPassed = false;
  }

  if (allPassed) {
    console.log("PASS: WebAssembly performance optimization tests");
  }

  return allPassed;
}

/**
 * Run all WebAssembly optimization tests
 */
export function runWasmOptimizationTests(): boolean {
  console.log("=== WebAssembly Optimization Tests ===");

  let allPassed = true;

  allPassed = testMemoryAlignment() && allPassed;
  allPassed = testMemoryGrowth() && allPassed;
  allPassed = testWasmBufferManagement() && allPassed;
  allPassed = testWasmPerformanceOptimizations() && allPassed;

  if (allPassed) {
    console.log("✅ All WebAssembly optimization tests passed!");
  } else {
    console.log("❌ Some WebAssembly optimization tests failed!");
  }

  return allPassed;
}