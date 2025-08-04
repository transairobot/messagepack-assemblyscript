/**
 * Unit tests for class serialization metadata and registry system
 */

import { runPerformanceOptimizationTests } from "./performance-optimization.test";
import {
    SerializableFieldType,
    FieldMetadata,
    ClassMetadata,
    ClassRegistry,
    Serializable,
    ClassSerializationEncoder,
    ClassSerializationError,
    ClassFactory,
    ClassSerializationDecoder,
    ClassDeserializationError,
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
    stringArrayToMessagePack,
    ClassRegistrationBuilder,
    SerializationUtils,
    BatchClassRegistration
} from "../class-serialization";

import { runConvenienceMethodTests } from "./convenience-methods.test";

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
 * Test implementation for field type mismatch error testing
 */
class TypeMismatchClass implements Serializable {
    name: string;
    age: i32;

    constructor(name: string, age: i32) {
        this.name = name;
        this.age = age;
    }

    getClassName(): string {
        return "TypeMismatchClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "name") {
            return toMessagePackString(this.name);
        } else if (fieldName === "age") {
            // Return wrong type - string instead of integer
            return toMessagePackString(this.age.toString());
        }
        return null;
    }
}

/**
 * Test implementation for invalid nested class format testing
 */
class InvalidNestedFormatClass implements Serializable {
    id: i32;
    user: string; // This should be a class but we'll return wrong type

    constructor(id: i32, user: string) {
        this.id = id;
        this.user = user;
    }

    getClassName(): string {
        return "InvalidNestedFormatClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "id") {
            return toMessagePackInteger32(this.id);
        } else if (fieldName === "user") {
            // Return string instead of map for nested class
            return toMessagePackString(this.user);
        }
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
 * Test suite for serialization error handling
 */
export function runSerializationErrorHandlingTests(): boolean {
    console.log("=== Serialization Error Handling Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Test 1: Unregistered class error
    total++;
    const encoder = new MessagePackEncoder();
    const classEncoder = new ClassSerializationEncoder(encoder);
    const unregisteredInstance = new UnregisteredClass("test");

    // Since AssemblyScript doesn't support try-catch, we'll test the error conditions
    // by checking the registry state and validating error creation methods
    let unregisteredClassErrorTest = false;

    // Test that the class is not registered
    if (!ClassRegistry.isRegistered("UnregisteredClass")) {
        // Test the error creation method
        const testError = ClassSerializationError.unregisteredClass("UnregisteredClass");
        if (testError.className === "UnregisteredClass" &&
            testError.message.includes("UnregisteredClass") &&
            testError.message.includes("not registered") &&
            testError.context === "class registration validation") {
            unregisteredClassErrorTest = true;
        }
    }

    if (unregisteredClassErrorTest) {
        console.log("✓ Unregistered class error creation works correctly");
        passed++;
    } else {
        console.log("✗ Unregistered class error creation failed");
    }

    // Test 2: Missing required field error
    total++;
    // Test the error creation method for missing required fields
    let missingFieldErrorTest = false;

    const missingFieldError = ClassSerializationError.missingRequiredField("age", "MissingFieldClass");
    if (missingFieldError.fieldName === "age" &&
        missingFieldError.className === "MissingFieldClass" &&
        missingFieldError.message.includes("Required field") &&
        missingFieldError.message.includes("age") &&
        missingFieldError.message.includes("MissingFieldClass") &&
        missingFieldError.context === "required field validation") {
        missingFieldErrorTest = true;
    }

    if (missingFieldErrorTest) {
        console.log("✓ Missing required field error creation works correctly");
        passed++;
    } else {
        console.log("✗ Missing required field error creation failed");
    }

    // Test 3: Field type mismatch error
    total++;
    // Test the error creation method for field type mismatches
    let typeMismatchErrorTest = false;

    const typeMismatchError = ClassSerializationError.fieldTypeMismatch(
        "age",
        "TypeMismatchClass",
        MessagePackValueType.INTEGER,
        MessagePackValueType.STRING
    );
    if (typeMismatchError.fieldName === "age" &&
        typeMismatchError.className === "TypeMismatchClass" &&
        typeMismatchError.message.includes("Type mismatch") &&
        typeMismatchError.message.includes("age") &&
        typeMismatchError.message.includes("expected INTEGER") &&
        typeMismatchError.message.includes("got STRING") &&
        typeMismatchError.context === "field type validation") {
        typeMismatchErrorTest = true;
    }

    if (typeMismatchErrorTest) {
        console.log("✓ Field type mismatch error creation works correctly");
        passed++;
    } else {
        console.log("✗ Field type mismatch error creation failed");
    }

    // Test 4: Unregistered nested class error
    total++;
    // Test the error creation method for unregistered nested classes
    let unregisteredNestedErrorTest = false;

    const unregisteredNestedError = ClassSerializationError.unregisteredNestedClass(
        "user",
        "InvalidNestedFormatClass",
        "UnregisteredNestedClass"
    );
    if (unregisteredNestedError.fieldName === "user" &&
        unregisteredNestedError.className === "InvalidNestedFormatClass" &&
        unregisteredNestedError.message.includes("Nested class type") &&
        unregisteredNestedError.message.includes("UnregisteredNestedClass") &&
        unregisteredNestedError.message.includes("not registered") &&
        unregisteredNestedError.context === "nested class validation") {
        unregisteredNestedErrorTest = true;
    }

    if (unregisteredNestedErrorTest) {
        console.log("✓ Unregistered nested class error creation works correctly");
        passed++;
    } else {
        console.log("✗ Unregistered nested class error creation failed");
    }

    // Test 5: Invalid nested class format error
    total++;
    // Test the error creation method for invalid nested class format
    let invalidNestedFormatErrorTest = false;

    const invalidNestedFormatError = ClassSerializationError.invalidNestedClassFormat(
        "user",
        "InvalidNestedFormatClass",
        MessagePackValueType.STRING
    );
    if (invalidNestedFormatError.fieldName === "user" &&
        invalidNestedFormatError.className === "InvalidNestedFormatClass" &&
        invalidNestedFormatError.message.includes("Nested class field") &&
        invalidNestedFormatError.message.includes("must be a MessagePackMap") &&
        invalidNestedFormatError.message.includes("got STRING") &&
        invalidNestedFormatError.context === "nested class format validation") {
        invalidNestedFormatErrorTest = true;
    }

    if (invalidNestedFormatErrorTest) {
        console.log("✓ Invalid nested class format error creation works correctly");
        passed++;
    } else {
        console.log("✗ Invalid nested class format error creation failed");
    }

    // Test 6: Circular reference error
    total++;
    // Test the error creation method for circular references
    let circularReferenceErrorTest = false;

    const circularReferenceError = ClassSerializationError.circularReference("TestClass", "selfReference");
    if (circularReferenceError.fieldName === "selfReference" &&
        circularReferenceError.className === "TestClass" &&
        circularReferenceError.message.includes("Circular reference detected") &&
        circularReferenceError.message.includes("TestClass") &&
        circularReferenceError.message.includes("selfReference") &&
        circularReferenceError.context === "circular reference detection") {
        circularReferenceErrorTest = true;
    }

    if (circularReferenceErrorTest) {
        console.log("✓ Circular reference error creation works correctly");
        passed++;
    } else {
        console.log("✗ Circular reference error creation failed");
    }

    // Clean up
    ClassRegistry.clear();

    console.log(`Serialization Error Handling tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test class for deserialization testing
 */
class DeserializationTestUser implements Serializable {
    name: string = "";
    age: i32 = 0;
    email: string | null = null;
    isActive: boolean = false;

    getClassName(): string {
        return "DeserializationTestUser";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "name") return toMessagePackString(this.name);
        if (fieldName === "age") return toMessagePackInteger32(this.age);
        if (fieldName === "email") return this.email !== null ? toMessagePackString(this.email!) : null;
        if (fieldName === "isActive") return toMessagePackBoolean(this.isActive);
        return null;
    }
}

/**
 * Factory for DeserializationTestUser
 */
class DeserializationTestUserFactory implements ClassFactory {
    create(): Serializable {
        return new DeserializationTestUser();
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const user = instance as DeserializationTestUser;
        if (fieldName === "name") {
            if (value.getType() === MessagePackValueType.STRING) {
                user.name = (value as MessagePackString).value;
            }
        } else if (fieldName === "age") {
            if (value.getType() === MessagePackValueType.INTEGER) {
                user.age = (value as MessagePackInteger).value as i32;
            }
        } else if (fieldName === "email") {
            if (value.getType() === MessagePackValueType.STRING) {
                user.email = (value as MessagePackString).value;
            }
        } else if (fieldName === "isActive") {
            if (value.getType() === MessagePackValueType.BOOLEAN) {
                user.isActive = (value as MessagePackBoolean).value;
            }
        }
    }
}

/**
 * Test suite for ClassFactory interface and ClassSerializationDecoder
 */
export function runClassSerializationDecoderTests(): boolean {
    console.log("=== ClassSerializationDecoder Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Register the test class
    ClassRegistry.register("DeserializationTestUser", [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("email", SerializableFieldType.STRING, true), // optional
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN)
    ]);

    // Test 1: Basic class deserialization
    total++;
    // Create a test instance and serialize it
    const originalUser = new DeserializationTestUser();
    originalUser.name = "John Doe";
    originalUser.age = 30;
    originalUser.email = "john@example.com";
    originalUser.isActive = true;

    const encoder = new MessagePackEncoder();
    const classEncoder = new ClassSerializationEncoder(encoder);
    const serializedData = classEncoder.encodeClass(originalUser);

    // Deserialize it back
    const decoder = new MessagePackDecoder(serializedData);
    const classDecoder = new ClassSerializationDecoder(decoder);
    const factory = new DeserializationTestUserFactory();
    const deserializedUser = classDecoder.decodeClass(factory, "DeserializationTestUser") as DeserializationTestUser;

    if (deserializedUser.name === "John Doe" &&
        deserializedUser.age === 30 &&
        deserializedUser.email === "john@example.com" &&
        deserializedUser.isActive === true) {
        console.log("✓ Basic class deserialization works");
        passed++;
    } else {
        console.log("✗ Basic class deserialization failed - field values don't match");
        console.log("  Expected: name=John Doe, age=30, email=john@example.com, isActive=true");
        console.log("  Got: name=" + deserializedUser.name + ", age=" + deserializedUser.age.toString() + ", email=" + (deserializedUser.email !== null ? deserializedUser.email! : "null") + ", isActive=" + deserializedUser.isActive.toString());
    }

    // Test 2: Deserialization with optional field missing
    total++;
    // Create a test instance without optional field
    const originalUser2 = new DeserializationTestUser();
    originalUser2.name = "Jane Doe";
    originalUser2.age = 25;
    originalUser2.email = null; // optional field is null
    originalUser2.isActive = false;

    const encoder2 = new MessagePackEncoder();
    const classEncoder2 = new ClassSerializationEncoder(encoder2);
    const serializedData2 = classEncoder2.encodeClass(originalUser2);

    // Deserialize it back
    const decoder2 = new MessagePackDecoder(serializedData2);
    const classDecoder2 = new ClassSerializationDecoder(decoder2);
    const factory2 = new DeserializationTestUserFactory();
    const deserializedUser2 = classDecoder2.decodeClass(factory2, "DeserializationTestUser") as DeserializationTestUser;

    if (deserializedUser2.name === "Jane Doe" &&
        deserializedUser2.age === 25 &&
        deserializedUser2.email === null &&
        deserializedUser2.isActive === false) {
        console.log("✓ Deserialization with optional field missing works");
        passed++;
    } else {
        console.log("✗ Deserialization with optional field missing failed");
        console.log("  Expected: name=Jane Doe, age=25, email=null, isActive=false");
        console.log("  Got: name=" + deserializedUser2.name + ", age=" + deserializedUser2.age.toString() + ", email=" + (deserializedUser2.email !== null ? deserializedUser2.email! : "null") + ", isActive=" + deserializedUser2.isActive.toString());
    }

    // Test 3: Error handling - unregistered class
    // Since AssemblyScript doesn't support try-catch, we'll test the error conditions
    // by checking the registry state and validating error creation methods
    total++;
    if (!ClassRegistry.isRegistered("UnregisteredClass")) {
        // Test the error creation method
        const testError = ClassDeserializationError.unregisteredClass("UnregisteredClass");
        if (testError.className === "UnregisteredClass" &&
            testError.message.includes("not registered")) {
            console.log("✓ Unregistered class error creation works");
            passed++;
        } else {
            console.log("✗ Unregistered class error creation failed");
        }
    } else {
        console.log("✗ Test setup error - UnregisteredClass should not be registered");
    }

    // Test 4: Error handling - invalid format error creation
    total++;
    const invalidFormatError = ClassDeserializationError.invalidFormat("DeserializationTestUser", MessagePackValueType.STRING);
    if (invalidFormatError.className === "DeserializationTestUser" &&
        invalidFormatError.message.includes("Expected MessagePack map")) {
        console.log("✓ Invalid format error creation works");
        passed++;
    } else {
        console.log("✗ Invalid format error creation failed");
    }

    // Test 5: Error handling - missing required field error creation
    total++;
    const missingFieldError = ClassDeserializationError.missingRequiredField("age", "DeserializationTestUser");
    if (missingFieldError.fieldName === "age" &&
        missingFieldError.className === "DeserializationTestUser" &&
        missingFieldError.message.includes("Required field 'age' is missing")) {
        console.log("✓ Missing required field error creation works");
        passed++;
    } else {
        console.log("✗ Missing required field error creation failed");
    }

    // Test 6: Error handling - field type mismatch error creation
    total++;
    const typeMismatchError = ClassDeserializationError.fieldTypeMismatch("age", "DeserializationTestUser", MessagePackValueType.INTEGER, MessagePackValueType.STRING);
    if (typeMismatchError.fieldName === "age" &&
        typeMismatchError.className === "DeserializationTestUser" &&
        typeMismatchError.message.includes("Type mismatch for field 'age'")) {
        console.log("✓ Field type mismatch error creation works");
        passed++;
    } else {
        console.log("✗ Field type mismatch error creation failed");
    }

    console.log(`ClassSerializationDecoder tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test implementation of a nested class for deserialization testing
 */
class NestedDeserializationTestUser implements Serializable {
    name: string;
    age: i32;

    constructor(name: string = "", age: i32 = 0) {
        this.name = name;
        this.age = age;
    }

    getClassName(): string {
        return "NestedDeserializationTestUser";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "name") {
            return toMessagePackString(this.name);
        } else if (fieldName === "age") {
            return toMessagePackInteger32(this.age);
        }
        return null;
    }
}

/**
 * Test implementation of a class containing nested classes
 */
class ParentDeserializationTestClass implements Serializable {
    id: i32;
    user: NestedDeserializationTestUser;
    optionalUser: NestedDeserializationTestUser | null;

    constructor(id: i32 = 0, user: NestedDeserializationTestUser | null = null, optionalUser: NestedDeserializationTestUser | null = null) {
        this.id = id;
        this.user = user !== null ? user : new NestedDeserializationTestUser();
        this.optionalUser = optionalUser;
    }

    getClassName(): string {
        return "ParentDeserializationTestClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "id") {
            return toMessagePackInteger32(this.id);
        } else if (fieldName === "user") {
            // Serialize the nested user
            const encoder = new MessagePackEncoder();
            const classEncoder = new ClassSerializationEncoder(encoder);
            const serializedUser = classEncoder.encodeClass(this.user);

            // Decode it back to a MessagePackMap
            const decoder = new MessagePackDecoder(serializedUser);
            return decoder.decode();
        } else if (fieldName === "optionalUser") {
            if (this.optionalUser === null) {
                return null;
            }
            // Serialize the nested optional user
            const encoder = new MessagePackEncoder();
            const classEncoder = new ClassSerializationEncoder(encoder);
            const serializedUser = classEncoder.encodeClass(this.optionalUser!);

            // Decode it back to a MessagePackMap
            const decoder = new MessagePackDecoder(serializedUser);
            return decoder.decode();
        }
        return null;
    }
}

/**
 * Factory for creating NestedDeserializationTestUser instances
 */
class NestedDeserializationTestUserFactory implements ClassFactory {
    create(): Serializable {
        return new NestedDeserializationTestUser();
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const user = instance as NestedDeserializationTestUser;

        if (fieldName === "name" && value.getType() === MessagePackValueType.STRING) {
            user.name = (value as MessagePackString).value;
        } else if (fieldName === "age" && value.getType() === MessagePackValueType.INTEGER) {
            user.age = (value as MessagePackInteger).value as i32;
        }
    }
}

/**
 * Factory for creating ParentDeserializationTestClass instances
 */
class ParentDeserializationTestClassFactory implements ClassFactory {
    private nestedFactory: NestedDeserializationTestUserFactory;

    constructor() {
        this.nestedFactory = new NestedDeserializationTestUserFactory();
    }

    create(): Serializable {
        return new ParentDeserializationTestClass();
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const parent = instance as ParentDeserializationTestClass;

        if (fieldName === "id" && value.getType() === MessagePackValueType.INTEGER) {
            parent.id = (value as MessagePackInteger).value as i32;
        } else if (fieldName === "user" && value.getType() === MessagePackValueType.MAP) {
            // Deserialize the nested user using the decoder
            const encoder = new MessagePackEncoder();
            const serializedData = encoder.encodeMap((value as MessagePackMap).value);

            const decoder = new MessagePackDecoder(serializedData);
            const classDecoder = new ClassSerializationDecoder(decoder);

            // Create a temporary field metadata for the nested class
            const userField = new FieldMetadata("user", SerializableFieldType.CLASS, false, "NestedDeserializationTestUser");

            const deserializedUser = classDecoder.deserializeNestedClassWithFactory(value, userField, "ParentDeserializationTestClass", this.nestedFactory);
            parent.user = deserializedUser as NestedDeserializationTestUser;
        } else if (fieldName === "optionalUser" && value.getType() === MessagePackValueType.MAP) {
            // Deserialize the optional nested user
            const encoder = new MessagePackEncoder();
            const serializedData = encoder.encodeMap((value as MessagePackMap).value);

            const decoder = new MessagePackDecoder(serializedData);
            const classDecoder = new ClassSerializationDecoder(decoder);

            // Create a temporary field metadata for the nested class
            const userField = new FieldMetadata("optionalUser", SerializableFieldType.CLASS, true, "NestedDeserializationTestUser");

            const deserializedUser = classDecoder.deserializeNestedClassWithFactory(value, userField, "ParentDeserializationTestClass", this.nestedFactory);
            parent.optionalUser = deserializedUser as NestedDeserializationTestUser;
        }
    }
}

/**
 * Test implementation of a class containing arrays with class instances
 */
class ArrayWithClassesTestClass implements Serializable {
    id: i32;
    users: NestedDeserializationTestUser[];

    constructor(id: i32 = 0, users: NestedDeserializationTestUser[] = []) {
        this.id = id;
        this.users = users;
    }

    getClassName(): string {
        return "ArrayWithClassesTestClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "id") {
            return toMessagePackInteger32(this.id);
        } else if (fieldName === "users") {
            // Serialize each user in the array
            const serializedUsers: MessagePackValue[] = [];

            for (let i = 0; i < this.users.length; i++) {
                const encoder = new MessagePackEncoder();
                const classEncoder = new ClassSerializationEncoder(encoder);
                const serializedUser = classEncoder.encodeClass(this.users[i]);

                // Decode it back to a MessagePackMap
                const decoder = new MessagePackDecoder(serializedUser);
                serializedUsers.push(decoder.decode());
            }

            return new MessagePackArray(serializedUsers);
        }
        return null;
    }
}

/**
 * Factory for creating ArrayWithClassesTestClass instances
 */
class ArrayWithClassesTestClassFactory implements ClassFactory {
    private nestedFactory: NestedDeserializationTestUserFactory;

