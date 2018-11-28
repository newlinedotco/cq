/**
 * @author Nate Murray
 * @license MIT
 * @module remark:leanpub:test
 * @fileoverview Test suite for remark-leanpub.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var test = require('tape');
var remark = require('remark');
var leanpub = require('./index.js');

/*
 * Tests.
 */

test('remark-leanpub blockquotes', function(t) { 
  t.equal(
    remark().use(leanpub).process([
      '',
      '> hello',
      '> here is',
      '> a blockquote',
      ''
      ].join('\n')).contents,
    [
      '> hello',
      '> here is',
      '> a blockquote',
      ''
    ].join('\n'))

  t.equal(
    remark().use(leanpub).process([
      '',
      'A> hello',
      'A> here is',
      'A> a blockquote',
      ''
      ].join('\n')).contents,
    [
      '> hello',
      '> here is',
      '> a blockquote',
      ''
    ].join('\n'))


  t.end();
})


/*
test('remark-leanpub code imports', function(t) { 
  t.equal(
    remark().use(leanpub).process("\n<<[my-file.js](my-file.js)"),
    '\n\n')

  t.equal(
    remark().use(leanpub).process([
      '',
      '<<[my-file.js](my-file.js)',
      '',
      '    <<EOF',
      '    okay'
      ].join('\n')),
    ['',
     '',
     '',
     '    <<EOF',
     '    okay',
     ''
    ].join('\n'))

  t.end();
})
 */

test('remark-leanpub block attribute lists', function(t) { 
  t.equal(
    remark().use(leanpub).process("\n{foo=bar}").contents,
    '  \n\n')

  t.equal(
    remark().use(leanpub).process("\n{foo: 1,\nbar: 2}").contents,
    '{foo: 1,\nbar: 2}\n')

  t.equal(
    remark().use(leanpub).process([
      '',
      '{baz=bam}',
      '    var foo = 1;',
      '    var bar = {cat: dog};'
      ].join('\n')).contents,
    ['  ',
     '',
     '',
     '    var foo = 1;',
     '    var bar = {cat: dog};',
     ''
    ].join('\n'))

  t.equal(
    remark().use(leanpub, { preserveEmptyLines: false }).process([
      '',
      '{baz=bam}',
      '    var foo = 1;',
      '    var bar = {cat: dog};'
      ].join('\n')).contents,
    ['',
     '',
     '    var foo = 1;',
     '    var bar = {cat: dog};',
     ''
    ].join('\n'))

  t.equal(
    remark().use(leanpub).process([
      '',
      '{lang=javascript}',
      '    var foo = 1;',
      '    var bar = {cat: dog};'
      ].join('\n')).contents,
    ['  ',
     '',
     '',
     '```javascript',
     'var foo = 1;',
     'var bar = {cat: dog};',
     '```',
     ''
    ].join('\n'))

  t.equal(
    remark().use(leanpub, { preserveEmptyLines: false }).process([
      '',
      '{lang=javascript}',
      '    var foo = 1;',
      '    var bar = {cat: dog};'
      ].join('\n')).contents,
    ['',
     '',
     '```javascript',
     'var foo = 1;',
     'var bar = {cat: dog};',
     '```',
     ''
    ].join('\n'))


  t.end();
})


