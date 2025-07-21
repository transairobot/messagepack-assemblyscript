// MessagePack format constants as defined in the specification

/**
 * MessagePack format type constants
 * These constants define the byte values used to identify different data types
 * in the MessagePack binary format
 */
export namespace Format {
  // Positive integers (0x00 - 0x7f)
  export const POSITIVE_FIXINT_MAX: u8 = 0x7f;
  
  // Maps (0x80 - 0x8f)
  export const FIXMAP_PREFIX: u8 = 0x80;
  export const FIXMAP_MAX: u8 = 0x8f;
  
  // Arrays (0x90 - 0x9f)  
  export const FIXARRAY_PREFIX: u8 = 0x90;
  export const FIXARRAY_MAX: u8 = 0x9f;
  
  // Strings (0xa0 - 0xbf)
  export const FIXSTR_PREFIX: u8 = 0xa0;
  export const FIXSTR_MAX: u8 = 0xbf;
  
  // Nil, boolean
  export const NIL: u8 = 0xc0;
  export const FALSE: u8 = 0xc2;
  export const TRUE: u8 = 0xc3;
  
  // Binary data
  export const BIN8: u8 = 0xc4;
  export const BIN16: u8 = 0xc5;
  export const BIN32: u8 = 0xc6;
  
  // Floats
  export const FLOAT32: u8 = 0xca;
  export const FLOAT64: u8 = 0xcb;
  
  // Unsigned integers
  export const UINT8: u8 = 0xcc;
  export const UINT16: u8 = 0xcd;
  export const UINT32: u8 = 0xce;
  export const UINT64: u8 = 0xcf;
  
  // Signed integers
  export const INT8: u8 = 0xd0;
  export const INT16: u8 = 0xd1;
  export const INT32: u8 = 0xd2;
  export const INT64: u8 = 0xd3;
  
  // Strings
  export const STR8: u8 = 0xd9;
  export const STR16: u8 = 0xda;
  export const STR32: u8 = 0xdb;
  
  // Arrays
  export const ARRAY16: u8 = 0xdc;
  export const ARRAY32: u8 = 0xdd;
  
  // Maps
  export const MAP16: u8 = 0xde;
  export const MAP32: u8 = 0xdf;
  
  // Negative integers (0xe0 - 0xff)
  export const NEGATIVE_FIXINT_MIN: u8 = 0xe0;
}