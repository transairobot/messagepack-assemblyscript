/**
 * Simple tests for convenience methods and utilities
 * These tests avoid try-catch blocks since AssemblyScript doesn't support them
 */

import {
    ClassRegistrationBuilder,
    BatchClassRegistration,
    SerializationUtils,
    ExamplePerson,
    ExamplePersonFactory,
    ExampleProject,
    ExampleProjectFactory,
    registerExampleClasses,
    ClassRegistry,
    SerializableFieldType
} from "../class-serialization";

/**
 * Test ClassRegistrationBuilder basic functionality
 */
export function testClassRegistrationBuilder(): boolean {
    console.log("Testing ClassRegistrationBuilder...");
    
    // Clear registry
    ClassRegistry.clear();
    
    // Test basic builder
    const builder = new ClassRegistrationBuilder("TestClass");
    builder.addStringField("name")
           .addIntegerField("age")
           .addBooleanField("active", true)
           .register();

    const isRegistered = ClassRegistry.isRegistered("TestClass");
    const metadata = ClassRegistry.getMetadata("TestClass");
    const hasCorrectFields = metadata !== null && metadata.fields.length === 3;
    
    if (isRegistered && hasCorrectFields) {
        console.log("✓ ClassRegistrationBuilder works");
        return true;
    } else {
        console.log("✗ ClassRegistrationBuilder failed");
        return false;
    }
}

/**
 * Test BatchClassRegistration functionality
 */
export function testBatchClassRegistration(): boolean {
    console.log("Testing BatchClassRegistration...");
    
    // Clear registry
    ClassRegistry.clear();
    
    // Test batch registration
    const batch = new BatchClassRegistration();
    
    batch.createClass("BatchClass1").addStringField("name");
    batch.createClass("BatchClass2").addIntegerField("value");
    
    batch.registerAll();
    
    const class1Registered = ClassRegistry.isRegistered("BatchClass1");
    const class2Registered = ClassRegistry.isRegistered("BatchClass2");
    
    if (class1Registered && class2Registered) {
        console.log("✓ BatchClassRegistration works");
        return true;
    } else {
        console.log("✗ BatchClassRegistration failed");
        return false;
    }
}

/**
 * Test SerializationUtils functionality
 */
export function testSerializationUtils(): boolean {
    console.log("Testing SerializationUtils...");
    
    // Clear registry
    ClassRegistry.clear();
    
    // Register a test class
    new ClassRegistrationBuilder("UtilsTestClass")
        .addStringField("field1")
        .addIntegerField("field2")
        .register();
    
    // Test statistics methods
    const totalClasses = SerializationUtils.getTotalClasses();
    const totalFields = SerializationUtils.getTotalFields();
    const classNames = SerializationUtils.getRegisteredClassNames();
    
    // Test field creation utilities
    const field1 = SerializationUtils.createField("name", SerializableFieldType.STRING, false);
    const field2 = SerializationUtils.createNestedField("nested", "NestedClass", true);
    
    const statsCorrect = totalClasses === 1 && totalFields === 2 && classNames.length === 1;
    const fieldsCorrect = field1.name === "name" && field2.nestedClassType === "NestedClass";
    
    if (statsCorrect && fieldsCorrect) {
        console.log("✓ SerializationUtils works");
        return true;
    } else {
        console.log("✗ SerializationUtils failed");
        return false;
    }
}

/**
 * Test ExamplePerson class
 */
export function testExamplePerson(): boolean {
    console.log("Testing ExamplePerson...");
    
    // Clear registry
    ClassRegistry.clear();
    
    // Register and test ExamplePerson
    ExamplePerson.register();
    
    const person = new ExamplePerson("John Doe", 30, true, "john@example.com");
    const factory = new ExamplePersonFactory();
    
    // Test basic functionality
    const className = person.getClassName();
    const nameField = person.getFieldValue("name");
    const ageField = person.getFieldValue("age");
    
    // Test serialization roundtrip
    const serialized = SerializationUtils.serialize(person);
    const deserialized = SerializationUtils.deserialize(serialized, factory, "ExamplePerson") as ExamplePerson;
    
    const basicTest = className === "ExamplePerson" && nameField !== null && ageField !== null;
    const roundtripTest = deserialized.name === "John Doe" && deserialized.age === 30;
    
    if (basicTest && roundtripTest) {
        console.log("✓ ExamplePerson works");
        return true;
    } else {
        console.log("✗ ExamplePerson failed");
        return false;
    }
}

/**
 * Test batch registration of example classes
 */
export function testRegisterExampleClasses(): boolean {
    console.log("Testing registerExampleClasses...");
    
    // Clear registry
    ClassRegistry.clear();
    
    // Register all example classes
    registerExampleClasses();
    
    const personRegistered = ClassRegistry.isRegistered("ExamplePerson");
    const projectRegistered = ClassRegistry.isRegistered("ExampleProject");
    const companyRegistered = ClassRegistry.isRegistered("ExampleCompany");
    
    if (personRegistered && projectRegistered && companyRegistered) {
        console.log("✓ registerExampleClasses works");
        return true;
    } else {
        console.log("✗ registerExampleClasses failed");
        return false;
    }
}

/**
 * Run all convenience method tests
 */
export function runConvenienceMethodTests(): boolean {
    console.log("=== Convenience Methods Tests ===\n");
    
    const results = [
        testClassRegistrationBuilder(),
        testBatchClassRegistration(),
        testSerializationUtils(),
        testExamplePerson(),
        testRegisterExampleClasses()
    ];
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    console.log(`\n=== Convenience Methods Test Summary ===`);
    console.log(`Passed: ${passed}/${total}`);
    
    if (passed === total) {
        console.log("🎉 All convenience method tests passed!");
    } else {
        console.log("❌ Some convenience method tests failed");
    }
    
    return passed === total;
}