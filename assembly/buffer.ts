// Buffer management utilities for MessagePack encoding/decoding

/**
 * Growable buffer class for efficient binary data writing during encoding
 * Implements automatic capacity expansion and provides utility methods for writing various data types
 */
export class GrowableBuffer {
    private buffer: Uint8Array;
    private position: i32;
    private capacity: i32;

    constructor(initialCapacity: i32 = 1024) {
        this.capacity = initialCapacity;
        this.buffer = new Uint8Array(initialCapacity);
        this.position = 0;
    }

    /**
     * Ensures the buffer has at least the specified number of bytes available
     * Doubles capacity if more space is needed
     */
    ensureCapacity(needed: i32): void {
        const required = this.position + needed;
        if (required > this.capacity) {
            let newCapacity = this.capacity;
            while (newCapacity < required) {
                newCapacity *= 2;
            }
            this.resize(newCapacity);
        }
    }

    /**
     * Resizes the internal buffer to the specified capacity
     */
    private resize(newCapacity: i32): void {
        const newBuffer = new Uint8Array(newCapacity);
        // Copy existing data
        for (let i = 0; i < this.position; i++) {
            newBuffer[i] = this.buffer[i];
        }
        this.buffer = newBuffer;
        this.capacity = newCapacity;
    }

    /**
     * Writes a single byte to the buffer
     */
    writeUint8(value: u8): void {
        this.ensureCapacity(1);
        this.buffer[this.position] = value;
        this.position++;
    }

    /**
     * Writes a 16-bit unsigned integer in big-endian format
     */
    writeUint16BE(value: u16): void {
        this.ensureCapacity(2);
        this.buffer[this.position] = (value >> 8) as u8;
        this.buffer[this.position + 1] = (value & 0xff) as u8;
        this.position += 2;
    }

    /**
     * Writes a 32-bit unsigned integer in big-endian format
     */
    writeUint32BE(value: u32): void {
        this.ensureCapacity(4);
        this.buffer[this.position] = (value >> 24) as u8;
        this.buffer[this.position + 1] = (value >> 16) as u8;
        this.buffer[this.position + 2] = (value >> 8) as u8;
        this.buffer[this.position + 3] = (value & 0xff) as u8;
        this.position += 4;
    }

    /**
     * Writes a 64-bit unsigned integer in big-endian format
     */
    writeUint64BE(value: u64): void {
        this.ensureCapacity(8);
        this.buffer[this.position] = (value >> 56) as u8;
        this.buffer[this.position + 1] = (value >> 48) as u8;
        this.buffer[this.position + 2] = (value >> 40) as u8;
        this.buffer[this.position + 3] = (value >> 32) as u8;
        this.buffer[this.position + 4] = (value >> 24) as u8;
        this.buffer[this.position + 5] = (value >> 16) as u8;
        this.buffer[this.position + 6] = (value >> 8) as u8;
        this.buffer[this.position + 7] = (value & 0xff) as u8;
        this.position += 8;
    }

    /**
     * Writes a 32-bit float in big-endian format
     */
    writeFloat32BE(value: f32): void {
        const intValue = reinterpret<u32>(value);
        this.writeUint32BE(intValue);
    }

    /**
     * Writes a 64-bit float in big-endian format
     */
    writeFloat64BE(value: f64): void {
        const intValue = reinterpret<u64>(value);
        this.writeUint64BE(intValue);
    }

    /**
     * Writes a byte array to the buffer
     */
    writeBytes(bytes: Uint8Array): void {
        this.ensureCapacity(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            this.buffer[this.position + i] = bytes[i];
        }
        this.position += bytes.length;
    }

    /**
     * Returns the current position in the buffer
     */
    getPosition(): i32 {
        return this.position;
    }

    /**
     * Returns the current capacity of the buffer
     */
    getCapacity(): i32 {
        return this.capacity;
    }

    /**
     * Returns a trimmed copy of the buffer containing only the written data
     */
    toBytes(): Uint8Array {
        const result = new Uint8Array(this.position);
        for (let i = 0; i < this.position; i++) {
            result[i] = this.buffer[i];
        }
        return result;
    }

