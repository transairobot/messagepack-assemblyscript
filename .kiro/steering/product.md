---
inclusion: always
---

# MessagePack AssemblyScript Library

High-performance MessagePack serialization for AssemblyScript/WebAssembly. Prioritize performance and strict MessagePack specification compliance.

## Core Architecture

### Value Type System
All MessagePack values must:
- Extend `MessagePackValue` abstract base class
- Implement `encode(): u8[]` instance method  
- Provide static `decode(reader: BufferReader): ValueType` method
- Validate constructor inputs with descriptive errors

### Buffer Management
- Use `GrowableBuffer` for encoding (never manual allocation)
- Use `BufferReader` for decoding with bounds checking
- Never perform manual buffer copies
- Always include bounds checking for buffer operations

## Code Standards

### AssemblyScript Types
- Use native types: `i32`, `i64`, `u8`, `u16`, `u32`, `f32`, `f64`
- Use `u8[]` for binary data (never `Uint8Array`)
- Use `Map<K,V>` and `Array<T>` with explicit generics
- Provide explicit return types for all public methods

### Naming Conventions
- Classes: `PascalCase` (MessagePackEncoder, StringValue)
- Methods/variables: `camelCase` (encodeValue, bufferSize)
- Constants: `UPPER_SNAKE_CASE` (Format.POSITIVE_FIXINT)
- Private members: underscore prefix (_buffer, _position)

### Error Handling
- Throw descriptive errors with specific context
- Validate all inputs in constructors and public methods
- Include expected vs actual values in error messages

## MessagePack Specification

### Format Compliance
- Use exact format codes from `Format` namespace constants
- Handle big-endian byte order for multi-byte values
- Support all types: nil, bool, int, float, str, bin, array, map, ext
- Validate data lengths match format specifications precisely

### Encoding Rules
- Always use most compact format for each value type
- Integers: choose appropriate fixed/variable length format
- Strings: UTF-8 encoding with length prefix
- Binary: raw bytes with length prefix
- Collections: recursive encoding with count prefix

## Class Serialization

### Decorator Pattern
- Apply `@msgpack` decorator to serializable classes
- Support field renaming: `@msgpack("customName")`
- Handle field exclusion and optional fields
- Implement circular reference detection

### Serialization Logic
- Traverse object properties in deterministic order
- Handle nested objects recursively
- Maintain type information for proper deserialization

### Performance Optimizations (Task 11 - COMPLETED)
- **Field Value Caching**: Cache frequently accessed field values to avoid repeated conversions
- **Metadata Lookup Optimization**: Pre-computed field mappings with O(1) field lookups using `OptimizedFieldMapping`
- **Fast Path for Simple Types**: Optimized encoding/decoding paths for boolean, integer, string, and float types
- **Buffer Reuse**: Encoder/decoder instances support buffer reuse to minimize memory allocations
- **Cache Statistics**: Monitor cache hit rates and performance metrics for optimization validation

#### Performance Features:
- `ClassRegistry` with metadata caching and optimized field mappings
- `ClassSerializationEncoder` with fast path detection and field value caching
- `ClassSerializationDecoder` with optimized deserialization for simple types
- Comprehensive performance tests validating all optimization features

## Testing Requirements

### Test Structure
- Create corresponding `.test.ts` file in `assembly/tests/` for every module
- Return `boolean` from test functions (true = pass, false = fail)
- Use descriptive names: `testEncodePositiveInteger`

### Test Coverage
- Include roundtrip tests: encode → decode → verify equality
- Test edge cases: boundary values, empty collections, null values
- Test error conditions: invalid input, malformed data
- Verify cross-compatibility against reference implementations

### Test Implementation
- Log detailed failure information with expected vs actual values
- Use `console.log()` for test output and debugging
- Include binary data inspection for format validation
- Test both success and failure paths

### Performance Testing (NEW)
- Performance optimization tests in `assembly/tests/performance-optimization.test.ts`
- Metadata caching validation with cache hit/miss statistics
- Fast path serialization/deserialization benchmarks
- Buffer reuse capability testing
- Performance comparison between optimized and standard paths

## Performance Guidelines

### Memory Management
- Minimize object allocations in hot paths
- Reuse buffers when possible (with proper clearing)
- Prefer stack allocation for small, fixed-size data
- Avoid string concatenation in loops

### Optimization Strategy
- Use appropriate data structures for access patterns
- Cache computed values when reused
- Optimize for common case scenarios first
- Implement fast paths for simple types (boolean, integer, string, float)

### Performance Monitoring
- Track cache hit rates for metadata and field value caches
- Monitor buffer reuse effectiveness
- Validate optimization impact through comprehensive benchmarks

## Development Workflow

### Code Generation
- Start with the simplest working implementation
- Add optimizations only after correctness is verified
- Follow existing naming and structure patterns exactly
- Include JSDoc comments for all public APIs

### Debugging Process
- Check binary output format against MessagePack specification
- Verify buffer bounds and memory management
- Ensure roundtrip compatibility (encode/decode cycles)
- Validate against existing test patterns

### Implementation Priority
1. Correctness and specification compliance
2. Comprehensive error handling and validation
3. Complete test coverage with edge cases
4. Performance optimization (COMPLETED)
5. Documentation and code clarity