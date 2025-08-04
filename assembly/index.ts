/**
 * MessagePack AssemblyScript Library
 * 
 * A high-performance MessagePack serialization library for AssemblyScript/WebAssembly.
 * MessagePack is an efficient binary serialization format that's more compact than JSON
 * while maintaining cross-platform compatibility.
 * 
 * ## Features
 * - Complete MessagePack format support (null, boolean, integers, floats, strings, binary, arrays, maps)
 * - Optimized for WebAssembly environments
 * - Type-safe encoding and decoding
 * - Efficient buffer management
 * - Comprehensive error handling
 * 
 * ## Basic Usage
 * 
 * ### Encoding
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
 * ### Decoding
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
 * @version 1.0.0
 * @author MessagePack AssemblyScript Library
 */


// Main encoder and decoder classes
export { MessagePackEncoder } from "./encoder";
export { MessagePackDecoder } from "./decoder";
export * from "./types"

// Class serialization system
export {
    SerializableFieldType,
    FieldMetadata,
    ClassMetadata,
    ClassRegistry,
    Serializable,
    ClassSerializationEncoder,
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
    booleanArrayToMessagePack,
    integer32ArrayToMessagePack,
    integer64ArrayToMessagePack,
    float32ArrayToMessagePack,
    float64ArrayToMessagePack,
    stringArrayToMessagePack
} from "./class-serialization";

// === Version Information ===

/**
 * Library version information
 */
export const VERSION = "1.0.0";

/**
 * MessagePack specification version supported by this library
 */
export const MESSAGEPACK_SPEC_VERSION = "5";

// === Development Exports (conditionally exported) ===

export {
  runAllClassSerializationTests
} from "./tests/class-serialization.test";

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
