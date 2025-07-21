# Project Structure

## Directory Organization

- **assembly/**: AssemblyScript source code
  - Core implementation files (*.ts)
  - Unit test files (*.test.ts)
- **build/**: Compiled WebAssembly output
  - Debug builds with source maps
  - Release builds (optimized)
- **tests/**: JavaScript test runners
- **.kiro/**: Kiro AI assistant configuration
- **node_modules/**: Dependencies (managed by npm)

## Key Files

- **assembly/index.ts**: Main entry point and exports
- **assembly/types.ts**: Core type definitions for MessagePack values
- **assembly/format.ts**: MessagePack format constants
- **assembly/buffer.ts**: Buffer management utilities
- **assembly/encoder.ts**: MessagePack encoding implementation
- **assembly/decoder.ts**: MessagePack decoding implementation
- **asconfig.json**: AssemblyScript compiler configuration
- **package.json**: Project metadata and scripts

## Code Organization

### Class Structure

- **MessagePackValue**: Abstract base class for all value types
- **MessagePackEncoder**: Handles serialization to binary format
- **MessagePackDecoder**: Handles deserialization from binary format
- **GrowableBuffer**: Utility for efficient binary data writing
- **BufferReader**: Utility for efficient binary data reading

### Testing Pattern

- Each core module has a corresponding test file (*.test.ts)
- Tests are organized into logical test suites
- Test functions return boolean indicating success/failure
- Detailed logging for test failures
- Tests are run via Node.js test runner in tests/index.js

## Coding Conventions

- Use AssemblyScript-specific types (i32, u8, etc.) for better performance
- Follow TypeScript-like naming conventions
  - PascalCase for classes and types
  - camelCase for methods and variables
- Include detailed JSDoc comments for public APIs
- Organize code with private methods following public methods
- Use namespaces for grouping related constants (e.g., Format)
- Implement proper error handling with custom error classes
- Follow MessagePack specification precisely for binary format