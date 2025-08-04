/**
 * Performance Optimization Tests for Class Serialization
 * 
 * These tests validate the performance optimizations implemented in task 11:
 * - Field value caching for frequently accessed fields
 * - Metadata lookup optimization with pre-computed field mappings
 * - Fast paths for common field types (boolean, integer, string)
 * - Buffer reuse capabilities for encoder/decoder instances
 */

import {
    ClassRegistry,
    FieldMetadata,
    SerializableFieldType,
    ClassSerializationEncoder,
    ClassSerializationDecoder,
    Serializable,
    ClassFactory
} from "../class-serialization";
import {
    MessagePackValue,
    MessagePackString,
    MessagePackInteger,
    MessagePackBoolean,
    MessagePackFloat
} from "../types";
import { MessagePackEncoder } from "../encoder";
import { MessagePackDecoder } from "../decoder";

// ============================================================================
// Test Classes for Performance Testing
// ============================================================================

/**
 * Simple class with only basic types for fast path testing
 */
class SimplePerformanceClass implements Serializable {
    name: string = "";
    age: i32 = 0;
    isActive: boolean = false;
    score: f64 = 0.0;

    constructor(name: string = "", age: i32 = 0, isActive: boolean = false, score: f64 = 0.0) {
        this.name = name;
        this.age = age;
        this.isActive = isActive;
        this.score = score;
    }

    getClassName(): string {
        return "SimplePerformanceClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "name") {
            return new MessagePackString(this.name);
        } else if (fieldName === "age") {
            return new MessagePackInteger(this.age);
        } else if (fieldName === "isActive") {
            return new MessagePackBoolean(this.isActive);
        } else if (fieldName === "score") {
            return new MessagePackFloat(this.score);
        } else {
            return null;
        }
    }
}

/**
 * Factory for SimplePerformanceClass
 */
class SimplePerformanceClassFactory implements ClassFactory {
    create(): Serializable {
        return new SimplePerformanceClass();
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const simpleInstance = instance as SimplePerformanceClass;
        if (fieldName === "name") {
            simpleInstance.name = (value as MessagePackString).value;
        } else if (fieldName === "age") {
            simpleInstance.age = (value as MessagePackInteger).value as i32;
        } else if (fieldName === "isActive") {
            simpleInstance.isActive = (value as MessagePackBoolean).value;
        } else if (fieldName === "score") {
            simpleInstance.score = (value as MessagePackFloat).value;
        }
    }
}

// ============================================================================
// Performance Optimization Tests
// ============================================================================

/**
 * Test metadata caching performance
 */
export function testMetadataCaching(): boolean {
    console.log("Testing metadata caching performance...");

    // Clear registry and register test class
    ClassRegistry.clear();
    ClassRegistry.register("SimplePerformanceClass", [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN),
        new FieldMetadata("score", SerializableFieldType.FLOAT)
    ]);

    // Reset cache stats
    ClassRegistry.resetCacheStats();

    // Access metadata multiple times to test caching
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
        const metadata = ClassRegistry.getMetadata("SimplePerformanceClass");
        if (metadata === null) {
            console.log("✗ Failed to get metadata");
            return false;
        }
    }

    // Check cache statistics
    const stats = ClassRegistry.getCacheStats();
    console.log(`  Cache hits: ${stats.hits}, misses: ${stats.misses}, hit rate: ${stats.hitRate}`);

    // After first access, all subsequent accesses should be cache hits
    if (stats.hits < iterations - 1) {
        console.log("✗ Cache hit rate too low");
        return false;
    }

    console.log("✓ Metadata caching test passed");
    return true;
}

/**
 * Test optimized field mapping performance
 */
