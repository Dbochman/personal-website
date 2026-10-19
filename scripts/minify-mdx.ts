import { transform } from 'esbuild';

// MDX function bodies are serialized as strings and executed with the JSX
// runtime in arguments[0]. Vite cannot minify code inside those strings.
export async function minifyMdxFunctionBody(source: string): Promise<string> {
  const { code } = await transform(source, {
    loader: 'js',
    target: 'es2020',
    minify: true,
  });
  return code;
}
