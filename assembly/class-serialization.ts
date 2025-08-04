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
import { MessagePackDecoder } from "./decoder";

// ============================================================================
// Class-Specific Error Types
// ============================================================================

/**
 * Custom error class for class serialization errors
 * Extends MessagePackEncodeError with class-specific context and methods
 */
export class ClassSerializationError extends MessagePackEncodeError {
    /** The name of the class being serialized when the error occurred */
    public className: string;
    /** The name of the field being processed when the error occurred (if applicable) */
    public fieldName: string;

    constructor(message: string, className: string, fieldName: string = "", position: i32 = -1, context: string = "class serialization") {
        super(message, position, context);
        this.className = className;
        this.fieldName = fieldName;
    }

    /**
     * Creates a class serialization error for unregistered classes
     * @param className The name of the unregistered class
     * @returns ClassSerializationError instance
     */
    static unregisteredClass(className: string): ClassSerializationError {
        return new ClassSerializationError(
            `Class '${className}' is not registered for serialization. Use ClassRegistry.register() to register the class first.`,
            className,
            "",
            -1,
            "class registration validation"
        );
    }

    /**
     * Creates a class serialization error for missing required fields
     * @param fieldName The name of the missing field
     * @param className The name of the class
     * @returns ClassSerializationError instance
     */
    static missingRequiredField(fieldName: string, className: string): ClassSerializationError {
        return new ClassSerializationError(
            `Required field '${fieldName}' is null or missing in class '${className}'. Ensure the field has a non-null value or mark it as optional.`,
            className,
            fieldName,
            -1,
            "required field validation"
        );
    }

    /**
     * Creates a class serialization error for field type mismatches
     * @param fieldName The name of the field with type mismatch
     * @param className The name of the class
     * @param expectedType The expected MessagePackValueType
     * @param actualType The actual MessagePackValueType
     * @returns ClassSerializationError instance
     */
    static fieldTypeMismatch(fieldName: string, className: string, expectedType: MessagePackValueType, actualType: MessagePackValueType): ClassSerializationError {
        return new ClassSerializationError(
            `Type mismatch for field '${fieldName}' in class '${className}': expected ${getMessagePackValueTypeName(expectedType)}, got ${getMessagePackValueTypeName(actualType)}. Check the field metadata registration and getFieldValue() implementation.`,
            className,
            fieldName,
            -1,
            "field type validation"
        );
    }

    /**
     * Creates a class serialization error for invalid nested class types
     * @param fieldName The name of the field with invalid nested class
     * @param className The name of the parent class
     * @param nestedClassName The name of the unregistered nested class
     * @returns ClassSerializationError instance
     */
    static unregisteredNestedClass(fieldName: string, className: string, nestedClassName: string): ClassSerializationError {
        return new ClassSerializationError(
            `Nested class type '${nestedClassName}' for field '${fieldName}' in class '${className}' is not registered. Register the nested class first.`,
            className,
            fieldName,
            -1,
            "nested class validation"
        );
    }

    /**
     * Creates a class serialization error for invalid nested class format
     * @param fieldName The name of the field with invalid format
     * @param className The name of the parent class
     * @param actualType The actual type received instead of map
     * @returns ClassSerializationError instance
     */
    static invalidNestedClassFormat(fieldName: string, className: string, actualType: MessagePackValueType): ClassSerializationError {
        return new ClassSerializationError(
            `Nested class field '${fieldName}' in class '${className}' must be a MessagePackMap (serialized class), got ${getMessagePackValueTypeName(actualType)}. Ensure the nested class is properly serialized.`,
            className,
            fieldName,
            -1,
            "nested class format validation"
        );
    }

    /**
     * Creates a class serialization error for circular references
     * @param className The name of the class where circular reference was detected
     * @param fieldName The name of the field causing the circular reference
     * @returns ClassSerializationError instance
     */
    static circularReference(className: string, fieldName: string): ClassSerializationError {
        return new ClassSerializationError(
            `Circular reference detected in class '${className}' at field '${fieldName}'. Circular references are not supported in class serialization.`,
            className,
            fieldName,
            -1,
            "circular reference detection"
        );
    }
}

/**
 * Helper function to get a human-readable name for MessagePackValueType
 * @param type The MessagePackValueType
 * @returns String representation of the type
 */
