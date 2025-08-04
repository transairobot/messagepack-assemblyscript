/**
 * Class Serialization System for MessagePack AssemblyScript Library
 * 
 * This module provides the core infrastructure for serializing and deserializing
 * user-defined classes to/from MessagePack format. Since AssemblyScript lacks
 * reflection capabilities, users must explicitly register field metadata for
 * their classes.
 */

import {
    MessagePackValue,
    MessagePackEncodeError,
    MessagePackDecodeError,
    MessagePackNull,
    MessagePackBoolean,
    MessagePackInteger,
    MessagePackFloat,
    MessagePackString,
    MessagePackBinary,
    MessagePackArray,
    MessagePackMap,
    MessagePackValueType
} from "./types";
import { MessagePackEncoder } from "./encoder";

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
 * Contains all information needed to serialize/deserialize a field
 */
export class FieldMetadata {
    /** The name of the field as it appears in the class */
    name: string;

    /** The type of the field for serialization */
    type: SerializableFieldType;

    /** Whether this field is optional (can be null/undefined) */
    isOptional: boolean;

    /** For CLASS type fields, the name of the nested class type */
    nestedClassType: string | null;

    /**
     * Creates a new field metadata instance
     * @param name The field name
     * @param type The field type
     * @param isOptional Whether the field is optional (defaults to false)
     * @param nestedClassType For CLASS type fields, the nested class name
     */
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

        // Validate that CLASS type fields have a nested class type specified
        if (type === SerializableFieldType.CLASS && nestedClassType === null) {
            throw new MessagePackEncodeError(
                `Field '${name}' of type CLASS must specify nestedClassType`,
                -1,
                "field metadata validation"
            );
        }

        // Validate that non-CLASS type fields don't have nested class type
        if (type !== SerializableFieldType.CLASS && nestedClassType !== null) {
            throw new MessagePackEncodeError(
                `Field '${name}' of type ${this.getTypeString(type)} cannot have nestedClassType`,
                -1,
                "field metadata validation"
            );
        }
    }

    /**
     * Gets a string representation of the field type
     * @param type The field type
     * @returns String representation
     */
    private getTypeString(type: SerializableFieldType): string {
        switch (type) {
            case SerializableFieldType.NULL: return "NULL";
            case SerializableFieldType.BOOLEAN: return "BOOLEAN";
            case SerializableFieldType.INTEGER: return "INTEGER";
            case SerializableFieldType.FLOAT: return "FLOAT";
            case SerializableFieldType.STRING: return "STRING";
            case SerializableFieldType.BINARY: return "BINARY";
            case SerializableFieldType.ARRAY: return "ARRAY";
            case SerializableFieldType.MAP: return "MAP";
            case SerializableFieldType.CLASS: return "CLASS";
            default: return "UNKNOWN";
        }
    }

    /**
     * Returns a string representation of this field metadata
     * @returns String representation
     */
    toString(): string {
        let result = `${this.name}: ${this.getTypeString(this.type)}`;
        if (this.isOptional) {
            result += " (optional)";
        }
        if (this.nestedClassType !== null) {
            result += " -> " + this.nestedClassType!;
        }
        return result;
    }
}

/**
 * Complete metadata for a serializable class
 * Contains all field definitions and validation logic
 */
export class ClassMetadata {
    /** The name of the class */
    className: string;

    /** Array of field metadata for all serializable fields */
    fields: FieldMetadata[];

    /**
     * Creates a new class metadata instance
     * @param className The name of the class
     * @param fields Array of field metadata
     */
    constructor(className: string, fields: FieldMetadata[]) {
        this.className = className;
        this.fields = fields;

        // Validate that class name is not empty
        if (className.length === 0) {
            throw new MessagePackEncodeError(
                "Class name cannot be empty",
                -1,
                "class metadata validation"
            );
        }

        // Validate that there are no duplicate field names
        this.validateUniqueFieldNames();
    }

