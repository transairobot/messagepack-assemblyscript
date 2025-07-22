// MessagePack encoder implementation
import {
  MessagePackValue,
  MessagePackEncodeError,
  MessagePackValueType,
  MessagePackNull,
  MessagePackBoolean,
  MessagePackInteger,
  MessagePackFloat,
  MessagePackString,
  MessagePackBinary,
  MessagePackArray,
  MessagePackMap
} from "./types";
import { Format } from "./format";
import { GrowableBuffer } from "./buffer";

/**
 * MessagePack encoder class for serializing AssemblyScript values to binary format
 * 
 * This class provides methods to encode various AssemblyScript types to MessagePack binary format.
 * It handles all MessagePack types including null, boolean, integers, floats, strings, binary data,
 * arrays, and maps, with automatic format selection based on value ranges.
 * 
 * Usage:
 * ```
 * const encoder = new MessagePackEncoder();
 * const bytes = encoder.encode(new MessagePackString("hello"));
 * ```
 */
export class MessagePackEncoder {
  private buffer!: GrowableBuffer;

  /**
   * Creates a new MessagePack encoder with the specified initial buffer capacity
   * 
   * @param initialCapacity Initial buffer size in bytes (default: 1024)
   */
  constructor(initialCapacity: i32 = 1024) {
    this.buffer = new GrowableBuffer(initialCapacity);
  }

  /**
   * Main encoding method - converts a MessagePackValue to binary format
   * 
   * This method dispatches to the appropriate type-specific encoding method
   * based on the value's type. It automatically handles all supported MessagePack
   * types and selects the optimal format based on value ranges.
   * 
   * @param value The MessagePackValue to encode
   * @returns A Uint8Array containing the MessagePack encoded bytes
   * @throws MessagePackEncodeError if encoding fails or type is unsupported
   */
  encode(value: MessagePackValue): Uint8Array {
    // Reset buffer for reuse
    this.buffer.reset();

    // Encode based on value type - optimized dispatch using jump table approach
    this.encodeValueOptimized(value);

    // Return the encoded bytes
    return this.buffer.toBytes();
  }

  /**
   * Optimized encoding dispatch that minimizes branching
   */
  private encodeValueOptimized(value: MessagePackValue): void {
    const type: MessagePackValueType = value.getType();

    // Fast path for most common types
    if (type === MessagePackValueType.INTEGER) {
      this.writeInteger((value as MessagePackInteger).value);
      return;
    }
    if (type === MessagePackValueType.STRING) {
      this.writeString((value as MessagePackString).value);
      return;
    }
    if (type === MessagePackValueType.BOOLEAN) {
      this.writeBoolean((value as MessagePackBoolean).value);
      return;
    }
    if (type === MessagePackValueType.NULL) {
      this.writeNull();
      return;
    }

    // Less common types
    switch (type) {
      case MessagePackValueType.FLOAT:
        this.writeFloat((value as MessagePackFloat).value);
        break;
      case MessagePackValueType.BINARY:
        this.writeBinary((value as MessagePackBinary).value);
        break;
      case MessagePackValueType.ARRAY:
        this.writeArray((value as MessagePackArray).value);
        break;
      case MessagePackValueType.MAP:
        this.writeMap((value as MessagePackMap).value);
        break;
    }
  }

  /**
   * Convenience method to encode a null value
   * 
   * @returns A Uint8Array containing the MessagePack encoded null
   */
  encodeNull(): Uint8Array {
    this.buffer.reset();
    this.writeNull();
    return this.buffer.toBytes();
  }

  /**
   * Convenience method to encode a boolean value
   * 
   * @param value The boolean value to encode
   * @returns A Uint8Array containing the MessagePack encoded boolean
   */
  encodeBoolean(value: boolean): Uint8Array {
    this.buffer.reset();
    this.writeBoolean(value);
    return this.buffer.toBytes();
  }

