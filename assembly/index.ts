/**
 * MessagePack AssemblyScript Library
 * 
 * A high-performance MessagePack serialization library for AssemblyScript/WebAssembly.
 * MessagePack is an efficient binary serialization format that's more compact than JSON
 * while maintaining cross-platform compatibility.
 * 
 * ## Features
 * - Complete MessagePack format support (null, boolean, integers, floats, strings, binary, arrays, maps)
 * - **Class serialization and deserialization** with automatic field mapping
 * - **Type-safe class registration** with metadata validation
 * - **Nested class support** for complex object graphs
 * - **Optional field handling** with default value support
 * - Optimized for WebAssembly environments
 * - Type-safe encoding and decoding
 * - Efficient buffer management
 * - Comprehensive error handling with detailed context
 * - Memory optimization utilities with buffer pooling
 * - Extensive test suite with real-world data patterns
 * - Cross-compatibility with other MessagePack implementations
 * 
 * ## Basic Usage
 * 
 * ### Encoding Basic Types
 * ```typescript
 * import { MessagePackEncoder } from "./index";
 * 
 * const encoder = new MessagePackEncoder();
 * 
 * // Encode basic types
 * const nullBytes = encoder.encodeNull();
 * const boolBytes = encoder.encodeBoolean(true);
 * const intBytes = encoder.encodeInteger(42);
 * const floatBytes = encoder.encodeFloat(3.14);
 * const stringBytes = encoder.encodeString("hello");
 * 
 * // Encode complex types using MessagePackValue wrappers
 * import { MessagePackString, MessagePackInteger, MessagePackArray } from "./index";
 * 
 * const arrayValue = new MessagePackArray([
 *   new MessagePackString("hello"),
 *   new MessagePackInteger(42)
 * ]);
 * const arrayBytes = encoder.encode(arrayValue);
 * ```
 * 
 * ### Decoding Basic Types
 * ```typescript
 * import { MessagePackDecoder, MessagePackValueType } from "./index";
 * 
 * const decoder = new MessagePackDecoder(encodedBytes);
 * const value = decoder.decode();
 * 
 * // Check the type and extract the value
 * if (value.getType() === MessagePackValueType.STRING) {
 *   const stringValue = (value as MessagePackString).value;
 *   console.log("Decoded string:", stringValue);
 * }
 * ```
 * 
 * ## Class Serialization
 * 
 * ### Defining Serializable Classes
 * ```typescript
 * import { 
 *   Serializable, 
 *   MessagePackValue, 
 *   toMessagePackString, 
 *   toMessagePackInteger32,
 *   toMessagePackBoolean,
 *   ClassRegistrationBuilder
 * } from "./index";
 * 
 * class User implements Serializable {
 *   name: string;
 *   age: i32;
 *   isActive: boolean;
 * 
 *   constructor(name: string, age: i32, isActive: boolean) {
 *     this.name = name;
 *     this.age = age;
 *     this.isActive = isActive;
 *   }
 * 
 *   getClassName(): string {
 *     return "User";
 *   }
 * 
 *   getFieldValue(fieldName: string): MessagePackValue | null {
 *     if (fieldName === "name") {
 *       return toMessagePackString(this.name);
 *     } else if (fieldName === "age") {
 *       return toMessagePackInteger32(this.age);
 *     } else if (fieldName === "isActive") {
 *       return toMessagePackBoolean(this.isActive);
 *     }
 *     return null;
 *   }
 * 
 *   // Register the class for serialization
 *   static register(): void {
 *     new ClassRegistrationBuilder("User")
 *       .addStringField("name")
 *       .addIntegerField("age")
 *       .addBooleanField("isActive")
 *       .register();
 *   }
 * }
 * ```
 * 
 * ### Serializing and Deserializing Classes
 * ```typescript
 * import { 
 *   ClassSerializationEncoder, 
 *   ClassSerializationDecoder,
 *   MessagePackEncoder,
 *   MessagePackDecoder,
 *   ClassFactory,
 *   SerializationUtils
 * } from "./index";
 * 
 * // Register the class first
 * User.register();
 * 
 * // Create and serialize a user
 * const user = new User("Alice", 30, true);
 * const serializedData = SerializationUtils.serialize(user);
 * 
 * // Create a factory for deserialization
 * class UserFactory implements ClassFactory {
 *   create(): Serializable {
 *     return new User("", 0, false);
 *   }
 * 
 *   setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
 *     const user = instance as User;
 *     if (fieldName === "name") {
 *       user.name = (value as MessagePackString).value;
 *     } else if (fieldName === "age") {
 *       user.age = (value as MessagePackInteger).value as i32;
 *     } else if (fieldName === "isActive") {
 *       user.isActive = (value as MessagePackBoolean).value;
 *     }
 *   }
 * }
 * 
 * // Deserialize back to a user object
 * const factory = new UserFactory();
 * const deserializedUser = SerializationUtils.deserialize(serializedData, factory, "User") as User;
 * ```
 * 
 * ### Batch Class Registration
 * ```typescript
 * import { BatchClassRegistration, ClassRegistrationBuilder } from "./index";
 * 
 * // Register multiple classes at once
 * new BatchClassRegistration()
 *   .createClass("User")
 *     .addStringField("name")
 *     .addIntegerField("age")
 *     .addBooleanField("isActive")
 *   .createClass("Product")
 *     .addStringField("title")
 *     .addFloatField("price")
 *     .addStringField("description", true) // optional field
 *   .registerAll();
 * ```
 * 
 * ### Working with Nested Classes
 * ```typescript
 * // Register classes with nested relationships
 * new ClassRegistrationBuilder("Company")
 *   .addStringField("name")
 *   .addClassField("founder", "User") // nested User object
 *   .addArrayField("employees") // array of User objects
 *   .register();
 * ```
 * 
 * ## Advanced Usage
 * 
 * ### Working with Maps
 * ```typescript
 * import { MessagePackEncoder, MessagePackMap, MessagePackString, MessagePackInteger } from "./index";
 * 
 * const map = new Map<string, MessagePackValue>();
 * map.set("name", new MessagePackString("Alice"));
 * map.set("age", new MessagePackInteger(30));
 * 
 * const encoder = new MessagePackEncoder();
 * const mapBytes = encoder.encode(new MessagePackMap(map));
 * ```
 * 
 * ### Error Handling
 * ```typescript
 * import { 
 *   MessagePackDecoder, 
 *   MessagePackDecodeError,
 *   ClassSerializationError,
 *   ClassDeserializationError
 * } from "./index";
 * 
 * try {
 *   const decoder = new MessagePackDecoder(invalidBytes);
 *   const value = decoder.decode();
 * } catch (error) {
 *   if (error instanceof MessagePackDecodeError) {
 *     console.log("Decode error at position:", error.position);
 *     console.log("Error context:", error.context);
 *   }
 * }
 * 
 * try {
 *   const serializedData = SerializationUtils.serialize(unregisteredClassInstance);
 * } catch (error) {
 *   if (error instanceof ClassSerializationError) {
 *     console.log("Serialization error:", error.message);
 *   }
 * }
 * ```
 * 
 * ### Memory Optimization
 * ```typescript
 * import { BufferPool } from "./index";
 * 
 * // Create a buffer pool for reusing memory
 * const bufferPool = new BufferPool(5, 1024); // 5 buffers of 1KB each
 * 
 * // Get a buffer from the pool
 * const buffer = bufferPool.acquire();
 * 
 * // Use the buffer for some operation
 * // ...
 * 
 * // Return the buffer to the pool when done
 * bufferPool.release(buffer);
 * 
 * // Check pool statistics
 * const stats = bufferPool.getStats();
 * console.log(`Total buffers: ${stats.totalBuffers}, Available: ${stats.availableBuffers}`);
 * ```
 * 
 * @version 1.1.0
 * @author MessagePack AssemblyScript Library Team
 * @since 1.0.0
 */