    /**
     * Validates that all field names are unique
     * @throws MessagePackEncodeError if duplicate field names are found
     */
    private validateUniqueFieldNames(): void {
        const fieldNames = new Set<string>();

        for (let i = 0; i < this.fields.length; i++) {
            const fieldName = this.fields[i].name;

            if (fieldNames.has(fieldName)) {
                throw new MessagePackEncodeError(
                    `Duplicate field name '${fieldName}' in class '${this.className}'`,
                    -1,
                    "class metadata validation"
                );
            }

            fieldNames.add(fieldName);
        }
    }

    /**
     * Gets field metadata by name
     * @param fieldName The name of the field
     * @returns Field metadata or null if not found
     */
    getField(fieldName: string): FieldMetadata | null {
        for (let i = 0; i < this.fields.length; i++) {
            if (this.fields[i].name === fieldName) {
                return this.fields[i];
            }
        }
        return null;
    }

    /**
     * Checks if a field exists
     * @param fieldName The name of the field
     * @returns True if the field exists
     */
    hasField(fieldName: string): boolean {
        return this.getField(fieldName) !== null;
    }

    /**
     * Gets all required field names
     * @returns Array of required field names
     */
    getRequiredFields(): string[] {
        const required: string[] = [];
        for (let i = 0; i < this.fields.length; i++) {
            if (!this.fields[i].isOptional) {
                required.push(this.fields[i].name);
            }
        }
        return required;
    }

    /**
     * Gets all optional field names
     * @returns Array of optional field names
     */
    getOptionalFields(): string[] {
        const optional: string[] = [];
        for (let i = 0; i < this.fields.length; i++) {
            if (this.fields[i].isOptional) {
                optional.push(this.fields[i].name);
            }
        }
        return optional;
    }

    /**
     * Returns a string representation of this class metadata
     * @returns String representation
     */
    toString(): string {
        let result = `Class: ${this.className}\n`;
        result += `Fields (${this.fields.length}):\n`;

        for (let i = 0; i < this.fields.length; i++) {
            result += `  - ${this.fields[i].toString()}\n`;
        }

        return result;
    }
}

/**
 * Global registry for class serialization metadata
 * Provides static methods for registering and looking up class metadata
 */
export class ClassRegistry {
    /** Internal storage for class metadata */
    private static metadata: Map<string, ClassMetadata> = new Map<string, ClassMetadata>();

    /**
     * Register a class for serialization
     * @param className The name of the class
     * @param fields Array of field metadata
     * @throws MessagePackEncodeError if the class is already registered or validation fails
     */
    static register(className: string, fields: FieldMetadata[]): void {
        // Check if class is already registered
        if (this.metadata.has(className)) {
            throw new MessagePackEncodeError(
                `Class '${className}' is already registered`,
                -1,
                "class registration"
            );
        }

        // Create and validate class metadata
        const classMetadata = new ClassMetadata(className, fields);

        // Validate nested class references
        this.validateNestedClassReferences(classMetadata);

        // Store the metadata
        this.metadata.set(className, classMetadata);
    }

    /**
     * Validates that all nested class references are valid
     * @param classMetadata The class metadata to validate
     * @throws MessagePackEncodeError if invalid nested class references are found
     */
    private static validateNestedClassReferences(classMetadata: ClassMetadata): void {
        for (let i = 0; i < classMetadata.fields.length; i++) {
            const field = classMetadata.fields[i];

            if (field.type === SerializableFieldType.CLASS && field.nestedClassType !== null) {
                // For now, we'll allow forward references since classes might be registered in any order
                // The actual validation will happen during serialization/deserialization
                // This is a design decision to allow more flexible registration patterns
            }
        }
    }

    /**
     * Get metadata for a registered class
     * @param className The name of the class
     * @returns Class metadata or null if not found
     */
    static getMetadata(className: string): ClassMetadata | null {
        if (this.metadata.has(className)) {
            return this.metadata.get(className);
        }
        return null;
    }

    /**
     * Check if a class is registered
     * @param className The name of the class
     * @returns True if the class is registered
     */
    static isRegistered(className: string): boolean {
        return this.metadata.has(className);
    }

