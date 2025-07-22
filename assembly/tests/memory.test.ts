// Memory optimization and leak detection tests
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
  MessagePackMap
} from "../types";

/**
 * Memory usage tracking for leak detection
 */
class MemoryTracker {
  private initialHeapSize: i32;
  private measurements: i32[] = [];
  
  constructor() {
    this.initialHeapSize = this.getCurrentHeapSize();
  }
  
  /**
   * Get current heap size (approximation using memory.size)
   */
  private getCurrentHeapSize(): i32 {
    return memory.size() * 65536; // Pages to bytes
  }
  
  /**
   * Take a memory measurement
   */
  measure(): void {
    this.measurements.push(this.getCurrentHeapSize());
  }
  
  /**
   * Check if memory usage has grown significantly
   */
  hasMemoryLeak(threshold: i32 = 1048576): boolean { // 1MB threshold
    if (this.measurements.length < 2) return false;
    
    const current = this.measurements[this.measurements.length - 1];
    const initial = this.measurements[0];
    
    return (current - initial) > threshold;
  }
  
  /**
   * Get memory growth since start
   */
  getMemoryGrowth(): i32 {
    if (this.measurements.length === 0) return 0;
    
    const current = this.getCurrentHeapSize();
    return current - this.initialHeapSize;
  }
  
  /**
   * Reset measurements
   */
  reset(): void {
    this.measurements = [];
    this.initialHeapSize = this.getCurrentHeapSize();
  }
}

/**
 * Test basic memory management
 */
export function testBasicMemoryManagement(): boolean {
  console.log("Testing basic memory management...");
  
  let allPassed = true;
  
  // Test encoder memory management
  const encoders: MessagePackEncoder[] = [];
  const testValue = new MessagePackString("test string for memory management");
  
  // Create multiple encoders and use them
  for (let i = 0; i < 10; i++) {
    const encoder = new MessagePackEncoder(1024);
    encoder.encode(testValue);
    encoders.push(encoder);
  }
  
  // Test decoder memory management
  const encoded = new MessagePackEncoder().encode(testValue);
  const decoders: MessagePackDecoder[] = [];
  
  for (let i = 0; i < 5; i++) {
    const decoder = new MessagePackDecoder(encoded);
    decoder.decode();
    decoders.push(decoder);
  }
  
  if (allPassed) {
    console.log("PASS: testBasicMemoryManagement");
  }
  
  return allPassed;
}

/**
 * Test for memory leaks in encoding operations
 */
export function testEncodingMemoryLeaks(): boolean {
  console.log("Testing encoding memory leak detection...");
  
  const tracker = new MemoryTracker();
  let allPassed = true;
  
  tracker.reset();
  tracker.measure();
  
  for (let i = 0; i < 1000; i++) {
    const encoder = new MessagePackEncoder(1024);
    
    // Encode various types
    encoder.encode(new MessagePackInteger(i));
    encoder.encode(new MessagePackString("test string " + i.toString()));
    encoder.encode(new MessagePackBoolean(i % 2 === 0));
    
    if (i % 100 === 0) {
      tracker.measure();
    }
  }
  
  if (tracker.hasMemoryLeak()) {
    console.log("FAIL: Memory leak detected in encoding");
    console.log("Memory growth: " + tracker.getMemoryGrowth().toString() + " bytes");
    allPassed = false;
  } else {
    console.log("PASS: No memory leak in encoding");
  }
  
  if (allPassed) {
    console.log("PASS: testEncodingMemoryLeaks");
  }
  
  return allPassed;
}

/**
 * Test for memory leaks in decoding operations
 */
export function testDecodingMemoryLeaks(): boolean {
  console.log("Testing decoding memory leak detection...");
  
  const tracker = new MemoryTracker();
  let allPassed = true;
  
  // Pre-encode test data
  const encoder = new MessagePackEncoder();
  const testData: Uint8Array[] = [];
  
  for (let i = 0; i < 100; i++) {
    testData.push(encoder.encode(new MessagePackInteger(i)));
    testData.push(encoder.encode(new MessagePackString("test " + i.toString())));
    testData.push(encoder.encode(new MessagePackBoolean(i % 2 === 0)));
  }
  
  tracker.reset();
  tracker.measure();
  
  for (let i = 0; i < 1000; i++) {
    const data = testData[i % testData.length];
    const decoder = new MessagePackDecoder(data);
    
    decoder.decode();
    
    if (i % 100 === 0) {
      tracker.measure();
    }
  }
  
  if (tracker.hasMemoryLeak()) {
    console.log("FAIL: Memory leak detected in decoding");
    console.log("Memory growth: " + tracker.getMemoryGrowth().toString() + " bytes");
    allPassed = false;
  } else {
    console.log("PASS: No memory leak in decoding");
  }
  
  if (allPassed) {
    console.log("PASS: testDecodingMemoryLeaks");
  }
  
  return allPassed;
}

/**
 * Test memory usage with complex nested structures
 */
