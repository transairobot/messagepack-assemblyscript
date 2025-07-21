// MessagePack decoder implementation
import { 
  MessagePackValue, 
  MessagePackDecodeError,
  MessagePackNull,
  MessagePackBoolean,
  MessagePackInteger,
  MessagePackFloat,
  MessagePackString,
  MessagePackBinary
} from "./types";
import { Format } from "./format";

/**
 * MessagePack decoder class for deserializing binary data to AssemblyScript values
 */
export class MessagePackDecoder {
  private buffer: Uint8Array;
  private position: i32;
  
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
   * Decode a single value based on format byte
   */
  private decodeValue(): MessagePackValue {
    if (!this.hasRemaining(1)) {
      throw new MessagePackDecodeError("Unexpected end of buffer");
    }
    
    const formatByte = this.readUint8();
    
    // Positive fixint (0x00 - 0x7f)
    if (formatByte <= Format.POSITIVE_FIXINT_MAX) {
      return new MessagePackInteger(formatByte as i64);
    }
    
    // fixstr (0xa0 - 0xbf)
    if (formatByte >= Format.FIXSTR_PREFIX && formatByte <= Format.FIXSTR_MAX) {
      const strLength = formatByte - Format.FIXSTR_PREFIX;
      return new MessagePackString(this.decodeString(strLength));
    }
    
    // Negative fixint (0xe0 - 0xff)
    if (formatByte >= Format.NEGATIVE_FIXINT_MIN) {
      // Convert to signed byte
      const signedValue = (formatByte as i8) as i64;
      return new MessagePackInteger(signedValue);
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
        
      default:
        throw new MessagePackDecodeError(`Unsupported format byte: 0x${formatByte.toString(16)}`);
    }
  }
  
  /**
   * Decode a string of the specified length from the buffer
   * @param length The length of the string in bytes
   * @returns The decoded string
   */
  private decodeString(length: u32): string {
    if (!this.hasRemaining(length)) {
      throw new MessagePackDecodeError(`Not enough bytes to read string of length ${length}`);
    }
    
    // Create a temporary buffer for the string bytes
    const bytes = new Uint8Array(length);
    for (let i: u32 = 0; i < length; i++) {
      bytes[i] = this.buffer[this.position + i];
    }
    
    // Advance the position
    this.position += length;
    
    // Convert UTF-8 bytes to string
    return String.UTF8.decode(bytes.buffer);
  }
  
  /**
   * Decode binary data of the specified length from the buffer
   * @param length The length of the binary data in bytes
   * @returns The decoded binary data as Uint8Array
   */
  private decodeBinary(length: u32): Uint8Array {
    if (!this.hasRemaining(length)) {
      throw new MessagePackDecodeError(`Not enough bytes to read binary data of length ${length}`);
    }
    
    // Create a new buffer for the binary data
    const bytes = new Uint8Array(length);
    for (let i: u32 = 0; i < length; i++) {
      bytes[i] = this.buffer[this.position + i];
    }
    
    // Advance the position
    this.position += length;
    
    return bytes;
  }
  
  /**
   * Check if there are enough remaining bytes in the buffer
   */
  private hasRemaining(bytes: i32): boolean {
    return this.position + bytes <= this.buffer.length;
  }
  
  /**
   * Read a single unsigned 8-bit integer
   */
  private readUint8(): u8 {
    if (!this.hasRemaining(1)) {
      throw new MessagePackDecodeError("Not enough bytes to read uint8");
    }
    return this.buffer[this.position++];
  }
  
  /**
   * Read an unsigned 16-bit integer in big-endian format
   */
  private readUint16BE(): u16 {
    if (!this.hasRemaining(2)) {
      throw new MessagePackDecodeError("Not enough bytes to read uint16");
    }
    const value = (this.buffer[this.position] as u16) << 8 | 
                  (this.buffer[this.position + 1] as u16);
    this.position += 2;
    return value;
  }
  
  /**
   * Read an unsigned 32-bit integer in big-endian format
   */
  private readUint32BE(): u32 {
    if (!this.hasRemaining(4)) {
      throw new MessagePackDecodeError("Not enough bytes to read uint32");
    }
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
    if (!this.hasRemaining(8)) {
      throw new MessagePackDecodeError("Not enough bytes to read uint64");
    }
    
    // Read as two 32-bit values and combine
    const high = this.readUint32BE() as i64;
    const low = this.readUint32BE() as i64;
    return (high << 32) | low;
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
    if (!this.hasRemaining(4)) {
      throw new MessagePackDecodeError("Not enough bytes to read float32");
    }
    
    // Read as uint32 and reinterpret as float32
    const bits = this.readUint32BE();
    return reinterpret<f32>(bits);
  }
  
  /**
   * Read a 64-bit float in big-endian format
   */
  private readFloat64BE(): f64 {
    if (!this.hasRemaining(8)) {
      throw new MessagePackDecodeError("Not enough bytes to read float64");
    }
    
    // Read as uint64 and reinterpret as float64
    const bits = this.readUint64BE();
    return reinterpret<f64>(bits);
  }
}