function getMessagePackValueTypeName(type: MessagePackValueType): string {
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
            throw ClassSerializationError.unregisteredClass(className);
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
                    throw ClassSerializationError.missingRequiredField(field.name, className);
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
                throw ClassSerializationError.fieldTypeMismatch(
                    field.name,
                    className,
                    MessagePackValueType.NULL, // Use NULL as placeholder for unknown expected type
                    actualType
                );
        }

        // Check if the actual type matches the expected type
        if (actualType !== expectedType) {
            throw ClassSerializationError.fieldTypeMismatch(field.name, className, expectedType, actualType);
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
            throw ClassSerializationError.invalidNestedClassFormat(field.name, parentClassName, value.getType());
        }

        // Validate that the nested class type is registered
        if (field.nestedClassType !== null) {
            const nestedMetadata = ClassRegistry.getMetadata(field.nestedClassType!);
            if (nestedMetadata === null) {
                throw ClassSerializationError.unregisteredNestedClass(field.name, parentClassName, field.nestedClassType!);
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
// Class Deserialization Decoder Extension
// ============================================================================

/**
 * Custom error class for class deserialization errors
 * Extends MessagePackDecodeError with class-specific context and methods
 */
export class ClassDeserializationError extends MessagePackDecodeError {
    /** The name of the class being deserialized when the error occurred */
    public className: string;
    /** The name of the field being processed when the error occurred (if applicable) */
    public fieldName: string;

    constructor(message: string, className: string, fieldName: string = "", position: i32 = -1, formatByte: u8 = 0, context: string = "class deserialization") {
        super(message, position, formatByte, context);
        this.className = className;
        this.fieldName = fieldName;
    }

    /**
     * Creates a class deserialization error for unregistered classes
     * @param className The name of the unregistered class
     * @returns ClassDeserializationError instance
     */
    static unregisteredClass(className: string): ClassDeserializationError {
        return new ClassDeserializationError(
            `Class '${className}' is not registered for deserialization. Use ClassRegistry.register() to register the class first.`,
            className,
            "",
            -1,
            0,
            "class registration validation"
        );
    }

    /**
     * Creates a class deserialization error for invalid MessagePack format
     * @param className The name of the class
     * @param actualType The actual MessagePackValueType received
     * @returns ClassDeserializationError instance
     */
    static invalidFormat(className: string, actualType: MessagePackValueType): ClassDeserializationError {
        return new ClassDeserializationError(
            `Expected MessagePack map for class '${className}', got ${getMessagePackValueTypeName(actualType)}. Classes must be serialized as maps.`,
            className,
            "",
            -1,
            0,
            "format validation"
        );
    }

    /**
     * Creates a class deserialization error for missing required fields
     * @param fieldName The name of the missing field
     * @param className The name of the class
     * @returns ClassDeserializationError instance
     */
    static missingRequiredField(fieldName: string, className: string): ClassDeserializationError {
        return new ClassDeserializationError(
            `Required field '${fieldName}' is missing from MessagePack data for class '${className}'. Ensure the field was included during serialization.`,
            className,
            fieldName,
            -1,
            0,
            "required field validation"
        );
    }

    /**
     * Creates a class deserialization error for field type mismatches
     * @param fieldName The name of the field with type mismatch
     * @param className The name of the class
     * @param expectedType The expected MessagePackValueType
     * @param actualType The actual MessagePackValueType
     * @returns ClassDeserializationError instance
     */
    static fieldTypeMismatch(fieldName: string, className: string, expectedType: MessagePackValueType, actualType: MessagePackValueType): ClassDeserializationError {
        return new ClassDeserializationError(
            `Type mismatch for field '${fieldName}' in class '${className}': expected ${getMessagePackValueTypeName(expectedType)}, got ${getMessagePackValueTypeName(actualType)}. Check the serialized data format.`,
            className,
            fieldName,
            -1,
            0,
            "field type validation"
        );
    }

    /**
     * Creates a class deserialization error for unregistered nested classes
     * @param fieldName The name of the field with unregistered nested class
     * @param className The name of the parent class
     * @param nestedClassName The name of the unregistered nested class
     * @returns ClassDeserializationError instance
     */
    static unregisteredNestedClass(fieldName: string, className: string, nestedClassName: string): ClassDeserializationError {
        return new ClassDeserializationError(
            `Nested class type '${nestedClassName}' for field '${fieldName}' in class '${className}' is not registered. Register the nested class first.`,
            className,
            fieldName,
            -1,
            0,
            "nested class validation"
        );
    }
}

/**
 * Factory interface for creating and populating class instances during deserialization
 * 
 * This interface must be implemented by users to provide the deserialization system
 * with the ability to create new instances of their classes and set field values.
 * Since AssemblyScript lacks reflection, this factory pattern is necessary.
 */
export interface ClassFactory {
    /**
     * Create a new instance of the class
     * This should return a new instance with default values or uninitialized fields
     * @returns A new instance of the class
     */
    create(): Serializable;

    /**
     * Set a field value on a class instance
     * This method should set the specified field to the given MessagePackValue
     * The implementation should handle type conversion from MessagePackValue to the appropriate field type
     * @param instance The class instance to modify
     * @param fieldName The name of the field to set
     * @param value The MessagePackValue to set (guaranteed to match the registered field type)
     */
    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void;
}

/**
 * Extension of MessagePackDecoder that provides class deserialization capabilities
 * 
 * This class wraps the existing MessagePackDecoder and adds methods for deserializing
 * MessagePack data back into class instances. It handles field mapping, type validation,
 * and nested class deserialization.
 */
export class ClassSerializationDecoder {
    /** The underlying MessagePack decoder */
    private decoder: MessagePackDecoder;

    /**
     * Creates a new class serialization decoder
     * @param decoder The MessagePackDecoder instance to wrap
     */
    constructor(decoder: MessagePackDecoder) {
        this.decoder = decoder;
    }

    /**
     * Deserializes MessagePack data to a class instance
     * 
     * This method validates the class is registered, decodes the MessagePack data as a map,
     * validates field types, and uses the provided factory to create and populate a class instance.
     * 
     * @param factory The factory for creating and populating class instances
     * @param className The name of the class to deserialize
     * @returns A new instance populated with the deserialized data
     * @throws MessagePackDecodeError if deserialization fails
     */
    decodeClass(factory: ClassFactory, className: string): Serializable {
        // Validate that the class is registered
        const metadata = ClassRegistry.getMetadata(className);
        if (metadata === null) {
            throw ClassDeserializationError.unregisteredClass(className);
        }

        // Decode the MessagePack data
        const value = this.decoder.decode();

        // Validate that the decoded value is a map (classes are serialized as maps)
        if (value.getType() !== MessagePackValueType.MAP) {
            throw ClassDeserializationError.invalidFormat(className, value.getType());
        }

        // Extract the map data
        const mapValue = value as MessagePackMap;
        const fieldMap = mapValue.value;

        // Create a new instance using the factory
        const instance = factory.create();

        // Process each registered field
        for (let i = 0; i < metadata.fields.length; i++) {
            const field = metadata.fields[i];

            // Handle missing fields
            if (!fieldMap.has(field.name)) {
                if (!field.isOptional) {
                    throw ClassDeserializationError.missingRequiredField(field.name, className);
                }
                // Skip optional fields that are missing - they keep their default values
                continue;
            }

            const fieldValue = fieldMap.get(field.name);

            // Validate field type matches expected type
            this.validateFieldType(fieldValue, field, className);

            // Handle nested class deserialization
            if (field.type === SerializableFieldType.CLASS) {
                const deserializedNestedValue = this.deserializeNestedClass(fieldValue, field, className);
                factory.setFieldValue(instance, field.name, deserializedNestedValue);
            } else {
                // Set the field value using the factory
                factory.setFieldValue(instance, field.name, fieldValue);
            }
        }

        return instance;
    }

    /**
     * Validates that a field value matches the expected type
     * @param value The field value to validate
     * @param field The field metadata containing expected type
     * @param className The name of the class being deserialized (for error messages)
     * @throws MessagePackDecodeError if type validation fails
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
                throw ClassDeserializationError.fieldTypeMismatch(
                    field.name,
                    className,
                    MessagePackValueType.NULL, // Use NULL as placeholder for unknown expected type
                    actualType
                );
        }

        // Check if the actual type matches the expected type
        if (actualType !== expectedType) {
            throw ClassDeserializationError.fieldTypeMismatch(field.name, className, expectedType, actualType);
        }
    }

    /**
     * Deserializes a nested class instance
     * @param value The MessagePackValue containing the nested class (should be a map)
     * @param field The field metadata for the nested class
     * @param parentClassName The name of the parent class (for error messages)
     * @returns The deserialized nested class as a MessagePackValue
     * @throws MessagePackDecodeError if nested class deserialization fails
     */
    private deserializeNestedClass(value: MessagePackValue, field: FieldMetadata, parentClassName: string): MessagePackValue {
        // For nested classes, the value should be a MessagePackMap
        if (value.getType() !== MessagePackValueType.MAP) {
            throw ClassDeserializationError.fieldTypeMismatch(field.name, parentClassName, MessagePackValueType.MAP, value.getType());
        }

        // Validate that the nested class type is registered
        if (field.nestedClassType !== null) {
            const nestedMetadata = ClassRegistry.getMetadata(field.nestedClassType!);
            if (nestedMetadata === null) {
                throw ClassDeserializationError.unregisteredNestedClass(field.name, parentClassName, field.nestedClassType!);
            }
        }

        // Return the value as-is - the actual nested class deserialization
        // is handled by the factory's setFieldValue method to allow for
        // flexible factory implementations
        return value;
    }

    /**
     * Deserializes a nested class instance recursively using a provided factory
     * @param value The MessagePackValue containing the nested class (should be a map)
     * @param field The field metadata for the nested class
     * @param parentClassName The name of the parent class (for error messages)
     * @param nestedFactory The factory for creating the nested class instance
     * @returns The deserialized nested class instance
     * @throws MessagePackDecodeError if nested class deserialization fails
     */
    deserializeNestedClassWithFactory(value: MessagePackValue, field: FieldMetadata, parentClassName: string, nestedFactory: ClassFactory): Serializable {
        // For nested classes, the value should be a MessagePackMap
        if (value.getType() !== MessagePackValueType.MAP) {
            throw ClassDeserializationError.fieldTypeMismatch(field.name, parentClassName, MessagePackValueType.MAP, value.getType());
        }

        // Validate that the nested class type is registered
        if (field.nestedClassType === null) {
            throw new ClassDeserializationError(
                `Nested class field '${field.name}' in class '${parentClassName}' must specify nestedClassType`,
                parentClassName,
                field.name,
                -1,
                0,
                "nested class validation"
            );
        }

        const nestedMetadata = ClassRegistry.getMetadata(field.nestedClassType!);
        if (nestedMetadata === null) {
            throw ClassDeserializationError.unregisteredNestedClass(field.name, parentClassName, field.nestedClassType!);
        }

        // Extract the map data
        const mapValue = value as MessagePackMap;
        const fieldMap = mapValue.value;

        // Create a new instance using the nested factory
        const nestedInstance = nestedFactory.create();

        // Process each registered field of the nested class
        for (let i = 0; i < nestedMetadata.fields.length; i++) {
            const nestedField = nestedMetadata.fields[i];

            // Handle missing fields
            if (!fieldMap.has(nestedField.name)) {
                if (!nestedField.isOptional) {
                    throw ClassDeserializationError.missingRequiredField(nestedField.name, field.nestedClassType!);
                }
                // Skip optional fields that are missing - they keep their default values
                continue;
            }

            const nestedFieldValue = fieldMap.get(nestedField.name);

            // Validate field type matches expected type
            this.validateFieldType(nestedFieldValue, nestedField, field.nestedClassType!);

            // Handle recursive nested class deserialization
            if (nestedField.type === SerializableFieldType.CLASS) {
                // For recursive nested classes, we would need another factory
                // For now, we'll set the value as-is and let the factory handle it
                nestedFactory.setFieldValue(nestedInstance, nestedField.name, nestedFieldValue);
            } else {
                // Set the field value using the factory
                nestedFactory.setFieldValue(nestedInstance, nestedField.name, nestedFieldValue);
            }
        }

        return nestedInstance;
    }

    /**
     * Deserializes an array that may contain class instances
     * @param arrayValue The MessagePackArray to deserialize
     * @param elementType The type of elements in the array
     * @param nestedClassType The class type if elements are classes (null otherwise)
     * @param nestedFactory The factory for creating nested class instances (null if not needed)
     * @returns The deserialized array with class instances converted
     * @throws MessagePackDecodeError if array deserialization fails
     */
    deserializeArrayWithClasses(arrayValue: MessagePackArray, elementType: SerializableFieldType, nestedClassType: string | null, nestedFactory: ClassFactory | null): MessagePackArray {
        const originalArray = arrayValue.value;
        const deserializedElements: MessagePackValue[] = [];

        for (let i = 0; i < originalArray.length; i++) {
            const element = originalArray[i];

            if (elementType === SerializableFieldType.CLASS) {
                if (nestedClassType === null || nestedFactory === null) {
                    throw new ClassDeserializationError(
                        `Array element of type CLASS requires nestedClassType and nestedFactory`,
                        "",
                        "",
                        -1,
                        0,
                        "array deserialization"
                    );
                }

                // Create a temporary field metadata for validation
                const tempField = new FieldMetadata(`array_element_${i}`, SerializableFieldType.CLASS, false, nestedClassType);
                
                // Deserialize the nested class
                const deserializedElement = this.deserializeNestedClassWithFactory(element, tempField, "Array", nestedFactory);
                
                // Convert back to MessagePackValue for consistency
                // This would typically be handled by the calling code
                deserializedElements.push(element);
            } else {
                // For non-class elements, validate type and keep as-is
                this.validateArrayElementType(element, elementType, i);
                deserializedElements.push(element);
            }
        }

        return new MessagePackArray(deserializedElements);
    }

    /**
     * Deserializes a map that may contain class instances as values
     * @param mapValue The MessagePackMap to deserialize
     * @param valueType The type of values in the map
     * @param nestedClassType The class type if values are classes (null otherwise)
     * @param nestedFactory The factory for creating nested class instances (null if not needed)
     * @returns The deserialized map with class instances converted
     * @throws MessagePackDecodeError if map deserialization fails
     */
    deserializeMapWithClasses(mapValue: MessagePackMap, valueType: SerializableFieldType, nestedClassType: string | null, nestedFactory: ClassFactory | null): MessagePackMap {
        const originalMap = mapValue.value;
        const deserializedMap = new Map<string, MessagePackValue>();

        const keys = originalMap.keys();
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = originalMap.get(key);

            if (valueType === SerializableFieldType.CLASS) {
                if (nestedClassType === null || nestedFactory === null) {
                    throw new ClassDeserializationError(
                        `Map value of type CLASS requires nestedClassType and nestedFactory`,
                        "",
                        "",
                        -1,
                        0,
                        "map deserialization"
                    );
                }

                // Create a temporary field metadata for validation
                const tempField = new FieldMetadata(`map_value_${key}`, SerializableFieldType.CLASS, false, nestedClassType);
                
                // Deserialize the nested class
                const deserializedValue = this.deserializeNestedClassWithFactory(value, tempField, "Map", nestedFactory);
                
                // Convert back to MessagePackValue for consistency
                // This would typically be handled by the calling code
                deserializedMap.set(key, value);
            } else {
                // For non-class values, validate type and keep as-is
                this.validateMapValueType(value, valueType, key);
                deserializedMap.set(key, value);
            }
        }

        return new MessagePackMap(deserializedMap);
    }

    /**
     * Validates the type of an array element
     * @param element The array element to validate
     * @param expectedType The expected element type
     * @param index The index of the element (for error messages)
     * @throws MessagePackDecodeError if validation fails
     */
    private validateArrayElementType(element: MessagePackValue, expectedType: SerializableFieldType, index: i32): void {
        let expectedMessagePackType: MessagePackValueType;

        switch (expectedType) {
            case SerializableFieldType.NULL:
                expectedMessagePackType = MessagePackValueType.NULL;
                break;
            case SerializableFieldType.BOOLEAN:
                expectedMessagePackType = MessagePackValueType.BOOLEAN;
                break;
            case SerializableFieldType.INTEGER:
                expectedMessagePackType = MessagePackValueType.INTEGER;
                break;
            case SerializableFieldType.FLOAT:
                expectedMessagePackType = MessagePackValueType.FLOAT;
                break;
            case SerializableFieldType.STRING:
                expectedMessagePackType = MessagePackValueType.STRING;
                break;
            case SerializableFieldType.BINARY:
                expectedMessagePackType = MessagePackValueType.BINARY;
                break;
            case SerializableFieldType.ARRAY:
                expectedMessagePackType = MessagePackValueType.ARRAY;
                break;
            case SerializableFieldType.MAP:
                expectedMessagePackType = MessagePackValueType.MAP;
                break;
            case SerializableFieldType.CLASS:
                expectedMessagePackType = MessagePackValueType.MAP;
                break;
            default:
                throw new ClassDeserializationError(
                    `Unknown array element type at index ${index}`,
                    "",
                    "",
                    -1,
                    0,
                    "array element validation"
                );
        }

        if (element.getType() !== expectedMessagePackType) {
            throw new ClassDeserializationError(
                `Array element type mismatch at index ${index}: expected ${getMessagePackValueTypeName(expectedMessagePackType)}, got ${getMessagePackValueTypeName(element.getType())}`,
                "",
                "",
                -1,
                0,
                "array element validation"
            );
        }
    }

    /**
     * Validates the type of a map value
     * @param value The map value to validate
     * @param expectedType The expected value type
     * @param key The key of the value (for error messages)
     * @throws MessagePackDecodeError if validation fails
     */
    private validateMapValueType(value: MessagePackValue, expectedType: SerializableFieldType, key: string): void {
        let expectedMessagePackType: MessagePackValueType;

        switch (expectedType) {
            case SerializableFieldType.NULL:
                expectedMessagePackType = MessagePackValueType.NULL;
                break;
            case SerializableFieldType.BOOLEAN:
                expectedMessagePackType = MessagePackValueType.BOOLEAN;
                break;
            case SerializableFieldType.INTEGER:
                expectedMessagePackType = MessagePackValueType.INTEGER;
                break;
            case SerializableFieldType.FLOAT:
                expectedMessagePackType = MessagePackValueType.FLOAT;
                break;
            case SerializableFieldType.STRING:
                expectedMessagePackType = MessagePackValueType.STRING;
                break;
            case SerializableFieldType.BINARY:
                expectedMessagePackType = MessagePackValueType.BINARY;
                break;
            case SerializableFieldType.ARRAY:
                expectedMessagePackType = MessagePackValueType.ARRAY;
                break;
            case SerializableFieldType.MAP:
                expectedMessagePackType = MessagePackValueType.MAP;
                break;
            case SerializableFieldType.CLASS:
                expectedMessagePackType = MessagePackValueType.MAP;
                break;
            default:
                throw new ClassDeserializationError(
                    `Unknown map value type for key '${key}'`,
                    "",
                    "",
                    -1,
                    0,
                    "map value validation"
                );
        }

        if (value.getType() !== expectedMessagePackType) {
            throw new ClassDeserializationError(
                `Map value type mismatch for key '${key}': expected ${getMessagePackValueTypeName(expectedMessagePackType)}, got ${getMessagePackValueTypeName(value.getType())}`,
                "",
                "",
                -1,
                0,
                "map value validation"
            );
        }
    }

    /**
     * Gets the underlying MessagePackDecoder instance
     * @returns The MessagePackDecoder instance
     */
    getDecoder(): MessagePackDecoder {
        return this.decoder;
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

// Convenience Methods and Utilities

/**
 * Builder class for creating class metadata with a fluent interface
 * Provides a convenient way to register classes with method chaining
 */
export class ClassRegistrationBuilder {
    private className: string;
    private fields: FieldMetadata[];

    /**
     * Creates a new class registration builder
     * @param className The name of the class to register
     */
    constructor(className: string) {
        this.className = className;
        this.fields = [];
    }

    /**
     * Adds a boolean field to the class
     * @param name The field name
     * @param isOptional Whether the field is optional (defaults to false)
     * @returns This builder instance for method chaining
     */
    addBooleanField(name: string, isOptional: boolean = false): ClassRegistrationBuilder {
        this.fields.push(new FieldMetadata(name, SerializableFieldType.BOOLEAN, isOptional));
        return this;
    }

    /**
     * Adds an integer field to the class
     * @param name The field name
     * @param isOptional Whether the field is optional (defaults to false)
     * @returns This builder instance for method chaining
     */
    addIntegerField(name: string, isOptional: boolean = false): ClassRegistrationBuilder {
        this.fields.push(new FieldMetadata(name, SerializableFieldType.INTEGER, isOptional));
        return this;
    }

    /**
     * Adds a float field to the class
     * @param name The field name
     * @param isOptional Whether the field is optional (defaults to false)
     * @returns This builder instance for method chaining
     */
    addFloatField(name: string, isOptional: boolean = false): ClassRegistrationBuilder {
        this.fields.push(new FieldMetadata(name, SerializableFieldType.FLOAT, isOptional));
        return this;
    }

    /**
     * Adds a string field to the class
     * @param name The field name
     * @param isOptional Whether the field is optional (defaults to false)
     * @returns This builder instance for method chaining
     */
    addStringField(name: string, isOptional: boolean = false): ClassRegistrationBuilder {
        this.fields.push(new FieldMetadata(name, SerializableFieldType.STRING, isOptional));
        return this;
    }

    /**
     * Adds a binary field to the class
     * @param name The field name
     * @param isOptional Whether the field is optional (defaults to false)
     * @returns This builder instance for method chaining
     */
    addBinaryField(name: string, isOptional: boolean = false): ClassRegistrationBuilder {
        this.fields.push(new FieldMetadata(name, SerializableFieldType.BINARY, isOptional));
        return this;
    }

    /**
     * Adds an array field to the class
     * @param name The field name
     * @param isOptional Whether the field is optional (defaults to false)
     * @returns This builder instance for method chaining
     */
    addArrayField(name: string, isOptional: boolean = false): ClassRegistrationBuilder {
        this.fields.push(new FieldMetadata(name, SerializableFieldType.ARRAY, isOptional));
        return this;
    }

    /**
     * Adds a map field to the class
     * @param name The field name
     * @param isOptional Whether the field is optional (defaults to false)
     * @returns This builder instance for method chaining
     */
    addMapField(name: string, isOptional: boolean = false): ClassRegistrationBuilder {
        this.fields.push(new FieldMetadata(name, SerializableFieldType.MAP, isOptional));
        return this;
    }

    /**
     * Adds a nested class field to the class
     * @param name The field name
     * @param nestedClassName The name of the nested class type
     * @param isOptional Whether the field is optional (defaults to false)
     * @returns This builder instance for method chaining
     */
    addClassField(name: string, nestedClassName: string, isOptional: boolean = false): ClassRegistrationBuilder {
        this.fields.push(new FieldMetadata(name, SerializableFieldType.CLASS, isOptional, nestedClassName));
        return this;
    }

    /**
     * Adds a null field to the class (primarily for testing)
     * @param name The field name
     * @param isOptional Whether the field is optional (defaults to true for null fields)
     * @returns This builder instance for method chaining
     */
    addNullField(name: string, isOptional: boolean = true): ClassRegistrationBuilder {
        this.fields.push(new FieldMetadata(name, SerializableFieldType.NULL, isOptional));
        return this;
    }

    /**
     * Registers the class with the ClassRegistry
     * @throws MessagePackEncodeError if registration fails
     */
    register(): void {
        ClassRegistry.register(this.className, this.fields);
    }

    /**
     * Gets the current field count
     * @returns The number of fields added so far
     */
    getFieldCount(): i32 {
        return this.fields.length;
    }

    /**
     * Gets the class name
     * @returns The class name
     */
    getClassName(): string {
        return this.className;
    }

    /**
     * Gets a copy of the current fields array
     * @returns Array of field metadata
     */
    getFields(): FieldMetadata[] {
        const fieldsCopy: FieldMetadata[] = [];
        for (let i = 0; i < this.fields.length; i++) {
            fieldsCopy.push(this.fields[i]);
        }
        return fieldsCopy;
    }
}
/**

 * Utility class for batch registration of multiple related classes
 * Provides methods to register multiple classes at once with validation
 */
export class BatchClassRegistration {
    private builders: ClassRegistrationBuilder[];

    /**
     * Creates a new batch registration instance
     */
    constructor() {
        this.builders = [];
    }

    /**
     * Adds a class builder to the batch
     * @param builder The class registration builder to add
     * @returns This batch registration instance for method chaining
     */
    addClass(builder: ClassRegistrationBuilder): BatchClassRegistration {
        this.builders.push(builder);
        return this;
    }

    /**
     * Creates and adds a new class builder to the batch
     * @param className The name of the class
     * @returns The new class registration builder for configuration
     */
    createClass(className: string): ClassRegistrationBuilder {
        const builder = new ClassRegistrationBuilder(className);
        this.builders.push(builder);
        return builder;
    }

    /**
     * Registers all classes in the batch
     * If any registration fails, none of the classes will be registered
     * @throws MessagePackEncodeError if any registration fails
     */
    registerAll(): void {
        // First, validate that all class names are unique within the batch
        const classNames = new Set<string>();
        for (let i = 0; i < this.builders.length; i++) {
            const className = this.builders[i].getClassName();
            if (classNames.has(className)) {
                throw new MessagePackEncodeError(
                    `Duplicate class name '${className}' in batch registration`,
                    -1,
                    "batch registration validation"
                );
            }
            classNames.add(className);
        }

        // Validate that no classes are already registered
        for (let i = 0; i < this.builders.length; i++) {
            const className = this.builders[i].getClassName();
            if (ClassRegistry.isRegistered(className)) {
                throw new MessagePackEncodeError(
                    `Class '${className}' is already registered`,
                    -1,
                    "batch registration validation"
                );
            }
        }

        // Register all classes
        for (let i = 0; i < this.builders.length; i++) {
            this.builders[i].register();
        }
    }

    /**
     * Gets the number of classes in the batch
     * @returns The number of classes to be registered
     */
    getClassCount(): i32 {
        return this.builders.length;
    }

    /**
     * Gets all class names in the batch
     * @returns Array of class names
     */
    getClassNames(): string[] {
        const names: string[] = [];
        for (let i = 0; i < this.builders.length; i++) {
            names.push(this.builders[i].getClassName());
        }
        return names;
    }

    /**
     * Clears all classes from the batch
     */
    clear(): void {
        this.builders = [];
    }
}/**
 *
 Utility class providing common serialization patterns and helper methods
 */
export class SerializationUtils {
    /**
     * Creates a simple encoder for class serialization
     * @returns ClassSerializationEncoder instance
     */
    static createEncoder(): ClassSerializationEncoder {
        const messagePackEncoder = new MessagePackEncoder();
        return new ClassSerializationEncoder(messagePackEncoder);
    }

    /**
     * Creates a simple decoder for class serialization
     * @returns ClassSerializationDecoder instance
     */
    static createDecoder(): ClassSerializationDecoder {
        const emptyBuffer = new Uint8Array(0);
        const messagePackDecoder = new MessagePackDecoder(emptyBuffer);
        return new ClassSerializationDecoder(messagePackDecoder);
    }

    /**
     * Serializes a class instance to binary data
     * @param instance The class instance to serialize
     * @returns Binary data as Uint8Array
     */
    static serialize<T extends Serializable>(instance: T): Uint8Array {
        const encoder = SerializationUtils.createEncoder();
        return encoder.encodeClass(instance);
    }

    /**
     * Deserializes binary data to a class instance
     * @param data The binary data to deserialize
     * @param factory The factory for creating class instances
     * @param className The name of the class to deserialize
     * @returns The deserialized class instance
     */
    static deserialize(data: Uint8Array, factory: ClassFactory, className: string): Serializable {
        const messagePackDecoder = new MessagePackDecoder(data);
        const decoder = new ClassSerializationDecoder(messagePackDecoder);
        return decoder.decodeClass(factory, className);
    }

    /**
     * Performs a roundtrip test: serialize then deserialize
     * @param instance The instance to test
     * @param factory The factory for creating instances
     * @returns The deserialized instance
     */
    static roundtrip<T extends Serializable>(instance: T, factory: ClassFactory): Serializable {
        const serialized = SerializationUtils.serialize(instance);
        return SerializationUtils.deserialize(serialized, factory, instance.getClassName());
    }

    /**
     * Validates that a class is properly registered and has all required metadata
     * @param className The name of the class to validate
     * @returns True if the class is valid for serialization
     * @throws MessagePackEncodeError if validation fails
     */
    static validateClassRegistration(className: string): boolean {
        const metadata = ClassRegistry.getMetadata(className);
        if (metadata === null) {
            throw ClassSerializationError.unregisteredClass(className);
        }

        // Validate nested class references
        for (let i = 0; i < metadata.fields.length; i++) {
            const field = metadata.fields[i];
            if (field.type === SerializableFieldType.CLASS && field.nestedClassType !== null) {
                const nestedMetadata = ClassRegistry.getMetadata(field.nestedClassType!);
                if (nestedMetadata === null) {
                    throw ClassSerializationError.unregisteredNestedClass(field.name, className, field.nestedClassType!);
                }
            }
        }

        return true;
    }

    /**
     * Gets the total number of registered classes
     * @returns Number of registered classes
     */
    static getTotalClasses(): i32 {
        return ClassRegistry.getRegisteredCount();
    }

    /**
     * Gets all registered class names
     * @returns Array of class names
     */
    static getRegisteredClassNames(): string[] {
        return ClassRegistry.getRegisteredClasses();
    }

    /**
     * Gets the total number of fields across all registered classes
     * @returns Total field count
     */
    static getTotalFields(): i32 {
        const classNames = ClassRegistry.getRegisteredClasses();
        let totalFields = 0;

        for (let i = 0; i < classNames.length; i++) {
            const metadata = ClassRegistry.getMetadata(classNames[i]);
            if (metadata !== null) {
                totalFields += metadata.fields.length;
            }
        }

        return totalFields;
    }

    /**
     * Creates a field metadata instance with basic parameters
     * @param name The field name
     * @param type The field type
     * @param isOptional Whether the field is optional
     * @returns FieldMetadata instance
     */
    static createField(name: string, type: SerializableFieldType, isOptional: boolean = false): FieldMetadata {
        return new FieldMetadata(name, type, isOptional);
    }

    /**
     * Creates a field metadata instance for nested classes
     * @param name The field name
     * @param nestedClassName The nested class name
     * @param isOptional Whether the field is optional
     * @returns FieldMetadata instance
     */
    static createNestedField(name: string, nestedClassName: string, isOptional: boolean = false): FieldMetadata {
        return new FieldMetadata(name, SerializableFieldType.CLASS, isOptional, nestedClassName);
    }
}//
// Example Classes for Demonstration

/**
 * Example simple class with basic field types
 * Demonstrates basic serialization patterns
 */
export class ExamplePerson implements Serializable {
    public name: string;
    public age: i32;
    public isActive: boolean;
    public email: string | null;

    constructor(name: string, age: i32, isActive: boolean, email: string | null = null) {
        this.name = name;
        this.age = age;
        this.isActive = isActive;
        this.email = email;
    }

    getClassName(): string {
        return "ExamplePerson";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "name") {
            return toMessagePackString(this.name);
        } else if (fieldName === "age") {
            return toMessagePackInteger32(this.age);
        } else if (fieldName === "isActive") {
            return toMessagePackBoolean(this.isActive);
        } else if (fieldName === "email") {
            return toMessagePackNullableString(this.email);
        } else {
            return null;
        }
    }

    /**
     * Static method to register this class with the registry
     */
    static register(): void {
        new ClassRegistrationBuilder("ExamplePerson")
            .addStringField("name")
            .addIntegerField("age")
            .addBooleanField("isActive")
            .addStringField("email", true) // optional
            .register();
    }
}

/**
 * Factory for creating ExamplePerson instances
 */
export class ExamplePersonFactory implements ClassFactory {
    create(): Serializable {
        return new ExamplePerson("", 0, false, null);
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const person = instance as ExamplePerson;
        
        if (fieldName === "name") {
            const nameValue = value as MessagePackString;
            person.name = nameValue.value;
        } else if (fieldName === "age") {
            const ageValue = value as MessagePackInteger;
            person.age = ageValue.value as i32;
        } else if (fieldName === "isActive") {
            const activeValue = value as MessagePackBoolean;
            person.isActive = activeValue.value;
        } else if (fieldName === "email") {
            if (value.getType() === MessagePackValueType.NULL) {
                person.email = null;
            } else {
                const emailValue = value as MessagePackString;
                person.email = emailValue.value;
            }
        }
    }
}

/**
 * Example class with array and map fields
 * Demonstrates collection serialization patterns
 */
export class ExampleProject implements Serializable {
    public name: string;
    public tags: string[];
    public metadata: Map<string, string>;
    public priority: i32;

    constructor(name: string, tags: string[], metadata: Map<string, string>, priority: i32) {
        this.name = name;
        this.tags = tags;
        this.metadata = metadata;
        this.priority = priority;
    }

    getClassName(): string {
        return "ExampleProject";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        switch (fieldName) {
            case "name":
                return toMessagePackString(this.name);
            case "tags":
                return stringArrayToMessagePack(this.tags);
            case "metadata":
                const metadataMap = new Map<string, MessagePackValue>();
                const keys = this.metadata.keys();
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    metadataMap.set(key, toMessagePackString(this.metadata.get(key)));
                }
                return toMessagePackMap(metadataMap);
            case "priority":
                return toMessagePackInteger32(this.priority);
            default:
                return null;
        }
    }

    /**
     * Static method to register this class with the registry
     */
    static register(): void {
        new ClassRegistrationBuilder("ExampleProject")
            .addStringField("name")
            .addArrayField("tags")
            .addMapField("metadata")
            .addIntegerField("priority")
            .register();
    }
}

/**
 * Factory for creating ExampleProject instances
 */
export class ExampleProjectFactory implements ClassFactory {
    create(): Serializable {
        return new ExampleProject("", [], new Map<string, string>(), 0);
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const project = instance as ExampleProject;
        
        switch (fieldName) {
            case "name":
                const nameValue = value as MessagePackString;
                project.name = nameValue.value;
                break;
            case "tags":
                const tagsValue = value as MessagePackArray;
                const tags: string[] = [];
                for (let i = 0; i < tagsValue.value.length; i++) {
                    const tagValue = tagsValue.value[i] as MessagePackString;
                    tags.push(tagValue.value);
                }
                project.tags = tags;
                break;
            case "metadata":
                const metadataValue = value as MessagePackMap;
                const metadata = new Map<string, string>();
                const keys = metadataValue.value.keys();
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const val = metadataValue.value.get(key) as MessagePackString;
                    metadata.set(key, val.value);
                }
                project.metadata = metadata;
                break;
            case "priority":
                const priorityValue = value as MessagePackInteger;
                project.priority = priorityValue.value as i32;
                break;
        }
    }
}