    /**
     * Get all registered class names
     * @returns Array of registered class names
     */
    static getRegisteredClasses(): string[] {
        return this.metadata.keys();
    }

    /**
     * Get the number of registered classes
     * @returns Number of registered classes
     */
    static getRegisteredCount(): i32 {
        return this.metadata.size;
    }

    /**
     * Clear all registered classes (primarily for testing)
     * @warning This will remove all registered class metadata
     */
    static clear(): void {
        this.metadata.clear();
    }

    /**
     * Unregister a specific class
     * @param className The name of the class to unregister
     * @returns True if the class was unregistered, false if it wasn't registered
     */
    static unregister(className: string): boolean {
        return this.metadata.delete(className);
    }

    /**
     * Returns a string representation of all registered classes
     * @returns String representation
     */
    static toString(): string {
        const classNames = this.getRegisteredClasses();
        let result = `ClassRegistry (${classNames.length} classes):\n`;

        for (let i = 0; i < classNames.length; i++) {
            const metadata = this.getMetadata(classNames[i]);
            if (metadata !== null) {
                result += metadata.toString();
                if (i < classNames.length - 1) {
                    result += "\n";
                }
            }
        }

        return result;
    }
}

/**
 * Interface that serializable classes must implement
 * Provides methods for the serialization system to access class information
 */
export interface Serializable {
    /**
     * Get the class name for serialization
     * This should return the same name used when registering the class
     * @returns The class name as registered in ClassRegistry
     */
    getClassName(): string;

    /**
     * Get field value by name
     * This method should return the field value wrapped in the appropriate MessagePackValue type
     * @param fieldName The name of the field to retrieve
     * @returns The field value as a MessagePackValue, or null if the field doesn't exist or is null
     */
    getFieldValue(fieldName: string): MessagePackValue | null;
}

// ============================================================================
// Class Serialization Encoder Extension
// ============================================================================

/**
 * Extension of MessagePackEncoder that provides class serialization capabilities
 * 
 * This class wraps the existing MessagePackEncoder and adds methods for serializing
 * class instances that implement the Serializable interface. It handles field
 * validation, type checking, and nested class serialization.
 */
export class ClassSerializationEncoder {
    /** The underlying MessagePack encoder */
    private encoder: MessagePackEncoder;

    /**
     * Creates a new class serialization encoder
     * @param encoder The MessagePackEncoder instance to wrap
     */
    constructor(encoder: MessagePackEncoder) {
        this.encoder = encoder;
    }

    /**
     * Serializes a class instance to MessagePack format
     * 
     * This method validates the class is registered, extracts field values,
     * validates field types, and encodes the instance as a MessagePack map.
     * 
     * @param instance The class instance to serialize
     * @returns A Uint8Array containing the MessagePack encoded class data
     * @throws MessagePackEncodeError if serialization fails
     */
    encodeClass<T extends Serializable>(instance: T): Uint8Array {
        // Get the class name from the instance
        const className = instance.getClassName();

        // Validate that the class is registered
        const metadata = ClassRegistry.getMetadata(className);
        if (metadata === null) {
            throw new MessagePackEncodeError(
                `Class '${className}' is not registered for serialization`,
                -1,
                "class serialization"
            );
        }

        // Build map of field values for serialization
        const fieldMap = new Map<string, MessagePackValue>();

        // Process each registered field
        for (let i = 0; i < metadata.fields.length; i++) {
            const field = metadata.fields[i];
            const fieldValue = instance.getFieldValue(field.name);

            // Handle required fields
            if (fieldValue === null) {
                if (!field.isOptional) {
                    throw new MessagePackEncodeError(
                        `Required field '${field.name}' is null or missing in class '${className}'`,
                        -1,
                        "field validation"
                    );
                }
                // Skip optional fields that are null
                continue;
            }

            // Validate field type matches expected type
            this.validateFieldType(fieldValue, field, className);

            // Handle nested class serialization
            if (field.type === SerializableFieldType.CLASS) {
                const nestedValue = this.serializeNestedClass(fieldValue, field, className);
                fieldMap.set(field.name, nestedValue);
            } else {
                // Add the field value to the map
                fieldMap.set(field.name, fieldValue);
            }
        }

        // Encode the field map as a MessagePack map
        return this.encoder.encodeMap(fieldMap);
    }

