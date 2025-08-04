/**
 * Integration tests to verify all exports work correctly
 * This test file validates that all public APIs are properly exported and functional
 */

import {
    // Core components
    MessagePackEncoder,
    MessagePackDecoder,
    MessagePackValue,
    MessagePackValueType,
    MessagePackString,
    MessagePackInteger,
    MessagePackBoolean,
    MessagePackArray,
    MessagePackMap,
    MessagePackNull,
    MessagePackFloat,
    MessagePackBinary,
    MessagePackEncodeError,
    MessagePackDecodeError,
    
    // Class serialization system
    SerializableFieldType,
    FieldMetadata,
    ClassMetadata,
    ClassRegistry,
    Serializable,
    ClassFactory,
    ClassSerializationEncoder,
    ClassSerializationDecoder,
    ClassSerializationError,
    ClassDeserializationError,
    
    // Type conversion utilities
    toMessagePackBoolean,
    toMessagePackInteger32,
    toMessagePackString,
    toMessagePackNull,
    
    // Convenience utilities
    ClassRegistrationBuilder,
    BatchClassRegistration,
    SerializationUtils,
    
    // Buffer management
    GrowableBuffer,
    BufferReader,
    
    // Format constants
    Format,
    
    // Version information
    VERSION,
    MESSAGEPACK_SPEC_VERSION,
    BASIC_SERIALIZATION,
    CLASS_SERIALIZATION,
    NESTED_CLASSES,
    OPTIONAL_FIELDS,
    DETAILED_ERRORS,
    CROSS_COMPATIBILITY
} from "../index";

/**
 * Test class for export validation
 */
class TestUser implements Serializable {
    name: string;
    age: i32;
    isActive: boolean;

    constructor(name: string, age: i32, isActive: boolean) {
        this.name = name;
        this.age = age;
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
        } else if (fieldName === "isActive") {
            return toMessagePackBoolean(this.isActive);
        }
        return null;
    }
}

/**
 * Test factory for export validation
 */
class TestUserFactory implements ClassFactory {
    create(): Serializable {
        return new TestUser("", 0, false);
    }

    setFieldValue(instance: Serializable, fieldName: string, value: MessagePackValue): void {
        const user = instance as TestUser;
        if (fieldName === "name") {
            user.name = (value as MessagePackString).value;
        } else if (fieldName === "age") {
            user.age = (value as MessagePackInteger).value as i32;
        } else if (fieldName === "isActive") {
            user.isActive = (value as MessagePackBoolean).value;
        }
    }
}

/**
 * Test core MessagePack encoder/decoder exports
 */
function testCoreExports(): boolean {
    console.log("Testing core MessagePack exports...");
    
    // Test encoder
    const encoder = new MessagePackEncoder();
    const stringBytes = encoder.encodeString("test");
    const intBytes = encoder.encodeInteger(42);
    const boolBytes = encoder.encodeBoolean(true);
    
    // Test decoder
    const decoder = new MessagePackDecoder(stringBytes);
    const value = decoder.decode();
    
    if (value.getType() !== MessagePackValueType.STRING) {
        console.log("❌ Core export test failed: wrong value type");
        return false;
    }
    
    const stringValue = (value as MessagePackString).value;
    if (stringValue !== "test") {
        console.log("❌ Core export test failed: wrong string value");
        return false;
    }
    
    console.log("✓ Core MessagePack exports work correctly");
    return true;
}

/**
 * Test class serialization exports
 */
function testClassSerializationExports(): boolean {
    console.log("Testing class serialization exports...");
    
    // Test class registration using builder
    new ClassRegistrationBuilder("TestUser")
        .addStringField("name")
        .addIntegerField("age")
        .addBooleanField("isActive")
        .register();
    
    // Test serialization
    const user = new TestUser("Alice", 30, true);
    const serializedData = SerializationUtils.serialize(user);
    
    // Test deserialization
    const factory = new TestUserFactory();
    const deserializedUser = SerializationUtils.deserialize(serializedData, factory, "TestUser") as TestUser;
    
    if (deserializedUser.name !== "Alice" || 
        deserializedUser.age !== 30 || 
        deserializedUser.isActive !== true) {
        console.log("❌ Class serialization export test failed: data mismatch");
        return false;
    }
    
    console.log("✓ Class serialization exports work correctly");
    return true;
}

/**
 * Test batch registration exports
 */
function testBatchRegistrationExports(): boolean {
    console.log("Testing batch registration exports...");
    
    // Test batch registration - create separate builders
    const batch = new BatchClassRegistration();
    
    const userBuilder = new ClassRegistrationBuilder("BatchTestUser")
        .addStringField("username")
        .addIntegerField("userId");
    
    const productBuilder = new ClassRegistrationBuilder("BatchTestProduct")
        .addStringField("title")
        .addFloatField("price")
        .addStringField("description", true); // optional
    
    batch.addClass(userBuilder);
    batch.addClass(productBuilder);
    batch.registerAll();
    
    // Verify registration worked
    const userMetadata = ClassRegistry.getMetadata("BatchTestUser");
    const productMetadata = ClassRegistry.getMetadata("BatchTestProduct");
    
    if (!userMetadata || !productMetadata) {
        console.log("❌ Batch registration export test failed: classes not registered");
        return false;
    }
    
    if (userMetadata.fields.length !== 2 || productMetadata.fields.length !== 3) {
        console.log("❌ Batch registration export test failed: wrong field count");
        return false;
    }
    
    console.log("✓ Batch registration exports work correctly");
    return true;
}