    /**
     * Resets the buffer position to 0, allowing reuse
     */
    reset(): void {
        this.position = 0;
    }
}

/**
 * Buffer reader class for efficient binary data reading during decoding
 * Provides utility methods for reading various data types with bounds checking
 */
export class BufferReader {
    private buffer: Uint8Array;
    private position: i32;
    private length: i32;

    constructor(buffer: Uint8Array) {
        this.buffer = buffer;
        this.position = 0;
        this.length = buffer.length;
    }

    /**
     * Checks if the specified number of bytes are available for reading
     */
    hasRemaining(bytes: i32): boolean {
        return this.position + bytes <= this.length;
    }

    /**
     * Returns the number of bytes remaining in the buffer
     */
    remaining(): i32 {
        return this.length - this.position;
    }

    /**
     * Returns the current position in the buffer
     */
    getPosition(): i32 {
        return this.position;
    }

    /**
     * Sets the position in the buffer
     */
    setPosition(position: i32): void {
        if (position < 0 || position > this.length) {
            throw new Error("Position out of bounds");
        }
        this.position = position;
    }

    /**
     * Reads a single byte from the buffer
     */
    readUint8(): u8 {
        if (!this.hasRemaining(1)) {
            throw new Error("Buffer underflow: cannot read u8");
        }
        const value = this.buffer[this.position];
        this.position++;
        return value;
    }

    /**
     * Reads a 16-bit unsigned integer in big-endian format
     */
    readUint16BE(): u16 {
        if (!this.hasRemaining(2)) {
            throw new Error("Buffer underflow: cannot read u16");
        }
        const value = (this.buffer[this.position] as u16) << 8 |
                     (this.buffer[this.position + 1] as u16);
        this.position += 2;
        return value;
    }

    /**
     * Reads a 32-bit unsigned integer in big-endian format
     */
    readUint32BE(): u32 {
        if (!this.hasRemaining(4)) {
            throw new Error("Buffer underflow: cannot read u32");
        }
        const value = (this.buffer[this.position] as u32) << 24 |
                     (this.buffer[this.position + 1] as u32) << 16 |
                     (this.buffer[this.position + 2] as u32) << 8 |
                     (this.buffer[this.position + 3] as u32);
        this.position += 4;
        return value;
    }

    /**
     * Reads a 64-bit unsigned integer in big-endian format
     */
    readUint64BE(): u64 {
        if (!this.hasRemaining(8)) {
            throw new Error("Buffer underflow: cannot read u64");
        }
        const value = (this.buffer[this.position] as u64) << 56 |
                     (this.buffer[this.position + 1] as u64) << 48 |
                     (this.buffer[this.position + 2] as u64) << 40 |
                     (this.buffer[this.position + 3] as u64) << 32 |
                     (this.buffer[this.position + 4] as u64) << 24 |
                     (this.buffer[this.position + 5] as u64) << 16 |
                     (this.buffer[this.position + 6] as u64) << 8 |
                     (this.buffer[this.position + 7] as u64);
        this.position += 8;
        return value;
    }

    /**
     * Reads a 32-bit float in big-endian format
     */
    readFloat32BE(): f32 {
        const intValue = this.readUint32BE();
        return reinterpret<f32>(intValue);
    }

    /**
     * Reads a 64-bit float in big-endian format
     */
    readFloat64BE(): f64 {
        const intValue = this.readUint64BE();
        return reinterpret<f64>(intValue);
    }

    /**
     * Reads a specified number of bytes from the buffer
     */
    readBytes(length: u32): Uint8Array {
        if (!this.hasRemaining(length as i32)) {
            throw new Error("Buffer underflow: cannot read " + length.toString() + " bytes");
        }
        const result = new Uint8Array(length);
        for (let i: u32 = 0; i < length; i++) {
            result[i] = this.buffer[this.position + (i as i32)];
        }
        this.position += length as i32;
        return result;
    }

    /**
     * Peeks at the next byte without advancing the position
     */
    peekUint8(): u8 {
        if (!this.hasRemaining(1)) {
            throw new Error("Buffer underflow: cannot peek u8");
        }
        return this.buffer[this.position];
    }
}