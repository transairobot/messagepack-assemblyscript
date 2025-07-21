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
 */
export class MessagePackEncodeError extends Error {
    constructor(message: string) {
        super(`MessagePack encode error: ${message}`);
    }
}

/**
 * Custom error class for MessagePack decoding errors
 */
export class MessagePackDecodeError extends Error {
    constructor(message: string) {
        super(`MessagePack decode error: ${message}`);
    }
}