/**
 * Test buffer management exports
 */
function testBufferManagementExports(): boolean {
    console.log("Testing buffer management exports...");
    
    // Test GrowableBuffer
    const growableBuffer = new GrowableBuffer();
    growableBuffer.writeUint8(42);
    growableBuffer.writeUint16BE(1234);
    const data = growableBuffer.toBytes();
    
    if (data.length !== 3) {
        console.log("❌ Buffer management export test failed: wrong buffer length");
        return false;
    }
    
    // Test BufferReader
    const reader = new BufferReader(data);
    const byte1 = reader.readUint8();
    const byte2 = reader.readUint16BE();
    
    if (byte1 !== 42 || byte2 !== 1234) {
        console.log("❌ Buffer management export test failed: wrong read values");
        return false;
    }
    
    console.log("✓ Buffer management exports work correctly");
    return true;
}

/**
 * Test version and feature exports
 */
function testVersionAndFeatureExports(): boolean {
    console.log("Testing version and feature exports...");
    
    // Test version constants
    if (typeof VERSION !== "string" || VERSION.length === 0) {
        console.log("❌ Version export test failed: invalid VERSION");
        return false;
    }
    
    if (typeof MESSAGEPACK_SPEC_VERSION !== "string" || MESSAGEPACK_SPEC_VERSION !== "5") {
        console.log("❌ Version export test failed: invalid MESSAGEPACK_SPEC_VERSION");
        return false;
    }
    
    // Test feature flags
    if (!BASIC_SERIALIZATION || !CLASS_SERIALIZATION || !NESTED_CLASSES) {
        console.log("❌ Feature export test failed: missing core features");
        return false;
    }
    
    if (!OPTIONAL_FIELDS || !DETAILED_ERRORS || !CROSS_COMPATIBILITY) {
        console.log("❌ Feature export test failed: missing additional features");
        return false;
    }
    
    console.log("✓ Version and feature exports work correctly");
    console.log(`  Library version: ${VERSION}`);
    console.log(`  MessagePack spec version: ${MESSAGEPACK_SPEC_VERSION}`);
    console.log("  Available features: BASIC_SERIALIZATION, CLASS_SERIALIZATION, NESTED_CLASSES, OPTIONAL_FIELDS, DETAILED_ERRORS, CROSS_COMPATIBILITY");
    return true;
}

/**
 * Test format constants export
 */
function testFormatConstantsExport(): boolean {
    console.log("Testing format constants export...");
    
    // Test some key format constants
    if (Format.NIL !== 0xc0) {
        console.log("❌ Format constants export test failed: wrong NIL value");
        return false;
    }
    
    if (Format.TRUE !== 0xc3) {
        console.log("❌ Format constants export test failed: wrong TRUE value");
        return false;
    }
    
    if (Format.FALSE !== 0xc2) {
        console.log("❌ Format constants export test failed: wrong FALSE value");
        return false;
    }
    
    console.log("✓ Format constants export works correctly");
    return true;
}

/**
 * Test error handling exports
 */
function testErrorHandlingExports(): boolean {
    console.log("Testing error handling exports...");
    
    // Test MessagePackEncodeError
    const encodeError = new MessagePackEncodeError("Test encode error");
    console.log("Encode error message: " + encodeError.message);
    if (!encodeError.message || encodeError.message.length === 0) {
        console.log("❌ Error handling export test failed: empty encode error message");
        return false;
    }
    
    // Test MessagePackDecodeError
    const decodeError = new MessagePackDecodeError("Test decode error", 10, 0x42, "test context");
    if (decodeError.position !== 10 || decodeError.formatByte !== 0x42) {
        console.log("❌ Error handling export test failed: wrong decode error properties");
        return false;
    }
    
    // Test ClassSerializationError
    const classError = new ClassSerializationError("Test class error", "TestClass", "testField");
    if (classError.className !== "TestClass" || classError.fieldName !== "testField") {
        console.log("❌ Error handling export test failed: wrong class error properties");
        return false;
    }
    
    console.log("✓ Error handling exports work correctly");
    return true;
}

/**
 * Run all export validation tests
 */
export function runAllExportTests(): boolean {
    console.log("=== Export Validation Tests ===\n");
    
    const tests = [
        testCoreExports,
        testClassSerializationExports,
        testBatchRegistrationExports,
        testBufferManagementExports,
        testVersionAndFeatureExports,
        testFormatConstantsExport,
        testErrorHandlingExports
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        if (test()) {
            passed++;
        }
        console.log(""); // Add spacing between tests
    }
    
    console.log("=== Export Test Summary ===");
    console.log(`Passed: ${passed}/${total}`);
    
    if (passed === total) {
        console.log("🎉 All export tests passed!");
        return true;
    } else {
        console.log(`❌ ${total - passed} export tests failed`);
        return false;
    }
}
