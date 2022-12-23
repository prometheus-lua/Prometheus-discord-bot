import tmp from 'tmp';
import { spawn } from 'child_process';
import logger from './logger';

/**
 * Obfuscate a Lua file using Prometheus Obfuscator
 * @param filename the path to the lua file
 * @returns the path to the obfuscated file
 */
export default function obfuscate(filename: string, preset: string): Promise<tmp.FileResult> {
    return new Promise((resolve, reject) => {
        const outFile = tmp.fileSync();
        const child = spawn('lua', ['./lua/cli.lua', '--LuaU', '--preset', preset, filename, '--out', outFile.name]);
        child.stderr.on('data', (data) => {
            logger.error(data.toString());
            reject(data.toString());
        });
        child.on('close', () => {
            resolve(outFile);
        });
    });
}