// === Core MessagePack Components ===

/**
 * Main encoder class for converting AssemblyScript values to MessagePack binary format
 */
export { MessagePackEncoder } from "./encoder";

/**
 * Main decoder class for converting MessagePack binary format to AssemblyScript values
 */
export { MessagePackDecoder } from "./decoder";

/**
 * All MessagePack value types, enums, and error classes
 */
export * from "./types"

// === Class Serialization System ===

/**
 * Core class serialization components for automatic object serialization
 */
export {
    // Metadata and registry system
    SerializableFieldType,
    FieldMetadata,
    ClassMetadata,
    ClassRegistry,
    
    // Interfaces for serializable classes
    Serializable,
    ClassFactory,
    
    // Encoder and decoder extensions
    ClassSerializationEncoder,
    ClassSerializationDecoder,
    
    // Error handling
    ClassSerializationError,
    ClassDeserializationError,
    
    // Type conversion utilities
    toMessagePackBoolean,
    toMessagePackInteger32,
    toMessagePackInteger64,
    toMessagePackUnsigned32,
    toMessagePackUnsigned64,
    toMessagePackFloat32,
    toMessagePackFloat64,
    toMessagePackString,
    toMessagePackBinary,
    toMessagePackArray,
    toMessagePackMap,
    toMessagePackNull,
    toMessagePackNullableString,
    toMessagePackNullableBinary,
    
    // Array conversion utilities
    booleanArrayToMessagePack,
    integer32ArrayToMessagePack,
    integer64ArrayToMessagePack,
    float32ArrayToMessagePack,
    float64ArrayToMessagePack,
    stringArrayToMessagePack,
    
    // Convenience utilities
    ClassRegistrationBuilder,
    BatchClassRegistration,
    SerializationUtils,
    
    // Example classes for reference
    ExamplePerson,
    ExamplePersonFactory,
    ExampleProject,
    ExampleProjectFactory,
    ExampleCompany,
    ExampleCompanyFactory,
    registerExampleClasses
} from "./class-serialization";