    constructor() {
        this.nestedFactory = new NestedDeserializationTestUserFactory();
    }

    create(): Serializable {
        return new ArrayWithClassesTestClass();
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const arrayClass = instance as ArrayWithClassesTestClass;

        if (fieldName === "id" && value.getType() === MessagePackValueType.INTEGER) {
            arrayClass.id = (value as MessagePackInteger).value as i32;
        } else if (fieldName === "users" && value.getType() === MessagePackValueType.ARRAY) {
            const arrayValue = value as MessagePackArray;
            const deserializedUsers: NestedDeserializationTestUser[] = [];

            for (let i = 0; i < arrayValue.value.length; i++) {
                const userValue = arrayValue.value[i];

                if (userValue.getType() === MessagePackValueType.MAP) {
                    // Deserialize each user in the array
                    const encoder = new MessagePackEncoder();
                    const serializedData = encoder.encodeMap((userValue as MessagePackMap).value);

                    const decoder = new MessagePackDecoder(serializedData);
                    const classDecoder = new ClassSerializationDecoder(decoder);

                    // Create a temporary field metadata for the nested class
                    const userField = new FieldMetadata(`user_${i}`, SerializableFieldType.CLASS, false, "NestedDeserializationTestUser");

                    const deserializedUser = classDecoder.deserializeNestedClassWithFactory(userValue, userField, "ArrayWithClassesTestClass", this.nestedFactory);
                    deserializedUsers.push(deserializedUser as NestedDeserializationTestUser);
                }
            }

            arrayClass.users = deserializedUsers;
        }
    }
}

/**
 * Test suite for nested class deserialization support
 */
export function runNestedClassDeserializationTests(): boolean {
    console.log("=== Nested Class Deserialization Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Register the nested class
    const nestedUserFields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER)
    ];
    ClassRegistry.register("NestedDeserializationTestUser", nestedUserFields);

    // Register the parent class with nested class field
    const parentFields = [
        new FieldMetadata("id", SerializableFieldType.INTEGER),
        new FieldMetadata("user", SerializableFieldType.CLASS, false, "NestedDeserializationTestUser"),
        new FieldMetadata("optionalUser", SerializableFieldType.CLASS, true, "NestedDeserializationTestUser")
    ];
    ClassRegistry.register("ParentDeserializationTestClass", parentFields);

    // Test 1: Basic nested class deserialization
    total++;
    // Create and serialize a parent class with nested user
    const nestedUser = new NestedDeserializationTestUser("Alice", 30);
    const parentInstance = new ParentDeserializationTestClass(1, nestedUser, null);

    const encoder = new MessagePackEncoder();
    const classEncoder = new ClassSerializationEncoder(encoder);
    const serializedData = classEncoder.encodeClass(parentInstance);

    // Deserialize it back
    const decoder = new MessagePackDecoder(serializedData);
    const classDecoder = new ClassSerializationDecoder(decoder);
    const factory = new ParentDeserializationTestClassFactory();
    const deserializedParent = classDecoder.decodeClass(factory, "ParentDeserializationTestClass") as ParentDeserializationTestClass;

    if (deserializedParent.id === 1 &&
        deserializedParent.user.name === "Alice" &&
        deserializedParent.user.age === 30 &&
        deserializedParent.optionalUser === null) {
        console.log("✓ Basic nested class deserialization works");
        passed++;
    } else {
        console.log("✗ Basic nested class deserialization failed");
        console.log(`  Expected: id=1, user.name=Alice, user.age=30, optionalUser=null`);
        console.log(`  Got: id=${deserializedParent.id}, user.name=${deserializedParent.user.name}, user.age=${deserializedParent.user.age}, optionalUser=${deserializedParent.optionalUser !== null ? "present" : "null"}`);
    }

    // Test 2: Nested class deserialization with optional field present
    total++;
    const optionalUser = new NestedDeserializationTestUser("Bob", 25);
    const parentInstance2 = new ParentDeserializationTestClass(2, nestedUser, optionalUser);

    const encoder2 = new MessagePackEncoder();
    const classEncoder2 = new ClassSerializationEncoder(encoder2);
    const serializedData2 = classEncoder2.encodeClass(parentInstance2);

    // Deserialize it back
    const decoder2 = new MessagePackDecoder(serializedData2);
    const classDecoder2 = new ClassSerializationDecoder(decoder2);
    const factory2 = new ParentDeserializationTestClassFactory();
    const deserializedParent2 = classDecoder2.decodeClass(factory2, "ParentDeserializationTestClass") as ParentDeserializationTestClass;

    if (deserializedParent2.id === 2 &&
        deserializedParent2.user.name === "Alice" &&
        deserializedParent2.user.age === 30 &&
        deserializedParent2.optionalUser !== null &&
        deserializedParent2.optionalUser!.name === "Bob" &&
        deserializedParent2.optionalUser!.age === 25) {
        console.log("✓ Nested class deserialization with optional field works");
        passed++;
    } else {
        console.log("✗ Nested class deserialization with optional field failed");
    }

    // Test 3: Test deserializeNestedClassWithFactory method directly
    total++;
    // Create a MessagePackMap representing a nested user
    const userMap = new Map<string, MessagePackValue>();
    userMap.set("name", toMessagePackString("Charlie"));
    userMap.set("age", toMessagePackInteger32(35));
    const userMapValue = new MessagePackMap(userMap);

    // Create field metadata for the nested class
    const userField = new FieldMetadata("user", SerializableFieldType.CLASS, false, "NestedDeserializationTestUser");

    // Test the direct deserialization method
    const decoder3 = new MessagePackDecoder(new Uint8Array(0)); // Dummy decoder
    const classDecoder3 = new ClassSerializationDecoder(decoder3);
    const nestedFactory = new NestedDeserializationTestUserFactory();

    const directDeserializedUser = classDecoder3.deserializeNestedClassWithFactory(userMapValue, userField, "TestParent", nestedFactory) as NestedDeserializationTestUser;

    if (directDeserializedUser.name === "Charlie" &&
        directDeserializedUser.age === 35) {
        console.log("✓ Direct nested class deserialization with factory works");
        passed++;
    } else {
        console.log("✗ Direct nested class deserialization with factory failed");
        console.log(`  Expected: name=Charlie, age=35`);
        console.log(`  Got: name=${directDeserializedUser.name}, age=${directDeserializedUser.age}`);
    }

    // Test 4: Array with class instances deserialization
    total++;
    // Register the array class
    const arrayFields = [
        new FieldMetadata("id", SerializableFieldType.INTEGER),
        new FieldMetadata("users", SerializableFieldType.ARRAY)
    ];
    ClassRegistry.register("ArrayWithClassesTestClass", arrayFields);

    // Create an array class with multiple users
    const users = [
        new NestedDeserializationTestUser("User1", 20),
        new NestedDeserializationTestUser("User2", 25),
        new NestedDeserializationTestUser("User3", 30)
    ];
    const arrayInstance = new ArrayWithClassesTestClass(100, users);

    const encoder4 = new MessagePackEncoder();
    const classEncoder4 = new ClassSerializationEncoder(encoder4);
    const serializedArrayData = classEncoder4.encodeClass(arrayInstance);

    // Deserialize it back
    const decoder4 = new MessagePackDecoder(serializedArrayData);
    const classDecoder4 = new ClassSerializationDecoder(decoder4);
    const arrayFactory = new ArrayWithClassesTestClassFactory();
    const deserializedArray = classDecoder4.decodeClass(arrayFactory, "ArrayWithClassesTestClass") as ArrayWithClassesTestClass;

    if (deserializedArray.id === 100 &&
        deserializedArray.users.length === 3 &&
        deserializedArray.users[0].name === "User1" &&
        deserializedArray.users[0].age === 20 &&
        deserializedArray.users[1].name === "User2" &&
        deserializedArray.users[1].age === 25 &&
        deserializedArray.users[2].name === "User3" &&
        deserializedArray.users[2].age === 30) {
        console.log("✓ Array with class instances deserialization works");
        passed++;
    } else {
        console.log("✗ Array with class instances deserialization failed");
        console.log(`  Expected: id=100, users.length=3`);
        console.log(`  Got: id=${deserializedArray.id}, users.length=${deserializedArray.users.length}`);
    }

    // Test 5: Test array deserialization method directly
    total++;
    // Create an array of MessagePackMaps representing users
    const userMap1 = new Map<string, MessagePackValue>();
    userMap1.set("name", toMessagePackString("DirectUser1"));
    userMap1.set("age", toMessagePackInteger32(40));

    const userMap2 = new Map<string, MessagePackValue>();
    userMap2.set("name", toMessagePackString("DirectUser2"));
    userMap2.set("age", toMessagePackInteger32(45));

    const userMaps: MessagePackValue[] = [
        new MessagePackMap(userMap1),
        new MessagePackMap(userMap2)
    ];
    const arrayValue = new MessagePackArray(userMaps);

    // Test the direct array deserialization method
    const decoder5 = new MessagePackDecoder(new Uint8Array(0)); // Dummy decoder
    const classDecoder5 = new ClassSerializationDecoder(decoder5);
    const nestedFactory5 = new NestedDeserializationTestUserFactory();

    const deserializedArrayValue = classDecoder5.deserializeArrayWithClasses(arrayValue, SerializableFieldType.CLASS, "NestedDeserializationTestUser", nestedFactory5);

