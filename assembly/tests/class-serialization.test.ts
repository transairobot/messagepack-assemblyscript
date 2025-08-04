/**
 * Unit tests for class serialization metadata and registry system
 */

import {
    SerializableFieldType,
    FieldMetadata,
    ClassMetadata,
    ClassRegistry,
    Serializable,
    ClassSerializationEncoder,
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
} from "../class-serialization";

import { MessagePackEncoder } from "../encoder";
import { MessagePackDecoder } from "../decoder";

import {
    MessagePackValue,
    MessagePackValueType,
    MessagePackBoolean,
    MessagePackInteger,
    MessagePackFloat,
    MessagePackString,
    MessagePackBinary,
    MessagePackArray,
    MessagePackMap,
    MessagePackNull
} from "../types";

/**
 * Test suite for SerializableFieldType enum
 */
export function runSerializableFieldTypeTests(): boolean {
    console.log("=== SerializableFieldType Tests ===");

    let passed = 0;
    let total = 0;

    // Test 1: Enum values are correctly defined
    total++;
    if (SerializableFieldType.NULL === 0 &&
        SerializableFieldType.BOOLEAN === 1 &&
        SerializableFieldType.INTEGER === 2 &&
        SerializableFieldType.FLOAT === 3 &&
        SerializableFieldType.STRING === 4 &&
        SerializableFieldType.BINARY === 5 &&
        SerializableFieldType.ARRAY === 6 &&
        SerializableFieldType.MAP === 7 &&
        SerializableFieldType.CLASS === 8) {
        console.log("✓ Enum values are correctly defined");
        passed++;
    } else {
        console.log("✗ Enum values are not correctly defined");
    }

    console.log(`SerializableFieldType tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test suite for FieldMetadata class
 */
export function runFieldMetadataTests(): boolean {
    console.log("=== FieldMetadata Tests ===");

    let passed = 0;
    let total = 0;

    // Test 1: Basic field metadata creation
    total++;
    const field = new FieldMetadata("name", SerializableFieldType.STRING);
    if (field.name === "name" &&
        field.type === SerializableFieldType.STRING &&
        field.isOptional === false &&
        field.nestedClassType === null) {
        console.log("✓ Basic field metadata creation works");
        passed++;
    } else {
        console.log("✗ Basic field metadata creation failed");
    }

    // Test 2: Optional field metadata creation
    total++;
    const field2 = new FieldMetadata("email", SerializableFieldType.STRING, true);
    if (field2.name === "email" &&
        field2.type === SerializableFieldType.STRING &&
        field2.isOptional === true &&
        field2.nestedClassType === null) {
        console.log("✓ Optional field metadata creation works");
        passed++;
    } else {
        console.log("✗ Optional field metadata creation failed");
    }

    // Test 3: CLASS type field with nested class type
    total++;
    const field3 = new FieldMetadata("user", SerializableFieldType.CLASS, false, "User");
    if (field3.name === "user" &&
        field3.type === SerializableFieldType.CLASS &&
        field3.isOptional === false &&
        field3.nestedClassType === "User") {
        console.log("✓ CLASS type field with nested class type works");
        passed++;
    } else {
        console.log("✗ CLASS type field with nested class type failed");
    }

    // Test 4: toString method
    total++;
    const field4 = new FieldMetadata("name", SerializableFieldType.STRING);
    const field5 = new FieldMetadata("email", SerializableFieldType.STRING, true);
    const field6 = new FieldMetadata("user", SerializableFieldType.CLASS, false, "User");

    const str1 = field4.toString();
    const str2 = field5.toString();
    const str3 = field6.toString();

    if (str1.includes("name") && str1.includes("STRING") &&
        str2.includes("email") && str2.includes("STRING") && str2.includes("optional") &&
        str3.includes("user") && str3.includes("CLASS") && str3.includes("User")) {
        console.log("✓ toString method works correctly");
        passed++;
    } else {
        console.log("✗ toString method failed");
        console.log("  str1: " + str1);
        console.log("  str2: " + str2);
        console.log("  str3: " + str3);
    }

    console.log(`FieldMetadata tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test suite for ClassMetadata class
 */
export function runClassMetadataTests(): boolean {
    console.log("=== ClassMetadata Tests ===");

    let passed = 0;
    let total = 0;

    // Test 1: Basic class metadata creation
    total++;
    const fields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER)
    ];
    const classMetadata = new ClassMetadata("User", fields);

    if (classMetadata.className === "User" &&
        classMetadata.fields.length === 2 &&
        classMetadata.fields[0].name === "name" &&
        classMetadata.fields[1].name === "age") {
        console.log("✓ Basic class metadata creation works");
        passed++;
    } else {
        console.log("✗ Basic class metadata creation failed");
    }

    // Test 2: getField method
    total++;
    const nameField = classMetadata.getField("name");
    const ageField = classMetadata.getField("age");
    const nonExistentField = classMetadata.getField("email");

    if (nameField !== null && nameField.name === "name" &&
        ageField !== null && ageField.name === "age" &&
        nonExistentField === null) {
        console.log("✓ getField method works correctly");
        passed++;
    } else {
        console.log("✗ getField method failed");
    }

    // Test 3: hasField method
    total++;
    if (classMetadata.hasField("name") === true &&
        classMetadata.hasField("age") === true &&
        classMetadata.hasField("email") === false) {
        console.log("✓ hasField method works correctly");
        passed++;
    } else {
        console.log("✗ hasField method failed");
    }

    // Test 4: getRequiredFields method
    total++;
    const fields2 = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("email", SerializableFieldType.STRING, true)
    ];
    const classMetadata2 = new ClassMetadata("User2", fields2);

    const requiredFields = classMetadata2.getRequiredFields();

    if (requiredFields.length === 2 &&
        requiredFields.includes("name") &&
        requiredFields.includes("age") &&
        !requiredFields.includes("email")) {
        console.log("✓ getRequiredFields method works correctly");
        passed++;
    } else {
        console.log("✗ getRequiredFields method failed");
        console.log("  Required fields: " + requiredFields.join(", "));
    }

    // Test 5: getOptionalFields method
    total++;
    const fields3 = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("email", SerializableFieldType.STRING, true),
        new FieldMetadata("phone", SerializableFieldType.STRING, true)
    ];
    const classMetadata3 = new ClassMetadata("User3", fields3);

    const optionalFields = classMetadata3.getOptionalFields();

    if (optionalFields.length === 2 &&
        optionalFields.includes("email") &&
        optionalFields.includes("phone") &&
        !optionalFields.includes("name") &&
        !optionalFields.includes("age")) {
        console.log("✓ getOptionalFields method works correctly");
        passed++;
    } else {
        console.log("✗ getOptionalFields method failed");
        console.log("  Optional fields: " + optionalFields.join(", "));
    }

    // Test 6: toString method
    total++;
    const str = classMetadata.toString();

    if (str.includes("User") && str.includes("name") && str.includes("age")) {
        console.log("✓ toString method works correctly");
        passed++;
    } else {
        console.log("✗ toString method failed");
        console.log("  toString output: " + str);
    }

    console.log(`ClassMetadata tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test suite for ClassRegistry class
 */
export function runClassRegistryTests(): boolean {
    console.log("=== ClassRegistry Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Test 1: Basic class registration
    total++;
    const fields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER)
    ];

    ClassRegistry.register("User", fields);

    if (ClassRegistry.isRegistered("User")) {
        console.log("✓ Basic class registration works");
        passed++;
    } else {
        console.log("✗ Basic class registration failed");
    }

    // Test 2: getMetadata method
    total++;
    const metadata = ClassRegistry.getMetadata("User");

    if (metadata !== null &&
        metadata.className === "User" &&
        metadata.fields.length === 2) {
        console.log("✓ getMetadata method works correctly");
        passed++;
    } else {
        console.log("✗ getMetadata method failed");
    }

    // Test 3: getMetadata for non-existent class
    total++;
    const nonExistentMetadata = ClassRegistry.getMetadata("NonExistent");

    if (nonExistentMetadata === null) {
        console.log("✓ getMetadata returns null for non-existent class");
        passed++;
    } else {
        console.log("✗ getMetadata should return null for non-existent class");
    }

    // Test 4: getRegisteredClasses method
    total++;
    // Register another class
    const productFields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("price", SerializableFieldType.FLOAT)
    ];
    ClassRegistry.register("Product", productFields);

    const registeredClasses = ClassRegistry.getRegisteredClasses();

    if (registeredClasses.length === 2 &&
        registeredClasses.includes("User") &&
        registeredClasses.includes("Product")) {
        console.log("✓ getRegisteredClasses method works correctly");
        passed++;
    } else {
        console.log("✗ getRegisteredClasses method failed");
        console.log("  Registered classes: " + registeredClasses.join(", "));
    }

    // Test 5: getRegisteredCount method
    total++;
    const count = ClassRegistry.getRegisteredCount();

    if (count === 2) {
        console.log("✓ getRegisteredCount method works correctly");
        passed++;
    } else {
        console.log("✗ getRegisteredCount method failed, expected 2 got " + count.toString());
    }

    // Test 6: unregister method
    total++;
    const unregistered = ClassRegistry.unregister("Product");
    const stillExists = ClassRegistry.isRegistered("Product");
    const userStillExists = ClassRegistry.isRegistered("User");

    if (unregistered === true && stillExists === false && userStillExists === true) {
        console.log("✓ unregister method works correctly");
        passed++;
    } else {
        console.log("✗ unregister method failed");
    }

    // Test 7: unregister non-existent class
    total++;
    const unregisteredNonExistent = ClassRegistry.unregister("NonExistent");

    if (unregisteredNonExistent === false) {
        console.log("✓ unregister returns false for non-existent class");
        passed++;
    } else {
        console.log("✗ unregister should return false for non-existent class");
    }

    // Test 8: clear method
    total++;
    ClassRegistry.clear();
    const countAfterClear = ClassRegistry.getRegisteredCount();

    if (countAfterClear === 0) {
        console.log("✓ clear method works correctly");
        passed++;
    } else {
        console.log("✗ clear method failed, expected 0 got " + countAfterClear.toString());
    }

    // Test 9: toString method
    total++;
    // Register a class for toString test
    const testFields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER)
    ];
    ClassRegistry.register("TestUser", testFields);

    const str = ClassRegistry.toString();

    if (str.includes("TestUser") && str.includes("name") && str.includes("age")) {
        console.log("✓ toString method works correctly");
        passed++;
    } else {
        console.log("✗ toString method failed");
        console.log("  toString output: " + str);
    }

    // Clean up
    ClassRegistry.clear();

    console.log(`ClassRegistry tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test implementation of Serializable interface for testing purposes
 */
class TestUser implements Serializable {
    name: string;
    age: i32;
    email: string | null;
    isActive: boolean;

    constructor(name: string, age: i32, email: string | null = null, isActive: boolean = true) {
        this.name = name;
        this.age = age;
        this.email = email;
        this.isActive = isActive;
    }

    getClassName(): string {
        return "TestUser";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "name") {
            return toMessagePackString(this.name);
        } else if (fieldName === "age") {
            return toMessagePackInteger32(this.age);
        } else if (fieldName === "email") {
            return this.email !== null ? toMessagePackString(this.email!) : toMessagePackNull();
        } else if (fieldName === "isActive") {
            return toMessagePackBoolean(this.isActive);
        } else {
            return null;
        }
    }
}