    /**
     * Validates that a field value matches the expected type
     * @param value The field value to validate
     * @param field The field metadata containing expected type
     * @param className The name of the class being serialized (for error messages)
     * @throws MessagePackEncodeError if type validation fails
     */
    private validateFieldType(value: MessagePackValue, field: FieldMetadata, className: string): void {
        const actualType = value.getType();
        let expectedType: MessagePackValueType;

        // Map SerializableFieldType to MessagePackValueType
        switch (field.type) {
            case SerializableFieldType.NULL:
                expectedType = MessagePackValueType.NULL;
                break;
            case SerializableFieldType.BOOLEAN:
                expectedType = MessagePackValueType.BOOLEAN;
                break;
            case SerializableFieldType.INTEGER:
                expectedType = MessagePackValueType.INTEGER;
                break;
            case SerializableFieldType.FLOAT:
                expectedType = MessagePackValueType.FLOAT;
                break;
            case SerializableFieldType.STRING:
                expectedType = MessagePackValueType.STRING;
                break;
            case SerializableFieldType.BINARY:
                expectedType = MessagePackValueType.BINARY;
                break;
            case SerializableFieldType.ARRAY:
                expectedType = MessagePackValueType.ARRAY;
                break;
            case SerializableFieldType.MAP:
                expectedType = MessagePackValueType.MAP;
                break;
            case SerializableFieldType.CLASS:
                // For CLASS type, we expect a MAP (since nested classes are serialized as maps)
                expectedType = MessagePackValueType.MAP;
                break;
            default:
                throw new MessagePackEncodeError(
                    `Unknown field type '${field.type}' for field '${field.name}' in class '${className}'`,
                    -1,
                    "type validation"
                );
        }

        // Check if the actual type matches the expected type
        if (actualType !== expectedType) {
            throw new MessagePackEncodeError(
                `Type mismatch for field '${field.name}' in class '${className}': expected ${this.getTypeString(expectedType)}, got ${this.getTypeString(actualType)}`,
                -1,
                "type validation"
            );
        }
    }

    /**
     * Serializes a nested class instance
     * @param value The MessagePackValue containing the nested class (should be a map)
     * @param field The field metadata for the nested class
     * @param parentClassName The name of the parent class (for error messages)
     * @returns The serialized nested class as a MessagePackValue
     * @throws MessagePackEncodeError if nested class serialization fails
     */
    private serializeNestedClass(value: MessagePackValue, field: FieldMetadata, parentClassName: string): MessagePackValue {
        // For nested classes, the value should already be a MessagePackMap
        // This is because the nested class's getFieldValue method should return
        // the result of calling encodeClass on the nested instance
        
        if (value.getType() !== MessagePackValueType.MAP) {
            throw new MessagePackEncodeError(
                `Nested class field '${field.name}' in class '${parentClassName}' must be a MessagePackMap, got ${this.getTypeString(value.getType())}`,
                -1,
                "nested class validation"
            );
        }

        // Validate that the nested class type is registered
        if (field.nestedClassType !== null) {
            const nestedMetadata = ClassRegistry.getMetadata(field.nestedClassType!);
            if (nestedMetadata === null) {
                throw new MessagePackEncodeError(
                    `Nested class type '${field.nestedClassType!}' for field '${field.name}' in class '${parentClassName}' is not registered`,
                    -1,
                    "nested class validation"
                );
            }
        }

        // Return the value as-is since it's already properly serialized
        return value;
    }