// === Buffer Management ===

/**
 * Buffer utilities for memory optimization
 */
export { GrowableBuffer, BufferReader } from "./buffer";

/**
 * MessagePack format constants
 */
export { Format } from "./format";

// === Version Information ===

/**
 * Library version information
 * @since 1.0.0
 */
export const VERSION = "1.1.0";

/**
 * MessagePack specification version supported by this library
 * @since 1.0.0
 */
export const MESSAGEPACK_SPEC_VERSION = "5";

/**
 * Feature flags indicating supported capabilities
 * @since 1.1.0
 */
export const BASIC_SERIALIZATION = true;
export const CLASS_SERIALIZATION = true;
export const NESTED_CLASSES = true;
export const OPTIONAL_FIELDS = true;
export const DETAILED_ERRORS = true;
export const CROSS_COMPATIBILITY = true;

// === Development and Testing Exports ===

/**
 * Test functions for development and validation
 * @dev These exports are intended for development and testing purposes
 */
export {
  runAllClassSerializationTests
} from "./tests/class-serialization.test";

/**
 * Export validation tests to verify all public APIs work correctly
 * @dev This test validates that all exports are functional
 */
export {
  runAllExportTests
} from "./tests/exports.test";

// Additional test exports (commented out but available for development)
// export {
//   runAllBufferTests
// } from "./tests/buffer.test";

// export {
//   runAllEncoderTests
// } from "./tests/encoder.test";

// export {
//   runDecoderTests
// } from "./tests/decoder.test";

// export {
//   runDecoderIntegrationTests
// } from "./tests/decoder.integration.test";

// export {
//   runErrorTests
// } from "./tests/error.test";

// export {
//   runRoundTripTests
// } from "./tests/roundtrip.test";

// export {
//   runMemoryTests
// } from "./tests/memory.test";

// export {
//   runWasmOptimizationTests
// } from "./tests/wasm-opt.test";

// export {
//   runCrossCompatibilityTests
// } from "./tests/cross-compat.test";
