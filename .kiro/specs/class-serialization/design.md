# Design Document

## Overview

The class serialization feature extends the existing MessagePack AssemblyScript library to support automatic serialization and deserialization of user-defined classes. Since AssemblyScript lacks reflection capabilities, the design relies on explicit field registration where users define which fields should be serialized and their corresponding types.

The feature integrates seamlessly with the existing `MessagePackEncoder` and `MessagePackDecoder` classes, using MessagePack's map format to represent class instances with field names as keys and field values as values.

## Architecture

### Core Components

The class serialization system consists of four main components:

1. **Field Metadata System**: Stores field definitions for registered classes
2. **Class Registry**: Maps class types to their serialization metadata
3. **Serialization Extensions**: Extends existing encoder with class-aware methods
4. **Deserialization Extensions**: Extends existing decoder with class construction capabilities

### Integration Points

The design integrates with existing library components:

- **MessagePackEncoder**: Extended with `encodeClass<T>(instance: T)` method
- **MessagePackDecoder**: Extended with `decodeClass<T>(classType: ClassType<T>)` method
- **MessagePackMap**: Used as the underlying representation for serialized classes
- **Error Handling**: Leverages existing `MessagePackEncodeError` and `MessagePackDecodeError`

## Components and Interfaces

### Field Metadata System

```typescript
/**
 * Enum representing supported field types for serialization
 */
export enum SerializableFieldType {
  NULL,
  BOOLEAN,
  INTEGER,
  FLOAT,
  STRING,
  BINARY,
  ARRAY,
  MAP,
  CLASS  // For nested class instances
}

/**
 * Metadata for a single serializable field
 */
export class FieldMetadata {
  name: string;
  type: SerializableFieldType;
  isOptional: boolean;
  nestedClassType: string | null; // For CLASS type fields
  
  constructor(
    name: string, 
    type: SerializableFieldType, 
    isOptional: boolean = false,
    nestedClassType: string | null = null
  ) {
    this.name = name;
    this.type = type;
    this.isOptional = isOptional;
    this.nestedClassType = nestedClassType;
  }
}

/**
 * Complete metadata for a serializable class
 */
export class ClassMetadata {
  className: string;
  fields: FieldMetadata[];
  
  constructor(className: string, fields: FieldMetadata[]) {
    this.className = className;
    this.fields = fields;
  }
}
```

### Class Registry

```typescript
/**
 * Global registry for class serialization metadata
 */
export class ClassRegistry {
  private static metadata: Map<string, ClassMetadata> = new Map();
  
  /**
   * Register a class for serialization
   */
  static register<T>(className: string, fields: FieldMetadata[]): void {
    // Validation logic here
    this.metadata.set(className, new ClassMetadata(className, fields));
  }
  
  /**
   * Get metadata for a registered class
   */
  static getMetadata(className: string): ClassMetadata | null {
    return this.metadata.get(className);
  }
  
  /**
   * Check if a class is registered
   */
  static isRegistered(className: string): boolean {
    return this.metadata.has(className);
  }
}
```

### Serialization Interface

```typescript
/**
 * Interface that serializable classes must implement
 */
export interface Serializable {
  /**
   * Get the class name for serialization
   */
  getClassName(): string;
  
  /**
   * Get field value by name
   */
  getFieldValue(fieldName: string): MessagePackValue | null;
}
```

### Enhanced Encoder

```typescript
/**
 * Extension methods for MessagePackEncoder to support class serialization
 */
export class ClassSerializationEncoder {
  private encoder: MessagePackEncoder;
  
  constructor(encoder: MessagePackEncoder) {
    this.encoder = encoder;
  }
  
  /**
   * Serialize a class instance to MessagePack format
   */
  encodeClass<T extends Serializable>(instance: T): Uint8Array {
    const className = instance.getClassName();
    const metadata = ClassRegistry.getMetadata(className);
    
    if (!metadata) {
      throw new MessagePackEncodeError(`Class not registered: ${className}`);
    }
    
    // Build map of field values
    const fieldMap = new Map<string, MessagePackValue>();
    
    for (let i = 0; i < metadata.fields.length; i++) {
      const field = metadata.fields[i];
      const value = instance.getFieldValue(field.name);
      
      if (value === null && !field.isOptional) {
        throw new MessagePackEncodeError(`Required field missing: ${field.name}`);
      }
      
      if (value !== null) {
        fieldMap.set(field.name, value);
      }
    }
    
    // Encode as MessagePack map
    return this.encoder.encodeMap(fieldMap);
  }
}
```

### Enhanced Decoder

```typescript
/**
 * Factory interface for creating class instances
 */
export interface ClassFactory<T> {
  create(): T;
  setFieldValue(instance: T, fieldName: string, value: MessagePackValue): void;
}

/**
 * Extension methods for MessagePackDecoder to support class deserialization
 */
export class ClassSerializationDecoder {
  private decoder: MessagePackDecoder;
  
  constructor(decoder: MessagePackDecoder) {
    this.decoder = decoder;
  }
  
  /**
   * Deserialize MessagePack data to a class instance
   */
  decodeClass<T>(factory: ClassFactory<T>, className: string): T {
    const metadata = ClassRegistry.getMetadata(className);
    
    if (!metadata) {
      throw new MessagePackDecodeError(`Class not registered: ${className}`);
    }
    
    // Decode as MessagePack map
    const value = this.decoder.decode();
    
    if (value.getType() !== MessagePackValueType.MAP) {
      throw new MessagePackDecodeError(`Expected map for class, got: ${value.getType()}`);
    }
    
    const map = (value as MessagePackMap).value;
    const instance = factory.create();
    
    // Set field values from map
    for (let i = 0; i < metadata.fields.length; i++) {
      const field = metadata.fields[i];
      const fieldValue = map.get(field.name);
      
      if (fieldValue === undefined) {
        if (!field.isOptional) {
          throw new MessagePackDecodeError(`Required field missing: ${field.name}`);
        }
        continue;
      }
      
      // Validate field type matches expected type
      this.validateFieldType(fieldValue, field);
      
      factory.setFieldValue(instance, field.name, fieldValue);
    }
    
    return instance;
  }
  
  private validateFieldType(value: MessagePackValue, field: FieldMetadata): void {
    // Type validation logic
  }
}
```

