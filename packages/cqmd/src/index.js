/**
 * cqmd - a markdown pre-processor to convert cq queries into conventional markdown
 *
 */
import cq from '@fullstackio/cq';
import fs from 'fs';
import path from 'path';

// http://stackoverflow.com/questions/25058134/javascript-split-a-string-by-comma-except-inside-parentheses
function splitNoParen(s){
  var left = 0, right = 0, A = [], 
  M = s.match(/([^()]+)|([()])/g), L = M.length, next, str = '';
  for(var i = 0; i<L; i++){
    next = M[i];
    if(next === '(') ++left;
    else if(next === ')') ++right;
    if(left !== 0){
      str += next;
      if(left === right){
        A[A.length-1] +=str;
        left = right= 0;
        str = '';
      }
    }
    else A = A.concat(next.match(/([^,]+)/g));
  }
  return A;
}

/*
 * Format's cq results into Github-flavored markdown-style code
 */
function formatGfm(results, opts={}) {
  let lang = opts.lang ? opts.lang : ''
  return '```' + lang + '\n' + 
    results.code + '\n' +
    '```';
}

function formatRaw(results, opts={}) {
  return results.code;
}

export default function cqmd(text, opts={}) {
  opts.format = opts.format || 'gfm';

  let newText = text.replace(/^{(.*?)}\s*\n<<\[(.*?)\]\((.*?)\)(\s*$)/mg, 
                             function(match, rawSettings, displayName, actualName, ws, offset, s) {
    let blockOpts = splitNoParen(rawSettings).reduce((acc, pair) => {
      let [k, v] = pair.split('=');
      acc[k] = v;
      return acc;
    }, {});

    // blocks override the global setting
    if(blockOpts['format']) {
      opts.format = blockOpts['format'];
    }

    let fullFilename = path.join(opts.path, actualName);
    let contents = fs.readFileSync(fullFilename).toString();
    let cqResults = cq(contents, blockOpts['crop-query']);
    let replacement;

    if(typeof opts.format === "function") {
      return opts.format(cqResults, blockOpts);
    }

    switch(opts.format) {
    case 'gfm':
      replacement = formatGfm(cqResults, blockOpts);
      break;
    case 'raw':
      replacement = formatRaw(cqResults, blockOpts);
      break;
    default:
      throw new Error('unknown format: ' + opts.format);
    }

    return replacement + ws;
  });
  return newText;
}
