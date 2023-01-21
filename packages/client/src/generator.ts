import { zodToTs, printNode } from 'zod-to-ts';
import { createWriteStream } from 'fs';
import { GeneralMessage, Person } from '../../server/src/hello.zod';
import { ZodTypeAny } from 'zod';

const zodToString = (type: ZodTypeAny, name: string) => {
  const { node } = zodToTs(type, name);
  return printNode(node);
};

const run = async () => {
  const s = createWriteStream('./src/hello.gen.ts', { encoding: 'utf8' });

  s.write(`// hello.gen.ts generated on ${new Date().toISOString()}\n\n`);

  const exportType = (type: ZodTypeAny, name: string) => {
    const text = zodToString(type, name).replace(/    /g, '  ');
    s.write(`export type ${name} = ${text};\n`);
  };

  exportType(GeneralMessage, 'GeneralMessage');
  exportType(Person, 'Person');

  await new Promise(resolve => s.end(resolve));
};

run().then(() => process.exit(0)).catch(() => process.exit(1));
