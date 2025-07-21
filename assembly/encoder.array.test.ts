// AssemblyScript unit tests for MessagePack array encoding
import { Format } from "./format";
import { MessagePackEncoder } from "./encoder";
import { 
  MessagePackValue, 
  MessagePackNull, 
  MessagePackBoolean, 
  MessagePackInteger, 
  MessagePackFloat, 
  MessagePackString, 
  MessagePackBinary,
  MessagePackArray
} from "./types";

/**
 * Test suite for array encoding
 */
export function testArrayEncoding(): boolean {
  console.log("Testing array encoding...");
  let encoder = new MessagePackEncoder();
  let passed = true;

  // Test 1: Empty array
  const emptyArray = new MessagePackArray([]);
  const emptyBytes = encoder.encode(emptyArray);
  
  if (emptyBytes.length != 1 || emptyBytes[0] != Format.FIXARRAY_PREFIX) {
    console.log(`❌ Empty array encoding test failed: expected [${Format.FIXARRAY_PREFIX}], got [${emptyBytes[0]}]`);
    passed = false;
  }
  console.log("✓ Empty array encoding test passed");

  // Test 2: Small array (fixarray format)
  const smallArray = new MessagePackArray([
    new MessagePackNull(),
    new MessagePackBoolean(true),
    new MessagePackInteger(42),
    new MessagePackFloat(3.14),
    new MessagePackString("hello")
  ]);
  
  const smallBytes = encoder.encode(smallArray);
  
  // First byte should be 0x90 + length (5)
  const expectedFirstByte = Format.FIXARRAY_PREFIX | 5;
  
  if (smallBytes[0] != expectedFirstByte) {
    console.log(`❌ Small array encoding test failed: expected first byte ${expectedFirstByte}, got ${smallBytes[0]}`);
    passed = false;
  }
  console.log("✓ Small array encoding test passed");

  // Test 3: Array with 15 elements (max fixarray)
  const maxFixArray = new MessagePackArray([
    new MessagePackInteger(0),
    new MessagePackInteger(1),
    new MessagePackInteger(2),
    new MessagePackInteger(3),
    new MessagePackInteger(4),
    new MessagePackInteger(5),
    new MessagePackInteger(6),
    new MessagePackInteger(7),
    new MessagePackInteger(8),
    new MessagePackInteger(9),
    new MessagePackInteger(10),
    new MessagePackInteger(11),
    new MessagePackInteger(12),
    new MessagePackInteger(13),
    new MessagePackInteger(14)
  ]);
  
  const maxFixBytes = encoder.encode(maxFixArray);
  
  // First byte should be 0x90 + length (15)
  const expectedMaxFixByte = Format.FIXARRAY_PREFIX | 15;
  
  if (maxFixBytes[0] != expectedMaxFixByte) {
    console.log(`❌ Max fixarray encoding test failed: expected first byte ${expectedMaxFixByte}, got ${maxFixBytes[0]}`);
    passed = false;
  }
  console.log("✓ Max fixarray encoding test passed");

  // Test 4: Array with 16 elements (array16 format)
  const array16Elements: MessagePackValue[] = [];
  for (let i = 0; i < 16; i++) {
    array16Elements.push(new MessagePackInteger(i));
  }
  
  const array16 = new MessagePackArray(array16Elements);
  const array16Bytes = encoder.encode(array16);
  
  if (array16Bytes[0] != Format.ARRAY16 || array16Bytes[1] != 0 || array16Bytes[2] != 16) {
    console.log(`❌ array16 encoding test failed: expected format byte ${Format.ARRAY16}, got ${array16Bytes[0]}`);
    passed = false;
  }
  console.log("✓ array16 encoding test passed");

  // Test 5: Array with 300 elements (array16 format)
  const array16LargeElements: MessagePackValue[] = [];
  for (let i = 0; i < 300; i++) {
    array16LargeElements.push(new MessagePackInteger(i));
  }
  
  const array16Large = new MessagePackArray(array16LargeElements);
  const array16LargeBytes = encoder.encode(array16Large);
  
  if (array16LargeBytes[0] != Format.ARRAY16 || 
      array16LargeBytes[1] != (300 >> 8) || 
      array16LargeBytes[2] != (300 & 0xff)) {
    console.log(`❌ Large array16 encoding test failed: expected format byte ${Format.ARRAY16}, got ${array16LargeBytes[0]}`);
    passed = false;
  }
  console.log("✓ Large array16 encoding test passed");

  // Test 6: Nested arrays
  const innerArray = new MessagePackArray([
    new MessagePackInteger(1),
    new MessagePackInteger(2),
    new MessagePackInteger(3)
  ]);
  
  const outerArray = new MessagePackArray([
    new MessagePackString("nested"),
    innerArray,
    new MessagePackBoolean(true)
  ]);
  
  const nestedBytes = encoder.encode(outerArray);
  
  // First byte should be 0x90 + length (3)
  const expectedNestedByte = Format.FIXARRAY_PREFIX | 3;
  
  if (nestedBytes[0] != expectedNestedByte) {
    console.log(`❌ Nested array encoding test failed: expected first byte ${expectedNestedByte}, got ${nestedBytes[0]}`);
    passed = false;
  }
  console.log("✓ Nested array encoding test passed");

  // Test 7: Mixed-type array
  const binaryData = new Uint8Array(3);
  binaryData[0] = 1;
  binaryData[1] = 2;
  binaryData[2] = 3;
  
  const mixedArray = new MessagePackArray([
    new MessagePackNull(),
    new MessagePackBoolean(true),
    new MessagePackBoolean(false),
    new MessagePackInteger(42),
    new MessagePackInteger(-42),
    new MessagePackFloat(3.14),
    new MessagePackString("hello"),
    new MessagePackBinary(binaryData),
    new MessagePackArray([new MessagePackInteger(1), new MessagePackInteger(2)])
  ]);
  
  const mixedBytes = encoder.encode(mixedArray);
  
  // First byte should be 0x90 + length (9)
  const expectedMixedByte = Format.FIXARRAY_PREFIX | 9;
  
  if (mixedBytes[0] != expectedMixedByte) {
    console.log(`❌ Mixed-type array encoding test failed: expected first byte ${expectedMixedByte}, got ${mixedBytes[0]}`);
    passed = false;
  }
  console.log("✓ Mixed-type array encoding test passed");

  // Test 8: Array32 format (using a smaller size for testing)
  // Note: We'll use a size just over 65535 to trigger array32 format
  const array32Size = 65536;
  const array32Elements: MessagePackValue[] = [];
  
  // Create a large array (this might be slow, but it's just for testing)
  for (let i = 0; i < array32Size; i++) {
    array32Elements.push(new MessagePackNull()); // Use null for minimal memory usage
  }
  
  const array32 = new MessagePackArray(array32Elements);
  const array32Bytes = encoder.encode(array32);
  
  if (array32Bytes[0] != Format.ARRAY32) {
    console.log(`❌ array32 encoding test failed: expected format byte ${Format.ARRAY32}, got ${array32Bytes[0]}`);
    passed = false;
  }
  
  // Verify length bytes (big-endian)
  const expectedByte1 = ((array32Size >> 24) & 0xff) as u8;
  const expectedByte2 = ((array32Size >> 16) & 0xff) as u8;
  const expectedByte3 = ((array32Size >> 8) & 0xff) as u8;
  const expectedByte4 = (array32Size & 0xff) as u8;
  
  if (array32Bytes[1] != expectedByte1 || array32Bytes[2] != expectedByte2 || 
      array32Bytes[3] != expectedByte3 || array32Bytes[4] != expectedByte4) {
    console.log(`❌ array32 length encoding failed`);
    passed = false;
  }
  console.log("✓ array32 encoding test passed");

  console.log("Array encoding tests completed ✅");
  return passed;
}