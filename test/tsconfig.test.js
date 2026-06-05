import Module from 'node:module';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

import { readTsConfigOptions } from 'bio-dts/lib/tsconfig.js';

import { expect } from 'chai';


/**
 * @param { string } dir
 * @param { object } config
 */
function writeTsConfig(dir, config) {
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify(config, null, 2));
}


describe('tsconfig', function() {

  let tmpDir;

  beforeEach(function() {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bio-dts-test-'));
  });

  afterEach(function() {
    fs.rmSync(tmpDir, { recursive: true });
  });


  describe('readTsConfigOptions', function() {

    it('should read module from tsconfig', function() {

      // given
      const ts = getTypescript();

      writeTsConfig(tmpDir, {
        compilerOptions: {
          module: 'NodeNext'
        }
      });

      // when
      const options = readTsConfigOptions(ts, tmpDir);

      // then
      expect(options.module).to.equal(ts.ModuleKind.NodeNext);
    });


    it('should read moduleResolution from tsconfig', function() {

      // given
      const ts = getTypescript();

      writeTsConfig(tmpDir, {
        compilerOptions: {
          moduleResolution: 'NodeNext'
        }
      });

      // when
      const options = readTsConfigOptions(ts, tmpDir);

      // then
      expect(options.moduleResolution).to.equal(ts.ModuleResolutionKind.NodeNext);
    });


    it('should read target from tsconfig', function() {

      // given
      const ts = getTypescript();

      writeTsConfig(tmpDir, {
        compilerOptions: {
          target: 'ES2020'
        }
      });

      // when
      const options = readTsConfigOptions(ts, tmpDir);

      // then
      expect(options.target).to.equal(ts.ScriptTarget.ES2020);
    });


    it('should return empty object when no tsconfig exists', function() {

      // given
      const ts = getTypescript();

      // when — use os.tmpdir() as a directory that has no tsconfig above it
      const options = readTsConfigOptions(ts, os.tmpdir());

      // then
      expect(options).to.eql({});
    });


    it('should not expose unrelated options', function() {

      // given
      const ts = getTypescript();

      writeTsConfig(tmpDir, {
        compilerOptions: {
          module: 'NodeNext',
          strict: true,
          noImplicitAny: true,
          lib: [ 'es2020' ]
        }
      });

      // when
      const options = readTsConfigOptions(ts, tmpDir);

      // then
      expect(options).to.not.have.property('strict');
      expect(options).to.not.have.property('noImplicitAny');
      expect(options).to.not.have.property('lib');
    });


    it('should read all three options together', function() {

      // given
      const ts = getTypescript();

      writeTsConfig(tmpDir, {
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          target: 'ES2020'
        }
      });

      // when
      const options = readTsConfigOptions(ts, tmpDir);

      // then
      expect(options).to.eql({
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        target: ts.ScriptTarget.ES2020
      });
    });

  });

});


// helpers //////////////////

function getTypescript() {
  const requireLocal = Module.createRequire(import.meta.url);
  return requireLocal('typescript');
}