    /**
     * Gets a string representation of a MessagePackValueType
     * @param type The MessagePackValueType
     * @returns String representation
     */
    private getTypeString(type: MessagePackValueType): string {
        switch (type) {
            case MessagePackValueType.NULL: return "NULL";
            case MessagePackValueType.BOOLEAN: return "BOOLEAN";
            case MessagePackValueType.INTEGER: return "INTEGER";
            case MessagePackValueType.FLOAT: return "FLOAT";
            case MessagePackValueType.STRING: return "STRING";
            case MessagePackValueType.BINARY: return "BINARY";
            case MessagePackValueType.ARRAY: return "ARRAY";
            case MessagePackValueType.MAP: return "MAP";
            default: return "UNKNOWN";
        }
    }

    /**
     * Gets the underlying MessagePackEncoder instance
     * @returns The MessagePackEncoder instance
     */
    getEncoder(): MessagePackEncoder {
        return this.encoder;
    }

    /**
     * Resets the underlying encoder for reuse
     */
    reset(): void {
        this.encoder.reset();
    }
}

// ============================================================================
// Type Conversion Utilities
// ============================================================================

/**
 * Converts an AssemblyScript boolean to MessagePackBoolean
 * @param value The boolean value to convert
 * @returns MessagePackBoolean instance
 */
export function toMessagePackBoolean(value: boolean): MessagePackBoolean {
    return new MessagePackBoolean(value);
}

/**
 * Converts an AssemblyScript i32 to MessagePackInteger
 * @param value The i32 value to convert
 * @returns MessagePackInteger instance
 */
export function toMessagePackInteger32(value: i32): MessagePackInteger {
    return new MessagePackInteger(value as i64);
}

/**
 * Converts an AssemblyScript i64 to MessagePackInteger
 * @param value The i64 value to convert
 * @returns MessagePackInteger instance
 */
export function toMessagePackInteger64(value: i64): MessagePackInteger {
    return new MessagePackInteger(value);
}

/**
 * Converts an AssemblyScript u32 to MessagePackInteger
 * @param value The u32 value to convert
 * @returns MessagePackInteger instance
 */
export function toMessagePackUnsigned32(value: u32): MessagePackInteger {
    return new MessagePackInteger(value as i64);
}

/**
 * Converts an AssemblyScript u64 to MessagePackInteger
 * Note: This may lose precision for very large u64 values since MessagePackInteger uses i64
 * @param value The u64 value to convert
 * @returns MessagePackInteger instance
 */
export function toMessagePackUnsigned64(value: u64): MessagePackInteger {
    return new MessagePackInteger(value as i64);
}

/**
 * Converts an AssemblyScript f32 to MessagePackFloat
 * @param value The f32 value to convert
 * @returns MessagePackFloat instance
 */
export function toMessagePackFloat32(value: f32): MessagePackFloat {
    return new MessagePackFloat(value as f64);
}

/**
 * Converts an AssemblyScript f64 to MessagePackFloat
 * @param value The f64 value to convert
 * @returns MessagePackFloat instance
 */
export function toMessagePackFloat64(value: f64): MessagePackFloat {
    return new MessagePackFloat(value);
}

/**
 * Converts an AssemblyScript string to MessagePackString
 * @param value The string value to convert
 * @returns MessagePackString instance
 */
export function toMessagePackString(value: string): MessagePackString {
    return new MessagePackString(value);
}

/**
 * Converts an AssemblyScript Uint8Array to MessagePackBinary
 * @param value The Uint8Array value to convert
 * @returns MessagePackBinary instance
 */
export function toMessagePackBinary(value: Uint8Array): MessagePackBinary {
    return new MessagePackBinary(value);
}

/**
 * Converts an array of MessagePackValue instances to MessagePackArray
 * @param values The array of MessagePackValue instances
 * @returns MessagePackArray instance
 */
export function toMessagePackArray(values: MessagePackValue[]): MessagePackArray {
    return new MessagePackArray(values);
}

/**
 * Converts a Map of string keys to MessagePackValue instances to MessagePackMap
 * @param value The map to convert
 * @returns MessagePackMap instance
 */
