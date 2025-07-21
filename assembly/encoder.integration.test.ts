// Integration tests for MessagePack encoder with complex nested data structures
import { 
  MessagePackNull, 
  MessagePackBoolean, 
  MessagePackInteger, 
  MessagePackFloat, 
  MessagePackString, 
  MessagePackBinary, 
  MessagePackArray, 
  MessagePackMap,
  MessagePackValue
} from "./types";
import { MessagePackEncoder } from "./encoder";

/**
 * Test suite for complex nested data structures
 */
export function testComplexNestedStructures(): boolean {
  console.log("Testing complex nested data structures...");
  let passed = true;

  // Test 1: Nested arrays
  console.log("Testing nested arrays...");
  const nestedArray = new MessagePackArray([
    new MessagePackInteger(1),
    new MessagePackString("hello"),
    new MessagePackArray([
      new MessagePackBoolean(true),
      new MessagePackNull(),
      new MessagePackInteger(42)
    ])
  ]);

  const encoder = new MessagePackEncoder();
  const nestedArrayBytes = encoder.encode(nestedArray);

  // We don't check exact byte values, just ensure encoding completes without errors
  if (nestedArrayBytes.length <= 3) {
    console.log("❌ Nested array encoding test failed: output too short");
    passed = false;
  } else {
    console.log("✓ Nested array encoding test passed");
  }

  // Test 2: Nested maps
  console.log("Testing nested maps...");
  const innerMap = new Map<string, MessagePackValue>();
  innerMap.set("a", new MessagePackInteger(1));
  innerMap.set("b", new MessagePackString("inner value"));

  const outerMap = new Map<string, MessagePackValue>();
  outerMap.set("x", new MessagePackInteger(100));
  outerMap.set("y", new MessagePackMap(innerMap));
  outerMap.set("z", new MessagePackBoolean(false));

  const nestedMap = new MessagePackMap(outerMap);
  const nestedMapBytes = encoder.encode(nestedMap);

  if (nestedMapBytes.length <= 5) {
    console.log("❌ Nested map encoding test failed: output too short");
    passed = false;
  } else {
    console.log("✓ Nested map encoding test passed");
  }

  // Test 3: Complex mixed structure
  console.log("Testing complex mixed structure...");
  
  // Create a complex structure with arrays, maps, and various data types
  const mixedInnerMap = new Map<string, MessagePackValue>();
  mixedInnerMap.set("name", new MessagePackString("MessagePack"));
  mixedInnerMap.set("compact", new MessagePackBoolean(true));
  mixedInnerMap.set("schema", new MessagePackNull());

  const mixedArray = new MessagePackArray([
    new MessagePackInteger(1),
    new MessagePackInteger(2),
    new MessagePackInteger(3)
  ]);

  const binaryData = new Uint8Array(4);
  binaryData[0] = 0xDE;
  binaryData[1] = 0xAD;
  binaryData[2] = 0xBE;
  binaryData[3] = 0xEF;

  const mixedOuterMap = new Map<string, MessagePackValue>();
  mixedOuterMap.set("data", new MessagePackMap(mixedInnerMap));
  mixedOuterMap.set("numbers", mixedArray);
  mixedOuterMap.set("binary", new MessagePackBinary(binaryData));
  mixedOuterMap.set("pi", new MessagePackFloat(3.14159));

  const complexStructure = new MessagePackMap(mixedOuterMap);
  const complexBytes = encoder.encode(complexStructure);

  if (complexBytes.length <= 10) {
    console.log("❌ Complex mixed structure encoding test failed: output too short");
    passed = false;
  } else {
    console.log("✓ Complex mixed structure encoding test passed");
  }

  // Test 4: Deep nesting (arrays within arrays within arrays)
  console.log("Testing deeply nested structure...");
  
  const level3 = new MessagePackArray([
    new MessagePackInteger(1),
    new MessagePackInteger(2)
  ]);
  
  const level2 = new MessagePackArray([
    new MessagePackString("level2"),
    level3
  ]);
  
  const level1 = new MessagePackArray([
    new MessagePackBoolean(true),
    level2
  ]);
  
  const deeplyNested = new MessagePackArray([
    new MessagePackString("root"),
    level1
  ]);
  
  const deeplyNestedBytes = encoder.encode(deeplyNested);
  
  if (deeplyNestedBytes.length <= 5) {
    console.log("❌ Deeply nested structure encoding test failed: output too short");
    passed = false;
  } else {
    console.log("✓ Deeply nested structure encoding test passed");
  }

  // Test 5: Mixed array with all supported types
  console.log("Testing mixed array with all types...");
  
  const allTypesArray = new MessagePackArray([
    new MessagePackNull(),                         // null
    new MessagePackBoolean(true),                  // boolean
    new MessagePackInteger(42),                    // integer
    new MessagePackFloat(3.14),                    // float
    new MessagePackString("hello"),                // string
    new MessagePackBinary(binaryData),             // binary
    new MessagePackArray([                         // array
      new MessagePackInteger(1),
      new MessagePackInteger(2)
    ]),
    new MessagePackMap(mixedInnerMap)              // map
  ]);
  
  const allTypesBytes = encoder.encode(allTypesArray);
  
  if (allTypesBytes.length <= 8) {
    console.log("❌ Mixed array with all types encoding test failed: output too short");
    passed = false;
  } else {
    console.log("✓ Mixed array with all types encoding test passed");
  }

  console.log("Complex nested data structure tests completed ✅");
  return passed;
}

/**
 * Run all integration tests
 */
export function runIntegrationTests(): boolean {
  console.log("=== MessagePack Encoder Integration Tests ===\n");
  
  let allPassed = true;
  
  allPassed = testComplexNestedStructures() && allPassed;
  console.log("");
  
  if (allPassed) {
    console.log("🎉 All integration tests passed!");
  } else {
    console.log("❌ Some integration tests failed!");
  }
  
  return allPassed;
}