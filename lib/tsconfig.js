import path from 'node:path';

/**
 * Read ESM-relevant compiler options from the nearest tsconfig.json,
 * starting from `cwd`.
 *
 * Options are sourced selectively: only `module`, `moduleResolution`, and
 * `target` are returned because these affect how declarations are generated.
 * Other options (strict, lib, paths, …) are not meaningful here.
 *
 * @param { import('typescript') } ts
 * @param { string } [cwd]
 *
 * @return { Partial<import('typescript').CompilerOptions> }
 */
export function readTsConfigOptions(ts, cwd = process.cwd()) {

  const configPath = ts.findConfigFile(cwd, ts.sys.fileExists);

  if (!configPath) {
    return {};
  }

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);

  if (configFile.error) {
    return {};
  }

  const { options } = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath)
  );

  const result = /** @type { Partial<import('typescript').CompilerOptions> } */ ({});

  if (options.module !== undefined) result.module = options.module;
  if (options.moduleResolution !== undefined) result.moduleResolution = options.moduleResolution;
  if (options.target !== undefined) result.target = options.target;

  return result;
}
