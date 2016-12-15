/**
 * cq utility functions
 */

import { spawn } from 'child_process';

// http://stackoverflow.com/questions/25058134/javascript-split-a-string-by-comma-except-inside-parentheses
export function splitNoParen(s){
  let results = [];
  let next;
  let str = '';
  let left = 0, right = 0;

  function keepResult() {
    results.push(str);
    str = '';
  }

  for(var i = 0; i<s.length; i++) {
    switch(s[i]) {
    case ',': 
      if((left === right)) {
        keepResult();
        left = right = 0;
      } else {
        str += s[i];
      }
      break;
    case '(':
      left++;
      str += s[i];
      break;
    case ')':
      right++;
      str += s[i];
      break;
    default: 
      str += s[i];
    }
  }
  keepResult();
  return results;
}

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