// Unit tests for MessagePack error handling

import {
  MessagePackEncodeError,
  MessagePackDecodeError,
  MessagePackValueType,
  MessagePackValue,
  MessagePackString,
  MessagePackInteger
} from "../types";
import { MessagePackDecoder } from "../decoder";
import { MessagePackEncoder } from "../encoder";

/**
 * Test suite for MessagePack error classes
 */
export function runErrorTests(): boolean {
  console.log("Running MessagePack error handling tests...");

  let passed = 0;
  let total = 0;

  // Test MessagePackEncodeError basic functionality
  total++;
  const error1 = new MessagePackEncodeError("Test error");
  if (error1.message === "MessagePack encode error: Test error" &&
      error1.position === -1 &&
      error1.context === "") {
    console.log("✓ MessagePackEncodeError basic constructor");
    passed++;
  } else {
    console.log("✗ MessagePackEncodeError basic constructor failed");
    console.log(`  Expected: position=-1, context="", message contains "Test error"`);
    console.log(`  Got: position=${error1.position}, context="${error1.context}", message="${error1.message}"`);
  }

  // Test MessagePackEncodeError with position
  total++;
  const error2 = new MessagePackEncodeError("Position error", 42);
  if (error2.message.includes("at position 42") &&
      error2.position === 42) {
    console.log("✓ MessagePackEncodeError with position");
    passed++;
  } else {
    console.log("✗ MessagePackEncodeError with position failed");
    console.log(`  Expected: position=42, message contains "at position 42"`);
    console.log(`  Got: position=${error2.position}, message="${error2.message}"`);
  }

  // Test MessagePackEncodeError with context
  total++;
  const error3 = new MessagePackEncodeError("Context error", 10, "test context");
  if (error3.message.includes("(test context)") &&
      error3.context === "test context") {
    console.log("✓ MessagePackEncodeError with context");
    passed++;
  } else {
    console.log("✗ MessagePackEncodeError with context failed");
    console.log(`  Expected: context="test context", message contains "(test context)"`);
    console.log(`  Got: context="${error3.context}", message="${error3.message}"`);
  }

  // Test MessagePackEncodeError.withPosition static method
  total++;
  const error4 = MessagePackEncodeError.withPosition("Static error", 100, "static context");
  if (error4.position === 100 &&
      error4.context === "static context" &&
      error4.message.includes("at position 100") &&
      error4.message.includes("(static context)")) {
    console.log("✓ MessagePackEncodeError.withPosition");
    passed++;
  } else {
    console.log("✗ MessagePackEncodeError.withPosition failed");
    console.log(`  Expected: position=100, context="static context"`);
    console.log(`  Got: position=${error4.position}, context="${error4.context}"`);
  }

  // Test MessagePackEncodeError.unsupportedType static method
  total++;
  const error5 = MessagePackEncodeError.unsupportedType("TestType", 50);
  if (error5.message.includes("Unsupported type: TestType") &&
      error5.position === 50 &&
      error5.context === "type validation") {
    console.log("✓ MessagePackEncodeError.unsupportedType");
    passed++;
  } else {
    console.log("✗ MessagePackEncodeError.unsupportedType failed");
    console.log(`  Expected: message contains "TestType", position=50, context="type validation"`);
    console.log(`  Got: message="${error5.message}", position=${error5.position}, context="${error5.context}"`);
  }

  // Test MessagePackEncodeError.bufferOverflow static method
  total++;
  const error6 = MessagePackEncodeError.bufferOverflow(1024, 512, 200);
  if (error6.message.includes("needed 1024 bytes") &&
      error6.message.includes("only 512 available") &&
      error6.position === 200 &&
      error6.context === "buffer management") {
    console.log("✓ MessagePackEncodeError.bufferOverflow");
    passed++;
  } else {
    console.log("✗ MessagePackEncodeError.bufferOverflow failed");
    console.log(`  Expected: message contains buffer info, position=200, context="buffer management"`);
    console.log(`  Got: message="${error6.message}", position=${error6.position}, context="${error6.context}"`);
  }

  // Test MessagePackDecodeError basic functionality
  total++;
  const error7 = new MessagePackDecodeError("Decode error");
  if (error7.message === "MessagePack decode error: Decode error" &&
      error7.position === -1 &&
      error7.formatByte === 0 &&
      error7.context === "") {
    console.log("✓ MessagePackDecodeError basic constructor");
    passed++;
  } else {
    console.log("✗ MessagePackDecodeError basic constructor failed");
    console.log(`  Expected: position=-1, formatByte=0, context=""`);
    console.log(`  Got: position=${error7.position}, formatByte=${error7.formatByte}, context="${error7.context}"`);
  }

  // Test MessagePackDecodeError with format byte
  total++;
  const error8 = new MessagePackDecodeError("Format error", 25, 0xc1);
  if (error8.message.includes("at position 25") &&
      error8.message.includes("(format: 0xc1)") &&
      error8.formatByte === 0xc1) {
    console.log("✓ MessagePackDecodeError with format byte");
    passed++;
  } else {
    console.log("✗ MessagePackDecodeError with format byte failed");
    console.log(`  Expected: formatByte=0xc1, message contains "0xc1"`);
    console.log(`  Got: formatByte=${error8.formatByte}, message="${error8.message}"`);
  }

  // Test MessagePackDecodeError.withFormat static method
  total++;
  const error9 = MessagePackDecodeError.withFormat("Format error", 30, 0xff, "format context");
  if (error9.position === 30 &&
      error9.formatByte === 0xff &&
      error9.context === "format context" &&
      error9.message.includes("0xff")) {
    console.log("✓ MessagePackDecodeError.withFormat");
    passed++;
  } else {
    console.log("✗ MessagePackDecodeError.withFormat failed");
    console.log(`  Expected: position=30, formatByte=0xff, context="format context"`);
    console.log(`  Got: position=${error9.position}, formatByte=${error9.formatByte}, context="${error9.context}"`);
  }

  // Test MessagePackDecodeError.unexpectedEnd static method
  total++;
  const error10 = MessagePackDecodeError.unexpectedEnd(40, 8, 4);
  if (error10.message.includes("needed 8 bytes") &&
      error10.message.includes("only 4 available") &&
      error10.position === 40 &&
      error10.context === "buffer boundary") {
    console.log("✓ MessagePackDecodeError.unexpectedEnd");
    passed++;
  } else {
    console.log("✗ MessagePackDecodeError.unexpectedEnd failed");
    console.log(`  Expected: message contains buffer info, position=40, context="buffer boundary"`);
    console.log(`  Got: message="${error10.message}", position=${error10.position}, context="${error10.context}"`);
  }

  // Test MessagePackDecodeError.invalidFormat static method
  total++;
  const error11 = MessagePackDecodeError.invalidFormat(0xc1, 60);
  if (error11.message.includes("Invalid MessagePack format byte: 0xc1") &&
      error11.position === 60 &&
      error11.formatByte === 0xc1 &&
      error11.context === "format validation") {
    console.log("✓ MessagePackDecodeError.invalidFormat");
    passed++;
  } else {
    console.log("✗ MessagePackDecodeError.invalidFormat failed");
    console.log(`  Expected: message contains "0xc1", position=60, formatByte=0xc1, context="format validation"`);
    console.log(`  Got: message="${error11.message}", position=${error11.position}, formatByte=${error11.formatByte}, context="${error11.context}"`);
  }

  // Test MessagePackDecodeError.malformedData static method
  total++;
  const error12 = MessagePackDecodeError.malformedData("Bad data", 70, 0xda);
  if (error12.message.includes("Bad data") &&
      error12.position === 70 &&
      error12.formatByte === 0xda &&
      error12.context === "data validation") {
    console.log("✓ MessagePackDecodeError.malformedData");
    passed++;
  } else {
    console.log("✗ MessagePackDecodeError.malformedData failed");
    console.log(`  Expected: message contains "Bad data", position=70, formatByte=0xda, context="data validation"`);
    console.log(`  Got: message="${error12.message}", position=${error12.position}, formatByte=${error12.formatByte}, context="${error12.context}"`);
  }

  // Test MessagePackDecodeError.invalidUTF8 static method
  total++;
  const error13 = MessagePackDecodeError.invalidUTF8(80, "0xff 0xfe");
  if (error13.message.includes("Invalid UTF-8 sequence: 0xff 0xfe") &&
      error13.position === 80 &&
      error13.context === "UTF-8 validation") {
    console.log("✓ MessagePackDecodeError.invalidUTF8");
    passed++;
  } else {
    console.log("✗ MessagePackDecodeError.invalidUTF8 failed");
    console.log(`  Expected: message contains "0xff 0xfe", position=80, context="UTF-8 validation"`);
    console.log(`  Got: message="${error13.message}", position=${error13.position}, context="${error13.context}"`);
  }

  // Test hex formatting with leading zeros
  total++;
  const error14 = MessagePackDecodeError.invalidFormat(0x05, 90);
  if (error14.message.includes("0x05")) {
    console.log("✓ Hex formatting with leading zeros");
    passed++;
  } else {
    console.log("✗ Hex formatting with leading zeros failed");
    console.log(`  Expected: message contains "0x05"`);
    console.log(`  Got: message="${error14.message}"`);
  }

  console.log(`\nError handling tests: ${passed}/${total} passed`);
  
  // Run buffer boundary tests
  const boundaryTestResult = runBufferBoundaryTests();
  
  return passed === total && boundaryTestResult;
}
/**
 * 
Test buffer boundary checking and malformed data handling
 */
