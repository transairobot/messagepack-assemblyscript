# Technology Stack

## Core Technologies

- **AssemblyScript**: A TypeScript-like language that compiles to WebAssembly
- **MessagePack**: Binary serialization format specification
- **WebAssembly**: Target compilation format for high-performance web applications

## Development Tools

- **Node.js**: JavaScript runtime for building and testing
- **AssemblyScript Compiler (asc)**: Compiles AssemblyScript code to WebAssembly

## Project Configuration

- AssemblyScript configuration in `asconfig.json`
- ES modules format for JavaScript interoperability
- Source maps enabled for debugging

## Common Commands

### Building the Project

```bash
# Build for production (optimized)
npm run build

# Build for debugging
npm run build:debug
```

### Running Tests

```bash
# Run all tests (builds debug version first)
npm test
```

### Development Workflow

1. Implement features in AssemblyScript files in the `assembly/` directory
2. Write corresponding tests in `assembly/*.test.ts` files
3. Build with `npm run build:debug`
4. Run tests with `npm test`
5. Once stable, build production version with `npm run build`

## Performance Considerations

- Use appropriate numeric types (i32, i64, u32, etc.) for better performance
- Minimize memory allocations and copies
- Follow AssemblyScript best practices for optimal WebAssembly output
- Consider binary size impact when adding new features