export function testOptimizedFieldMapping(): boolean {
    console.log("Testing optimized field mapping...");

    // Clear registry and register test class
    ClassRegistry.clear();
    ClassRegistry.register("SimplePerformanceClass", [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN),
        new FieldMetadata("score", SerializableFieldType.FLOAT)
    ]);

    // Get optimized mapping
    const mapping = ClassRegistry.getOptimizedMapping("SimplePerformanceClass");
    if (mapping === null) {
        console.log("✗ Failed to get optimized mapping");
        return false;
    }

    // Test fast path capability
    if (!mapping.canUseFastPath()) {
        console.log("✗ Simple class should be able to use fast path");
        return false;
    }

    // Test field index lookup
    const nameIndex = mapping.getFieldIndex("name");
    const ageIndex = mapping.getFieldIndex("age");
    const invalidIndex = mapping.getFieldIndex("nonexistent");

    if (nameIndex < 0 || ageIndex < 0 || invalidIndex !== -1) {
        console.log("✗ Field index lookup failed");
        return false;
    }

    // Test field metadata by index
    const nameField = mapping.getFieldByIndex(nameIndex);
    if (nameField === null || nameField.name !== "name") {
        console.log("✗ Field metadata by index failed");
        return false;
    }

    console.log("✓ Optimized field mapping test passed");
    return true;
}

/**
 * Test fast path serialization performance
 */
export function testFastPathSerialization(): boolean {
    console.log("Testing fast path serialization...");

    // Clear registry and register test class
    ClassRegistry.clear();
    ClassRegistry.register("SimplePerformanceClass", [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN),
        new FieldMetadata("score", SerializableFieldType.FLOAT)
    ]);

    // Create encoder with buffer reuse
    const messagePackEncoder = new MessagePackEncoder();
    const encoder = new ClassSerializationEncoder(messagePackEncoder, true);

    // Create test instance
    const instance = new SimplePerformanceClass("Alice", 30, true, 95.5);

    // Test serialization
    const serialized = encoder.encodeClass(instance);
    if (serialized.length === 0) {
        console.log("✗ Serialization failed");
        return false;
    }

    // Test multiple serializations to check buffer reuse
    const iterations = 50;
    for (let i = 0; i < iterations; i++) {
        const testInstance = new SimplePerformanceClass(`User${i}`, i, i % 2 === 0, i * 1.5);
        const result = encoder.encodeClass(testInstance);
        if (result.length === 0) {
            console.log("✗ Multiple serialization failed");
            return false;
        }
    }

    // Check cache statistics
    const cacheStats = encoder.getCacheStats();
    console.log(`  Encoder cache hits: ${cacheStats.hits}, misses: ${cacheStats.misses}, hit rate: ${cacheStats.hitRate}`);

    console.log("✓ Fast path serialization test passed");
    return true;
}

/**
 * Test fast path deserialization performance
 */
export function testFastPathDeserialization(): boolean {
    console.log("Testing fast path deserialization...");

    // Clear registry and register test class
    ClassRegistry.clear();
    ClassRegistry.register("SimplePerformanceClass", [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN),
        new FieldMetadata("score", SerializableFieldType.FLOAT)
    ]);

    // Create encoder and serialize test data
    const messagePackEncoder = new MessagePackEncoder();
    const encoder = new ClassSerializationEncoder(messagePackEncoder);
    const instance = new SimplePerformanceClass("Bob", 25, false, 87.3);
    const serialized = encoder.encodeClass(instance);

    // Create decoder with buffer reuse
    const messagePackDecoder = new MessagePackDecoder(serialized);
    const decoder = new ClassSerializationDecoder(messagePackDecoder, true);
    const factory = new SimplePerformanceClassFactory();

    // Test deserialization
    const deserialized = decoder.decodeClass(factory, "SimplePerformanceClass") as SimplePerformanceClass;
    if (deserialized.name !== "Bob" || deserialized.age !== 25 || deserialized.isActive !== false) {
        console.log("✗ Deserialization failed");
        return false;
    }

    // Test multiple deserializations
    const iterations = 50;
    for (let i = 0; i < iterations; i++) {
        const testInstance = new SimplePerformanceClass(`User${i}`, i, i % 2 === 0, i * 1.5);
        const testSerialized = encoder.encodeClass(testInstance);
        
        const testDecoder = new MessagePackDecoder(testSerialized);
        const testDecoderWrapper = new ClassSerializationDecoder(testDecoder, true);
        const testDeserialized = testDecoderWrapper.decodeClass(factory, "SimplePerformanceClass") as SimplePerformanceClass;
        
        if (testDeserialized.name !== `User${i}` || testDeserialized.age !== i) {
            console.log("✗ Multiple deserialization failed");
            return false;
        }
    }

    console.log("✓ Fast path deserialization test passed");
    return true;
}

