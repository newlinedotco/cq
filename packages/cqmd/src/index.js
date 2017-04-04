/**
 * cqmd - a markdown pre-processor to convert cq queries into conventional markdown
 *
 */
import cq from '@fullstackio/cq';
import fs from 'fs';
import path from 'path';
import { splitNoParen } from './util';
import stringReplaceAsync from 'string-replace-async';

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

export default async function cqmd(text, opts={}) {
  opts.format = opts.format || 'gfm';
  opts.gapFiller = (typeof opts.gapFiller != 'undefined') ? opts.gapFiller : "\n  // ...\n";

  let replacer = async function(match, rawSettings, displayName, actualName, ws, offset, s) {
    let blockOpts = splitNoParen(rawSettings).reduce((acc, pair) => {
      let [k, v] = pair.split('=');
      acc[k] = v;
      return acc;
    }, {});

    // blocks override the global setting
    let format = blockOpts['format'] ? blockOpts['format'] : opts.format;                             

    let fullFilename = path.join(opts.path, actualName);
    let contents = fs.readFileSync(fullFilename).toString();
    let cqOpts = {};

    if (typeof opts.gapFiller != 'undefined') {
      cqOpts['gapFiller'] = opts.gapFiller;
    }

    let cqResults = await cq(contents, blockOpts['crop-query'], cqOpts); // TODO
    let replacement;

    if(typeof format === "function") {
      return format(cqResults, blockOpts);
    }

    switch(format) {
    case 'gfm':
      replacement = formatGfm(cqResults, blockOpts);
      break;
    case 'raw':
      replacement = formatRaw(cqResults, blockOpts);
      break;
    default:
      throw new Error('unknown format: ' + format);
    }

    return replacement + ws;
  }

  let newText = await stringReplaceAsync(
    text, 
        /^{(.*?)}\s*\n<<\[(.*?)\]\((.*?)\)(\s*$)/mg, 
    replacer );
  return newText;
}