export function toMessagePackMap(value: Map<string, MessagePackValue>): MessagePackMap {
    return new MessagePackMap(value);
}

/**
 * Creates a MessagePackNull instance
 * @returns MessagePackNull instance
 */
export function toMessagePackNull(): MessagePackNull {
    return new MessagePackNull();
}

/**
 * Converts a nullable string to MessagePackValue
 * @param value The nullable string value
 * @returns MessagePackString or MessagePackNull
 */
export function toMessagePackNullableString(value: string | null): MessagePackValue {
    if (value === null) {
        return new MessagePackNull();
    }
    return new MessagePackString(value);
}

/**
 * Converts a nullable Uint8Array to MessagePackValue
 * @param value The nullable Uint8Array value
 * @returns MessagePackBinary or MessagePackNull
 */
export function toMessagePackNullableBinary(value: Uint8Array | null): MessagePackValue {
    if (value === null) {
        return new MessagePackNull();
    }
    return new MessagePackBinary(value);
}

/**
 * Helper function to convert an array of AssemblyScript booleans to MessagePackArray
 * @param values The array of boolean values
 * @returns MessagePackArray containing MessagePackBoolean instances
 */
export function booleanArrayToMessagePack(values: boolean[]): MessagePackArray {
    const messagePackValues: MessagePackValue[] = [];
    for (let i = 0; i < values.length; i++) {
        messagePackValues.push(new MessagePackBoolean(values[i]));
    }
    return new MessagePackArray(messagePackValues);
}

/**
 * Helper function to convert an array of AssemblyScript i32s to MessagePackArray
 * @param values The array of i32 values
 * @returns MessagePackArray containing MessagePackInteger instances
 */
export function integer32ArrayToMessagePack(values: i32[]): MessagePackArray {
    const messagePackValues: MessagePackValue[] = [];
    for (let i = 0; i < values.length; i++) {
        messagePackValues.push(new MessagePackInteger(values[i] as i64));
    }
    return new MessagePackArray(messagePackValues);
}

/**
 * Helper function to convert an array of AssemblyScript i64s to MessagePackArray
 * @param values The array of i64 values
 * @returns MessagePackArray containing MessagePackInteger instances
 */
export function integer64ArrayToMessagePack(values: i64[]): MessagePackArray {
    const messagePackValues: MessagePackValue[] = [];
    for (let i = 0; i < values.length; i++) {
        messagePackValues.push(new MessagePackInteger(values[i]));
    }
    return new MessagePackArray(messagePackValues);
}

/**
 * Helper function to convert an array of AssemblyScript f32s to MessagePackArray
 * @param values The array of f32 values
 * @returns MessagePackArray containing MessagePackFloat instances
 */
export function float32ArrayToMessagePack(values: f32[]): MessagePackArray {
    const messagePackValues: MessagePackValue[] = [];
    for (let i = 0; i < values.length; i++) {
        messagePackValues.push(new MessagePackFloat(values[i] as f64));
    }
    return new MessagePackArray(messagePackValues);
}

/**
 * Helper function to convert an array of AssemblyScript f64s to MessagePackArray
 * @param values The array of f64 values
 * @returns MessagePackArray containing MessagePackFloat instances
 */
export function float64ArrayToMessagePack(values: f64[]): MessagePackArray {
    const messagePackValues: MessagePackValue[] = [];
    for (let i = 0; i < values.length; i++) {
        messagePackValues.push(new MessagePackFloat(values[i]));
    }
    return new MessagePackArray(messagePackValues);
}

/**
 * Helper function to convert an array of AssemblyScript strings to MessagePackArray
 * @param values The array of string values
 * @returns MessagePackArray containing MessagePackString instances
 */
export function stringArrayToMessagePack(values: string[]): MessagePackArray {
    const messagePackValues: MessagePackValue[] = [];
    for (let i = 0; i < values.length; i++) {
        messagePackValues.push(new MessagePackString(values[i]));
    }
    return new MessagePackArray(messagePackValues);
}