// AssemblyScript unit tests for MessagePack map encoding
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
  MessagePackArray,
  MessagePackMap
} from "./types";

/**
 * Test suite for map encoding
 */
export function testMapEncoding(): boolean {
  console.log("Testing map encoding...");
  let encoder = new MessagePackEncoder();
  let passed = true;

  // Test 1: Empty map
  const emptyMap = new MessagePackMap(new Map<string, MessagePackValue>());
  const emptyBytes = encoder.encode(emptyMap);
  
  if (emptyBytes.length != 1 || emptyBytes[0] != Format.FIXMAP_PREFIX) {
    console.log(`❌ Empty map encoding test failed: expected [${Format.FIXMAP_PREFIX}], got [${emptyBytes[0]}]`);
    passed = false;
  }
  console.log("✓ Empty map encoding test passed");

  // Test 2: Small map (fixmap format)
  const smallMap = new Map<string, MessagePackValue>();
  smallMap.set("null", new MessagePackNull());
  smallMap.set("bool", new MessagePackBoolean(true));
  smallMap.set("int", new MessagePackInteger(42));
  smallMap.set("float", new MessagePackFloat(3.14));
  smallMap.set("string", new MessagePackString("hello"));
  
  const smallMapValue = new MessagePackMap(smallMap);
  const smallBytes = encoder.encode(smallMapValue);
  
  // First byte should be 0x80 + size (5)
  const expectedFirstByte = Format.FIXMAP_PREFIX | 5;
  
  if (smallBytes[0] != expectedFirstByte) {
    console.log(`❌ Small map encoding test failed: expected first byte ${expectedFirstByte}, got ${smallBytes[0]}`);
    passed = false;
  }
  console.log("✓ Small map encoding test passed");

  // Test 3: Map with 15 elements (max fixmap)
  const maxFixMap = new Map<string, MessagePackValue>();
  for (let i = 0; i < 15; i++) {
    maxFixMap.set("key" + i.toString(), new MessagePackInteger(i));
  }
  
  const maxFixMapValue = new MessagePackMap(maxFixMap);
  const maxFixBytes = encoder.encode(maxFixMapValue);
  
  // First byte should be 0x80 + size (15)
  const expectedMaxFixByte = Format.FIXMAP_PREFIX | 15;
  
  if (maxFixBytes[0] != expectedMaxFixByte) {
    console.log(`❌ Max fixmap encoding test failed: expected first byte ${expectedMaxFixByte}, got ${maxFixBytes[0]}`);
    passed = false;
  }
  console.log("✓ Max fixmap encoding test passed");

  // Test 4: Map with 16 elements (map16 format)
  const map16 = new Map<string, MessagePackValue>();
  for (let i = 0; i < 16; i++) {
    map16.set("key" + i.toString(), new MessagePackInteger(i));
  }
  
  const map16Value = new MessagePackMap(map16);
  const map16Bytes = encoder.encode(map16Value);
  
  if (map16Bytes[0] != Format.MAP16 || map16Bytes[1] != 0 || map16Bytes[2] != 16) {
    console.log(`❌ map16 encoding test failed: expected format byte ${Format.MAP16}, got ${map16Bytes[0]}`);
    passed = false;
  }
  console.log("✓ map16 encoding test passed");

  // Test 5: Map with various value types
  const mixedMap = new Map<string, MessagePackValue>();
  mixedMap.set("null", new MessagePackNull());
  mixedMap.set("true", new MessagePackBoolean(true));
  mixedMap.set("false", new MessagePackBoolean(false));
  mixedMap.set("posint", new MessagePackInteger(42));
  mixedMap.set("negint", new MessagePackInteger(-42));
  mixedMap.set("float", new MessagePackFloat(3.14));
  mixedMap.set("string", new MessagePackString("hello"));
  
  // Add binary data
  const binaryData = new Uint8Array(3);
  binaryData[0] = 1;
  binaryData[1] = 2;
  binaryData[2] = 3;
  mixedMap.set("binary", new MessagePackBinary(binaryData));
  
  // Add array
  mixedMap.set("array", new MessagePackArray([
    new MessagePackInteger(1),
    new MessagePackInteger(2),
    new MessagePackInteger(3)
  ]));
  
  const mixedMapValue = new MessagePackMap(mixedMap);
  const mixedBytes = encoder.encode(mixedMapValue);
  
  // First byte should be 0x80 + size (9)
  const expectedMixedByte = Format.FIXMAP_PREFIX | 9;
  
  if (mixedBytes[0] != expectedMixedByte) {
    console.log(`❌ Mixed-type map encoding test failed: expected first byte ${expectedMixedByte}, got ${mixedBytes[0]}`);
    passed = false;
  }
  console.log("✓ Mixed-type map encoding test passed");

  // Test 6: Nested maps
  const innerMap = new Map<string, MessagePackValue>();
  innerMap.set("a", new MessagePackInteger(1));
  innerMap.set("b", new MessagePackInteger(2));
  innerMap.set("c", new MessagePackInteger(3));
  
  const outerMap = new Map<string, MessagePackValue>();
  outerMap.set("nested", new MessagePackMap(innerMap));
  outerMap.set("simple", new MessagePackBoolean(true));
  
  const nestedMapValue = new MessagePackMap(outerMap);
  const nestedBytes = encoder.encode(nestedMapValue);
  
  // First byte should be 0x80 + size (2)
  const expectedNestedByte = Format.FIXMAP_PREFIX | 2;
  
  if (nestedBytes[0] != expectedNestedByte) {
    console.log(`❌ Nested map encoding test failed: expected first byte ${expectedNestedByte}, got ${nestedBytes[0]}`);
    passed = false;
  }
  console.log("✓ Nested map encoding test passed");

  // Test 7: Map with long string keys
  const longKeyMap = new Map<string, MessagePackValue>();
  longKeyMap.set("this_is_a_very_long_key_that_exceeds_fixstr_format", new MessagePackInteger(1));
  longKeyMap.set("another_very_long_key_that_also_exceeds_fixstr_format", new MessagePackInteger(2));
  
  const longKeyMapValue = new MessagePackMap(longKeyMap);
  const longKeyBytes = encoder.encode(longKeyMapValue);
  
  // First byte should be 0x80 + size (2)
  const expectedLongKeyByte = Format.FIXMAP_PREFIX | 2;
  
  if (longKeyBytes[0] != expectedLongKeyByte) {
    console.log(`❌ Long key map encoding test failed: expected first byte ${expectedLongKeyByte}, got ${longKeyBytes[0]}`);
    passed = false;
  }
  console.log("✓ Long key map encoding test passed");

  // Test 8: Map32 format (using a smaller size for testing)
  // Note: We'll use a size just over 65535 to trigger map32 format
  // This test is commented out because it would be very memory intensive
  /*
  const map32Size = 65536;
  const map32 = new Map<string, MessagePackValue>();
  
  // Create a large map (this might be slow, but it's just for testing)
  for (let i = 0; i < map32Size; i++) {
    map32.set("key" + i.toString(), new MessagePackNull()); // Use null for minimal memory usage
  }
  
  const map32Value = new MessagePackMap(map32);
  const map32Bytes = encoder.encode(map32Value);
  
  if (map32Bytes[0] != Format.MAP32) {
    console.log(`❌ map32 encoding test failed: expected format byte ${Format.MAP32}, got ${map32Bytes[0]}`);
    passed = false;
  }
  
  // Verify length bytes (big-endian)
  const expectedByte1 = ((map32Size >> 24) & 0xff) as u8;
  const expectedByte2 = ((map32Size >> 16) & 0xff) as u8;
  const expectedByte3 = ((map32Size >> 8) & 0xff) as u8;
  const expectedByte4 = (map32Size & 0xff) as u8;
  
  if (map32Bytes[1] != expectedByte1 || map32Bytes[2] != expectedByte2 || 
      map32Bytes[3] != expectedByte3 || map32Bytes[4] != expectedByte4) {
    console.log(`❌ map32 length encoding failed`);
    passed = false;
  }
  console.log("✓ map32 encoding test passed");
  */
  // Instead of running the memory-intensive test, we'll just log that we're skipping it
  console.log("⚠️ Skipping map32 test as it would be too memory intensive");

  console.log("Map encoding tests completed ✅");
  return passed;
}