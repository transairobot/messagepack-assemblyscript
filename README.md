# MessagePack AssemblyScript Library

A high-performance MessagePack serialization library for AssemblyScript/WebAssembly. MessagePack is an efficient binary serialization format that's more compact than JSON while maintaining cross-platform compatibility.

## Features

- Complete MessagePack format support (null, boolean, integers, floats, strings, binary, arrays, maps)
- Optimized for WebAssembly environments
- Type-safe encoding and decoding
- Efficient buffer management
- Comprehensive error handling
- Memory optimization utilities
- Extensive test suite with real-world data patterns
- Cross-compatibility with other MessagePack implementations

## Installation

```bash
npm install messagepack-assemblyscript
```

## Basic Usage

### Encoding

```typescript
import { MessagePackEncoder } from "messagepack-assemblyscript";

const encoder = new MessagePackEncoder();

// Encode basic types
const nullBytes = encoder.encodeNull();
const boolBytes = encoder.encodeBoolean(true);
const intBytes = encoder.encodeInteger(42);
const floatBytes = encoder.encodeFloat(3.14);
const stringBytes = encoder.encodeString("hello");

// Encode complex types using MessagePackValue wrappers
import { MessagePackString, MessagePackInteger, MessagePackArray } from "messagepack-assemblyscript";

const arrayValue = new MessagePackArray([
  new MessagePackString("hello"),
  new MessagePackInteger(42)
]);
const arrayBytes = encoder.encode(arrayValue);
```

### Decoding

```typescript
import { MessagePackDecoder, MessagePackValueType } from "messagepack-assemblyscript";

const decoder = new MessagePackDecoder(encodedBytes);
const value = decoder.decode();

// Check the type and extract the value
if (value.getType() === MessagePackValueType.STRING) {
  const stringValue = (value as MessagePackString).value;
  console.log("Decoded string:", stringValue);
}
```

## Advanced Usage

### Working with Maps

```typescript
import { 
  MessagePackEncoder, 
  MessagePackMap, 
  MessagePackString, 
  MessagePackInteger 
} from "messagepack-assemblyscript";

const map = new Map<string, MessagePackValue>();
map.set("name", new MessagePackString("Alice"));
map.set("age", new MessagePackInteger(30));

const encoder = new MessagePackEncoder();
const mapBytes = encoder.encode(new MessagePackMap(map));
```

### Error Handling

```typescript
import { 
  MessagePackDecoder, 
  MessagePackDecodeError 
} from "messagepack-assemblyscript";

try {
  const decoder = new MessagePackDecoder(invalidBytes);
  const value = decoder.decode();
} catch (error) {
  if (error instanceof MessagePackDecodeError) {
    console.log("Decode error at position:", error.position);
    console.log("Error context:", error.context);
  }
}
```

### Memory Optimization

```typescript
import { 
  MessagePackEncoder, 
  BufferPool 
} from "messagepack-assemblyscript";

// Create a buffer pool for reusing memory
const bufferPool = new BufferPool(5, 1024); // 5 buffers of 1KB each

// Get a buffer from the pool
const buffer = bufferPool.acquire();

// Use the buffer for some operation
// ...

// Return the buffer to the pool when done
bufferPool.release(buffer);

// Check pool statistics
const stats = bufferPool.getStats();
console.log(`Total buffers: ${stats.totalBuffers}, Available: ${stats.availableBuffers}`);
```

## Performance Considerations

- Reuse encoder instances for multiple operations to avoid repeated allocations
- Use appropriate numeric types (i32, i64, u32, etc.) for better performance
- Consider using the BufferPool for memory-intensive operations
- For large datasets, process data incrementally rather than all at once

## API Documentation

See [API.md](API.md) for complete API documentation.

## Examples

See [examples.md](examples.md) for more detailed usage examples.

## Testing

```bash
# Build debug version
npm run build:debug

# Run tests
npm test
```

## Compatibility

This library implements the MessagePack specification v5 and is compatible with other MessagePack implementations in various languages.

## License

MIT