/**
 * Example class with nested class field
 * Demonstrates nested class serialization patterns
 */
export class ExampleCompany implements Serializable {
    public name: string;
    public founder: ExamplePerson;
    public employees: ExamplePerson[];
    public established: i32;

    constructor(name: string, founder: ExamplePerson, employees: ExamplePerson[], established: i32) {
        this.name = name;
        this.founder = founder;
        this.employees = employees;
        this.established = established;
    }

    getClassName(): string {
        return "ExampleCompany";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        switch (fieldName) {
            case "name":
                return toMessagePackString(this.name);
            case "founder":
                // Serialize the nested person object
                const founderSerialized = SerializationUtils.serialize(this.founder);
                const founderDecoder = new MessagePackDecoder();
                founderDecoder.setData(founderSerialized);
                return founderDecoder.decode();
            case "employees":
                const employeeValues: MessagePackValue[] = [];
                for (let i = 0; i < this.employees.length; i++) {
                    const empSerialized = SerializationUtils.serialize(this.employees[i]);
                    const empDecoder = new MessagePackDecoder();
                    empDecoder.setData(empSerialized);
                    employeeValues.push(empDecoder.decode());
                }
                return toMessagePackArray(employeeValues);
            case "established":
                return toMessagePackInteger32(this.established);
            default:
                return null;
        }
    }

