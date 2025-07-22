// Core MessagePack value types

/**
 * Enum representing MessagePack value types
 */
export enum MessagePackValueType {
    NULL,
    BOOLEAN,
    INTEGER,
    FLOAT,
    STRING,
    BINARY,
    ARRAY,
    MAP
}

/**
 * Base class for MessagePack values
 * AssemblyScript doesn't support union types, so we use a class hierarchy
 */
export abstract class MessagePackValue {
    abstract getType(): MessagePackValueType;
}

/**
 * Null value wrapper
 */
export class MessagePackNull extends MessagePackValue {
    getType(): MessagePackValueType {
        return MessagePackValueType.NULL;
    }
}

/**
 * Boolean value wrapper
 */
export class MessagePackBoolean extends MessagePackValue {
    value: boolean;

    constructor(value: boolean) {
        super();
        this.value = value;
    }

    getType(): MessagePackValueType {
        return MessagePackValueType.BOOLEAN;
    }
}

/**
 * Integer value wrapper
 */
export class MessagePackInteger extends MessagePackValue {
    value: i64;

    constructor(value: i64) {
        super();
        this.value = value;
    }

    getType(): MessagePackValueType {
        return MessagePackValueType.INTEGER;
    }
}

/**
 * Float value wrapper
 */
export class MessagePackFloat extends MessagePackValue {
    value: f64;

    constructor(value: f64) {
        super();
        this.value = value;
    }

    getType(): MessagePackValueType {
        return MessagePackValueType.FLOAT;
    }
}

/**
 * String value wrapper
 */
export class MessagePackString extends MessagePackValue {
    value: string;

    constructor(value: string) {
        super();
        this.value = value;
    }

    getType(): MessagePackValueType {
        return MessagePackValueType.STRING;
    }
}

/**
 * Binary data wrapper
 */
export class MessagePackBinary extends MessagePackValue {
    value: Uint8Array;

    constructor(value: Uint8Array) {
        super();
        this.value = value;
    }

    getType(): MessagePackValueType {
        return MessagePackValueType.BINARY;
    }
}

/**
 * Array value wrapper
 */
export class MessagePackArray extends MessagePackValue {
    value: MessagePackValue[];

    constructor(value: MessagePackValue[]) {
        super();
        this.value = value;
    }

    getType(): MessagePackValueType {
        return MessagePackValueType.ARRAY;
    }
}

/**
 * Map value wrapper
 */
export class MessagePackMap extends MessagePackValue {
    value: Map<string, MessagePackValue>;

    constructor(value: Map<string, MessagePackValue>) {
        super();
        this.value = value;
    }

    getType(): MessagePackValueType {
        return MessagePackValueType.MAP;
    }
}

/**
 * Custom error class for MessagePack encoding errors
 * Provides detailed error information including context and position
 */
export class MessagePackEncodeError extends Error {
    /** The position in the encoding process where the error occurred */
    public position: i32;
    /** Additional context about the error */
    public context: string;

    constructor(message: string, position: i32 = -1, context: string = "") {
        let fullMessage = `MessagePack encode error: ${message}`;
        if (position >= 0) {
            fullMessage += ` at position ${position}`;
        }
        if (context.length > 0) {
            fullMessage += ` (${context})`;
        }
        super(fullMessage);
        this.position = position;
        this.context = context;
    }

    /**
     * Creates an encoding error with position information
     * @param message Error message
     * @param position Position where error occurred
     * @param context Additional context
     * @returns MessagePackEncodeError instance
     */
    static withPosition(message: string, position: i32, context: string = ""): MessagePackEncodeError {
        return new MessagePackEncodeError(message, position, context);
    }

    /**
     * Creates an encoding error for unsupported types
     * @param typeName Name of the unsupported type
     * @param position Position where error occurred
     * @returns MessagePackEncodeError instance
     */
    static unsupportedType(typeName: string, position: i32 = -1): MessagePackEncodeError {
        return new MessagePackEncodeError(`Unsupported type: ${typeName}`, position, "type validation");
    }

    /**
     * Creates an encoding error for buffer overflow
     * @param needed Number of bytes needed
     * @param available Number of bytes available
     * @param position Position where error occurred
     * @returns MessagePackEncodeError instance
     */
    static bufferOverflow(needed: i32, available: i32, position: i32): MessagePackEncodeError {
        return new MessagePackEncodeError(
            `Buffer overflow: needed ${needed} bytes, only ${available} available`,
            position,
            "buffer management"
        );
    }
}

/**
 * Custom error class for MessagePack decoding errors
 * Provides detailed error information including buffer position and format context
 */
export class MessagePackDecodeError extends Error {
    /** The position in the buffer where the error occurred */
    public position: i32;
    /** The format byte that caused the error (if applicable) */
    public formatByte: u8;
    /** Additional context about the error */
    public context: string;

    constructor(message: string, position: i32 = -1, formatByte: u8 = 0, context: string = "") {
        let fullMessage = `MessagePack decode error: ${message}`;
        if (position >= 0) {
            fullMessage += ` at position ${position}`;
        }
        if (formatByte > 0) {
            fullMessage += ` (format: 0x${formatByte.toString(16).padStart(2, '0')})`;
        }
        if (context.length > 0) {
            fullMessage += ` (${context})`;
        }
        super(fullMessage);
        this.position = position;
        this.formatByte = formatByte;
        this.context = context;
    }

    /**
     * Creates a decoding error with position and format information
     * @param message Error message
     * @param position Position where error occurred
     * @param formatByte Format byte that caused the error
     * @param context Additional context
     * @returns MessagePackDecodeError instance
     */
    static withFormat(message: string, position: i32, formatByte: u8, context: string = ""): MessagePackDecodeError {
        return new MessagePackDecodeError(message, position, formatByte, context);
    }

    /**
     * Creates a decoding error for unexpected end of buffer
     * @param position Position where error occurred
     * @param needed Number of bytes needed
     * @param available Number of bytes available
     * @returns MessagePackDecodeError instance
     */
    static unexpectedEnd(position: i32, needed: i32, available: i32): MessagePackDecodeError {
        return new MessagePackDecodeError(
            `Unexpected end of buffer: needed ${needed} bytes, only ${available} available`,
            position,
            0,
            "buffer boundary"
        );
    }

    /**
     * Creates a decoding error for invalid format bytes
     * @param formatByte The invalid format byte
     * @param position Position where error occurred
     * @returns MessagePackDecodeError instance
     */
    static invalidFormat(formatByte: u8, position: i32): MessagePackDecodeError {
        return new MessagePackDecodeError(
            `Invalid MessagePack format byte: 0x${formatByte.toString(16).padStart(2, '0')}`,
            position,
            formatByte,
            "format validation"
        );
    }

    /**
     * Creates a decoding error for malformed data
     * @param message Specific error message
     * @param position Position where error occurred
     * @param formatByte Format byte being processed
     * @returns MessagePackDecodeError instance
     */
    static malformedData(message: string, position: i32, formatByte: u8 = 0): MessagePackDecodeError {
        return new MessagePackDecodeError(message, position, formatByte, "data validation");
    }

    /**
     * Creates a decoding error for UTF-8 validation failures
     * @param position Position where error occurred
     * @param byteSequence The invalid byte sequence
     * @returns MessagePackDecodeError instance
     */
    static invalidUTF8(position: i32, byteSequence: string = ""): MessagePackDecodeError {
        let message = "Invalid UTF-8 sequence";
        if (byteSequence.length > 0) {
            message += `: ${byteSequence}`;
        }
        return new MessagePackDecodeError(message, position, 0, "UTF-8 validation");
    }
}