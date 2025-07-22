# MessagePack AssemblyScript Library - Usage Examples

This document provides practical examples of using the MessagePack AssemblyScript library.

## Basic Examples

### Simple Encoding and Decoding

```typescript
import {
  encodeString,
  encodeInteger,
  decode,
  MessagePackValueType,
  MessagePackString,
  MessagePackInteger
} from "./assembly/index";

// Encode simple values
const stringBytes = encodeString("Hello, World!");
const integerBytes = encodeInteger(42);

// Decode them back
const decodedString = decode(stringBytes);
const decodedInteger = decode(integerBytes);

// Extract values
if (decodedString.getType() === MessagePackValueType.STRING) {
  console.log((decodedString as MessagePackString).value); // "Hello, World!"
}

if (decodedInteger.getType() === MessagePackValueType.INTEGER) {
  console.log((decodedInteger as MessagePackInteger).value); // 42
}
```

### Working with Arrays

```typescript
import {
  MessagePackEncoder,
  MessagePackDecoder,
  createArray,
  createString,
  createInteger,
  MessagePackValueType,
  MessagePackArray,
  MessagePackString,
  MessagePackInteger
} from "./assembly/index";

// Create an array with mixed types
const arrayValue = createArray([
  createString("hello"),
  createInteger(123),
  createString("world")
]);

// Encode the array
const encoder = new MessagePackEncoder();
const bytes = encoder.encode(arrayValue);

// Decode the array
const decoder = new MessagePackDecoder(bytes);
const decoded = decoder.decode();

// Process the decoded array
if (decoded.getType() === MessagePackValueType.ARRAY) {
  const array = (decoded as MessagePackArray).value;
  
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    
    if (element.getType() === MessagePackValueType.STRING) {
      console.log(`String: ${(element as MessagePackString).value}`);
    } else if (element.getType() === MessagePackValueType.INTEGER) {
      console.log(`Integer: ${(element as MessagePackInteger).value}`);
    }
  }
}
```

### Working with Maps

```typescript
import {
  MessagePackEncoder,
  MessagePackDecoder,
  createMap,
  createString,
  createInteger,
  createBoolean,
  MessagePackValue,
  MessagePackValueType,
  MessagePackMap,
  MessagePackString,
  MessagePackInteger,
  MessagePackBoolean
} from "./assembly/index";

// Create a map with user data
const userData = new Map<string, MessagePackValue>();
userData.set("name", createString("Alice"));
userData.set("age", createInteger(30));
userData.set("active", createBoolean(true));

const mapValue = createMap(userData);

// Encode the map
const encoder = new MessagePackEncoder();
const bytes = encoder.encode(mapValue);

// Decode the map
const decoder = new MessagePackDecoder(bytes);
const decoded = decoder.decode();

// Process the decoded map
if (decoded.getType() === MessagePackValueType.MAP) {
  const map = (decoded as MessagePackMap).value;
  const keys = map.keys();
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = map.get(key);
    
    console.log(`Key: ${key}`);
    
    if (value.getType() === MessagePackValueType.STRING) {
      console.log(`  String value: ${(value as MessagePackString).value}`);
    } else if (value.getType() === MessagePackValueType.INTEGER) {
      console.log(`  Integer value: ${(value as MessagePackInteger).value}`);
    } else if (value.getType() === MessagePackValueType.BOOLEAN) {
      console.log(`  Boolean value: ${(value as MessagePackBoolean).value}`);
    }
  }
}
```

## Advanced Examples

### Nested Data Structures

```typescript
import {
  MessagePackEncoder,
  MessagePackDecoder,
  createMap,
  createArray,
  createString,
  createInteger,
  MessagePackValue,
  MessagePackValueType,
  MessagePackMap,
  MessagePackArray
} from "./assembly/index";

// Create nested data: user with addresses
const addresses = createArray([
  createMap(new Map<string, MessagePackValue>([
    ["type", createString("home")],
    ["street", createString("123 Main St")],
    ["city", createString("Anytown")]
  ])),
  createMap(new Map<string, MessagePackValue>([
    ["type", createString("work")],
    ["street", createString("456 Office Blvd")],
    ["city", createString("Business City")]
  ]))
]);

const user = createMap(new Map<string, MessagePackValue>([
  ["name", createString("John Doe")],
  ["id", createInteger(12345)],
  ["addresses", addresses]
]));

// Encode and decode
const encoder = new MessagePackEncoder();
const bytes = encoder.encode(user);

const decoder = new MessagePackDecoder(bytes);
const decoded = decoder.decode();

// Navigate the nested structure
if (decoded.getType() === MessagePackValueType.MAP) {
  const userMap = (decoded as MessagePackMap).value;
  const addressesValue = userMap.get("addresses");
  
  if (addressesValue && addressesValue.getType() === MessagePackValueType.ARRAY) {
    const addressArray = (addressesValue as MessagePackArray).value;
    console.log(`User has ${addressArray.length} addresses`);
  }
}
```

### Binary Data Handling