    /**
     * Static method to register this class with the registry
     */
    static register(): void {
        new ClassRegistrationBuilder("ExampleCompany")
            .addStringField("name")
            .addClassField("founder", "ExamplePerson")
            .addArrayField("employees") // Array of ExamplePerson objects
            .addIntegerField("established")
            .register();
    }
}

/**
 * Factory for creating ExampleCompany instances
 */
export class ExampleCompanyFactory implements ClassFactory {
    private personFactory: ExamplePersonFactory;

    constructor() {
        this.personFactory = new ExamplePersonFactory();
    }

    create(): Serializable {
        const defaultFounder = new ExamplePerson("", 0, false, null);
        return new ExampleCompany("", defaultFounder, [], 0);
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const company = instance as ExampleCompany;
        
        switch (fieldName) {
            case "name":
                const nameValue = value as MessagePackString;
                company.name = nameValue.value;
                break;
            case "founder":
                // Deserialize the nested person object
                const founderMap = value as MessagePackMap;
                const founderEncoder = new MessagePackEncoder();
                const founderData = founderEncoder.encodeMap(founderMap.value);
                company.founder = SerializationUtils.deserialize(founderData, this.personFactory, "ExamplePerson") as ExamplePerson;
                break;
            case "employees":
                const employeesValue = value as MessagePackArray;
                const employees: ExamplePerson[] = [];
                for (let i = 0; i < employeesValue.value.length; i++) {
                    const empMap = employeesValue.value[i] as MessagePackMap;
                    const empEncoder = new MessagePackEncoder();
                    const empData = empEncoder.encodeMap(empMap.value);
                    const emp = SerializationUtils.deserialize(empData, this.personFactory, "ExamplePerson") as ExamplePerson;
                    employees.push(emp);
                }
                company.employees = employees;
                break;
            case "established":
                const establishedValue = value as MessagePackInteger;
                company.established = establishedValue.value as i32;
                break;
        }
    }
}

/**
 * Utility function to register all example classes at once
 * Demonstrates batch registration pattern
 */
export function registerExampleClasses(): void {
    const batch = new BatchClassRegistration();
    
    // Register Person class
    batch.createClass("ExamplePerson")
        .addStringField("name")
        .addIntegerField("age")
        .addBooleanField("isActive")
        .addStringField("email", true);
    
    // Register Project class
    batch.createClass("ExampleProject")
        .addStringField("name")
        .addArrayField("tags")
        .addMapField("metadata")
        .addIntegerField("priority");
    
    // Register Company class (depends on Person)
    batch.createClass("ExampleCompany")
        .addStringField("name")
        .addClassField("founder", "ExamplePerson")
        .addArrayField("employees")
        .addIntegerField("established");
    
    batch.registerAll();
}