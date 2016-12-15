/**
 * cq-python-engine utility functions
 */

import { spawn } from 'child_process';

export function spawnParseCmd(content) {
  return new Promise((resolve, reject) => {
    const spawnOpts = {
      shell: false,
      cwd: __dirname
    };
    const cmd = spawn('python', ['./parser.py', content], spawnOpts)
    let output = '';
    let error = '';
    cmd.stdout.on('data', data => output += data.toString());
    cmd.stdout.on('end', () => {});
    cmd.stderr.on('data', data => error += data.toString());
    cmd.stderr.on('end', () => {});

    cmd.on('exit', (code) => {
      return (code !== 0) ? reject({code, error}) : resolve({code, output});
    });
  });
}
