# MessagePack AssemblyScript Library API Documentation

## Overview

The MessagePack AssemblyScript Library provides efficient binary serialization capabilities for AssemblyScript/WebAssembly applications. This library implements the MessagePack specification v5 and offers both high-level convenience functions and low-level control for advanced use cases.

## Installation and Setup

```typescript
// Import the main classes and functions
import {
  MessagePackEncoder,
  MessagePackDecoder,
  MessagePackValue,
  MessagePackValueType,
  encode,
  decode
} from "./assembly/index";
```

## Core Classes

### MessagePackEncoder

The main encoding class that converts AssemblyScript values to MessagePack binary format.

#### Constructor

```typescript
constructor(initialCapacity: i32 = 1024)
```

Creates a new encoder with the specified initial buffer capacity.

#### Methods

##### `encode(value: MessagePackValue): Uint8Array`

Main encoding method that converts a MessagePackValue to binary format.

**Parameters:**
- `value`: The MessagePackValue to encode

**Returns:** A Uint8Array containing the MessagePack encoded bytes

**Throws:** MessagePackEncodeError if encoding fails

##### Convenience Methods

- `encodeNull(): Uint8Array` - Encode a null value
- `encodeBoolean(value: boolean): Uint8Array` - Encode a boolean value
- `encodeInteger(value: i64): Uint8Array` - Encode an integer value
- `encodeFloat(value: f64): Uint8Array` - Encode a floating point value
- `encodeString(value: string): Uint8Array` - Encode a string value
- `encodeBinary(value: Uint8Array): Uint8Array` - Encode binary data
- `encodeArray(values: MessagePackValue[]): Uint8Array` - Encode an array
- `encodeMap(map: Map<string, MessagePackValue>): Uint8Array` - Encode a map

### MessagePackDecoder

The main decoding class that converts MessagePack binary data to AssemblyScript values.

#### Constructor

```typescript
constructor(buffer: Uint8Array)
```

Creates a new decoder for the specified buffer.

#### Methods

##### `decode(): MessagePackValue`

Main decoding method that converts binary MessagePack data to AssemblyScript values.

**Returns:** The decoded MessagePackValue

**Throws:** MessagePackDecodeError if decoding fails

## Value Types

### MessagePackValue

Abstract base class for all MessagePack values. All value types extend this class.

#### Methods

- `getType(): MessagePackValueType` - Returns the type of the value

### Concrete Value Types

#### MessagePackNull

Represents a null value.

```typescript
const nullValue = new MessagePackNull();
```

#### MessagePackBoolean

Represents a boolean value.

```typescript
const boolValue = new MessagePackBoolean(true);
console.log(boolValue.value); // true
```

#### MessagePackInteger

Represents an integer value (i64).

```typescript
const intValue = new MessagePackInteger(42);
console.log(intValue.value); // 42
```

#### MessagePackFloat

Represents a floating point value (f64).

```typescript
const floatValue = new MessagePackFloat(3.14);
console.log(floatValue.value); // 3.14
```

#### MessagePackString

Represents a string value.

```typescript
const stringValue = new MessagePackString("hello");
console.log(stringValue.value); // "hello"
```

#### MessagePackBinary

Represents binary data.

```typescript
const data = new Uint8Array([1, 2, 3, 4]);
const binaryValue = new MessagePackBinary(data);
console.log(binaryValue.value); // Uint8Array([1, 2, 3, 4])
```

#### MessagePackArray

Represents an array of MessagePack values.

```typescript
const arrayValue = new MessagePackArray([
  new MessagePackString("hello"),
  new MessagePackInteger(42)
]);
```

#### MessagePackMap

Represents a map of string keys to MessagePack values.

```typescript
const map = new Map<string, MessagePackValue>();
map.set("name", new MessagePackString("Alice"));
map.set("age", new MessagePackInteger(30));
const mapValue = new MessagePackMap(map);
```

## Convenience Functions

### Encoding Functions

```typescript
// Encode any MessagePackValue
const bytes = encode(value);

// Encode specific types directly
const nullBytes = encodeNull();
const boolBytes = encodeBoolean(true);
const intBytes = encodeInteger(42);
const floatBytes = encodeFloat(3.14);
const stringBytes = encodeString("hello");
const binaryBytes = encodeBinary(new Uint8Array([1, 2, 3]));
const arrayBytes = encodeArray([new MessagePackString("hello")]);
const mapBytes = encodeMap(myMap);
```

### Decoding Functions

```typescript
// Decode MessagePack bytes
const value = decode(bytes);

// Check type and extract value
if (value.getType() === MessagePackValueType.STRING) {
  const str = (value as MessagePackString).value;
}
```

### Helper Functions

```typescript
// Create MessagePack value wrappers
const nullValue = createNull();
const boolValue = createBoolean(true);
const intValue = createInteger(42);
const floatValue = createFloat(3.14);
const stringValue = createString("hello");
const binaryValue = createBinary(new Uint8Array([1, 2, 3]));
const arrayValue = createArray([stringValue, intValue]);
const mapValue = createMap(myMap);
```

## Error Handling

### MessagePackEncodeError

Thrown when encoding fails.

**Properties:**
- `position: i32` - Position where error occurred
- `context: string` - Additional error context