/**
 * Test buffer reuse capabilities
 */
export function testBufferReuse(): boolean {
    console.log("Testing buffer reuse capabilities...");

    // Clear registry and register test class
    ClassRegistry.clear();
    ClassRegistry.register("SimplePerformanceClass", [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN),
        new FieldMetadata("score", SerializableFieldType.FLOAT)
    ]);

    // Test encoder buffer reuse
    const messagePackEncoder = new MessagePackEncoder();
    const encoder = new ClassSerializationEncoder(messagePackEncoder, false);
    
    // Enable buffer reuse
    encoder.setBufferReuse(true);
    
    // Test multiple serializations
    const iterations = 20;
    for (let i = 0; i < iterations; i++) {
        const instance = new SimplePerformanceClass(`Test${i}`, i, i % 2 === 0, i * 2.5);
        const serialized = encoder.encodeClass(instance);
        if (serialized.length === 0) {
            console.log("✗ Buffer reuse serialization failed");
            return false;
        }
    }

    // Clear cache and test
    encoder.clearFieldValueCache();
    const cacheStats = encoder.getCacheStats();
    if (cacheStats.cacheSize !== 0) {
        console.log("✗ Cache clear failed");
        return false;
    }

    console.log("✓ Buffer reuse test passed");
    return true;
}

/**
 * Test performance comparison between optimized and standard paths
 */
export function testPerformanceComparison(): boolean {
    console.log("Testing performance comparison...");

    // Clear registry and register test class
    ClassRegistry.clear();
    ClassRegistry.register("SimplePerformanceClass", [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN),
        new FieldMetadata("score", SerializableFieldType.FLOAT)
    ]);

    const iterations = 100000;
    const instances: SimplePerformanceClass[] = [];

    // Create test instances
    for (let i = 0; i < iterations; i++) {
        instances.push(new SimplePerformanceClass(`User${i}`, i, i % 2 === 0, i * 1.5));
    }

    // Test optimized serialization
    const optimizedEncoder = new ClassSerializationEncoder(new MessagePackEncoder(), true);
    const optimizedStartTime = Date.now();
    
    for (let i = 0; i < instances.length; i++) {
        const serialized = optimizedEncoder.encodeClass(instances[i]);
        if (serialized.length === 0) {
            console.log("✗ Optimized serialization failed");
            return false;
        }
    }
    
    const optimizedEndTime = Date.now();
    const optimizedTime = optimizedEndTime - optimizedStartTime;

    // Test standard serialization (without buffer reuse)
    const standardEncoder = new ClassSerializationEncoder(new MessagePackEncoder(), false);
    const standardStartTime = Date.now();
    
    for (let i = 0; i < instances.length; i++) {
        const serialized = standardEncoder.encodeClass(instances[i]);
        if (serialized.length === 0) {
            console.log("✗ Standard serialization failed");
            return false;
        }
    }
    
    const standardEndTime = Date.now();
    const standardTime = standardEndTime - standardStartTime;

    console.log(`  Optimized time: ${optimizedTime}ms, Standard time: ${standardTime}ms`);
    
    // The optimized version should be at least as fast (allowing for measurement variance)
    if (optimizedTime > standardTime * 2) {
        console.log("✗ Optimized version is significantly slower");
        return false;
    }

    console.log("✓ Performance comparison test passed");
    return true;
}

/**
 * Run all performance optimization tests
 */
export function runPerformanceOptimizationTests(): boolean {
    console.log("=== Performance Optimization Tests ===");

    let passed = 0;
    let total = 0;

    const tests = [
        testMetadataCaching,
        testOptimizedFieldMapping,
        testFastPathSerialization,
        testFastPathDeserialization,
        testBufferReuse,
        testPerformanceComparison
    ];

    for (let i = 0; i < tests.length; i++) {
        total++;
        if (tests[i]()) {
            passed++;
        }
    }

    console.log(`Performance Optimization tests: ${passed}/${total} passed\n`);
    return passed === total;
}