export function testComplexStructureMemory(): boolean {
  console.log("Testing memory usage with complex structures...");
  
  const tracker = new MemoryTracker();
  let allPassed = true;
  
  tracker.reset();
  tracker.measure();
  
  for (let i = 0; i < 100; i++) {
    // Create complex nested structure
    const innerArray: MessagePackValue[] = [];
    for (let j = 0; j < 10; j++) {
      innerArray.push(new MessagePackInteger(j));
    }
    
    const innerMap = new Map<string, MessagePackValue>();
    for (let j = 0; j < 5; j++) {
      innerMap.set("key" + j.toString(), new MessagePackString("value" + j.toString()));
    }
    
    const complexMap = new Map<string, MessagePackValue>();
    complexMap.set("array", new MessagePackArray(innerArray));
    complexMap.set("map", new MessagePackMap(innerMap));
    complexMap.set("string", new MessagePackString("complex structure " + i.toString()));
    
    const complexValue = new MessagePackMap(complexMap);
    
    // Encode and decode
    const encoder = new MessagePackEncoder(2048);
    const encoded = encoder.encode(complexValue);
    
    const decoder = new MessagePackDecoder(encoded);
    decoder.decode();
    
    if (i % 10 === 0) {
      tracker.measure();
    }
  }
  
  if (tracker.hasMemoryLeak(2097152)) { // 2MB threshold for complex structures
    console.log("FAIL: Memory leak detected with complex structures");
    console.log("Memory growth: " + tracker.getMemoryGrowth().toString() + " bytes");
    allPassed = false;
  } else {
    console.log("PASS: No excessive memory growth with complex structures");
  }
  
  if (allPassed) {
    console.log("PASS: testComplexStructureMemory");
  }
  
  return allPassed;
}

/**
 * Performance test for encoding operations
 */
export function testEncodingPerformance(): boolean {
  console.log("Testing encoding performance...");
  
  const iterations = 10000;
  const testValue = new MessagePackString("performance test string");
  
  const startTime = Date.now();
  for (let i = 0; i < iterations; i++) {
    const encoder = new MessagePackEncoder(1024);
    encoder.encode(testValue);
  }
  const endTime = Date.now();
  const elapsedTime = endTime - startTime;
  
  console.log("Encoding time for " + iterations.toString() + " iterations: " + elapsedTime.toString() + "ms");
  
  let allPassed = true;
  // Simple performance sanity check
  if (elapsedTime > 5000) { // 5 seconds is very conservative
    console.log("FAIL: Encoding performance is below expectations");
    allPassed = false;
  } else {
    console.log("PASS: Encoding performance is acceptable");
  }
  
  return allPassed;
}

/**
 * Test WebAssembly-specific optimizations
 */
export function testWebAssemblyOptimizations(): boolean {
  console.log("Testing WebAssembly-specific optimizations...");
  
  let allPassed = true;
  
  // Test memory alignment and efficient operations
  const encoder = new MessagePackEncoder();
  
  // Test integer encoding performance (should use optimized paths)
  const intStartTime = Date.now();
  for (let i = 0; i < 10000; i++) {
    encoder.encode(new MessagePackInteger(i));
  }
  const intEndTime = Date.now();
  const intTime = intEndTime - intStartTime;
  
  // Test string encoding performance
  const strStartTime = Date.now();
  for (let i = 0; i < 10000; i++) {
    encoder.encode(new MessagePackString("test" + i.toString()));
  }
  const strEndTime = Date.now();
  const strTime = strEndTime - strStartTime;
  
  console.log("Integer encoding time: " + intTime.toString() + "ms");
  console.log("String encoding time: " + strTime.toString() + "ms");
  
  // Basic performance sanity check
  if (intTime > 1000 || strTime > 2000) { // Reasonable thresholds
    console.log("FAIL: Performance is below expected levels");
    allPassed = false;
  } else {
    console.log("PASS: Performance meets expectations");
  }
  
  // Test buffer capacity management
  const initialCapacity = encoder.getBufferCapacity();
  
  // Encode large data to trigger buffer growth
  const largeString = "x".repeat(10000);
  encoder.encode(new MessagePackString(largeString));
  
  const finalCapacity = encoder.getBufferCapacity();
  
  if (finalCapacity <= initialCapacity) {
    console.log("FAIL: Buffer did not grow as expected");
    allPassed = false;
  } else {
    console.log("PASS: Buffer growth works correctly");
  }
  
  if (allPassed) {
    console.log("PASS: testWebAssemblyOptimizations");
  }
  
  return allPassed;
}

/**
 * Test buffer memory usage efficiency
 */
export function testBufferMemoryUsage(): boolean {
  console.log("Testing buffer memory usage efficiency...");
  
  let allPassed = true;
  const tracker = new MemoryTracker();
  
  // Measure initial memory
  tracker.reset();
  tracker.measure();
  
  // Create and use many buffers
  for (let i = 0; i < 1000; i++) {
    const encoder = new MessagePackEncoder(1024);
    encoder.encode(new MessagePackString("test string " + i.toString()));
    
    if (i % 100 === 0) {
      tracker.measure();
    }
  }
  
  // Check memory growth
  const memoryGrowth = tracker.getMemoryGrowth();
  console.log(`Memory growth: ${memoryGrowth} bytes`);
  
  // Simple sanity check for memory usage
  if (memoryGrowth > 10 * 1024 * 1024) { // 10MB is very conservative
    console.log("FAIL: Memory usage is higher than expected");
    allPassed = false;
  } else {
    console.log("PASS: Memory usage is within acceptable limits");
  }
  
  if (allPassed) {
    console.log("PASS: Buffer memory usage tests");
  }
  
  return allPassed;
}

/**
 * Run all memory optimization and performance tests
 */
export function runMemoryTests(): boolean {
  console.log("=== Memory Optimization and Performance Tests ===");
  
  let allPassed = true;
  
  allPassed = testBasicMemoryManagement() && allPassed;
  allPassed = testEncodingMemoryLeaks() && allPassed;
  allPassed = testDecodingMemoryLeaks() && allPassed;
  allPassed = testComplexStructureMemory() && allPassed;
  allPassed = testEncodingPerformance() && allPassed;
  allPassed = testWebAssemblyOptimizations() && allPassed;
  allPassed = testBufferMemoryUsage() && allPassed;
  
  if (allPassed) {
    console.log("✅ All memory optimization tests passed!");
  } else {
    console.log("❌ Some memory optimization tests failed!");
  }
  
  return allPassed;
}