/**
 * Test suite for Serializable interface
 */
export function runSerializableInterfaceTests(): boolean {
    console.log("=== Serializable Interface Tests ===");

    let passed = 0;
    let total = 0;

    // Test 1: Basic Serializable implementation
    total++;
    const user = new TestUser("Alice", 30, "alice@example.com", true);

    if (user.getClassName() === "TestUser") {
        console.log("✓ getClassName method works correctly");
        passed++;
    } else {
        console.log("✗ getClassName method failed");
    }

    // Test 2: getFieldValue for string field
    total++;
    const nameValue = user.getFieldValue("name");

    if (nameValue !== null &&
        nameValue.getType() === MessagePackValueType.STRING &&
        (nameValue as MessagePackString).value === "Alice") {
        console.log("✓ getFieldValue for string field works correctly");
        passed++;
    } else {
        console.log("✗ getFieldValue for string field failed");
    }

    // Test 3: getFieldValue for integer field
    total++;
    const ageValue = user.getFieldValue("age");

    if (ageValue !== null &&
        ageValue.getType() === MessagePackValueType.INTEGER &&
        (ageValue as MessagePackInteger).value === 30) {
        console.log("✓ getFieldValue for integer field works correctly");
        passed++;
    } else {
        console.log("✗ getFieldValue for integer field failed");
    }

    // Test 4: getFieldValue for boolean field
    total++;
    const isActiveValue = user.getFieldValue("isActive");

    if (isActiveValue !== null &&
        isActiveValue.getType() === MessagePackValueType.BOOLEAN &&
        (isActiveValue as MessagePackBoolean).value === true) {
        console.log("✓ getFieldValue for boolean field works correctly");
        passed++;
    } else {
        console.log("✗ getFieldValue for boolean field failed");
    }

    // Test 5: getFieldValue for nullable field (non-null)
    total++;
    const emailValue = user.getFieldValue("email");

    if (emailValue !== null &&
        emailValue.getType() === MessagePackValueType.STRING &&
        (emailValue as MessagePackString).value === "alice@example.com") {
        console.log("✓ getFieldValue for nullable field (non-null) works correctly");
        passed++;
    } else {
        console.log("✗ getFieldValue for nullable field (non-null) failed");
    }

    // Test 6: getFieldValue for nullable field (null)
    total++;
    const userWithNullEmail = new TestUser("Bob", 25, null, false);
    const nullEmailValue = userWithNullEmail.getFieldValue("email");

    if (nullEmailValue !== null &&
        nullEmailValue.getType() === MessagePackValueType.NULL) {
        console.log("✓ getFieldValue for nullable field (null) works correctly");
        passed++;
    } else {
        console.log("✗ getFieldValue for nullable field (null) failed");
    }

    // Test 7: getFieldValue for non-existent field
    total++;
    const nonExistentValue = user.getFieldValue("nonExistent");

    if (nonExistentValue === null) {
        console.log("✓ getFieldValue returns null for non-existent field");
        passed++;
    } else {
        console.log("✗ getFieldValue should return null for non-existent field");
    }

    console.log(`Serializable Interface tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test suite for basic type conversion utilities
 */
export function runBasicTypeConversionTests(): boolean {
    console.log("=== Basic Type Conversion Tests ===");

    let passed = 0;
    let total = 0;

    // Test 1: toMessagePackBoolean
    total++;
    const boolTrue = toMessagePackBoolean(true);
    const boolFalse = toMessagePackBoolean(false);

    if (boolTrue.getType() === MessagePackValueType.BOOLEAN &&
        boolTrue.value === true &&
        boolFalse.getType() === MessagePackValueType.BOOLEAN &&
        boolFalse.value === false) {
        console.log("✓ toMessagePackBoolean works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackBoolean failed");
    }

    // Test 2: toMessagePackInteger32
    total++;
    const int32Value = toMessagePackInteger32(42);

    if (int32Value.getType() === MessagePackValueType.INTEGER &&
        int32Value.value === 42) {
        console.log("✓ toMessagePackInteger32 works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackInteger32 failed");
    }

    // Test 3: toMessagePackInteger64
    total++;
    const int64Value = toMessagePackInteger64(9223372036854775807);

    if (int64Value.getType() === MessagePackValueType.INTEGER &&
        int64Value.value === 9223372036854775807) {
        console.log("✓ toMessagePackInteger64 works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackInteger64 failed");
    }

    // Test 4: toMessagePackUnsigned32
    total++;
    const uint32Value = toMessagePackUnsigned32(4294967295);

    if (uint32Value.getType() === MessagePackValueType.INTEGER &&
        uint32Value.value === 4294967295) {
        console.log("✓ toMessagePackUnsigned32 works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackUnsigned32 failed");
    }

    // Test 5: toMessagePackFloat32
    total++;
    const float32Value = toMessagePackFloat32(3.14);

    if (float32Value.getType() === MessagePackValueType.FLOAT &&
        Math.abs(float32Value.value - 3.14) < 0.01) {
        console.log("✓ toMessagePackFloat32 works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackFloat32 failed");
    }

    // Test 6: toMessagePackFloat64
    total++;
    const float64Value = toMessagePackFloat64(3.141592653589793);

    if (float64Value.getType() === MessagePackValueType.FLOAT &&
        Math.abs(float64Value.value - 3.141592653589793) < 0.000000000000001) {
        console.log("✓ toMessagePackFloat64 works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackFloat64 failed");
    }

    // Test 7: toMessagePackString
    total++;
    const stringValue = toMessagePackString("Hello, World!");

    if (stringValue.getType() === MessagePackValueType.STRING &&
        stringValue.value === "Hello, World!") {
        console.log("✓ toMessagePackString works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackString failed");
    }

    // Test 8: toMessagePackBinary
    total++;
    const binaryData = new Uint8Array(3);
    binaryData[0] = 0x01;
    binaryData[1] = 0x02;
    binaryData[2] = 0x03;
    const binaryValue = toMessagePackBinary(binaryData);

    if (binaryValue.getType() === MessagePackValueType.BINARY &&
        binaryValue.value.length === 3 &&
        binaryValue.value[0] === 0x01 &&
        binaryValue.value[1] === 0x02 &&
        binaryValue.value[2] === 0x03) {
        console.log("✓ toMessagePackBinary works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackBinary failed");
    }

    // Test 9: toMessagePackNull
    total++;
    const nullValue = toMessagePackNull();

    if (nullValue.getType() === MessagePackValueType.NULL) {
        console.log("✓ toMessagePackNull works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackNull failed");
    }

    console.log(`Basic Type Conversion tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test suite for nullable type conversion utilities
 */
export function runNullableTypeConversionTests(): boolean {
    console.log("=== Nullable Type Conversion Tests ===");

    let passed = 0;
    let total = 0;

    // Test 1: toMessagePackNullableString (non-null)
    total++;
    const nullableString = toMessagePackNullableString("Hello");

    if (nullableString.getType() === MessagePackValueType.STRING &&
        (nullableString as MessagePackString).value === "Hello") {
        console.log("✓ toMessagePackNullableString (non-null) works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackNullableString (non-null) failed");
    }

    // Test 2: toMessagePackNullableString (null)
    total++;
    const nullableStringNull = toMessagePackNullableString(null);

    if (nullableStringNull.getType() === MessagePackValueType.NULL) {
        console.log("✓ toMessagePackNullableString (null) works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackNullableString (null) failed");
    }

    // Test 3: toMessagePackNullableBinary (non-null)
    total++;
    const binaryData = new Uint8Array(2);
    binaryData[0] = 0xAB;
    binaryData[1] = 0xCD;
    const nullableBinary = toMessagePackNullableBinary(binaryData);

    if (nullableBinary.getType() === MessagePackValueType.BINARY &&
        (nullableBinary as MessagePackBinary).value.length === 2 &&
        (nullableBinary as MessagePackBinary).value[0] === 0xAB &&
        (nullableBinary as MessagePackBinary).value[1] === 0xCD) {
        console.log("✓ toMessagePackNullableBinary (non-null) works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackNullableBinary (non-null) failed");
    }

    // Test 4: toMessagePackNullableBinary (null)
    total++;
    const nullableBinaryNull = toMessagePackNullableBinary(null);

    if (nullableBinaryNull.getType() === MessagePackValueType.NULL) {
        console.log("✓ toMessagePackNullableBinary (null) works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackNullableBinary (null) failed");
    }

    console.log(`Nullable Type Conversion tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test suite for array conversion utilities
 */
export function runArrayConversionTests(): boolean {
    console.log("=== Array Conversion Tests ===");

    let passed = 0;
    let total = 0;

    // Test 1: toMessagePackArray
    total++;
    const values: MessagePackValue[] = [
        toMessagePackString("hello"),
        toMessagePackInteger32(42),
        toMessagePackBoolean(true)
    ];
    const arrayValue = toMessagePackArray(values);

    if (arrayValue.getType() === MessagePackValueType.ARRAY &&
        arrayValue.value.length === 3 &&
        arrayValue.value[0].getType() === MessagePackValueType.STRING &&
        arrayValue.value[1].getType() === MessagePackValueType.INTEGER &&
        arrayValue.value[2].getType() === MessagePackValueType.BOOLEAN) {
        console.log("✓ toMessagePackArray works correctly");
        passed++;
    } else {
        console.log("✗ toMessagePackArray failed");
    }

    console.log(`Array Conversion tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test implementation of a simple class for encoder testing
 */
class SimpleTestClass implements Serializable {
    name: string;
    age: i32;
    isActive: boolean;

    constructor(name: string, age: i32, isActive: boolean) {
        this.name = name;
        this.age = age;
        this.isActive = isActive;
    }

    getClassName(): string {
        return "SimpleTestClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "name") {
            return toMessagePackString(this.name);
        } else if (fieldName === "age") {
            return toMessagePackInteger32(this.age);
        } else if (fieldName === "isActive") {
            return toMessagePackBoolean(this.isActive);
        } else {
            return null;
        }
    }
}

/**
 * Test implementation of a class with optional fields
 */
class OptionalFieldsTestClass implements Serializable {
    name: string;
    email: string | null;
    phone: string | null;

    constructor(name: string, email: string | null = null, phone: string | null = null) {
        this.name = name;
        this.email = email;
        this.phone = phone;
    }

    getClassName(): string {
        return "OptionalFieldsTestClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "name") {
            return toMessagePackString(this.name);
        } else if (fieldName === "email") {
            return this.email !== null ? toMessagePackString(this.email!) : null;
        } else if (fieldName === "phone") {
            return this.phone !== null ? toMessagePackString(this.phone!) : null;
        } else {
            return null;
        }
    }
}

/**
 * Test implementation of a nested class
 */
class NestedTestClass implements Serializable {
    id: i32;
    user: SimpleTestClass;

    constructor(id: i32, user: SimpleTestClass) {
        this.id = id;
        this.user = user;
    }

    getClassName(): string {
        return "NestedTestClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "id") {
            return toMessagePackInteger32(this.id);
        } else if (fieldName === "user") {
            // For nested classes, we need to serialize the nested object
            const encoder = new MessagePackEncoder();
            const classEncoder = new ClassSerializationEncoder(encoder);
            const serializedUser = classEncoder.encodeClass(this.user);
            
            // Decode it back to a MessagePackMap for validation
            const decoder = new MessagePackDecoder(serializedUser);
            return decoder.decode();
        } else {
            return null;
        }
    }
}

/**
 * Test implementation for unregistered class error testing
 */
class UnregisteredClass implements Serializable {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    getClassName(): string {
        return "UnregisteredClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "name") {
            return toMessagePackString(this.name);
        }
        return null;
    }
}