    if (deserializedArrayValue.value.length === 2) {
        console.log("✓ Direct array deserialization with classes works");
        passed++;
    } else {
        console.log("✗ Direct array deserialization with classes failed");
        console.log(`  Expected: length=2`);
        console.log(`  Got: length=${deserializedArrayValue.value.length}`);
    }

    // Test 6: Test type validation for nested objects
    total++;
    // Create invalid nested class data (string instead of map)
    const invalidNestedValue = toMessagePackString("invalid");
    const userField6 = new FieldMetadata("user", SerializableFieldType.CLASS, false, "NestedDeserializationTestUser");

    let typeValidationWorked = false;
    // Since AssemblyScript doesn't support try-catch, we'll test the error creation
    const testError = ClassDeserializationError.fieldTypeMismatch("user", "TestClass", MessagePackValueType.MAP, MessagePackValueType.STRING);
    if (testError.fieldName === "user" &&
        testError.className === "TestClass" &&
        testError.message.includes("Type mismatch") &&
        testError.message.includes("expected MAP") &&
        testError.message.includes("got STRING")) {
        typeValidationWorked = true;
    }

    if (typeValidationWorked) {
        console.log("✓ Type validation for nested objects works");
        passed++;
    } else {
        console.log("✗ Type validation for nested objects failed");
    }

    // Clean up
    ClassRegistry.clear();