## Data Models

### Serialized Class Format

Classes are serialized as MessagePack maps with the following structure:

```
{
  "fieldName1": <serialized_value1>,
  "fieldName2": <serialized_value2>,
  ...
}
```

### Field Type Mapping

| AssemblyScript Type | SerializableFieldType | MessagePack Representation |
|-------------------|---------------------|---------------------------|
| `boolean` | `BOOLEAN` | MessagePack boolean |
| `i32`, `i64`, `u32`, `u64` | `INTEGER` | MessagePack integer |
| `f32`, `f64` | `FLOAT` | MessagePack float |
| `string` | `STRING` | MessagePack string |
| `Uint8Array` | `BINARY` | MessagePack binary |
| `Array<T>` | `ARRAY` | MessagePack array |
| `Map<string, T>` | `MAP` | MessagePack map |
| Custom class | `CLASS` | MessagePack map (recursive) |

### Registration Example

```typescript
// Example class
class User implements Serializable {
  name: string;
  age: i32;
  email: string;
  isActive: boolean;
  
  getClassName(): string {
    return "User";
  }
  
  getFieldValue(fieldName: string): MessagePackValue | null {
    switch (fieldName) {
      case "name": return new MessagePackString(this.name);
      case "age": return new MessagePackInteger(this.age);
      case "email": return new MessagePackString(this.email);
      case "isActive": return new MessagePackBoolean(this.isActive);
      default: return null;
    }
  }
}

// Registration
ClassRegistry.register("User", [
  new FieldMetadata("name", SerializableFieldType.STRING),
  new FieldMetadata("age", SerializableFieldType.INTEGER),
  new FieldMetadata("email", SerializableFieldType.STRING, true), // optional
  new FieldMetadata("isActive", SerializableFieldType.BOOLEAN)
]);
```

## Error Handling

### Serialization Errors

- **Unregistered Class**: Thrown when attempting to serialize a class that hasn't been registered
- **Missing Required Field**: Thrown when a required field is null or undefined
- **Type Mismatch**: Thrown when a field value doesn't match the registered type
- **Circular Reference**: Thrown when detecting circular references in nested objects

### Deserialization Errors

- **Invalid Format**: Thrown when the MessagePack data is not a map
- **Missing Required Field**: Thrown when a required field is missing from the map
- **Type Validation**: Thrown when a field value doesn't match the expected type
- **Unknown Field**: Warning or error for fields in the data that aren't registered

### Error Context

All errors include:
- Field name and class name context
- Expected vs actual type information
- Position in the serialization/deserialization process
- Suggestions for resolution

## Testing Strategy

### Unit Tests

1. **Field Metadata Tests**
   - Validate field metadata creation and validation
   - Test optional vs required field handling
   - Test nested class type references

2. **Class Registry Tests**
   - Test class registration and retrieval
   - Test duplicate registration handling
   - Test unregistered class access

3. **Serialization Tests**
   - Test basic type serialization (boolean, integer, string, etc.)
   - Test nested class serialization
   - Test array and map field serialization
   - Test optional field handling
   - Test error conditions (missing fields, type mismatches)

4. **Deserialization Tests**
   - Test basic type deserialization
   - Test nested class deserialization
   - Test missing field handling (required vs optional)
   - Test type validation
   - Test malformed data handling

### Integration Tests

1. **Round-trip Tests**
   - Serialize and deserialize various class structures
   - Verify data integrity after round-trip
   - Test with complex nested structures

2. **Performance Tests**
   - Benchmark serialization vs manual map creation
   - Test memory usage with large object graphs
   - Test performance with deeply nested structures

3. **Compatibility Tests**
   - Verify MessagePack output is compatible with other implementations
   - Test with various MessagePack viewers/parsers

### Error Handling Tests

1. **Serialization Error Tests**
   - Test unregistered class handling
   - Test missing required field scenarios
   - Test type mismatch scenarios

2. **Deserialization Error Tests**
   - Test invalid MessagePack format handling
   - Test missing field scenarios
   - Test type validation failures

## Performance Considerations

### Memory Optimization

- **Field Value Caching**: Cache frequently accessed field values to avoid repeated conversions
- **Metadata Caching**: Store class metadata in optimized structures for fast lookup
- **Buffer Reuse**: Reuse encoder/decoder buffers across multiple operations

### Serialization Performance

- **Fast Path for Simple Types**: Optimize common field types (boolean, integer, string)
- **Batch Field Processing**: Process multiple fields in single operations where possible
- **Lazy Evaluation**: Only convert field values when actually serializing

### Deserialization Performance

- **Type-Specific Decoders**: Use specialized decoders for known field types
- **Field Mapping Optimization**: Pre-compute field name to index mappings
- **Instance Pooling**: Reuse class instances where appropriate

### WebAssembly Optimizations

- **Minimal Branching**: Structure code to minimize conditional branches
- **Efficient Memory Access**: Use sequential memory access patterns
- **Inline Critical Paths**: Inline frequently called methods for better performance