/**
 * Test implementation for missing field error testing
 */
class MissingFieldClass implements Serializable {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    getClassName(): string {
        return "MissingFieldClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "name") {
            return toMessagePackString(this.name);
        }
        // Return null for the required "age" field
        return null;
    }
}

/**
 * Test suite for ClassSerializationEncoder
 */
export function runClassSerializationEncoderTests(): boolean {
    console.log("=== ClassSerializationEncoder Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Test 1: Basic class serialization
    total++;
    // Register the test class
    const fields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN)
    ];
    ClassRegistry.register("SimpleTestClass", fields);

    // Create encoder and instance
    const encoder = new MessagePackEncoder();
    const classEncoder = new ClassSerializationEncoder(encoder);
    const instance = new SimpleTestClass("Alice", 30, true);

    // Serialize the instance
    const serialized = classEncoder.encodeClass(instance);

    // Verify we got some bytes
    if (serialized.length > 0) {
        console.log("✓ Basic class serialization works");
        passed++;
    } else {
        console.log("✗ Basic class serialization failed - no bytes returned");
    }

    // Test 2: Serialization with optional fields (all present)
    total++;
    // Register the optional fields test class
    const optionalFields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("email", SerializableFieldType.STRING, true),
        new FieldMetadata("phone", SerializableFieldType.STRING, true)
    ];
    ClassRegistry.register("OptionalFieldsTestClass", optionalFields);

    // Create encoder and instance with all fields present
    const encoder2 = new MessagePackEncoder();
    const classEncoder2 = new ClassSerializationEncoder(encoder2);
    const instance2 = new OptionalFieldsTestClass("Bob", "bob@example.com", "123-456-7890");

    // Serialize the instance
    const serialized2 = classEncoder2.encodeClass(instance2);

    // Verify we got some bytes
    if (serialized2.length > 0) {
        console.log("✓ Serialization with optional fields (all present) works");
        passed++;
    } else {
        console.log("✗ Serialization with optional fields (all present) failed - no bytes returned");
    }

    // Test 3: Serialization with optional fields (some missing)
    total++;
    // Create encoder and instance with some optional fields missing
    const encoder3 = new MessagePackEncoder();
    const classEncoder3 = new ClassSerializationEncoder(encoder3);
    const instance3 = new OptionalFieldsTestClass("Charlie", "charlie@example.com", null);

    // Serialize the instance
    const serialized3 = classEncoder3.encodeClass(instance3);

    // Verify we got some bytes
    if (serialized3.length > 0) {
        console.log("✓ Serialization with optional fields (some missing) works");
        passed++;
    } else {
        console.log("✗ Serialization with optional fields (some missing) failed - no bytes returned");
    }

    // Test 4: Round-trip test (serialize and deserialize)
    total++;
    // Create encoder and instance
    const encoder4 = new MessagePackEncoder();
    const classEncoder4 = new ClassSerializationEncoder(encoder4);
    const instance4 = new SimpleTestClass("Eve", 35, true);

    // Serialize the instance
    const serialized4 = classEncoder4.encodeClass(instance4);

    // Deserialize back to a map to verify structure
    const decoder4 = new MessagePackDecoder(serialized4);
    const decoded4 = decoder4.decode();

    if (decoded4.getType() === MessagePackValueType.MAP) {
        const map = (decoded4 as MessagePackMap).value;
        const nameValue = map.get("name");
        const ageValue = map.get("age");
        const isActiveValue = map.get("isActive");

        if (nameValue !== null && nameValue.getType() === MessagePackValueType.STRING &&
            ageValue !== null && ageValue.getType() === MessagePackValueType.INTEGER &&
            isActiveValue !== null && isActiveValue.getType() === MessagePackValueType.BOOLEAN &&
            (nameValue as MessagePackString).value === "Eve" &&
            (ageValue as MessagePackInteger).value === 35 &&
            (isActiveValue as MessagePackBoolean).value === true) {
            console.log("✓ Round-trip test works");
            passed++;
        } else {
            console.log("✗ Round-trip test failed - field values don't match");
        }
    } else {
        console.log("✗ Round-trip test failed - decoded value is not a map");
    }

    // Clean up
    ClassRegistry.clear();

    console.log(`ClassSerializationEncoder tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Run all class serialization tests
 */
export function runAllClassSerializationTests(): boolean {
    console.log("Running Class Serialization Tests...\n");

    const results = [
        runSerializableFieldTypeTests(),
        runFieldMetadataTests(),
        runClassMetadataTests(),
        runClassRegistryTests(),
        runSerializableInterfaceTests(),
        runBasicTypeConversionTests(),
        runNullableTypeConversionTests(),
        runArrayConversionTests(),
        runClassSerializationEncoderTests()
    ];

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log(`=== Class Serialization Test Summary ===`);
    console.log(`${passed}/${total} test suites passed`);

    if (passed === total) {
        console.log("🎉 All class serialization tests passed!");
    } else {
        console.log("❌ Some class serialization tests failed");
    }

    return passed === total;
}