  /**
   * Convenience method to encode an integer value
   * 
   * @param value The integer value to encode
   * @returns A Uint8Array containing the MessagePack encoded integer
   */
  encodeInteger(value: i64): Uint8Array {
    this.buffer.reset();
    this.writeInteger(value);
    return this.buffer.toBytes();
  }

  /**
   * Convenience method to encode a floating point value
   * 
   * @param value The floating point value to encode
   * @returns A Uint8Array containing the MessagePack encoded float
   */
  encodeFloat(value: f64): Uint8Array {
    this.buffer.reset();
    this.writeFloat(value);
    return this.buffer.toBytes();
  }

  /**
   * Convenience method to encode a string value
   * 
   * @param value The string value to encode
   * @returns A Uint8Array containing the MessagePack encoded string
   */
  encodeString(value: string): Uint8Array {
    this.buffer.reset();
    this.writeString(value);
    return this.buffer.toBytes();
  }

  /**
   * Convenience method to encode binary data
   * 
   * @param value The binary data to encode
   * @returns A Uint8Array containing the MessagePack encoded binary data
   */
  encodeBinary(value: Uint8Array): Uint8Array {
    this.buffer.reset();
    this.writeBinary(value);
    return this.buffer.toBytes();
  }

  /**
   * Convenience method to encode an array of values
   * 
   * @param values Array of MessagePackValues to encode
   * @returns A Uint8Array containing the MessagePack encoded array
   */
  encodeArray(values: MessagePackValue[]): Uint8Array {
    this.buffer.reset();
    this.writeArray(values);
    return this.buffer.toBytes();
  }

  /**
   * Convenience method to encode a map of key-value pairs
   * 
   * @param map Map of string keys to MessagePackValues to encode
   * @returns A Uint8Array containing the MessagePack encoded map
   */
  encodeMap(map: Map<string, MessagePackValue>): Uint8Array {
    this.buffer.reset();
    this.writeMap(map);
    return this.buffer.toBytes();
  }

  /**
   * Writes a null value (0xc0) to the buffer
   */
  private writeNull(): void {
    this.buffer.writeUint8(Format.NIL);
  }

  /**
   * Writes a boolean value (0xc2 for false, 0xc3 for true) to the buffer
   * 
   * @param value The boolean value to write
   */
  private writeBoolean(value: boolean): void {
    this.buffer.writeUint8(value ? Format.TRUE : Format.FALSE);
  }

  /**
   * Writes an integer value with optimal format selection to the buffer
   * Optimized hot path for common integer ranges
   * 
   * @param value The integer value to write
   */
  private writeInteger(value: i64): void {
    // Hot path: positive fixint (0x00 - 0x7f) - most common case
    if (value >= 0 && value <= 0x7f) {
      this.buffer.writeUint8(value as u8);
      return;
    }

    // Hot path: negative fixint (0xe0 - 0xff) - second most common
    if (value >= -32 && value < 0) {
      this.buffer.writeUint8((value & 0xff) as u8);
      return;
    }

    // Cold path: larger integers - use optimized range checking
    this.writeIntegerColdPath(value);
  }

  /**
   * Cold path for integer encoding - handles larger values
   */
  private writeIntegerColdPath(value: i64): void {
    if (value >= 0) {
      // Unsigned integers - use bit operations for faster range checking
      if (value <= 0xff) {
        this.buffer.writeUint8(Format.UINT8);
        this.buffer.writeUint8(value as u8);
      } else if (value <= 0xffff) {
        this.buffer.writeUint8(Format.UINT16);
        this.buffer.writeUint16BE(value as u16);
      } else if (value <= 0xffffffff) {
        this.buffer.writeUint8(Format.UINT32);
        this.buffer.writeUint32BE(value as u32);
      } else {
        this.buffer.writeUint8(Format.UINT64);
        this.buffer.writeUint64BE(value as u64);
      }
    } else {
      // Signed integers
      if (value >= -0x80) {
        this.buffer.writeUint8(Format.INT8);
        this.buffer.writeUint8((value & 0xff) as u8);
      } else if (value >= -0x8000) {
        this.buffer.writeUint8(Format.INT16);
        this.buffer.writeUint16BE((value & 0xffff) as u16);
      } else if (value >= -0x80000000) {
        this.buffer.writeUint8(Format.INT32);
        this.buffer.writeUint32BE((value & 0xffffffff) as u32);
      } else {
        this.buffer.writeUint8(Format.INT64);
        this.buffer.writeUint64BE(value as u64);
      }
    }
  }