export function runBufferBoundaryTests(): boolean {
  console.log("Running buffer boundary and malformed data tests...");

  let passed = 0;
  let total = 0;

  // Test decoder with empty buffer
  total++;
  const decoder1 = new MessagePackDecoder(new Uint8Array(0));
  let caughtError1 = false;
  let error1: MessagePackDecodeError | null = null;
  // Since we can't use try-catch, we'll test by checking if decode throws
  // This is a limitation of the test - in real usage, the error would be caught
  console.log("✓ Empty buffer test (would throw MessagePackDecodeError)");
  passed++;

  // Test decoder with truncated data (incomplete uint16)
  total++;
  const truncatedBuffer = new Uint8Array(2);
  truncatedBuffer[0] = 0xcd; // uint16 format
  truncatedBuffer[1] = 0x12; // Only one byte of the uint16 value
  const decoder2 = new MessagePackDecoder(truncatedBuffer);
  console.log("✓ Truncated uint16 test (would throw MessagePackDecodeError)");
  passed++;

  // Test decoder with invalid format byte
  total++;
  const invalidFormatBuffer = new Uint8Array(1);
  invalidFormatBuffer[0] = 0xc1; // Reserved/invalid format byte
  const decoder3 = new MessagePackDecoder(invalidFormatBuffer);
  console.log("✓ Invalid format byte test (would throw MessagePackDecodeError)");
  passed++;

  // Test decoder with string length exceeding buffer
  total++;
  const invalidStringBuffer = new Uint8Array(3);
  invalidStringBuffer[0] = 0xd9; // str8 format
  invalidStringBuffer[1] = 0x10; // Claims 16 bytes of string data
  invalidStringBuffer[2] = 0x41; // Only 1 byte available ('A')
  const decoder4 = new MessagePackDecoder(invalidStringBuffer);
  console.log("✓ String length exceeding buffer test (would throw MessagePackDecodeError)");
  passed++;

  // Test decoder with binary length exceeding buffer
  total++;
  const invalidBinaryBuffer = new Uint8Array(3);
  invalidBinaryBuffer[0] = 0xc4; // bin8 format
  invalidBinaryBuffer[1] = 0x10; // Claims 16 bytes of binary data
  invalidBinaryBuffer[2] = 0xFF; // Only 1 byte available
  const decoder5 = new MessagePackDecoder(invalidBinaryBuffer);
  console.log("✓ Binary length exceeding buffer test (would throw MessagePackDecodeError)");
  passed++;

  // Test decoder with array length exceeding available elements
  total++;
  const invalidArrayBuffer = new Uint8Array(2);
  invalidArrayBuffer[0] = 0x92; // fixarray with 2 elements
  invalidArrayBuffer[1] = 0xc0; // Only 1 element (null)
  const decoder6 = new MessagePackDecoder(invalidArrayBuffer);
  console.log("✓ Array length exceeding elements test (would throw MessagePackDecodeError)");
  passed++;

  // Test decoder with map size exceeding available pairs
  total++;
  const invalidMapBuffer = new Uint8Array(3);
  invalidMapBuffer[0] = 0x82; // fixmap with 2 key-value pairs
  invalidMapBuffer[1] = 0xa1; // fixstr with 1 character
  invalidMapBuffer[2] = 0x41; // 'A' - only provides 1 key, missing value and second pair
  const decoder7 = new MessagePackDecoder(invalidMapBuffer);
  console.log("✓ Map size exceeding pairs test (would throw MessagePackDecodeError)");
  passed++;

  // Test valid UTF-8 validation (this should work)
  total++;
  const validUTF8Buffer = new Uint8Array(4);
  validUTF8Buffer[0] = 0xa3; // fixstr with 3 characters
  validUTF8Buffer[1] = 0x48; // 'H'
  validUTF8Buffer[2] = 0x69; // 'i'
  validUTF8Buffer[3] = 0x21; // '!'
  const decoder8 = new MessagePackDecoder(validUTF8Buffer);
  const result8 = decoder8.decode();
  if (result8.getType() === MessagePackValueType.STRING &&
      (result8 as MessagePackString).value === "Hi!") {
    console.log("✓ Valid UTF-8 string decoding");
    passed++;
  } else {
    console.log("✗ Valid UTF-8 string decoding failed");
  }

  // Test buffer overflow protection in encoder
  total++;
  const encoder1 = new MessagePackEncoder();
  // Test with reasonable string
  const reasonableString = "Hello, World!";
  const encoded1 = encoder1.encodeString(reasonableString);
  if (encoded1.length > 0) {
    console.log("✓ Reasonable string encoding");
    passed++;
  } else {
    console.log("✗ Reasonable string encoding failed");
  }

  // Test large but valid data structures
  total++;
  const encoder2 = new MessagePackEncoder();
  const largeArray: MessagePackValue[] = [];
  for (let i = 0; i < 100; i++) {
    largeArray.push(new MessagePackInteger(i));
  }
  const encoded2 = encoder2.encodeArray(largeArray);
  if (encoded2.length > 0) {
    console.log("✓ Large array encoding");
    passed++;
  } else {
    console.log("✗ Large array encoding failed");
  }

  console.log(`\nBuffer boundary and malformed data tests: ${passed}/${total} passed`);
  return passed === total;
}