import { createConfigOperations } from './src/core/operations.js';

const configOps = createConfigOperations();

const definition = {
  name: 'test-config',
  sources: [
    {
      type: 'object',
      data: { key: 'value' },
      priority: 1,
    },
  ],
};

const result = configOps.create(definition);

console.log('Result isOk:', result.isOk());
console.log('Result isErr:', result.isErr());

if (result.isErr()) {
  console.log('Error:', JSON.stringify(result.error, null, 2));
}
