import { glob } from 'tinyglobby';

export const globImportEager = async (pattern: string | string[], basePath: string): Promise<Record<string, any>> => {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const ps = patterns.map((p) => p[0] === '/' ? `${basePath}${p}` : p);
  const files = await glob(ps, {
    cwd: basePath,
    absolute: true,
    onlyFiles: true,
    expandDirectories: false,
  });
  const modules: Record<string, any> = {};

  for (const file of files) {
    const module = await import(file);
    modules[file] = module;
  }

  return modules;
};