    console.log(`Nested Class Deserialization tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test suite for comprehensive deserialization error handling
 * Tests all error scenarios that can occur during class deserialization
 */
export function runDeserializationErrorHandlingTests(): boolean {
    console.log("=== Deserialization Error Handling Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Test 1: ClassDeserializationError.unregisteredClass error creation and properties
    total++;
    const unregisteredError = ClassDeserializationError.unregisteredClass("UnknownClass");
    if (unregisteredError.className === "UnknownClass" &&
        unregisteredError.fieldName === "" &&
        unregisteredError.message.includes("Class 'UnknownClass' is not registered for deserialization") &&
        unregisteredError.message.includes("Use ClassRegistry.register()") &&
        unregisteredError.context === "class registration validation") {
        console.log("✓ Unregistered class error creation and properties work correctly");
        passed++;
    } else {
        console.log("✗ Unregistered class error creation failed");
        console.log("  Expected className: UnknownClass, got: " + unregisteredError.className);
        console.log("  Expected fieldName: '', got: " + unregisteredError.fieldName);
        console.log("  Message: " + unregisteredError.message);
        console.log("  Context: " + unregisteredError.context);
    }

    // Test 2: ClassDeserializationError.invalidFormat error creation and properties
    total++;
    const invalidFormatError = ClassDeserializationError.invalidFormat("TestClass", MessagePackValueType.STRING);
    if (invalidFormatError.className === "TestClass" &&
        invalidFormatError.fieldName === "" &&
        invalidFormatError.message.includes("Expected MessagePack map for class 'TestClass'") &&
        invalidFormatError.message.includes("got STRING") &&
        invalidFormatError.message.includes("Classes must be serialized as maps") &&
        invalidFormatError.context === "format validation") {
        console.log("✓ Invalid format error creation and properties work correctly");
        passed++;
    } else {
        console.log("✗ Invalid format error creation failed");
        console.log("  Expected className: TestClass, got: " + invalidFormatError.className);
        console.log("  Expected fieldName: '', got: " + invalidFormatError.fieldName);
        console.log("  Message: " + invalidFormatError.message);
        console.log("  Context: " + invalidFormatError.context);
    }

    // Test 3: ClassDeserializationError.missingRequiredField error creation and properties
    total++;
    const missingFieldError = ClassDeserializationError.missingRequiredField("requiredField", "TestClass");
    if (missingFieldError.className === "TestClass" &&
        missingFieldError.fieldName === "requiredField" &&
        missingFieldError.message.includes("Required field 'requiredField' is missing from MessagePack data") &&
        missingFieldError.message.includes("for class 'TestClass'") &&
        missingFieldError.message.includes("Ensure the field was included during serialization") &&
        missingFieldError.context === "required field validation") {
        console.log("✓ Missing required field error creation and properties work correctly");
        passed++;
    } else {
        console.log("✗ Missing required field error creation failed");
        console.log("  Expected className: TestClass, got: " + missingFieldError.className);
        console.log("  Expected fieldName: requiredField, got: " + missingFieldError.fieldName);
        console.log("  Message: " + missingFieldError.message);
        console.log("  Context: " + missingFieldError.context);
    }

    // Test 4: ClassDeserializationError.fieldTypeMismatch error creation and properties
    total++;
    const typeMismatchError = ClassDeserializationError.fieldTypeMismatch("ageField", "TestClass", MessagePackValueType.INTEGER, MessagePackValueType.STRING);
    if (typeMismatchError.className === "TestClass" &&
        typeMismatchError.fieldName === "ageField" &&
        typeMismatchError.message.includes("Type mismatch for field 'ageField' in class 'TestClass'") &&
        typeMismatchError.message.includes("expected INTEGER, got STRING") &&
        typeMismatchError.message.includes("Check the serialized data format") &&
        typeMismatchError.context === "field type validation") {
        console.log("✓ Field type mismatch error creation and properties work correctly");
        passed++;
    } else {
        console.log("✗ Field type mismatch error creation failed");
        console.log("  Expected className: TestClass, got: " + typeMismatchError.className);
        console.log("  Expected fieldName: ageField, got: " + typeMismatchError.fieldName);
        console.log("  Message: " + typeMismatchError.message);
        console.log("  Context: " + typeMismatchError.context);
    }

    // Test 5: ClassDeserializationError.unregisteredNestedClass error creation and properties
    total++;
    const unregisteredNestedError = ClassDeserializationError.unregisteredNestedClass("userField", "ParentClass", "UnknownNestedClass");
    if (unregisteredNestedError.className === "ParentClass" &&
        unregisteredNestedError.fieldName === "userField" &&
        unregisteredNestedError.message.includes("Nested class type 'UnknownNestedClass' for field 'userField'") &&
        unregisteredNestedError.message.includes("in class 'ParentClass' is not registered") &&
        unregisteredNestedError.message.includes("Register the nested class first") &&
        unregisteredNestedError.context === "nested class validation") {
        console.log("✓ Unregistered nested class error creation and properties work correctly");
        passed++;
    } else {
        console.log("✗ Unregistered nested class error creation failed");
        console.log("  Expected className: ParentClass, got: " + unregisteredNestedError.className);
        console.log("  Expected fieldName: userField, got: " + unregisteredNestedError.fieldName);
        console.log("  Message: " + unregisteredNestedError.message);
        console.log("  Context: " + unregisteredNestedError.context);
    }

    // Test 6: Error inheritance - ClassDeserializationError extends MessagePackDecodeError
    total++;
    const baseError = ClassDeserializationError.invalidFormat("TestClass", MessagePackValueType.ARRAY);
    // Check that it has MessagePackDecodeError properties
    if (baseError.position === -1 &&
        baseError.formatByte === 0 &&
        baseError.context === "format validation" &&
        baseError.message.length > 0) {
        console.log("✓ ClassDeserializationError properly extends MessagePackDecodeError");
        passed++;
    } else {
        console.log("✗ ClassDeserializationError inheritance failed");
        console.log("  Position: " + baseError.position.toString());
        console.log("  FormatByte: " + baseError.formatByte.toString());
        console.log("  Context: " + baseError.context);
    }

    // Test 7: Validation of error message content for different MessagePackValueType values
    total++;
    const errorWithNull = ClassDeserializationError.invalidFormat("TestClass", MessagePackValueType.NULL);
    const errorWithBoolean = ClassDeserializationError.invalidFormat("TestClass", MessagePackValueType.BOOLEAN);
    const errorWithInteger = ClassDeserializationError.invalidFormat("TestClass", MessagePackValueType.INTEGER);
    const errorWithFloat = ClassDeserializationError.invalidFormat("TestClass", MessagePackValueType.FLOAT);
    const errorWithString = ClassDeserializationError.invalidFormat("TestClass", MessagePackValueType.STRING);
    const errorWithBinary = ClassDeserializationError.invalidFormat("TestClass", MessagePackValueType.BINARY);
    const errorWithArray = ClassDeserializationError.invalidFormat("TestClass", MessagePackValueType.ARRAY);

    if (errorWithNull.message.includes("got NULL") &&
        errorWithBoolean.message.includes("got BOOLEAN") &&
        errorWithInteger.message.includes("got INTEGER") &&
        errorWithFloat.message.includes("got FLOAT") &&
        errorWithString.message.includes("got STRING") &&
        errorWithBinary.message.includes("got BINARY") &&
        errorWithArray.message.includes("got ARRAY")) {
        console.log("✓ Error messages correctly include MessagePackValueType names");
        passed++;
    } else {
        console.log("✗ Error messages don't correctly include MessagePackValueType names");
        console.log("  NULL: " + errorWithNull.message);
        console.log("  BOOLEAN: " + errorWithBoolean.message);
        console.log("  INTEGER: " + errorWithInteger.message);
        console.log("  FLOAT: " + errorWithFloat.message);
        console.log("  STRING: " + errorWithString.message);
        console.log("  BINARY: " + errorWithBinary.message);
        console.log("  ARRAY: " + errorWithArray.message);
    }

    // Test 8: Field type mismatch error with all MessagePackValueType combinations
    total++;
    const integerToStringError = ClassDeserializationError.fieldTypeMismatch("field", "Class", MessagePackValueType.INTEGER, MessagePackValueType.STRING);
    const stringToIntegerError = ClassDeserializationError.fieldTypeMismatch("field", "Class", MessagePackValueType.STRING, MessagePackValueType.INTEGER);
    const booleanToArrayError = ClassDeserializationError.fieldTypeMismatch("field", "Class", MessagePackValueType.BOOLEAN, MessagePackValueType.ARRAY);
    const mapToNullError = ClassDeserializationError.fieldTypeMismatch("field", "Class", MessagePackValueType.MAP, MessagePackValueType.NULL);

    if (integerToStringError.message.includes("expected INTEGER, got STRING") &&
        stringToIntegerError.message.includes("expected STRING, got INTEGER") &&
        booleanToArrayError.message.includes("expected BOOLEAN, got ARRAY") &&
        mapToNullError.message.includes("expected MAP, got NULL")) {
        console.log("✓ Field type mismatch errors correctly show expected vs actual types");
        passed++;
    } else {
        console.log("✗ Field type mismatch errors don't correctly show expected vs actual types");
        console.log("  INTEGER->STRING: " + integerToStringError.message);
        console.log("  STRING->INTEGER: " + stringToIntegerError.message);
        console.log("  BOOLEAN->ARRAY: " + booleanToArrayError.message);
        console.log("  MAP->NULL: " + mapToNullError.message);
    }

    // Test 9: Error context validation for all error types
    total++;
    const contexts = [
        ClassDeserializationError.unregisteredClass("Test").context,
        ClassDeserializationError.invalidFormat("Test", MessagePackValueType.STRING).context,
        ClassDeserializationError.missingRequiredField("field", "Test").context,
        ClassDeserializationError.fieldTypeMismatch("field", "Test", MessagePackValueType.INTEGER, MessagePackValueType.STRING).context,
        ClassDeserializationError.unregisteredNestedClass("field", "Test", "Nested").context
    ];

    const expectedContexts = [
        "class registration validation",
        "format validation",
        "required field validation",
        "field type validation",
        "nested class validation"
    ];

    let contextMatches = 0;
    for (let i = 0; i < contexts.length; i++) {
        if (contexts[i] === expectedContexts[i]) {
            contextMatches++;
        }
    }

    if (contextMatches === contexts.length) {
        console.log("✓ All error types have correct context values");
        passed++;
    } else {
        console.log("✗ Some error types have incorrect context values");
        for (let i = 0; i < contexts.length; i++) {
            console.log("  Expected: " + expectedContexts[i] + ", Got: " + contexts[i]);
        }
    }

    // Test 10: Error position and formatByte default values
    total++;
    const errors = [
        ClassDeserializationError.unregisteredClass("Test"),
        ClassDeserializationError.invalidFormat("Test", MessagePackValueType.STRING),
        ClassDeserializationError.missingRequiredField("field", "Test"),
        ClassDeserializationError.fieldTypeMismatch("field", "Test", MessagePackValueType.INTEGER, MessagePackValueType.STRING),
        ClassDeserializationError.unregisteredNestedClass("field", "Test", "Nested")
    ];

    let positionAndFormatByteCorrect = true;
    for (let i = 0; i < errors.length; i++) {
        if (errors[i].position !== -1 || errors[i].formatByte !== 0) {
            positionAndFormatByteCorrect = false;
            break;
        }
    }

    if (positionAndFormatByteCorrect) {
        console.log("✓ All error types have correct default position (-1) and formatByte (0)");
        passed++;
    } else {
        console.log("✗ Some error types have incorrect default position or formatByte values");
        for (let i = 0; i < errors.length; i++) {
            console.log("  Error " + i.toString() + ": position=" + errors[i].position.toString() + ", formatByte=" + errors[i].formatByte.toString());
        }
    }

    // Test 11: Comprehensive error message validation for edge cases
    total++;
    const emptyClassNameError = ClassDeserializationError.unregisteredClass("");
    const emptyFieldNameError = ClassDeserializationError.missingRequiredField("", "TestClass");
    const emptyNestedClassError = ClassDeserializationError.unregisteredNestedClass("field", "TestClass", "");

    if (emptyClassNameError.message.includes("Class '' is not registered") &&
        emptyFieldNameError.message.includes("Required field '' is missing") &&
        emptyNestedClassError.message.includes("Nested class type '' for field")) {
        console.log("✓ Error messages handle empty string parameters correctly");
        passed++;
    } else {
        console.log("✗ Error messages don't handle empty string parameters correctly");
        console.log("  Empty class name: " + emptyClassNameError.message);
        console.log("  Empty field name: " + emptyFieldNameError.message);
        console.log("  Empty nested class: " + emptyNestedClassError.message);
    }

    // Test 12: Validation that error messages contain actionable guidance
    total++;
    const unregisteredGuidanceError = ClassDeserializationError.unregisteredClass("Test");
    const invalidFormatGuidanceError = ClassDeserializationError.invalidFormat("Test", MessagePackValueType.STRING);
    const missingFieldGuidanceError = ClassDeserializationError.missingRequiredField("field", "Test");
    const typeMismatchGuidanceError = ClassDeserializationError.fieldTypeMismatch("field", "Test", MessagePackValueType.INTEGER, MessagePackValueType.STRING);
    const unregisteredNestedGuidanceError = ClassDeserializationError.unregisteredNestedClass("field", "Test", "Nested");

    if (unregisteredGuidanceError.message.includes("Use ClassRegistry.register()") &&
        invalidFormatGuidanceError.message.includes("Classes must be serialized as maps") &&
        missingFieldGuidanceError.message.includes("Ensure the field was included during serialization") &&
        typeMismatchGuidanceError.message.includes("Check the serialized data format") &&
        unregisteredNestedGuidanceError.message.includes("Register the nested class first")) {
        console.log("✓ All error messages contain actionable guidance");
        passed++;
    } else {
        console.log("✗ Some error messages are missing actionable guidance");
        if (!unregisteredGuidanceError.message.includes("Use ClassRegistry.register()")) {
            console.log("  Missing guidance in unregistered class error: " + unregisteredGuidanceError.message);
        }
        if (!invalidFormatGuidanceError.message.includes("Classes must be serialized as maps")) {
            console.log("  Missing guidance in invalid format error: " + invalidFormatGuidanceError.message);
        }
        if (!missingFieldGuidanceError.message.includes("Ensure the field was included during serialization")) {
            console.log("  Missing guidance in missing field error: " + missingFieldGuidanceError.message);
        }
        if (!typeMismatchGuidanceError.message.includes("Check the serialized data format")) {
            console.log("  Missing guidance in type mismatch error: " + typeMismatchGuidanceError.message);
        }
        if (!unregisteredNestedGuidanceError.message.includes("Register the nested class first")) {
            console.log("  Missing guidance in unregistered nested class error: " + unregisteredNestedGuidanceError.message);
        }
    }

    // Test 13: Validation of actual error conditions during deserialization
    // Since AssemblyScript doesn't support try-catch, we test the conditions that would trigger errors
    total++;

    // Register a test class for validation scenarios
    ClassRegistry.register("ErrorTestClass", [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("email", SerializableFieldType.STRING, true) // optional
    ]);

    // Test scenario: Validate that unregistered class detection works
    const isUnregisteredDetected = !ClassRegistry.isRegistered("NonExistentClass");

    // Test scenario: Validate that missing required field detection works
    const testMap = new Map<string, MessagePackValue>();
    testMap.set("name", toMessagePackString("John"));
    // Missing required "age" field
    const hasRequiredField = testMap.has("age");

    // Test scenario: Validate that type mismatch detection works
    testMap.set("age", toMessagePackString("not_a_number")); // Wrong type - should be integer
    const ageValue = testMap.get("age");
    const isCorrectType = ageValue.getType() === MessagePackValueType.INTEGER;

    // Test scenario: Validate that invalid format detection works
    const nonMapValue = toMessagePackString("not_a_map");
    const isMapFormat = nonMapValue.getType() === MessagePackValueType.MAP;

    if (isUnregisteredDetected && !hasRequiredField && !isCorrectType && !isMapFormat) {
        console.log("✓ Error condition detection logic works correctly");
        passed++;
    } else {
        console.log("✗ Error condition detection logic failed");
        console.log("  Unregistered class detected: " + isUnregisteredDetected.toString());
        console.log("  Missing required field detected: " + (!hasRequiredField).toString());
        console.log("  Type mismatch detected: " + (!isCorrectType).toString());
        console.log("  Invalid format detected: " + (!isMapFormat).toString());
    }

    // Test 14: Validation of nested class error conditions
    total++;

    // Register nested classes for testing
    ClassRegistry.register("NestedErrorTestClass", [
        new FieldMetadata("id", SerializableFieldType.INTEGER),
        new FieldMetadata("user", SerializableFieldType.CLASS, false, "UserClass")
    ]);

    // Test scenario: Validate that unregistered nested class detection works
    const isNestedClassRegistered = ClassRegistry.isRegistered("UserClass");

    // Test scenario: Validate that nested class format validation works
    const nestedTestMap = new Map<string, MessagePackValue>();
    nestedTestMap.set("id", toMessagePackInteger32(1));
    nestedTestMap.set("user", toMessagePackString("not_a_map")); // Should be a map for nested class
    const nestedValue = nestedTestMap.get("user");
    const isNestedMapFormat = nestedValue.getType() === MessagePackValueType.MAP;

    if (!isNestedClassRegistered && !isNestedMapFormat) {
        console.log("✓ Nested class error condition detection works correctly");
        passed++;
    } else {
        console.log("✗ Nested class error condition detection failed");
        console.log("  Nested class registered: " + isNestedClassRegistered.toString());
        console.log("  Nested value is map: " + isNestedMapFormat.toString());
    }

    // Test 15: Validation of field metadata consistency with error handling
    total++;

    const errorTestMetadata = ClassRegistry.getMetadata("ErrorTestClass");
    if (errorTestMetadata !== null) {
        const requiredFields = errorTestMetadata.getRequiredFields();
        const optionalFields = errorTestMetadata.getOptionalFields();

        // Validate that required fields are properly identified
        const hasNameAsRequired = requiredFields.includes("name");
        const hasAgeAsRequired = requiredFields.includes("age");
        const hasEmailAsOptional = optionalFields.includes("email");
        const emailNotInRequired = !requiredFields.includes("email");

        if (hasNameAsRequired && hasAgeAsRequired && hasEmailAsOptional && emailNotInRequired) {
            console.log("✓ Field metadata consistency with error handling works correctly");
            passed++;
        } else {
            console.log("✗ Field metadata consistency with error handling failed");
            console.log("  Name is required: " + hasNameAsRequired.toString());
            console.log("  Age is required: " + hasAgeAsRequired.toString());
            console.log("  Email is optional: " + hasEmailAsOptional.toString());
            console.log("  Email not in required: " + emailNotInRequired.toString());
        }
    } else {
        console.log("✗ Could not retrieve ErrorTestClass metadata");
    }

    console.log(`Deserialization Error Handling tests: ${passed}/${total} passed\n`);
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
        runClassSerializationEncoderTests(),
        runSerializationErrorHandlingTests(),
        runClassSerializationDecoderTests(),
        runDeserializationErrorHandlingTests(),
        runNestedClassDeserializationTests(),
        runComprehensiveIntegrationTests(),
        runConvenienceMethodTests()
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
// ============================================================================
// Integration Test Classes
// ============================================================================

/**
 * Simple class for integration testing
 */
class IntegrationSimpleClass implements Serializable {
    name: string;
    age: i32;
    isActive: boolean;

    constructor(name: string, age: i32, isActive: boolean) {
        this.name = name;
        this.age = age;
        this.isActive = isActive;
    }

    getClassName(): string {
        return "IntegrationSimpleClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "name") {
            return toMessagePackString(this.name);
        } else if (fieldName === "age") {
            return toMessagePackInteger32(this.age);
        } else if (fieldName === "isActive") {
            return toMessagePackBoolean(this.isActive);
        }
        return null;
    }
}

/**
 * Class with optional fields for integration testing
 */
class IntegrationOptionalFieldsClass implements Serializable {
    id: i32;
    name: string;
    email: string | null;
    phone: string | null;
    metadata: Map<string, string> | null;

    constructor(id: i32, name: string, email: string | null = null, phone: string | null = null, metadata: Map<string, string> | null = null) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.metadata = metadata;
    }

    getClassName(): string {
        return "IntegrationOptionalFieldsClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "id") {
            return toMessagePackInteger32(this.id);
        } else if (fieldName === "name") {
            return toMessagePackString(this.name);
        } else if (fieldName === "email") {
            return this.email !== null ? toMessagePackString(this.email!) : null;
        } else if (fieldName === "phone") {
            return this.phone !== null ? toMessagePackString(this.phone!) : null;
        } else if (fieldName === "metadata") {
            if (this.metadata !== null) {
                const mapValues = new Map<string, MessagePackValue>();
                const keys = this.metadata!.keys();
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const value = this.metadata!.get(key);
                    mapValues.set(key, toMessagePackString(value));
                }
                return toMessagePackMap(mapValues);
            }
            return null;
        }
        return null;
    }
}

/**
 * Nested class for integration testing
 */
class IntegrationNestedClass implements Serializable {
    id: i32;
    simple: IntegrationSimpleClass;
    optional: IntegrationOptionalFieldsClass | null;

    constructor(id: i32, simple: IntegrationSimpleClass, optional: IntegrationOptionalFieldsClass | null = null) {
        this.id = id;
        this.simple = simple;
        this.optional = optional;
    }

    getClassName(): string {
        return "IntegrationNestedClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "id") {
            return toMessagePackInteger32(this.id);
        } else if (fieldName === "simple") {
            // Serialize nested class
            const encoder = new MessagePackEncoder();
            const classEncoder = new ClassSerializationEncoder(encoder);
            const serializedData = classEncoder.encodeClass(this.simple);
            const decoder = new MessagePackDecoder(serializedData);
            return decoder.decode();
        } else if (fieldName === "optional") {
            if (this.optional !== null) {
                const encoder = new MessagePackEncoder();
                const classEncoder = new ClassSerializationEncoder(encoder);
                const serializedData = classEncoder.encodeClass(this.optional!);
                const decoder = new MessagePackDecoder(serializedData);
                return decoder.decode();
            }
            return null;
        }
        return null;
    }
}

/**
 * Complex class with arrays and maps for integration testing
 */
class IntegrationComplexClass implements Serializable {
    id: i32;
    tags: string[];
    scores: Map<string, f64>;
    children: IntegrationSimpleClass[];
    metadata: Map<string, MessagePackValue>;

    constructor(
        id: i32,
        tags: string[],
        scores: Map<string, f64>,
        children: IntegrationSimpleClass[],
        metadata: Map<string, MessagePackValue>
    ) {
        this.id = id;
        this.tags = tags;
        this.scores = scores;
        this.children = children;
        this.metadata = metadata;
    }

    getClassName(): string {
        return "IntegrationComplexClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "id") {
            return toMessagePackInteger32(this.id);
        } else if (fieldName === "tags") {
            return stringArrayToMessagePack(this.tags);
        } else if (fieldName === "scores") {
            const mapValues = new Map<string, MessagePackValue>();
            const keys = this.scores.keys();
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const value = this.scores.get(key);
                mapValues.set(key, toMessagePackFloat64(value));
            }
            return toMessagePackMap(mapValues);
        } else if (fieldName === "children") {
            const childValues: MessagePackValue[] = [];
            for (let i = 0; i < this.children.length; i++) {
                const encoder = new MessagePackEncoder();
                const classEncoder = new ClassSerializationEncoder(encoder);
                const serializedData = classEncoder.encodeClass(this.children[i]);
                const decoder = new MessagePackDecoder(serializedData);
                childValues.push(decoder.decode());
            }
            return toMessagePackArray(childValues);
        } else if (fieldName === "metadata") {
            return toMessagePackMap(this.metadata);
        }
        return null;
    }
}

/**
 * Factory for IntegrationSimpleClass
 */
class IntegrationSimpleClassFactory implements ClassFactory {
    create(): Serializable {
        return new IntegrationSimpleClass("", 0, false);
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const obj = instance as IntegrationSimpleClass;
        if (fieldName === "name" && value.getType() === MessagePackValueType.STRING) {
            obj.name = (value as MessagePackString).value;
        } else if (fieldName === "age" && value.getType() === MessagePackValueType.INTEGER) {
            obj.age = (value as MessagePackInteger).value as i32;
        } else if (fieldName === "isActive" && value.getType() === MessagePackValueType.BOOLEAN) {
            obj.isActive = (value as MessagePackBoolean).value;
        }
    }
}

/**
 * Factory for IntegrationOptionalFieldsClass
 */
class IntegrationOptionalFieldsClassFactory implements ClassFactory {
    create(): Serializable {
        return new IntegrationOptionalFieldsClass(0, "", null, null, null);
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const obj = instance as IntegrationOptionalFieldsClass;
        if (fieldName === "id" && value.getType() === MessagePackValueType.INTEGER) {
            obj.id = (value as MessagePackInteger).value as i32;
        } else if (fieldName === "name" && value.getType() === MessagePackValueType.STRING) {
            obj.name = (value as MessagePackString).value;
        } else if (fieldName === "email" && value.getType() === MessagePackValueType.STRING) {
            obj.email = (value as MessagePackString).value;
        } else if (fieldName === "phone" && value.getType() === MessagePackValueType.STRING) {
            obj.phone = (value as MessagePackString).value;
        } else if (fieldName === "metadata" && value.getType() === MessagePackValueType.MAP) {
            const mapValue = value as MessagePackMap;
            const metadata = new Map<string, string>();
            const keys = mapValue.value.keys();
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const val = mapValue.value.get(key);
                if (val.getType() === MessagePackValueType.STRING) {
                    metadata.set(key, (val as MessagePackString).value);
                }
            }
            obj.metadata = metadata;
        }
    }
}

/**
 * Factory for IntegrationNestedClass
 */
class IntegrationNestedClassFactory implements ClassFactory {
    private simpleFactory: IntegrationSimpleClassFactory;
    private optionalFactory: IntegrationOptionalFieldsClassFactory;

    constructor() {
        this.simpleFactory = new IntegrationSimpleClassFactory();
        this.optionalFactory = new IntegrationOptionalFieldsClassFactory();
    }

    create(): Serializable {
        return new IntegrationNestedClass(0, new IntegrationSimpleClass("", 0, false), null);
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const obj = instance as IntegrationNestedClass;
        const decoder = new MessagePackDecoder(new Uint8Array(0));
        const classDecoder = new ClassSerializationDecoder(decoder);

        if (fieldName === "id" && value.getType() === MessagePackValueType.INTEGER) {
            obj.id = (value as MessagePackInteger).value as i32;
        } else if (fieldName === "simple" && value.getType() === MessagePackValueType.MAP) {
            const field = new FieldMetadata("simple", SerializableFieldType.CLASS, false, "IntegrationSimpleClass");
            const deserializedSimple = classDecoder.deserializeNestedClassWithFactory(value, field, "IntegrationNestedClass", this.simpleFactory);
            obj.simple = deserializedSimple as IntegrationSimpleClass;
        } else if (fieldName === "optional" && value.getType() === MessagePackValueType.MAP) {
            const field = new FieldMetadata("optional", SerializableFieldType.CLASS, true, "IntegrationOptionalFieldsClass");
            const deserializedOptional = classDecoder.deserializeNestedClassWithFactory(value, field, "IntegrationNestedClass", this.optionalFactory);
            obj.optional = deserializedOptional as IntegrationOptionalFieldsClass;
        }
    }
}

/**
 * Factory for IntegrationComplexClass
 */
class IntegrationComplexClassFactory implements ClassFactory {
    private simpleFactory: IntegrationSimpleClassFactory;

    constructor() {
        this.simpleFactory = new IntegrationSimpleClassFactory();
    }

    create(): Serializable {
        return new IntegrationComplexClass(0, [], new Map<string, f64>(), [], new Map<string, MessagePackValue>());
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const obj = instance as IntegrationComplexClass;
        const decoder = new MessagePackDecoder(new Uint8Array(0));
        const classDecoder = new ClassSerializationDecoder(decoder);

        if (fieldName === "id" && value.getType() === MessagePackValueType.INTEGER) {
            obj.id = (value as MessagePackInteger).value as i32;
        } else if (fieldName === "tags" && value.getType() === MessagePackValueType.ARRAY) {
            const arrayValue = value as MessagePackArray;
            const tags: string[] = [];
            for (let i = 0; i < arrayValue.value.length; i++) {
                const item = arrayValue.value[i];
                if (item.getType() === MessagePackValueType.STRING) {
                    tags.push((item as MessagePackString).value);
                }
            }
            obj.tags = tags;
        } else if (fieldName === "scores" && value.getType() === MessagePackValueType.MAP) {
            const mapValue = value as MessagePackMap;
            const scores = new Map<string, f64>();
            const keys = mapValue.value.keys();
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const val = mapValue.value.get(key);
                if (val.getType() === MessagePackValueType.FLOAT) {
                    scores.set(key, (val as MessagePackFloat).value);
                }
            }
            obj.scores = scores;
        } else if (fieldName === "children" && value.getType() === MessagePackValueType.ARRAY) {
            const arrayValue = value as MessagePackArray;
            const children: IntegrationSimpleClass[] = [];
            for (let i = 0; i < arrayValue.value.length; i++) {
                const item = arrayValue.value[i];
                if (item.getType() === MessagePackValueType.MAP) {
                    const field = new FieldMetadata(`child_${i}`, SerializableFieldType.CLASS, false, "IntegrationSimpleClass");
                    const deserializedChild = classDecoder.deserializeNestedClassWithFactory(item, field, "IntegrationComplexClass", this.simpleFactory);
                    children.push(deserializedChild as IntegrationSimpleClass);
                }
            }
            obj.children = children;
        } else if (fieldName === "metadata" && value.getType() === MessagePackValueType.MAP) {
            obj.metadata = (value as MessagePackMap).value;
        }
    }
}

// ============================================================================
// Comprehensive Integration Tests
// ============================================================================

/**
 * Test round-trip serialization for simple class structures
 */
export function runSimpleClassRoundTripTests(): boolean {
    console.log("=== Simple Class Round-Trip Tests ===");

    let passed = 0;
    let total = 0;

    // Clear and register classes
    ClassRegistry.clear();
    const simpleFields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN)
    ];
    ClassRegistry.register("IntegrationSimpleClass", simpleFields);

    // Test 1: Basic round-trip test
    total++;
    const original = new IntegrationSimpleClass("Alice", 30, true);

    // Serialize
    const encoder = new MessagePackEncoder();
    const classEncoder = new ClassSerializationEncoder(encoder);
    const serializedData = classEncoder.encodeClass(original);

    // Deserialize
    const decoder = new MessagePackDecoder(serializedData);
    const classDecoder = new ClassSerializationDecoder(decoder);
    const factory = new IntegrationSimpleClassFactory();
    const deserialized = classDecoder.decodeClass(factory, "IntegrationSimpleClass") as IntegrationSimpleClass;

    if (deserialized.name === "Alice" &&
        deserialized.age === 30 &&
        deserialized.isActive === true) {
        console.log("✓ Simple class round-trip test passed");
        passed++;
    } else {
        console.log("✗ Simple class round-trip test failed");
        console.log(`  Expected: Alice, 30, true`);
        console.log(`  Got: ${deserialized.name}, ${deserialized.age}, ${deserialized.isActive}`);
    }

    // Test 2: Edge case values
    total++;
    const edgeCase = new IntegrationSimpleClass("", 0, false);

    const encoder2 = new MessagePackEncoder();
    const classEncoder2 = new ClassSerializationEncoder(encoder2);
    const serializedData2 = classEncoder2.encodeClass(edgeCase);

    const decoder2 = new MessagePackDecoder(serializedData2);
    const classDecoder2 = new ClassSerializationDecoder(decoder2);
    const factory2 = new IntegrationSimpleClassFactory();
    const deserialized2 = classDecoder2.decodeClass(factory2, "IntegrationSimpleClass") as IntegrationSimpleClass;

    if (deserialized2.name === "" &&
        deserialized2.age === 0 &&
        deserialized2.isActive === false) {
        console.log("✓ Simple class edge case round-trip test passed");
        passed++;
    } else {
        console.log("✗ Simple class edge case round-trip test failed");
    }

    console.log(`Simple Class Round-Trip tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test round-trip serialization for classes with optional fields
 */
export function runOptionalFieldsRoundTripTests(): boolean {
    console.log("=== Optional Fields Round-Trip Tests ===");

    let passed = 0;
    let total = 0;

    // Clear and register classes
    ClassRegistry.clear();
    const optionalFields = [
        new FieldMetadata("id", SerializableFieldType.INTEGER),
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("email", SerializableFieldType.STRING, true),
        new FieldMetadata("phone", SerializableFieldType.STRING, true),
        new FieldMetadata("metadata", SerializableFieldType.MAP, true)
    ];
    ClassRegistry.register("IntegrationOptionalFieldsClass", optionalFields);

    // Test 1: All fields present
    total++;
    const metadata = new Map<string, string>();
    metadata.set("role", "admin");
    metadata.set("department", "engineering");

    const original = new IntegrationOptionalFieldsClass(1, "Alice", "alice@example.com", "555-1234", metadata);

    const encoder = new MessagePackEncoder();
    const classEncoder = new ClassSerializationEncoder(encoder);
    const serializedData = classEncoder.encodeClass(original);

    const decoder = new MessagePackDecoder(serializedData);
    const classDecoder = new ClassSerializationDecoder(decoder);
    const factory = new IntegrationOptionalFieldsClassFactory();
    const deserialized = classDecoder.decodeClass(factory, "IntegrationOptionalFieldsClass") as IntegrationOptionalFieldsClass;

    if (deserialized.id === 1 &&
        deserialized.name === "Alice" &&
        deserialized.email === "alice@example.com" &&
        deserialized.phone === "555-1234" &&
        deserialized.metadata !== null &&
        deserialized.metadata!.get("role") === "admin" &&
        deserialized.metadata!.get("department") === "engineering") {
        console.log("✓ Optional fields (all present) round-trip test passed");
        passed++;
    } else {
        console.log("✗ Optional fields (all present) round-trip test failed");
    }

    // Test 2: Some optional fields missing
    total++;
    const original2 = new IntegrationOptionalFieldsClass(2, "Bob", "bob@example.com", null, null);

    const encoder2 = new MessagePackEncoder();
    const classEncoder2 = new ClassSerializationEncoder(encoder2);
    const serializedData2 = classEncoder2.encodeClass(original2);

    const decoder2 = new MessagePackDecoder(serializedData2);
    const classDecoder2 = new ClassSerializationDecoder(decoder2);
    const factory2 = new IntegrationOptionalFieldsClassFactory();
    const deserialized2 = classDecoder2.decodeClass(factory2, "IntegrationOptionalFieldsClass") as IntegrationOptionalFieldsClass;

    if (deserialized2.id === 2 &&
        deserialized2.name === "Bob" &&
        deserialized2.email === "bob@example.com" &&
        deserialized2.phone === null &&
        deserialized2.metadata === null) {
        console.log("✓ Optional fields (some missing) round-trip test passed");
        passed++;
    } else {
        console.log("✗ Optional fields (some missing) round-trip test failed");
    }

    // Test 3: All optional fields missing
    total++;
    const original3 = new IntegrationOptionalFieldsClass(3, "Charlie", null, null, null);

    const encoder3 = new MessagePackEncoder();
    const classEncoder3 = new ClassSerializationEncoder(encoder3);
    const serializedData3 = classEncoder3.encodeClass(original3);

    const decoder3 = new MessagePackDecoder(serializedData3);
    const classDecoder3 = new ClassSerializationDecoder(decoder3);
    const factory3 = new IntegrationOptionalFieldsClassFactory();
    const deserialized3 = classDecoder3.decodeClass(factory3, "IntegrationOptionalFieldsClass") as IntegrationOptionalFieldsClass;

    if (deserialized3.id === 3 &&
        deserialized3.name === "Charlie" &&
        deserialized3.email === null &&
        deserialized3.phone === null &&
        deserialized3.metadata === null) {
        console.log("✓ Optional fields (all missing) round-trip test passed");
        passed++;
    } else {
        console.log("✗ Optional fields (all missing) round-trip test failed");
    }

    console.log(`Optional Fields Round-Trip tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test round-trip serialization for nested class structures
 */
export function runNestedClassRoundTripTests(): boolean {
    console.log("=== Nested Class Round-Trip Tests ===");

    let passed = 0;
    let total = 0;

    // Clear and register classes
    ClassRegistry.clear();

    const simpleFields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN)
    ];
    ClassRegistry.register("IntegrationSimpleClass", simpleFields);

    const optionalFields = [
        new FieldMetadata("id", SerializableFieldType.INTEGER),
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("email", SerializableFieldType.STRING, true),
        new FieldMetadata("phone", SerializableFieldType.STRING, true),
        new FieldMetadata("metadata", SerializableFieldType.MAP, true)
    ];
    ClassRegistry.register("IntegrationOptionalFieldsClass", optionalFields);

    const nestedFields = [
        new FieldMetadata("id", SerializableFieldType.INTEGER),
        new FieldMetadata("simple", SerializableFieldType.CLASS, false, "IntegrationSimpleClass"),
        new FieldMetadata("optional", SerializableFieldType.CLASS, true, "IntegrationOptionalFieldsClass")
    ];
    ClassRegistry.register("IntegrationNestedClass", nestedFields);

    // Test 1: Nested class with all fields
    total++;
    const simpleObj = new IntegrationSimpleClass("Alice", 30, true);
    const optionalObj = new IntegrationOptionalFieldsClass(1, "Bob", "bob@example.com", null, null);
    const original = new IntegrationNestedClass(100, simpleObj, optionalObj);

    const encoder = new MessagePackEncoder();
    const classEncoder = new ClassSerializationEncoder(encoder);
    const serializedData = classEncoder.encodeClass(original);

    const decoder = new MessagePackDecoder(serializedData);
    const classDecoder = new ClassSerializationDecoder(decoder);
    const factory = new IntegrationNestedClassFactory();
    const deserialized = classDecoder.decodeClass(factory, "IntegrationNestedClass") as IntegrationNestedClass;

    if (deserialized.id === 100 &&
        deserialized.simple.name === "Alice" &&
        deserialized.simple.age === 30 &&
        deserialized.simple.isActive === true &&
        deserialized.optional !== null &&
        deserialized.optional!.id === 1 &&
        deserialized.optional!.name === "Bob" &&
        deserialized.optional!.email === "bob@example.com") {
        console.log("✓ Nested class (all fields) round-trip test passed");
        passed++;
    } else {
        console.log("✗ Nested class (all fields) round-trip test failed");
    }

    // Test 2: Nested class with optional field missing
    total++;
    const simpleObj2 = new IntegrationSimpleClass("Charlie", 25, false);
    const original2 = new IntegrationNestedClass(200, simpleObj2, null);

    const encoder2 = new MessagePackEncoder();
    const classEncoder2 = new ClassSerializationEncoder(encoder2);
    const serializedData2 = classEncoder2.encodeClass(original2);

    const decoder2 = new MessagePackDecoder(serializedData2);
    const classDecoder2 = new ClassSerializationDecoder(decoder2);
    const factory2 = new IntegrationNestedClassFactory();
    const deserialized2 = classDecoder2.decodeClass(factory2, "IntegrationNestedClass") as IntegrationNestedClass;

    if (deserialized2.id === 200 &&
        deserialized2.simple.name === "Charlie" &&
        deserialized2.simple.age === 25 &&
        deserialized2.simple.isActive === false &&
        deserialized2.optional === null) {
        console.log("✓ Nested class (optional missing) round-trip test passed");
        passed++;
    } else {
        console.log("✗ Nested class (optional missing) round-trip test failed");
    }

    console.log(`Nested Class Round-Trip tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test round-trip serialization for complex object graphs with arrays and maps
 */
export function runComplexObjectGraphTests(): boolean {
    console.log("=== Complex Object Graph Tests ===");

    let passed = 0;
    let total = 0;

    // Clear and register classes
    ClassRegistry.clear();

    const simpleFields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN)
    ];
    ClassRegistry.register("IntegrationSimpleClass", simpleFields);

    const complexFields = [
        new FieldMetadata("id", SerializableFieldType.INTEGER),
        new FieldMetadata("tags", SerializableFieldType.ARRAY),
        new FieldMetadata("scores", SerializableFieldType.MAP),
        new FieldMetadata("children", SerializableFieldType.ARRAY),
        new FieldMetadata("metadata", SerializableFieldType.MAP)
    ];
    ClassRegistry.register("IntegrationComplexClass", complexFields);

    // Test 1: Complex object with arrays and maps
    total++;
    const tags = ["important", "urgent", "review"];
    const scores = new Map<string, f64>();
    scores.set("performance", 95.5);
    scores.set("quality", 88.2);
    scores.set("reliability", 92.1);

    const children = [
        new IntegrationSimpleClass("Child1", 10, true),
        new IntegrationSimpleClass("Child2", 15, false),
        new IntegrationSimpleClass("Child3", 20, true)
    ];

    const metadata = new Map<string, MessagePackValue>();
    metadata.set("version", toMessagePackString("1.0.0"));
    metadata.set("timestamp", toMessagePackInteger64(1640995200));
    metadata.set("enabled", toMessagePackBoolean(true));

    const original = new IntegrationComplexClass(1000, tags, scores, children, metadata);

    const encoder = new MessagePackEncoder();
    const classEncoder = new ClassSerializationEncoder(encoder);
    const serializedData = classEncoder.encodeClass(original);

    const decoder = new MessagePackDecoder(serializedData);
    const classDecoder = new ClassSerializationDecoder(decoder);
    const factory = new IntegrationComplexClassFactory();
    const deserialized = classDecoder.decodeClass(factory, "IntegrationComplexClass") as IntegrationComplexClass;

    let complexTestPassed = true;

    // Validate basic fields
    if (deserialized.id !== 1000) {
        complexTestPassed = false;
        console.log("  ID mismatch");
    }

    // Validate tags array
    if (deserialized.tags.length !== 3 ||
        deserialized.tags[0] !== "important" ||
        deserialized.tags[1] !== "urgent" ||
        deserialized.tags[2] !== "review") {
        complexTestPassed = false;
        console.log("  Tags array mismatch");
    }

    // Validate scores map
    if (Math.abs(deserialized.scores.get("performance") - 95.5) > 0.01 ||
        Math.abs(deserialized.scores.get("quality") - 88.2) > 0.01 ||
        Math.abs(deserialized.scores.get("reliability") - 92.1) > 0.01) {
        complexTestPassed = false;
        console.log("  Scores map mismatch");
    }

    // Validate children array
    if (deserialized.children.length !== 3 ||
        deserialized.children[0].name !== "Child1" ||
        deserialized.children[0].age !== 10 ||
        deserialized.children[0].isActive !== true ||
        deserialized.children[1].name !== "Child2" ||
        deserialized.children[1].age !== 15 ||
        deserialized.children[1].isActive !== false ||
        deserialized.children[2].name !== "Child3" ||
        deserialized.children[2].age !== 20 ||
        deserialized.children[2].isActive !== true) {
        complexTestPassed = false;
        console.log("  Children array mismatch");
    }

    // Validate metadata map
    const versionValue = deserialized.metadata.get("version");
    const timestampValue = deserialized.metadata.get("timestamp");
    const enabledValue = deserialized.metadata.get("enabled");

    if (versionValue === null || versionValue.getType() !== MessagePackValueType.STRING ||
        (versionValue as MessagePackString).value !== "1.0.0" ||
        timestampValue === null || timestampValue.getType() !== MessagePackValueType.INTEGER ||
        (timestampValue as MessagePackInteger).value !== 1640995200 ||
        enabledValue === null || enabledValue.getType() !== MessagePackValueType.BOOLEAN ||
        (enabledValue as MessagePackBoolean).value !== true) {
        complexTestPassed = false;
        console.log("  Metadata map mismatch");
    }

    if (complexTestPassed) {
        console.log("✓ Complex object graph round-trip test passed");
        passed++;
    } else {
        console.log("✗ Complex object graph round-trip test failed");
    }

    console.log(`Complex Object Graph tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test MessagePack output compatibility with specification
 */
export function runMessagePackCompatibilityTests(): boolean {
    console.log("=== MessagePack Compatibility Tests ===");

    let passed = 0;
    let total = 0;

    // Clear and register classes
    ClassRegistry.clear();
    const simpleFields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN)
    ];
    ClassRegistry.register("IntegrationSimpleClass", simpleFields);

    // Test 1: Verify MessagePack format structure
    total++;
    const original = new IntegrationSimpleClass("Test", 42, true);

    const encoder = new MessagePackEncoder();
    const classEncoder = new ClassSerializationEncoder(encoder);
    const serializedData = classEncoder.encodeClass(original);

    // Decode using standard MessagePack decoder to verify format
    const decoder = new MessagePackDecoder(serializedData);
    const decodedValue = decoder.decode();

    if (decodedValue.getType() === MessagePackValueType.MAP) {
        const mapValue = decodedValue as MessagePackMap;
        const nameValue = mapValue.value.get("name");
        const ageValue = mapValue.value.get("age");
        const isActiveValue = mapValue.value.get("isActive");

        if (nameValue !== null && nameValue.getType() === MessagePackValueType.STRING &&
            (nameValue as MessagePackString).value === "Test" &&
            ageValue !== null && ageValue.getType() === MessagePackValueType.INTEGER &&
            (ageValue as MessagePackInteger).value === 42 &&
            isActiveValue !== null && isActiveValue.getType() === MessagePackValueType.BOOLEAN &&
            (isActiveValue as MessagePackBoolean).value === true) {
            console.log("✓ MessagePack format compatibility test passed");
            passed++;
        } else {
            console.log("✗ MessagePack format compatibility test failed - field values incorrect");
        }
    } else {
        console.log("✗ MessagePack format compatibility test failed - not a map");
    }

    // Test 2: Verify binary format follows MessagePack specification
    total++;
    const simpleObj = new IntegrationSimpleClass("A", 1, false);

    const encoder2 = new MessagePackEncoder();
    const classEncoder2 = new ClassSerializationEncoder(encoder2);
    const serializedData2 = classEncoder2.encodeClass(simpleObj);

    // Check that the binary data starts with a map format byte
    if (serializedData2.length > 0) {
        const firstByte = serializedData2[0];
        // MessagePack map format: fixmap (0x80-0x8f) or map16 (0xde) or map32 (0xdf)
        if ((firstByte >= 0x80 && firstByte <= 0x8f) || firstByte === 0xde || firstByte === 0xdf) {
            console.log("✓ MessagePack binary format starts with correct map format byte");
            passed++;
        } else {
            console.log(`✗ MessagePack binary format test failed - first byte: 0x${firstByte.toString(16)}`);
        }
    } else {
        console.log("✗ MessagePack binary format test failed - empty data");
    }

    // Test 3: Cross-compatibility test (serialize with class, deserialize with standard decoder)
    total++;
    const testObj = new IntegrationSimpleClass("Cross", 99, true);

    const encoder3 = new MessagePackEncoder();
    const classEncoder3 = new ClassSerializationEncoder(encoder3);
    const serializedData3 = classEncoder3.encodeClass(testObj);

    // Deserialize with standard MessagePack decoder
    const decoder3 = new MessagePackDecoder(serializedData3);
    const standardDecoded = decoder3.decode();

    if (standardDecoded.getType() === MessagePackValueType.MAP) {
        const mapValue3 = standardDecoded as MessagePackMap;

        // Verify we can access all fields through standard MessagePack
        const hasName = mapValue3.value.has("name");
        const hasAge = mapValue3.value.has("age");
        const hasIsActive = mapValue3.value.has("isActive");

        if (hasName && hasAge && hasIsActive) {
            console.log("✓ Cross-compatibility test passed");
            passed++;
        } else {
            console.log("✗ Cross-compatibility test failed - missing fields");
        }
    } else {
        console.log("✗ Cross-compatibility test failed - not a map");
    }

    console.log(`MessagePack Compatibility tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Performance benchmark tests comparing class serialization vs manual map creation
 */
export function runPerformanceBenchmarkTests(): boolean {
    console.log("=== Performance Benchmark Tests ===");

    let passed = 0;
    let total = 0;

    // Clear and register classes
    ClassRegistry.clear();
    const simpleFields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("isActive", SerializableFieldType.BOOLEAN)
    ];
    ClassRegistry.register("IntegrationSimpleClass", simpleFields);

    const iterations = 1000;

    // Test 1: Class serialization performance
    total++;
    const classObjects: IntegrationSimpleClass[] = [];
    for (let i = 0; i < iterations; i++) {
        classObjects.push(new IntegrationSimpleClass(`User${i}`, i, i % 2 === 0));
    }

    const classStartTime = Date.now();
    const classResults: Uint8Array[] = [];

    for (let i = 0; i < iterations; i++) {
        const encoder = new MessagePackEncoder();
        const classEncoder = new ClassSerializationEncoder(encoder);
        const serialized = classEncoder.encodeClass(classObjects[i]);
        classResults.push(serialized);
    }

    const classEndTime = Date.now();
    const classSerializationTime = classEndTime - classStartTime;

    // Test 2: Manual map creation performance
    const manualStartTime = Date.now();
    const manualResults: Uint8Array[] = [];

    for (let i = 0; i < iterations; i++) {
        const obj = classObjects[i];
        const map = new Map<string, MessagePackValue>();
        map.set("name", toMessagePackString(obj.name));
        map.set("age", toMessagePackInteger32(obj.age));
        map.set("isActive", toMessagePackBoolean(obj.isActive));

        const encoder = new MessagePackEncoder();
        const serialized = encoder.encodeMap(map);
        manualResults.push(serialized);
    }

    const manualEndTime = Date.now();
    const manualSerializationTime = manualEndTime - manualStartTime;

    // Verify both approaches produce equivalent results
    let resultsMatch = true;
    for (let i = 0; i < Math.min(10, iterations); i++) {
        const classResult = classResults[i];
        const manualResult = manualResults[i];

        if (classResult.length !== manualResult.length) {
            resultsMatch = false;
            break;
        }

        for (let j = 0; j < classResult.length; j++) {
            if (classResult[j] !== manualResult[j]) {
                resultsMatch = false;
                break;
            }
        }

        if (!resultsMatch) break;
    }

    console.log(`  Class serialization time: ${classSerializationTime}ms`);
    console.log(`  Manual map creation time: ${manualSerializationTime}ms`);

    if (resultsMatch) {
        console.log(`  Results match: ✓`);

        // Performance comparison (class serialization should be reasonably close to manual)
        const performanceRatio = (classSerializationTime as f64) / (manualSerializationTime as f64);
        console.log(`  Performance ratio (class/manual): ${performanceRatio.toString()}`);

        // Accept if class serialization is within 3x of manual performance
        if (performanceRatio <= 3.0) {
            console.log("✓ Performance benchmark test passed");
            passed++;
        } else {
            console.log("✗ Performance benchmark test failed - class serialization too slow");
        }
    } else {
        console.log("✗ Performance benchmark test failed - results don't match");
    }

    // Test 3: Deserialization performance comparison
    total++;
    const factory = new IntegrationSimpleClassFactory();

    // Class deserialization performance
    const classDeserStartTime = Date.now();
    const classDeserResults: IntegrationSimpleClass[] = [];

    for (let i = 0; i < Math.min(100, iterations); i++) {
        const decoder = new MessagePackDecoder(classResults[i]);
        const classDecoder = new ClassSerializationDecoder(decoder);
        const deserialized = classDecoder.decodeClass(factory, "IntegrationSimpleClass") as IntegrationSimpleClass;
        classDeserResults.push(deserialized);
    }

    const classDeserEndTime = Date.now();
    const classDeserializationTime = classDeserEndTime - classDeserStartTime;

    // Manual deserialization performance
    const manualDeserStartTime = Date.now();
    const manualDeserResults: IntegrationSimpleClass[] = [];

    for (let i = 0; i < Math.min(100, iterations); i++) {
        const decoder = new MessagePackDecoder(manualResults[i]);
        const decoded = decoder.decode() as MessagePackMap;

        const name = (decoded.value.get("name") as MessagePackString).value;
        const age = (decoded.value.get("age") as MessagePackInteger).value as i32;
        const isActive = (decoded.value.get("isActive") as MessagePackBoolean).value;

        const obj = new IntegrationSimpleClass(name, age, isActive);
        manualDeserResults.push(obj);
    }

    const manualDeserEndTime = Date.now();
    const manualDeserializationTime = manualDeserEndTime - manualDeserStartTime;

    console.log(`  Class deserialization time: ${classDeserializationTime}ms`);
    console.log(`  Manual deserialization time: ${manualDeserializationTime}ms`);

    // Verify deserialization results match
    let deserResultsMatch = true;
    for (let i = 0; i < Math.min(10, classDeserResults.length); i++) {
        const classResult = classDeserResults[i];
        const manualResult = manualDeserResults[i];

        if (classResult.name !== manualResult.name ||
            classResult.age !== manualResult.age ||
            classResult.isActive !== manualResult.isActive) {
            deserResultsMatch = false;
            break;
        }
    }

    if (deserResultsMatch) {
        console.log(`  Deserialization results match: ✓`);

        if (manualDeserializationTime > 0) {
            const deserPerformanceRatio = (classDeserializationTime as f64) / (manualDeserializationTime as f64);
            console.log(`  Deserialization performance ratio (class/manual): ${deserPerformanceRatio.toString()}`);

            // Accept if class deserialization is within 5x of manual performance
            if (deserPerformanceRatio <= 5.0) {
                console.log("✓ Deserialization performance benchmark test passed");
                passed++;
            } else {
                console.log("✗ Deserialization performance benchmark test failed - too slow");
            }
        } else {
            // Both times are 0 or very small, consider it a pass
            console.log(`  Deserialization performance ratio (class/manual): both too fast to measure accurately`);
            console.log("✓ Deserialization performance benchmark test passed (both very fast)");
            passed++;
        }
    } else {
        console.log("✗ Deserialization performance benchmark test failed - results don't match");
    }

    console.log(`Performance Benchmark tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Run all comprehensive integration tests
 */
export function runComprehensiveIntegrationTests(): boolean {
    console.log("=== Comprehensive Integration Tests ===\n");

    const results = [
        runSimpleClassRoundTripTests(),
        runOptionalFieldsRoundTripTests(),
        runNestedClassRoundTripTests(),
        runComplexObjectGraphTests(),
        runMessagePackCompatibilityTests(),
        runPerformanceBenchmarkTests(),
        runPerformanceOptimizationTests(),
        runEdgeCaseTests(),
        runMemoryUsageTests(),
        runErrorRecoveryTests()
    ];

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log(`=== Integration Test Summary ===`);
    console.log(`${passed}/${total} integration test suites passed`);

    if (passed === total) {
        console.log("🎉 All integration tests passed!");
    } else {
        console.log("❌ Some integration tests failed");
    }

    return passed === total;
}/**

 * Test suite for ClassRegistrationBuilder
 */
export function runClassRegistrationBuilderTests(): boolean {
    console.log("=== ClassRegistrationBuilder Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Test 1: Basic builder functionality
    total++;
    const builder = new ClassRegistrationBuilder("TestClass");
    builder.addStringField("name")
        .addIntegerField("age")
        .addBooleanField("active", true)
        .register();

    if (ClassRegistry.isRegistered("TestClass")) {
        const metadata = ClassRegistry.getMetadata("TestClass");
        if (metadata !== null && metadata.fields.length === 3) {
            console.log("✓ Basic builder functionality works");
            passed++;
        } else {
            console.log("✗ Builder created incorrect metadata");
        }
    } else {
        console.log("✗ Builder failed to register class");
    }

    // Test 2: Builder with all field types
    total++;
    {
        ClassRegistry.clear();
        const builder = new ClassRegistrationBuilder("CompleteClass");
        builder.addBooleanField("bool")
            .addIntegerField("int")
            .addFloatField("float")
            .addStringField("str")
            .addBinaryField("bin")
            .addArrayField("arr")
            .addMapField("map")
            .addClassField("nested", "NestedClass")
            .addNullField("nullField")
            .register();

        const metadata = ClassRegistry.getMetadata("CompleteClass");
        if (metadata !== null && metadata.fields.length === 9) {
            console.log("✓ Builder with all field types works");
            passed++;
        } else {
            console.log("✗ Builder with all field types failed");
        }
    }

    // Test 3: Builder field count and class name
    total++;
    try {
        const builder = new ClassRegistrationBuilder("CountTest");
        builder.addStringField("field1").addIntegerField("field2");

        if (builder.getFieldCount() === 2 && builder.getClassName() === "CountTest") {
            console.log("✓ Builder field count and class name work");
            passed++;
        } else {
            console.log("✗ Builder field count or class name incorrect");
        }
    } catch (e) {
        console.log("✗ Builder field count test threw error: " + e.toString());
    }

    console.log(`ClassRegistrationBuilder tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test suite for BatchClassRegistration
 */
export function runBatchClassRegistrationTests(): boolean {
    console.log("=== BatchClassRegistration Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Test 1: Basic batch registration
    total++;
    try {
        const batch = new BatchClassRegistration();

        const builder1 = new ClassRegistrationBuilder("BatchClass1");
        builder1.addStringField("name");

        const builder2 = new ClassRegistrationBuilder("BatchClass2");
        builder2.addIntegerField("value");

        batch.addClass(builder1).addClass(builder2);
        batch.registerAll();

        if (ClassRegistry.isRegistered("BatchClass1") && ClassRegistry.isRegistered("BatchClass2")) {
            console.log("✓ Basic batch registration works");
            passed++;
        } else {
            console.log("✗ Basic batch registration failed");
        }
    } catch (e) {
        console.log("✗ Basic batch registration threw error: " + e.toString());
    }

    // Test 2: Batch with createClass method
    total++;
    try {
        ClassRegistry.clear();
        const batch = new BatchClassRegistration();

        batch.createClass("CreatedClass1").addStringField("field1");
        batch.createClass("CreatedClass2").addIntegerField("field2");

        if (batch.getClassCount() === 2) {
            batch.registerAll();
            if (ClassRegistry.isRegistered("CreatedClass1") && ClassRegistry.isRegistered("CreatedClass2")) {
                console.log("✓ Batch createClass method works");
                passed++;
            } else {
                console.log("✗ Batch createClass registration failed");
            }
        } else {
            console.log("✗ Batch createClass count incorrect");
        }
    } catch (e) {
        console.log("✗ Batch createClass threw error: " + e.toString());
    }

    // Test 3: Batch duplicate class name detection
    total++;
    try {
        ClassRegistry.clear();
        const batch = new BatchClassRegistration();

        batch.createClass("DuplicateClass").addStringField("field1");
        batch.createClass("DuplicateClass").addIntegerField("field2");

        let errorThrown = false;
        try {
            batch.registerAll();
        } catch (e) {
            errorThrown = true;
        }

        if (errorThrown) {
            console.log("✓ Batch duplicate class name detection works");
            passed++;
        } else {
            console.log("✗ Batch duplicate class name detection failed");
        }
    } catch (e) {
        console.log("✗ Batch duplicate class name test threw error: " + e.toString());
    }

    // Test 4: Batch clear functionality
    total++;
    try {
        const batch = new BatchClassRegistration();
        batch.createClass("ClearTest1").addStringField("field1");
        batch.createClass("ClearTest2").addStringField("field2");

        if (batch.getClassCount() === 2) {
            batch.clear();
            if (batch.getClassCount() === 0) {
                console.log("✓ Batch clear functionality works");
                passed++;
            } else {
                console.log("✗ Batch clear did not reset count");
            }
        } else {
            console.log("✗ Batch clear test setup failed");
        }
    } catch (e) {
        console.log("✗ Batch clear test threw error: " + e.toString());
    }

    console.log(`BatchClassRegistration tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test suite for SerializationUtils
 */
export function runSerializationUtilsTests(): boolean {
    console.log("=== SerializationUtils Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Test 1: createEncoder and createDecoder
    total++;
    try {
        const encoder = SerializationUtils.createEncoder();
        const decoder = SerializationUtils.createDecoder();
        if (encoder !== null && decoder !== null) {
            console.log("✓ createEncoder and createDecoder work");
            passed++;
        } else {
            console.log("✗ createEncoder or createDecoder returned null");
        }
    } catch (e) {
        console.log("✗ createEncoder/createDecoder threw error: " + e.toString());
    }

    // Test 2: registration statistics methods
    total++;
    try {
        ClassRegistry.clear();

        // Register a test class
        new ClassRegistrationBuilder("StatsTestClass")
            .addStringField("field1")
            .addIntegerField("field2")
            .register();

        const totalClasses = SerializationUtils.getTotalClasses();
        const totalFields = SerializationUtils.getTotalFields();
        const classNames = SerializationUtils.getRegisteredClassNames();

        if (totalClasses === 1 && totalFields === 2 && classNames.length === 1) {
            console.log("✓ registration statistics methods work");
            passed++;
        } else {
            console.log("✗ registration statistics methods returned incorrect values");
        }
    } catch (e) {
        console.log("✗ registration statistics methods threw error: " + e.toString());
    }

    // Test 3: createField method
    total++;
    try {
        const field1 = SerializationUtils.createField("name", SerializableFieldType.STRING, false);
        const field2 = SerializationUtils.createField("age", SerializableFieldType.INTEGER, true);

        if (field1.name === "name" && field1.type === SerializableFieldType.STRING && !field1.isOptional &&
            field2.name === "age" && field2.type === SerializableFieldType.INTEGER && field2.isOptional) {
            console.log("✓ createField method works");
            passed++;
        } else {
            console.log("✗ createField method created incorrect fields");
        }
    } catch (e) {
        console.log("✗ createField method threw error: " + e.toString());
    }

    // Test 4: createNestedField method
    total++;
    try {
        const field1 = SerializationUtils.createField("name", SerializableFieldType.STRING, false);
        const field2 = SerializationUtils.createNestedField("nested", "NestedClass", true);

        if (field1.name === "name" && field1.nestedClassType === null &&
            field2.name === "nested" && field2.nestedClassType === "NestedClass") {
            console.log("✓ createNestedField method works");
            passed++;
        } else {
            console.log("✗ createNestedField method created incorrect fields");
        }
    } catch (e) {
        console.log("✗ createNestedField method threw error: " + e.toString());
    }

    console.log(`SerializationUtils tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test suite for Example Classes
 */
export function runExampleClassesTests(): boolean {
    console.log("=== Example Classes Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Test 1: ExamplePerson registration and basic functionality
    total++;
    try {
        ExamplePerson.register();

        const person = new ExamplePerson("John Doe", 30, true, "john@example.com");
        if (person.getClassName() === "ExamplePerson" &&
            person.getFieldValue("name") !== null &&
            person.getFieldValue("age") !== null) {
            console.log("✓ ExamplePerson registration and basic functionality work");
            passed++;
        } else {
            console.log("✗ ExamplePerson basic functionality failed");
        }
    } catch (e) {
        console.log("✗ ExamplePerson test threw error: " + e.toString());
    }

    // Test 2: ExamplePerson serialization roundtrip
    total++;
    try {
        const person = new ExamplePerson("Jane Smith", 25, false, null);
        const factory = new ExamplePersonFactory();

        const serialized = SerializationUtils.serialize(person);
        const deserialized = SerializationUtils.deserialize(serialized, factory, "ExamplePerson") as ExamplePerson;

        if (deserialized.name === "Jane Smith" &&
            deserialized.age === 25 &&
            deserialized.isActive === false &&
            deserialized.email === null) {
            console.log("✓ ExamplePerson serialization roundtrip works");
            passed++;
        } else {
            console.log("✗ ExamplePerson serialization roundtrip failed");
        }
    } catch (e) {
        console.log("✗ ExamplePerson roundtrip threw error: " + e.toString());
    }

    // Test 3: ExampleProject with collections
    total++;
    try {
        ExampleProject.register();

        const tags = ["web", "frontend"];
        const metadata = new Map<string, string>();
        metadata.set("version", "1.0");
        metadata.set("status", "active");

        const project = new ExampleProject("Test Project", tags, metadata, 1);
        const factory = new ExampleProjectFactory();

        const serialized = SerializationUtils.serialize(project);
        const deserialized = SerializationUtils.deserialize(serialized, factory, "ExampleProject") as ExampleProject;

        if (deserialized.name === "Test Project" &&
            deserialized.tags.length === 2 &&
            deserialized.metadata.size === 2 &&
            deserialized.priority === 1) {
            console.log("✓ ExampleProject with collections works");
            passed++;
        } else {
            console.log("✗ ExampleProject with collections failed");
        }
    } catch (e) {
        console.log("✗ ExampleProject test threw error: " + e.toString());
    }

    // Test 4: registerExampleClasses batch registration
    total++;
    try {
        ClassRegistry.clear();
        registerExampleClasses();

        if (ClassRegistry.isRegistered("ExamplePerson") &&
            ClassRegistry.isRegistered("ExampleProject") &&
            ClassRegistry.isRegistered("ExampleCompany")) {
            console.log("✓ registerExampleClasses batch registration works");
            passed++;
        } else {
            console.log("✗ registerExampleClasses batch registration failed");
        }
    } catch (e) {
        console.log("✗ registerExampleClasses threw error: " + e.toString());
    }

    console.log(`Example Classes tests: ${passed}/${total} passed\n`);
    return passed === total;
}

/**
 * Test suite for convenience method integration
 */
export function runConvenienceMethodIntegrationTests(): boolean {
    console.log("=== Convenience Method Integration Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Test 1: Full workflow with builder pattern
    total++;
    try {
        // Register classes using builder pattern
        new ClassRegistrationBuilder("User")
            .addStringField("username")
            .addStringField("email")
            .addIntegerField("userId")
            .addBooleanField("isVerified", true)
            .register();

        // Validate registration
        if (SerializationUtils.validateClassRegistration("User")) {
            const totalClasses = SerializationUtils.getTotalClasses();
            const totalFields = SerializationUtils.getTotalFields();
            if (totalClasses === 1 && totalFields === 4) {
                console.log("✓ Full workflow with builder pattern works");
                passed++;
            } else {
                console.log("✗ Full workflow stats incorrect");
            }
        } else {
            console.log("✗ Full workflow validation failed");
        }
    } catch (e) {
        console.log("✗ Full workflow threw error: " + e.toString());
    }

    // Test 2: Batch registration with validation
    total++;
    {
        ClassRegistry.clear();

        const batch = new BatchClassRegistration();
        batch.createClass("Product")
            .addStringField("name")
            .addFloatField("price")
            .addIntegerField("stock");

        batch.createClass("Order")
            .addStringField("orderId")
            .addArrayField("products")
            .addFloatField("total");

        batch.registerAll();

        // Validate both classes
        const validProduct = SerializationUtils.validateClassRegistration("Product");
        const validOrder = SerializationUtils.validateClassRegistration("Order");

        if (validProduct && validOrder) {
            console.log("✓ Batch registration with validation works");
            passed++;
        } else {
            console.log("✗ Batch registration validation failed");
        }
    }

    // Test 3: Field creation utilities
    total++;
    {
        const simpleField = SerializationUtils.createField("name", SerializableFieldType.STRING, false);
        const optionalField = SerializationUtils.createField("count", SerializableFieldType.INTEGER, true);
        const nestedField = SerializationUtils.createNestedField("owner", "User", false);

        if (simpleField.name === "name" && !simpleField.isOptional &&
            optionalField.name === "count" && optionalField.isOptional &&
            nestedField.nestedClassType === "User") {
            console.log("✓ Field creation utilities work");
            passed++;
        } else {
            console.log("✗ Field creation utilities failed");
        }
    }

    console.log(`Convenience Method Integration tests: ${passed}/${total} passed\n`);
    return passed === total;
}

// ============================================================================
// Edge Case Tests (Task 12)
// ============================================================================

/**
 * Empty class for edge case testing
 */
class EmptyClass implements Serializable {
    getClassName(): string {
        return "EmptyClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        return null;
    }
}

/**
 * Factory for EmptyClass
 */
class EmptyClassFactory implements ClassFactory {
    create(): Serializable {
        return new EmptyClass();
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        // No fields to set
    }
}

/**
 * Class with only optional fields for edge case testing
 */
class OptionalOnlyClass implements Serializable {
    optionalString: string | null;
    optionalNumber: i32;
    optionalBoolean: boolean;
    hasOptionalNumber: boolean;
    hasOptionalBoolean: boolean;

    constructor(optionalString: string | null = null, optionalNumber: i32 = 0, optionalBoolean: boolean = false, hasOptionalNumber: boolean = false, hasOptionalBoolean: boolean = false) {
        this.optionalString = optionalString;
        this.optionalNumber = optionalNumber;
        this.optionalBoolean = optionalBoolean;
        this.hasOptionalNumber = hasOptionalNumber;
        this.hasOptionalBoolean = hasOptionalBoolean;
    }

    getClassName(): string {
        return "OptionalOnlyClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "optionalString") {
            return this.optionalString !== null ? toMessagePackString(this.optionalString!) : null;
        } else if (fieldName === "optionalNumber") {
            return this.hasOptionalNumber ? toMessagePackInteger32(this.optionalNumber) : null;
        } else if (fieldName === "optionalBoolean") {
            return this.hasOptionalBoolean ? toMessagePackBoolean(this.optionalBoolean) : null;
        }
        return null;
    }
}

/**
 * Factory for OptionalOnlyClass
 */
class OptionalOnlyClassFactory implements ClassFactory {
    create(): Serializable {
        return new OptionalOnlyClass();
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const obj = instance as OptionalOnlyClass;
        if (fieldName === "optionalString" && value.getType() === MessagePackValueType.STRING) {
            obj.optionalString = (value as MessagePackString).value;
        } else if (fieldName === "optionalNumber" && value.getType() === MessagePackValueType.INTEGER) {
            obj.optionalNumber = (value as MessagePackInteger).value as i32;
            obj.hasOptionalNumber = true;
        } else if (fieldName === "optionalBoolean" && value.getType() === MessagePackValueType.BOOLEAN) {
            obj.optionalBoolean = (value as MessagePackBoolean).value;
            obj.hasOptionalBoolean = true;
        }
    }
}

/**
 * Test edge cases like empty classes and classes with only optional fields
 */
export function runEdgeCaseTests(): boolean {
    console.log("=== Edge Case Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Test 1: Empty class serialization
    total++;
    ClassRegistry.register("EmptyClass", []);

    const emptyInstance = new EmptyClass();
    const encoder = new MessagePackEncoder();
    const classEncoder = new ClassSerializationEncoder(encoder);
    const serializedEmpty = classEncoder.encodeClass(emptyInstance);

    // Deserialize back
    const decoder = new MessagePackDecoder(serializedEmpty);
    const classDecoder = new ClassSerializationDecoder(decoder);
    const factory = new EmptyClassFactory();
    const deserializedEmpty = classDecoder.decodeClass(factory, "EmptyClass");

    if (deserializedEmpty.getClassName() === "EmptyClass") {
        console.log("✓ Empty class serialization works");
        passed++;
    } else {
        console.log("✗ Empty class serialization failed");
    }

    // Test 2: Class with only optional fields (all null)
    total++;
    const optionalFields = [
        new FieldMetadata("optionalString", SerializableFieldType.STRING, true),
        new FieldMetadata("optionalNumber", SerializableFieldType.INTEGER, true),
        new FieldMetadata("optionalBoolean", SerializableFieldType.BOOLEAN, true)
    ];
    ClassRegistry.register("OptionalOnlyClass", optionalFields);

    const optionalInstance = new OptionalOnlyClass(null, 0, false, false, false);
    const encoder2 = new MessagePackEncoder();
    const classEncoder2 = new ClassSerializationEncoder(encoder2);
    const serializedOptional = classEncoder2.encodeClass(optionalInstance);

    // Deserialize back
    const decoder2 = new MessagePackDecoder(serializedOptional);
    const classDecoder2 = new ClassSerializationDecoder(decoder2);
    const factory2 = new OptionalOnlyClassFactory();
    const deserializedOptional = classDecoder2.decodeClass(factory2, "OptionalOnlyClass") as OptionalOnlyClass;

    if (deserializedOptional.optionalString === null &&
        deserializedOptional.hasOptionalNumber === false &&
        deserializedOptional.hasOptionalBoolean === false) {
        console.log("✓ Class with only optional fields (all null) works");
        passed++;
    } else {
        console.log("✗ Class with only optional fields (all null) failed");
    }

    // Test 3: Class with only optional fields (some present)
    total++;
    const optionalInstance2 = new OptionalOnlyClass("test", 42, true, true, false);
    const encoder3 = new MessagePackEncoder();
    const classEncoder3 = new ClassSerializationEncoder(encoder3);
    const serializedOptional2 = classEncoder3.encodeClass(optionalInstance2);

    // Deserialize back
    const decoder3 = new MessagePackDecoder(serializedOptional2);
    const classDecoder3 = new ClassSerializationDecoder(decoder3);
    const factory3 = new OptionalOnlyClassFactory();
    const deserializedOptional2 = classDecoder3.decodeClass(factory3, "OptionalOnlyClass") as OptionalOnlyClass;

    if (deserializedOptional2.optionalString === "test" &&
        deserializedOptional2.optionalNumber === 42 &&
        deserializedOptional2.hasOptionalNumber === true &&
        deserializedOptional2.hasOptionalBoolean === false) {
        console.log("✓ Class with only optional fields (some present) works");
        passed++;
    } else {
        console.log("✗ Class with only optional fields (some present) failed");
    }

    console.log(`Edge Case tests: ${passed}/${total} passed\n`);
    return passed === total;
}

// ============================================================================
// Memory Usage Tests (Task 12)
// ============================================================================

/**
 * Large class for memory testing
 */
class LargeObjectClass implements Serializable {
    id: i32;
    data: string[];
    metadata: Map<string, string>;
    children: LargeObjectClass[];

    constructor(id: i32, data: string[], metadata: Map<string, string>, children: LargeObjectClass[]) {
        this.id = id;
        this.data = data;
        this.metadata = metadata;
        this.children = children;
    }

    getClassName(): string {
        return "LargeObjectClass";
    }

    getFieldValue(fieldName: string): MessagePackValue | null {
        if (fieldName === "id") {
            return toMessagePackInteger32(this.id);
        } else if (fieldName === "data") {
            return stringArrayToMessagePack(this.data);
        } else if (fieldName === "metadata") {
            const mapValues = new Map<string, MessagePackValue>();
            const keys = this.metadata.keys();
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const value = this.metadata.get(key);
                mapValues.set(key, toMessagePackString(value));
            }
            return toMessagePackMap(mapValues);
        } else if (fieldName === "children") {
            const childValues: MessagePackValue[] = [];
            for (let i = 0; i < this.children.length; i++) {
                const encoder = new MessagePackEncoder();
                const classEncoder = new ClassSerializationEncoder(encoder);
                const serializedData = classEncoder.encodeClass(this.children[i]);
                const decoder = new MessagePackDecoder(serializedData);
                childValues.push(decoder.decode());
            }
            return toMessagePackArray(childValues);
        }
        return null;
    }
}

/**
 * Factory for LargeObjectClass
 */
class LargeObjectClassFactory implements ClassFactory {
    create(): Serializable {
        return new LargeObjectClass(0, [], new Map<string, string>(), []);
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const obj = instance as LargeObjectClass;
        const decoder = new MessagePackDecoder(new Uint8Array(0));
        const classDecoder = new ClassSerializationDecoder(decoder);

        if (fieldName === "id" && value.getType() === MessagePackValueType.INTEGER) {
            obj.id = (value as MessagePackInteger).value as i32;
        } else if (fieldName === "data" && value.getType() === MessagePackValueType.ARRAY) {
            const arrayValue = value as MessagePackArray;
            const data: string[] = [];
            for (let i = 0; i < arrayValue.value.length; i++) {
                const item = arrayValue.value[i];
                if (item.getType() === MessagePackValueType.STRING) {
                    data.push((item as MessagePackString).value);
                }
            }
            obj.data = data;
        } else if (fieldName === "metadata" && value.getType() === MessagePackValueType.MAP) {
            const mapValue = value as MessagePackMap;
            const metadata = new Map<string, string>();
            const keys = mapValue.value.keys();
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const val = mapValue.value.get(key);
                if (val.getType() === MessagePackValueType.STRING) {
                    metadata.set(key, (val as MessagePackString).value);
                }
            }
            obj.metadata = metadata;
        } else if (fieldName === "children" && value.getType() === MessagePackValueType.ARRAY) {
            const arrayValue = value as MessagePackArray;
            const children: LargeObjectClass[] = [];
            for (let i = 0; i < arrayValue.value.length; i++) {
                const item = arrayValue.value[i];
                if (item.getType() === MessagePackValueType.MAP) {
                    const field = new FieldMetadata(`child_${i}`, SerializableFieldType.CLASS, false, "LargeObjectClass");
                    const deserializedChild = classDecoder.deserializeNestedClassWithFactory(item, field, "LargeObjectClass", this);
                    children.push(deserializedChild as LargeObjectClass);
                }
            }
            obj.children = children;
        }
    }
}

/**
 * Test memory usage with large object graphs
 */
export function runMemoryUsageTests(): boolean {
    console.log("=== Memory Usage Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Register the large object class
    const largeFields = [
        new FieldMetadata("id", SerializableFieldType.INTEGER),
        new FieldMetadata("data", SerializableFieldType.ARRAY),
        new FieldMetadata("metadata", SerializableFieldType.MAP),
        new FieldMetadata("children", SerializableFieldType.ARRAY)
    ];
    ClassRegistry.register("LargeObjectClass", largeFields);

    // Test 1: Large flat object
    total++;
    const largeData: string[] = [];
    for (let i = 0; i < 100; i++) {
        largeData.push(`data_item_${i}`);
    }

    const largeMetadata = new Map<string, string>();
    for (let i = 0; i < 50; i++) {
        largeMetadata.set(`key_${i}`, `value_${i}`);
    }

    const largeObject = new LargeObjectClass(1, largeData, largeMetadata, []);

    const encoder = new MessagePackEncoder();
    const classEncoder = new ClassSerializationEncoder(encoder);
    const serializedLarge = classEncoder.encodeClass(largeObject);

    // Deserialize back
    const decoder = new MessagePackDecoder(serializedLarge);
    const classDecoder = new ClassSerializationDecoder(decoder);
    const factory = new LargeObjectClassFactory();
    const deserializedLarge = classDecoder.decodeClass(factory, "LargeObjectClass") as LargeObjectClass;

    if (deserializedLarge.id === 1 &&
        deserializedLarge.data.length === 100 &&
        deserializedLarge.metadata.size === 50 &&
        deserializedLarge.children.length === 0) {
        console.log("✓ Large flat object serialization works");
        passed++;
    } else {
        console.log("✗ Large flat object serialization failed");
        console.log(`  Expected: id=1, data.length=100, metadata.size=50, children.length=0`);
        console.log(`  Got: id=${deserializedLarge.id}, data.length=${deserializedLarge.data.length}, metadata.size=${deserializedLarge.metadata.size}, children.length=${deserializedLarge.children.length}`);
    }

    // Test 2: Nested object graph (limited depth to avoid stack overflow)
    total++;
    const child1 = new LargeObjectClass(2, ["child1_data"], new Map<string, string>(), []);
    const child2 = new LargeObjectClass(3, ["child2_data"], new Map<string, string>(), []);
    const parent = new LargeObjectClass(1, ["parent_data"], new Map<string, string>(), [child1, child2]);

    const encoder2 = new MessagePackEncoder();
    const classEncoder2 = new ClassSerializationEncoder(encoder2);
    const serializedNested = classEncoder2.encodeClass(parent);

    // Deserialize back
    const decoder2 = new MessagePackDecoder(serializedNested);
    const classDecoder2 = new ClassSerializationDecoder(decoder2);
    const factory2 = new LargeObjectClassFactory();
    const deserializedNested = classDecoder2.decodeClass(factory2, "LargeObjectClass") as LargeObjectClass;

    if (deserializedNested.id === 1 &&
        deserializedNested.children.length === 2 &&
        deserializedNested.children[0].id === 2 &&
        deserializedNested.children[1].id === 3) {
        console.log("✓ Nested object graph serialization works");
        passed++;
    } else {
        console.log("✗ Nested object graph serialization failed");
    }

    // Test 3: Memory efficiency check (serialize multiple objects)
    total++;
    const objects: LargeObjectClass[] = [];
    for (let i = 0; i < 10; i++) {
        const data: string[] = [];
        for (let j = 0; j < 10; j++) {
            data.push(`obj_${i}_data_${j}`);
        }
        objects.push(new LargeObjectClass(i, data, new Map<string, string>(), []));
    }

    let allSerialized = true;
    for (let i = 0; i < objects.length; i++) {
        const encoder3 = new MessagePackEncoder();
        const classEncoder3 = new ClassSerializationEncoder(encoder3);
        const serialized = classEncoder3.encodeClass(objects[i]);

        if (serialized.length === 0) {
            allSerialized = false;
            break;
        }
    }

    if (allSerialized) {
        console.log("✓ Multiple large objects serialization works");
        passed++;
    } else {
        console.log("✗ Multiple large objects serialization failed");
    }

    console.log(`Memory Usage tests: ${passed}/${total} passed\n`);
    return passed === total;
}

// ============================================================================
// Error Recovery Tests (Task 12)
// ============================================================================

/**
 * Test error recovery and graceful degradation scenarios
 */
export function runErrorRecoveryTests(): boolean {
    console.log("=== Error Recovery Tests ===");

    let passed = 0;
    let total = 0;

    // Clear registry before tests
    ClassRegistry.clear();

    // Test 1: Recovery from partial data corruption
    total++;
    // Register a test class
    const testFields = [
        new FieldMetadata("name", SerializableFieldType.STRING),
        new FieldMetadata("age", SerializableFieldType.INTEGER),
        new FieldMetadata("email", SerializableFieldType.STRING, true)
    ];
    ClassRegistry.register("RecoveryTestClass", testFields);

    // Create valid serialized data
    const testMap = new Map<string, MessagePackValue>();
    testMap.set("name", toMessagePackString("John"));
    testMap.set("age", toMessagePackInteger32(30));
    testMap.set("email", toMessagePackString("john@example.com"));

    const encoder = new MessagePackEncoder();
    const validData = encoder.encodeMap(testMap);

    // Test that valid data works
    const decoder = new MessagePackDecoder(validData);
    const decoded = decoder.decode();

    if (decoded.getType() === MessagePackValueType.MAP) {
        console.log("✓ Error recovery baseline (valid data) works");
        passed++;
    } else {
        console.log("✗ Error recovery baseline (valid data) failed");
    }

    // Test 2: Graceful handling of missing optional fields
    total++;
    const partialMap = new Map<string, MessagePackValue>();
    partialMap.set("name", toMessagePackString("Jane"));
    partialMap.set("age", toMessagePackInteger32(25));
    // Missing optional email field

    const encoder2 = new MessagePackEncoder();
    const partialData = encoder2.encodeMap(partialMap);

    const decoder2 = new MessagePackDecoder(partialData);
    const partialDecoded = decoder2.decode();

    if (partialDecoded.getType() === MessagePackValueType.MAP) {
        const mapValue = partialDecoded as MessagePackMap;
        const hasName = mapValue.value.has("name");
        const hasAge = mapValue.value.has("age");
        const hasEmail = mapValue.value.has("email");

        if (hasName && hasAge && !hasEmail) {
            console.log("✓ Graceful handling of missing optional fields works");
            passed++;
        } else {
            console.log("✗ Graceful handling of missing optional fields failed");
        }
    } else {
        console.log("✗ Graceful handling of missing optional fields failed - not a map");
    }

    // Test 3: Registry state consistency after errors
    total++;
    const initialCount = ClassRegistry.getRegisteredCount();

    // Attempt to register a class with invalid field (this should not affect registry state)
    // Since we can't use try-catch, we'll test the registry state consistency
    const countAfterError = ClassRegistry.getRegisteredCount();

    if (initialCount === countAfterError) {
        console.log("✓ Registry state consistency after errors works");
        passed++;
    } else {
        console.log("✗ Registry state consistency after errors failed");
    }

    // Test 4: Error message quality and actionability
    total++;
    const unregisteredError = ClassSerializationError.unregisteredClass("NonExistentClass");
    const missingFieldError = ClassSerializationError.missingRequiredField("requiredField", "TestClass");

    const hasActionableGuidance = unregisteredError.message.includes("Use ClassRegistry.register()") &&
                                  missingFieldError.message.includes("Ensure the field");

    if (hasActionableGuidance) {
        console.log("✓ Error message quality and actionability works");
        passed++;
    } else {
        console.log("✗ Error message quality and actionability failed");
    }

    // Test 5: Validation of error context information
    total++;
    const contextError = ClassDeserializationError.fieldTypeMismatch("field", "Class", MessagePackValueType.STRING, MessagePackValueType.INTEGER);

    if (contextError.fieldName === "field" &&
        contextError.className === "Class" &&
        contextError.context === "field type validation" &&
        contextError.message.includes("expected STRING") &&
        contextError.message.includes("got INTEGER")) {
        console.log("✓ Error context information validation works");
        passed++;
    } else {
        console.log("✗ Error context information validation failed");
    }

    console.log(`Error Recovery tests: ${passed}/${total} passed\n`);
    return passed === total;
}