**Static Methods:**
- `withPosition(message: string, position: i32, context?: string)` - Create error with position
- `unsupportedType(typeName: string, position?: i32)` - Create unsupported type error
- `bufferOverflow(needed: i32, available: i32, position: i32)` - Create buffer overflow error

### MessagePackDecodeError

Thrown when decoding fails.

**Properties:**
- `position: i32` - Position where error occurred
- `formatByte: u8` - Format byte that caused the error
- `context: string` - Additional error context

**Static Methods:**
- `withFormat(message: string, position: i32, formatByte: u8, context?: string)` - Create error with format info
- `unexpectedEnd(position: i32, needed: i32, available: i32)` - Create unexpected end error
- `invalidFormat(formatByte: u8, position: i32)` - Create invalid format error
- `malformedData(message: string, position: i32, formatByte?: u8)` - Create malformed data error
- `invalidUTF8(position: i32, byteSequence?: string)` - Create UTF-8 validation error

## Usage Examples

### Basic Encoding and Decoding

```typescript
import {
  MessagePackEncoder,
  MessagePackDecoder,
  MessagePackString,
  MessagePackInteger,
  MessagePackArray,
  MessagePackValueType
} from "./assembly/index";

// Create some data
const data = new MessagePackArray([
  new MessagePackString("hello"),
  new MessagePackInteger(42)
]);

// Encode to bytes
const encoder = new MessagePackEncoder();
const bytes = encoder.encode(data);

// Decode back to value
const decoder = new MessagePackDecoder(bytes);
const decoded = decoder.decode();

// Extract the data
if (decoded.getType() === MessagePackValueType.ARRAY) {
  const array = (decoded as MessagePackArray).value;
  console.log("Array length:", array.length);
  
  if (array[0].getType() === MessagePackValueType.STRING) {
    const str = (array[0] as MessagePackString).value;
    console.log("First element:", str); // "hello"
  }
}
```

### Working with Maps

```typescript
import {
  MessagePackEncoder,
  MessagePackDecoder,
  MessagePackMap,
  MessagePackString,
  MessagePackInteger,
  MessagePackValueType
} from "./assembly/index";

// Create a map
const map = new Map<string, MessagePackValue>();
map.set("name", new MessagePackString("Alice"));
map.set("age", new MessagePackInteger(30));
map.set("city", new MessagePackString("New York"));

const mapValue = new MessagePackMap(map);

// Encode and decode
const encoder = new MessagePackEncoder();
const bytes = encoder.encode(mapValue);

const decoder = new MessagePackDecoder(bytes);
const decoded = decoder.decode();

// Extract map data
if (decoded.getType() === MessagePackValueType.MAP) {
  const decodedMap = (decoded as MessagePackMap).value;
  const keys = decodedMap.keys();
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = decodedMap.get(key);
    console.log(`${key}:`, value);
  }
}
```

### Error Handling

```typescript
import {
  MessagePackDecoder,
  MessagePackDecodeError
} from "./assembly/index";

try {
  const decoder = new MessagePackDecoder(invalidBytes);
  const value = decoder.decode();
} catch (error) {
  if (error instanceof MessagePackDecodeError) {
    console.log("Decode error at position:", error.position);
    console.log("Format byte:", error.formatByte.toString(16));
    console.log("Context:", error.context);
  }
}
```

### Using Convenience Functions

```typescript
import {
  encode,
  decode,
  encodeString,
  encodeInteger,
  createArray,
  createString,
  createInteger,
  MessagePackValueType
} from "./assembly/index";

// Simple encoding
const stringBytes = encodeString("hello world");
const intBytes = encodeInteger(42);

// Complex data with convenience functions
const arrayValue = createArray([
  createString("hello"),
  createInteger(42),
  createString("world")
]);

const arrayBytes = encode(arrayValue);
const decoded = decode(arrayBytes);

if (decoded.getType() === MessagePackValueType.ARRAY) {
  console.log("Successfully decoded array");
}
```

## Performance Considerations

### Memory Management

- The encoder uses a growable buffer that starts at 1KB and doubles when needed
- Reuse encoder instances for multiple operations to avoid repeated allocations
- The decoder operates directly on the input buffer without additional allocations

### Optimization Tips

1. **Reuse Encoders**: Create one encoder instance and reuse it for multiple operations
2. **Buffer Sizing**: If you know the approximate size of your data, set an appropriate initial capacity
3. **Type Selection**: Use the most appropriate numeric types (i32 vs i64) for your data
4. **String Handling**: Be aware that string encoding/decoding involves UTF-8 conversion

### WebAssembly Considerations

- The library is optimized for WebAssembly compilation
- Uses AssemblyScript's typed arrays for efficient binary operations
- Minimal JavaScript interop for better performance
- Small binary size impact when compiled to WebAssembly

## Format Support

This library supports all MessagePack format types as defined in specification v5:

- **Integers**: fixint, int8, int16, int32, int64, uint8, uint16, uint32, uint64
- **Floats**: float32, float64
- **Strings**: fixstr, str8, str16, str32 (UTF-8 encoded)
- **Binary**: bin8, bin16, bin32
- **Arrays**: fixarray, array16, array32
- **Maps**: fixmap, map16, map32
- **Nil**: null values
- **Boolean**: true/false values

## Version Information

- **Library Version**: 1.0.0
- **MessagePack Specification**: v5
- **AssemblyScript Compatibility**: Latest stable version