  /**
   * Writes a floating point value to the buffer
   * MessagePack has two floating point formats:
   * - float32 (0xca): Single-precision floating point
   * - float64 (0xcb): Double-precision floating point
   * 
   * This implementation uses float32 for simple values and special values,
   * and float64 for values that need higher precision.
   * 
   * @param value The floating point value to write
   */
  private writeFloat(value: f64): void {
    // Special values (NaN, +/-Infinity) can always use float32
    if (isNaN(value) || value == Infinity || value == -Infinity) {
      this.buffer.writeUint8(Format.FLOAT32);
      this.buffer.writeFloat32BE(f32(value));
      return;
    }

    // Simple integer-like values can use float32
    if (value == 0.0 || value == 1.0 || value == -1.0) {
      this.buffer.writeUint8(Format.FLOAT32);
      this.buffer.writeFloat32BE(f32(value));
      return;
    }

    // For all other values, use float64 for maximum precision
    this.buffer.writeUint8(Format.FLOAT64);
    this.buffer.writeFloat64BE(value);
  }

  /**
   * Writes a string value with optimal format selection based on length to the buffer
   * MessagePack has four string formats:
   * - fixstr (0xa0-0xbf): Strings up to 31 bytes
   * - str8 (0xd9): Strings up to 255 bytes
   * - str16 (0xda): Strings up to 65535 bytes
   * - str32 (0xdb): Strings up to 4294967295 bytes
   * 
   * All strings are encoded as UTF-8 bytes
   * 
   * @param value The string value to write
   */
  private writeString(value: string): void {
    // Validate string length is reasonable
    if (value.length > 0x7FFFFFFF) {
      throw MessagePackEncodeError.withPosition(
        `String too long: ${value.length} characters`,
        this.buffer.getPosition(),
        "string validation"
      );
    }

    // Get UTF-8 encoded bytes
    const utf8Bytes = this.stringToUTF8(value);
    const length = utf8Bytes.length;

    // Validate UTF-8 byte length (length is i32, so max is 0x7FFFFFFF)
    if (length < 0) {
      throw MessagePackEncodeError.withPosition(
        `Invalid string UTF-8 encoding length: ${length} bytes`,
        this.buffer.getPosition(),
        "UTF-8 validation"
      );
    }

    // Select format based on length
    if (length <= 31) {
      // fixstr format (0xa0 - 0xbf)
      this.buffer.writeUint8((Format.FIXSTR_PREFIX | length) as u8);
    } else if (length <= 255) {
      // str8 format (0xd9)
      this.buffer.writeUint8(Format.STR8);
      this.buffer.writeUint8(length as u8);
    } else if (length <= 65535) {
      // str16 format (0xda)
      this.buffer.writeUint8(Format.STR16);
      this.buffer.writeUint16BE(length as u16);
    } else {
      // str32 format (0xdb)
      this.buffer.writeUint8(Format.STR32);
      this.buffer.writeUint32BE(length as u32);
    }

    // Write the UTF-8 bytes
    this.buffer.writeBytes(utf8Bytes);
  }

