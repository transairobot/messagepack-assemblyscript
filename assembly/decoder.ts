// MessagePack decoder implementation
import {
  MessagePackValueType,
  MessagePackValue,
  MessagePackDecodeError,
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
import { BufferReader } from "./buffer";

/**
 * MessagePack decoder class for deserializing binary data to AssemblyScript values
 */
export class MessagePackDecoder {
  private buffer: Uint8Array;
  private position: i32;
  private reader: BufferReader | null = null;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.position = 0;
  }

  /**
   * Main decoding method - converts binary MessagePack data to AssemblyScript values
   */
  decode(): MessagePackValue {
    if (this.buffer.length === 0) {
      throw new MessagePackDecodeError("Empty buffer");
    }

    this.position = 0;
    return this.decodeValue();
  }

  /**
   * Decode a single value based on format byte - optimized hot path
   */
  private decodeValue(): MessagePackValue {
    this.validateRemaining(1, "format byte");

    const formatByte = this.readUint8();

    // Hot path: positive fixint (0x00 - 0x7f) - most common
    if (formatByte <= Format.POSITIVE_FIXINT_MAX) {
      return new MessagePackInteger(formatByte as i64);
    }

    // Hot path: negative fixint (0xe0 - 0xff) - second most common
    if (formatByte >= Format.NEGATIVE_FIXINT_MIN) {
      return new MessagePackInteger((formatByte as i8) as i64);
    }

    // Hot path: fixstr (0xa0 - 0xbf) - very common
    if (formatByte >= Format.FIXSTR_PREFIX && formatByte <= Format.FIXSTR_MAX) {
      const strLength = formatByte - Format.FIXSTR_PREFIX;
      return new MessagePackString(this.decodeString(strLength));
    }

    // Cold path: other formats
    return this.decodeValueColdPath(formatByte);
  }
  
  /**
   * Cold path for less common format types
   */
  private decodeValueColdPath(formatByte: u8): MessagePackValue {
    // fixmap (0x80 - 0x8f)
    if (formatByte >= Format.FIXMAP_PREFIX && formatByte <= Format.FIXMAP_MAX) {
      const mapSize = formatByte - Format.FIXMAP_PREFIX;
      return new MessagePackMap(this.decodeMap(mapSize));
    }

    // fixarray (0x90 - 0x9f)
    if (formatByte >= Format.FIXARRAY_PREFIX && formatByte <= Format.FIXARRAY_MAX) {
      const arrayLength = formatByte - Format.FIXARRAY_PREFIX;
      return new MessagePackArray(this.decodeArray(arrayLength));
    }

    // Handle specific format types
    switch (formatByte) {
      case Format.NIL:
        return new MessagePackNull();
      case Format.FALSE:
        return new MessagePackBoolean(false);
      case Format.TRUE:
        return new MessagePackBoolean(true);
      case Format.UINT8:
        return new MessagePackInteger(this.readUint8() as i64);
      case Format.UINT16:
        return new MessagePackInteger(this.readUint16BE() as i64);
      case Format.UINT32:
        return new MessagePackInteger(this.readUint32BE() as i64);
      case Format.UINT64:
        return new MessagePackInteger(this.readUint64BE());
      case Format.INT8:
        return new MessagePackInteger((this.readUint8() as i8) as i64);
      case Format.INT16:
        return new MessagePackInteger((this.readUint16BE() as i16) as i64);
      case Format.INT32:
        return new MessagePackInteger((this.readUint32BE() as i32) as i64);
      case Format.INT64:
        return new MessagePackInteger(this.readInt64BE());
      case Format.FLOAT32:
        return new MessagePackFloat(this.readFloat32BE() as f64);
      case Format.FLOAT64:
        return new MessagePackFloat(this.readFloat64BE());
      case Format.STR8:
        return new MessagePackString(this.decodeString(this.readUint8()));
      case Format.STR16:
        return new MessagePackString(this.decodeString(this.readUint16BE()));
      case Format.STR32:
        return new MessagePackString(this.decodeString(this.readUint32BE()));
      case Format.BIN8:
        return new MessagePackBinary(this.decodeBinary(this.readUint8()));
      case Format.BIN16:
        return new MessagePackBinary(this.decodeBinary(this.readUint16BE()));
      case Format.BIN32:
        return new MessagePackBinary(this.decodeBinary(this.readUint32BE()));
      case Format.ARRAY16:
        return new MessagePackArray(this.decodeArray(this.readUint16BE()));
      case Format.ARRAY32:
        return new MessagePackArray(this.decodeArray(this.readUint32BE()));
      case Format.MAP16:
        return new MessagePackMap(this.decodeMap(this.readUint16BE()));
      case Format.MAP32:
        return new MessagePackMap(this.decodeMap(this.readUint32BE()));
      default:
        throw MessagePackDecodeError.invalidFormat(formatByte, this.position - 1);
    }
  }

  /**
   * Decode a string of the specified length from the buffer
   * @param length The length of the string in bytes
   * @returns The decoded string
   */
  private decodeString(length: u32): string {
    // Validate length is reasonable (prevent excessive memory allocation)
    if (length > 0x7FFFFFFF) {
      throw MessagePackDecodeError.malformedData(
        `String length too large: ${length}`,
        this.position - 1
      );
    }

    this.validateRemaining(length, `string data (${length} bytes)`);

    // Create a temporary buffer for the string bytes
    const bytes = new Uint8Array(length);
    
    // Fast copy using direct buffer access
    for (let i: u32 = 0; i < length; i++) {
      bytes[i] = this.buffer[this.position + i];
    }
    // Advance the position
    this.position += length;

    // Validate UTF-8 and convert to string
    const result = this.validateAndDecodeUTF8(bytes);
    
    return result;
  }

  /**
   * Validate UTF-8 byte sequence and decode to string
   * @param bytes UTF-8 encoded bytes
   * @returns Decoded string
   */
  private validateAndDecodeUTF8(bytes: Uint8Array): string {
    // Fast path for ASCII-only strings (very common case)
    let isAsciiOnly = true;
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 0x80) {
        isAsciiOnly = false;
        break;
      }
    }
    
    if (isAsciiOnly) {
      // ASCII-only strings can be decoded directly
      return String.UTF8.decode(bytes.buffer);
    }
    
    // Full UTF-8 validation for non-ASCII strings
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      
      if (byte < 0x80) {
        // ASCII character - valid
        continue;
      } else if ((byte & 0xE0) === 0xC0) {
        // 2-byte sequence
        if (i + 1 >= bytes.length) {
          throw MessagePackDecodeError.invalidUTF8(this.position - bytes.length + i, "truncated 2-byte sequence");
        }
        const byte2 = bytes[++i];
        if ((byte2 & 0xC0) !== 0x80) {
          throw MessagePackDecodeError.invalidUTF8(this.position - bytes.length + i, "invalid continuation byte");
        }
      } else if ((byte & 0xF0) === 0xE0) {
        // 3-byte sequence
        if (i + 2 >= bytes.length) {
          throw MessagePackDecodeError.invalidUTF8(this.position - bytes.length + i, "truncated 3-byte sequence");
        }
        const byte2 = bytes[++i];
        const byte3 = bytes[++i];
        if ((byte2 & 0xC0) !== 0x80 || (byte3 & 0xC0) !== 0x80) {
          throw MessagePackDecodeError.invalidUTF8(this.position - bytes.length + i, "invalid continuation bytes");
        }
      } else if ((byte & 0xF8) === 0xF0) {
        // 4-byte sequence
        if (i + 3 >= bytes.length) {
          throw MessagePackDecodeError.invalidUTF8(this.position - bytes.length + i, "truncated 4-byte sequence");
        }
        const byte2 = bytes[++i];
        const byte3 = bytes[++i];
        const byte4 = bytes[++i];
        if ((byte2 & 0xC0) !== 0x80 || (byte3 & 0xC0) !== 0x80 || (byte4 & 0xC0) !== 0x80) {
          throw MessagePackDecodeError.invalidUTF8(this.position - bytes.length + i, "invalid continuation bytes");
        }
      } else {
        throw MessagePackDecodeError.invalidUTF8(this.position - bytes.length + i, `invalid start byte: 0x${byte.toString(16)}`);
      }
    }

    // Convert UTF-8 bytes to string
    return String.UTF8.decode(bytes.buffer);
  }

  /**
   * Decode binary data of the specified length from the buffer
   * @param length The length of the binary data in bytes
   * @returns The decoded binary data as Uint8Array
   */
  private decodeBinary(length: u32): Uint8Array {
    // Validate length is reasonable (prevent excessive memory allocation)
    if (length > 0x7FFFFFFF) {
      throw MessagePackDecodeError.malformedData(
        `Binary data length too large: ${length}`,
        this.position - 1
      );
    }

    this.validateRemaining(length, `binary data (${length} bytes)`);

    // Create a buffer for the binary data - don't use pooling as this will be returned to the user
    const bytes = new Uint8Array(length);
    
    // Fast copy using direct buffer access
    for (let i: u32 = 0; i < length; i++) {
      bytes[i] = this.buffer[this.position + i];
    }

    // Advance the position
    this.position += length;

    return bytes;
  }

  /**
   * Decode an array of the specified length from the buffer
   * @param length The number of elements in the array
   * @returns The decoded array as MessagePackValue[]
   */
  private decodeArray(length: u32): MessagePackValue[] {
    // Validate length is reasonable (prevent excessive memory allocation)
    if (length > 0x7FFFFFFF) {
      throw MessagePackDecodeError.malformedData(
        `Array length too large: ${length}`,
        this.position - 1
      );
    }

    const array = new Array<MessagePackValue>(length);

    for (let i: u32 = 0; i < length; i++) {
      // Check if we have enough buffer remaining for at least one more byte
      if (!this.hasRemaining(1)) {
        throw MessagePackDecodeError.unexpectedEnd(
          this.position,
          1,
          this.buffer.length - this.position
        );
      }
      array[i] = this.decodeValue();
    }

    return array;
  }

  /**
   * Decode a map with the specified number of key-value pairs from the buffer
   * @param size The number of key-value pairs in the map
   * @returns The decoded map as Map<string, MessagePackValue>
   */
  private decodeMap(size: u32): Map<string, MessagePackValue> {
    // Validate size is reasonable (prevent excessive memory allocation)
    if (size > 0x7FFFFFFF) {
      throw MessagePackDecodeError.malformedData(
        `Map size too large: ${size}`,
        this.position - 1
      );
    }

    const map = new Map<string, MessagePackValue>();

    for (let i: u32 = 0; i < size; i++) {
      // Check if we have enough buffer remaining for at least two more bytes (key + value)
      if (!this.hasRemaining(2)) {
        throw MessagePackDecodeError.unexpectedEnd(
          this.position,
          2,
          this.buffer.length - this.position
        );
      }

      // Decode key
      const keyValue = this.decodeValue();
      let key: string;

      // Convert key to string (MessagePack spec allows any type as key, but we'll use string keys for simplicity)
      if (keyValue.getType() === MessagePackValueType.STRING) {
        key = (keyValue as MessagePackString).value;
      } else {
        // For non-string keys, we'll convert them to a string representation
        // This is a simplification - in a full implementation, you might want to handle different key types
        if (keyValue.getType() === MessagePackValueType.INTEGER) {
          key = (keyValue as MessagePackInteger).value.toString();
        } else if (keyValue.getType() === MessagePackValueType.BOOLEAN) {
          key = (keyValue as MessagePackBoolean).value.toString();
        } else if (keyValue.getType() === MessagePackValueType.NULL) {
          key = "null";
        } else {
          // For other types, use a generic string representation
          key = "key_" + i.toString();
        }
      }

      // Check if we have enough buffer remaining for the value
      if (!this.hasRemaining(1)) {
        throw MessagePackDecodeError.unexpectedEnd(
          this.position,
          1,
          this.buffer.length - this.position
        );
      }

      // Decode value
      const value = this.decodeValue();

      // Add key-value pair to map
      map.set(key, value);
    }

    return map;
  }

  /**
   * Check if there are enough remaining bytes in the buffer
   */
  private hasRemaining(bytes: i32): boolean {
    return this.position + bytes <= this.buffer.length;
  }

  /**
   * Validate that we have enough bytes remaining and throw detailed error if not
   * @param bytes Number of bytes needed
   * @param context Description of what we're trying to read
   */
  private validateRemaining(bytes: i32, context: string): void {
    if (!this.hasRemaining(bytes)) {
      const available = this.buffer.length - this.position;
      throw MessagePackDecodeError.unexpectedEnd(this.position, bytes, available);
    }
  }

  /**
   * Read a single unsigned 8-bit integer
   */
  private readUint8(): u8 {
    this.validateRemaining(1, "uint8");
    return this.buffer[this.position++];
  }

  /**
   * Read an unsigned 16-bit integer in big-endian format
   */
  private readUint16BE(): u16 {
    this.validateRemaining(2, "uint16");
    const value = (this.buffer[this.position] as u16) << 8 |
      (this.buffer[this.position + 1] as u16);
    this.position += 2;
    return value;
  }

  /**
   * Read an unsigned 32-bit integer in big-endian format
   */
  private readUint32BE(): u32 {
    this.validateRemaining(4, "uint32");
    const value = (this.buffer[this.position] as u32) << 24 |
      (this.buffer[this.position + 1] as u32) << 16 |
      (this.buffer[this.position + 2] as u32) << 8 |
      (this.buffer[this.position + 3] as u32);
    this.position += 4;
    return value;
  }

  /**
   * Read an unsigned 64-bit integer in big-endian format
   */
  private readUint64BE(): i64 {
    this.validateRemaining(8, "uint64");

    // Direct read from buffer for better performance
    const p = this.position;
    const high = ((this.buffer[p] as i64) << 24) | 
                ((this.buffer[p+1] as i64) << 16) | 
                ((this.buffer[p+2] as i64) << 8) | 
                (this.buffer[p+3] as i64);
    const low = ((this.buffer[p+4] as i64) << 24) | 
               ((this.buffer[p+5] as i64) << 16) | 
               ((this.buffer[p+6] as i64) << 8) | 
               (this.buffer[p+7] as i64);
    
    this.position += 8;
    // Combine high and low 32-bit values into a 64-bit value
    return (high << 32) | (low & 0xFFFFFFFF);
  }

  /**
   * Read a signed 64-bit integer in big-endian format
   */
  private readInt64BE(): i64 {
    return this.readUint64BE(); // Same bit pattern, different interpretation
  }

  /**
   * Read a 32-bit float in big-endian format
   */
  private readFloat32BE(): f32 {
    this.validateRemaining(4, "float32");

    // Read as uint32 and reinterpret as float32
    const bits = this.readUint32BE();
    return reinterpret<f32>(bits);
  }

  /**
   * Read a 64-bit float in big-endian format
   */
  private readFloat64BE(): f64 {
    this.validateRemaining(8, "float64");

    // Read as uint64 and reinterpret as float64
    const bits = this.readUint64BE();
    return reinterpret<f64>(bits);
  }
  
  /**
   * Get current position for monitoring
   */
  getPosition(): i32 {
    return this.position;
  }
  
  /**
   * Get buffer length for monitoring
   */
  getBufferLength(): i32 {
    return this.buffer.length;
  }
}