```typescript
import {
  encodeBinary,
  decode,
  createBinary,
  MessagePackEncoder,
  MessagePackValueType,
  MessagePackBinary
} from "./assembly/index";

// Create some binary data
const binaryData = new Uint8Array(10);
for (let i = 0; i < binaryData.length; i++) {
  binaryData[i] = i * 2;
}

// Method 1: Direct encoding
const bytes1 = encodeBinary(binaryData);

// Method 2: Using MessagePackValue wrapper
const binaryValue = createBinary(binaryData);
const encoder = new MessagePackEncoder();
const bytes2 = encoder.encode(binaryValue);

// Decode binary data
const decoded = decode(bytes1);

if (decoded.getType() === MessagePackValueType.BINARY) {
  const decodedBinary = (decoded as MessagePackBinary).value;
  console.log(`Binary data length: ${decodedBinary.length}`);
  
  // Verify the data
  let isEqual = true;
  if (decodedBinary.length === binaryData.length) {
    for (let i = 0; i < binaryData.length; i++) {
      if (decodedBinary[i] !== binaryData[i]) {
        isEqual = false;
        break;
      }
    }
  } else {
    isEqual = false;
  }
  
  console.log(`Binary data matches: ${isEqual}`);
}
```

### Error Handling Example

```typescript
import {
  MessagePackDecoder,
  MessagePackDecodeError,
  MessagePackEncoder,
  MessagePackEncodeError,
  createString
} from "./assembly/index";

// Example 1: Handling decode errors
function safeDecodeExample(): void {
  const invalidBytes = new Uint8Array([0xFF, 0xFF, 0xFF]); // Invalid MessagePack data
  
  try {
    const decoder = new MessagePackDecoder(invalidBytes);
    const value = decoder.decode();
    console.log("Decoded successfully");
  } catch (error) {
    if (error instanceof MessagePackDecodeError) {
      console.log(`Decode error at position ${error.position}`);
      console.log(`Format byte: 0x${error.formatByte.toString(16)}`);
      console.log(`Context: ${error.context}`);
    } else {
      console.log("Unknown error:", error.message);
    }
  }
}

// Example 2: Handling encode errors (rare, but possible)
function safeEncodeExample(): void {
  try {
    const encoder = new MessagePackEncoder();
    const value = createString("Hello, World!");
    const bytes = encoder.encode(value);
    console.log(`Encoded ${bytes.length} bytes`);
  } catch (error) {
    if (error instanceof MessagePackEncodeError) {
      console.log(`Encode error at position ${error.position}`);
      console.log(`Context: ${error.context}`);
    } else {
      console.log("Unknown error:", error.message);
    }
  }
}
```

### Performance Optimization Example

```typescript
import {
  MessagePackEncoder,
  MessagePackDecoder,
  createString,
  createInteger,
  createArray
} from "./assembly/index";

// Reuse encoder for multiple operations
function efficientEncoding(): void {
  const encoder = new MessagePackEncoder(4096); // Start with larger buffer
  
  // Encode multiple values with the same encoder
  const values = [
    createString("value1"),
    createString("value2"),
    createInteger(100),
    createInteger(200)
  ];
  
  const encodedResults: Uint8Array[] = [];
  
  for (let i = 0; i < values.length; i++) {
    const bytes = encoder.encode(values[i]);
    encodedResults.push(bytes);
  }
  
  console.log(`Encoded ${encodedResults.length} values efficiently`);
}

// Batch processing
function batchProcessing(): void {
  const encoder = new MessagePackEncoder();
  
  // Create a large array of values
  const largeArray: MessagePackValue[] = [];
  for (let i = 0; i < 1000; i++) {
    largeArray.push(createString(`item_${i}`));
  }
  
  const arrayValue = createArray(largeArray);
  const bytes = encoder.encode(arrayValue);
  
  console.log(`Encoded array of ${largeArray.length} items in ${bytes.length} bytes`);
  
  // Decode it back
  const decoder = new MessagePackDecoder(bytes);
  const decoded = decoder.decode();
  
  console.log("Successfully decoded large array");
}
```

## Integration Examples

### WebAssembly Integration

```typescript
// This would be used from JavaScript after compiling to WebAssembly
import {
  encodeString,
  encodeInteger,
  decode,
  MessagePackValueType
} from "./assembly/index";

// Function that can be called from JavaScript
export function serializeUserData(name: string, age: i32): Uint8Array {
  const userData = createMap(new Map<string, MessagePackValue>([
    ["name", createString(name)],
    ["age", createInteger(age)]
  ]));
  
  const encoder = new MessagePackEncoder();
  return encoder.encode(userData);
}

// Function to deserialize data received from JavaScript
export function deserializeUserData(bytes: Uint8Array): string {
  try {
    const decoded = decode(bytes);
    
    if (decoded.getType() === MessagePackValueType.MAP) {
      const map = (decoded as MessagePackMap).value;
      const name = map.get("name");
      const age = map.get("age");
      
      if (name && age) {
        return `User: ${(name as MessagePackString).value}, Age: ${(age as MessagePackInteger).value}`;
      }
    }
    
    return "Invalid user data";
  } catch (error) {
    return `Error: ${error.message}`;
  }
}
```

These examples demonstrate the key features and usage patterns of the MessagePack AssemblyScript library. The library provides both high-level convenience functions and low-level control for advanced use cases.