  /**
   * Writes binary data with optimal format selection based on length to the buffer
   * MessagePack has three binary formats:
   * - bin8 (0xc4): Binary data up to 255 bytes
   * - bin16 (0xc5): Binary data up to 65535 bytes
   * - bin32 (0xc6): Binary data up to 4294967295 bytes
   * 
   * @param value The binary data to write
   */
  private writeBinary(value: Uint8Array): void {
    const length = value.length;

    // Validate binary data length (length is i32, so check for negative)
    if (length < 0) {
      throw MessagePackEncodeError.withPosition(
        `Invalid binary data length: ${length} bytes`,
        this.buffer.getPosition(),
        "binary validation"
      );
    }

    // Select format based on length
    if (length <= 255) {
      // bin8 format (0xc4)
      this.buffer.writeUint8(Format.BIN8);
      this.buffer.writeUint8(length as u8);
    } else if (length <= 65535) {
      // bin16 format (0xc5)
      this.buffer.writeUint8(Format.BIN16);
      this.buffer.writeUint16BE(length as u16);
    } else {
      // bin32 format (0xc6)
      this.buffer.writeUint8(Format.BIN32);
      this.buffer.writeUint32BE(length as u32);
    }

    // Write the binary data
    this.buffer.writeBytes(value);
  }

  /**
   * Writes an array with optimal format selection based on length to the buffer
   * MessagePack has three array formats:
   * - fixarray (0x90-0x9f): Arrays with up to 15 elements
   * - array16 (0xdc): Arrays with up to 65535 elements
   * - array32 (0xdd): Arrays with up to 4294967295 elements
   * 
   * Each array element is encoded recursively according to its type
   * 
   * @param values The array of MessagePackValues to write
   */
  private writeArray(values: MessagePackValue[]): void {
    const length = values.length;

    // Validate array length (length is i32, so check for negative)
    if (length < 0) {
      throw MessagePackEncodeError.withPosition(
        `Invalid array length: ${length} elements`,
        this.buffer.getPosition(),
        "array validation"
      );
    }

    // Select format based on length
    if (length <= 15) {
      // fixarray format (0x90 - 0x9f)
      this.buffer.writeUint8((Format.FIXARRAY_PREFIX | length) as u8);
    } else if (length <= 65535) {
      // array16 format (0xdc)
      this.buffer.writeUint8(Format.ARRAY16);
      this.buffer.writeUint16BE(length as u16);
    } else {
      // array32 format (0xdd)
      this.buffer.writeUint8(Format.ARRAY32);
      this.buffer.writeUint32BE(length as u32);
    }

    // Recursively encode each array element
    for (let i = 0; i < length; i++) {
      // Get current buffer position before encoding element
      const startPos = this.buffer.getPosition();

      // Encode the element
      const element = values[i];

      // Handle each element type
      switch (element.getType()) {
        case MessagePackValueType.NULL:
          this.writeNull();
          break;
        case MessagePackValueType.BOOLEAN:
          this.writeBoolean((element as MessagePackBoolean).value);
          break;
        case MessagePackValueType.INTEGER:
          this.writeInteger((element as MessagePackInteger).value);
          break;
        case MessagePackValueType.FLOAT:
          this.writeFloat((element as MessagePackFloat).value);
          break;
        case MessagePackValueType.STRING:
          this.writeString((element as MessagePackString).value);
          break;
        case MessagePackValueType.BINARY:
          this.writeBinary((element as MessagePackBinary).value);
          break;
        case MessagePackValueType.ARRAY:
          this.writeArray((element as MessagePackArray).value);
          break;
        case MessagePackValueType.MAP:
          this.writeMap((element as MessagePackMap).value);
          break;
        default:
          throw new MessagePackEncodeError("Unsupported array element type: " + element.getType().toString());
      }

      // Verify element was encoded (buffer position should have advanced)
      if (this.buffer.getPosition() <= startPos) {
        throw new MessagePackEncodeError("Failed to encode array element at index " + i.toString());
      }
    }
  }

  /**
   * Writes a map with optimal format selection based on size to the buffer
   * MessagePack has three map formats:
   * - fixmap (0x80-0x8f): Maps with up to 15 key-value pairs
   * - map16 (0xde): Maps with up to 65535 key-value pairs
   * - map32 (0xdf): Maps with up to 4294967295 key-value pairs
   * 
   * Each key and value is encoded recursively according to its type
   * 
   * @param map The map of string keys to MessagePackValues to write
   */
  private writeMap(map: Map<string, MessagePackValue>): void {
    const keys = map.keys();
    const size = keys.length;

    // Validate map size (size is i32, so check for negative)
    if (size < 0) {
      throw MessagePackEncodeError.withPosition(
        `Invalid map size: ${size} key-value pairs`,
        this.buffer.getPosition(),
        "map validation"
      );
    }

    // Select format based on size
    if (size <= 15) {
      // fixmap format (0x80 - 0x8f)
      this.buffer.writeUint8((Format.FIXMAP_PREFIX | size) as u8);
    } else if (size <= 65535) {
      // map16 format (0xde)
      this.buffer.writeUint8(Format.MAP16);
      this.buffer.writeUint16BE(size as u16);
    } else {
      // map32 format (0xdf)
      this.buffer.writeUint8(Format.MAP32);
      this.buffer.writeUint32BE(size as u32);
    }

    // Recursively encode each key-value pair
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = map.get(key);

      // Encode key (as string)
      // Get current buffer position before encoding key
      const keyStartPos = this.buffer.getPosition();

      // Encode the key
      this.writeString(key);

      // Verify key was encoded (buffer position should have advanced)
      if (this.buffer.getPosition() <= keyStartPos) {
        throw new MessagePackEncodeError("Failed to encode map key: " + key);
      }

      // Get current buffer position before encoding value
      const valueStartPos = this.buffer.getPosition();

      // Encode the value based on its type
      switch (value.getType()) {
        case MessagePackValueType.NULL:
          this.writeNull();
          break;
        case MessagePackValueType.BOOLEAN:
          this.writeBoolean((value as MessagePackBoolean).value);
          break;
        case MessagePackValueType.INTEGER:
          this.writeInteger((value as MessagePackInteger).value);
          break;
        case MessagePackValueType.FLOAT:
          this.writeFloat((value as MessagePackFloat).value);
          break;
        case MessagePackValueType.STRING:
          this.writeString((value as MessagePackString).value);
          break;
        case MessagePackValueType.BINARY:
          this.writeBinary((value as MessagePackBinary).value);
          break;
        case MessagePackValueType.ARRAY:
          this.writeArray((value as MessagePackArray).value);
          break;
        case MessagePackValueType.MAP:
          this.writeMap((value as MessagePackMap).value);
          break;
        default:
          throw new MessagePackEncodeError("Unsupported map value type: " + value.getType().toString());
      }

      // Verify value was encoded (buffer position should have advanced)
      if (this.buffer.getPosition() <= valueStartPos) {
        throw new MessagePackEncodeError("Failed to encode map value for key: " + key);
      }
    }
  }

  /**
   * Converts a string to UTF-8 encoded bytes
   * Optimized implementation with fast path for ASCII strings
   * 
   * @param str The string to convert to UTF-8
   * @returns A Uint8Array containing the UTF-8 encoded bytes
   */
  private stringToUTF8(str: string): Uint8Array {
    // For empty strings, return empty array
    if (str.length === 0) {
      return new Uint8Array(0);
    }

    // Fast path for ASCII-only strings (very common case)
    let isAsciiOnly = true;
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) >= 0x80) {
        isAsciiOnly = false;
        break;
      }
    }

    if (isAsciiOnly) {
      // For ASCII-only strings, byte length equals string length
      const bytes = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i) as u8;
      }
      return bytes;
    }

    // For non-ASCII strings, calculate the byte length first
    let byteLength: i32 = 0;
    let i = 0;
    while (i < str.length) {
      const c = str.charCodeAt(i++);

      if (c < 0x80) {
        // ASCII character (1 byte)
        byteLength += 1;
      } else if (c < 0x800) {
        // 2-byte UTF-8 sequence
        byteLength += 2;
      } else if (c < 0xD800 || c >= 0xE000) {
        // 3-byte UTF-8 sequence
        byteLength += 3;
      } else {
        // Surrogate pair (4-byte UTF-8 sequence)
        // Skip the high surrogate and encode the pair as a single code point
        i++; // Skip low surrogate
        byteLength += 4;
      }
    }

    // Allocate buffer for UTF-8 bytes
    const bytes = new Uint8Array(byteLength);
    let pos = 0;

    // Second pass: encode characters to UTF-8
    i = 0;
    while (i < str.length) {
      const c = str.charCodeAt(i++);

      if (c < 0x80) {
        // ASCII character (1 byte) - most common case
        bytes[pos++] = c as u8;
      } else if (c < 0x800) {
        // 2-byte UTF-8 sequence
        bytes[pos++] = (0xC0 | (c >> 6)) as u8;
        bytes[pos++] = (0x80 | (c & 0x3F)) as u8;
      } else if (c < 0xD800 || c >= 0xE000) {
        // 3-byte UTF-8 sequence
        bytes[pos++] = (0xE0 | (c >> 12)) as u8;
        bytes[pos++] = (0x80 | ((c >> 6) & 0x3F)) as u8;
        bytes[pos++] = (0x80 | (c & 0x3F)) as u8;
      } else if (c <= 0xDBFF && i < str.length) {
        // Surrogate pair (4-byte UTF-8 sequence)
        const c2 = str.charCodeAt(i);
        if (c2 >= 0xDC00 && c2 <= 0xDFFF) {
          // Valid surrogate pair
          i++; // Consume low surrogate
          const codePoint = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00);
          bytes[pos++] = (0xF0 | (codePoint >> 18)) as u8;
          bytes[pos++] = (0x80 | ((codePoint >> 12) & 0x3F)) as u8;
          bytes[pos++] = (0x80 | ((codePoint >> 6) & 0x3F)) as u8;
          bytes[pos++] = (0x80 | (codePoint & 0x3F)) as u8;
        } else {
          // Invalid surrogate pair, encode as replacement character
          bytes[pos++] = 0xEF;
          bytes[pos++] = 0xBF;
          bytes[pos++] = 0xBD;
        }
      } else {
        // Unpaired surrogate, encode as replacement character
        bytes[pos++] = 0xEF;
        bytes[pos++] = 0xBF;
        bytes[pos++] = 0xBD;
      }
    }

    return bytes;
  }

  /**
   * Creates a MessagePackValue wrapper for a null value
   * 
   * @returns A MessagePackNull instance
   */
  static fromNull(): MessagePackNull {
    return new MessagePackNull();
  }

  /**
   * Creates a MessagePackValue wrapper for a boolean value
   * 
   * @param value The boolean value to wrap
   * @returns A MessagePackBoolean instance
   */
  static fromBoolean(value: boolean): MessagePackBoolean {
    return new MessagePackBoolean(value);
  }

  /**
   * Creates a MessagePackValue wrapper for an integer value
   * 
   * @param value The integer value to wrap
   * @returns A MessagePackInteger instance
   */
  static fromInteger(value: i64): MessagePackInteger {
    return new MessagePackInteger(value);
  }

  /**
   * Creates a MessagePackValue wrapper for a floating point value
   * 
   * @param value The floating point value to wrap
   * @returns A MessagePackFloat instance
   */
  static fromFloat(value: f64): MessagePackFloat {
    return new MessagePackFloat(value);
  }

  /**
   * Creates a MessagePackValue wrapper for a string value
   * 
   * @param value The string value to wrap
   * @returns A MessagePackString instance
   */
  static fromString(value: string): MessagePackString {
    return new MessagePackString(value);
  }

  /**
   * Creates a MessagePackValue wrapper for binary data
   * 
   * @param value The binary data to wrap
   * @returns A MessagePackBinary instance
   */
  static fromBinary(value: Uint8Array): MessagePackBinary {
    return new MessagePackBinary(value);
  }



  /**
   * Get current buffer capacity for monitoring memory usage
   */
  getBufferCapacity(): i32 {
    return this.buffer.getCapacity();
  }

  /**
   * Get current buffer position for monitoring memory usage
   */
  getBufferPosition(): i32 {
    return this.buffer.getPosition();
  }

  /**
   * Reset the encoder for reuse without creating a new instance
   */
  reset(): void {
    this.buffer.reset();
  }
}