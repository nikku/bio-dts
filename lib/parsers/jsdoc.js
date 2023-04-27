function skipWhitespace(str, pos) {
  let i = pos;

  let char;
  for (; (char = str.charAt(i)) && char !== '\n' && /\s/.test(char); i++) {

    // ignore
  }

  return i;
}

function skipText(str, pos) {
  let i = pos;
  let char;

  for (; (char = str.charAt(i)) && /\S/.test(char); i++) {

    // ignore
  }

  return i;
}

function findClose(str, pos, openChar, closeChar) {

  if (str.charAt(pos) !== openChar) {
    return false;
  }

  let char;

  let i = pos;

  let open = 0;

  while ((char = str.charAt(i++))) {
    switch (char) {
    case openChar:
      open++;
      break;
    case closeChar:
      if (--open === 0) {
        return {
          start: pos,
          end: i,
          value: str.substring(pos, i)
        };
      }
      break;
    }
  }
}

function findNewline(str, pos) {

  let i = pos;
  let char;

  for (; (char = str.charAt(i)) && /[^\n]/.test(char); i++) {

    // ignore
  }

  return i;
}

export function parse(str) {

  var i = 0, j;

  var tags = [];
  var tag;

  while ((i = str.indexOf('@', i)) && i !== -1) {
    j = i + 1;
    tag = {
      start: i
    };

    // parse tag name
    j = skipText(str, i);

    tag.name = str.substring(i + 1, j);

    i = skipWhitespace(str, j);

    // parse type
    if ([ 'param', 'return', 'returns', 'typedef', 'template' ].includes(tag.name)) {

      let match = findClose(str, i, '{', '}');

      if (match) {
        tag.type = match;

        i = skipWhitespace(str, match.end);
      }
    }

    // parse param
    if ([ 'param', 'typedef', 'template' ].includes(tag.name)) {

      let match = tag.name === 'param' && findClose(str, i, '[', ']');

      if (match) {
        tag.param = match;

        const contents = tag.param.contents = str.substring(match.start + 1, match.end - 1);
        const idxEq = contents.indexOf('=');

        tag.param.name = idxEq !== -1 ? contents.substring(0, idxEq).trim() : contents;
      } else {
        j = skipText(str, i);

        tag.param = {
          start: i,
          end: j,
          name: str.substring(i, j),
          value: str.substring(i, j)
        };
      }

      i = skipWhitespace(str, tag.param.end);
    }

    j = findNewline(str, i);

    tag.description = i !== j ? {
      start: i,
      end: j,
      value: str.substring(i, j)
    } : null;

    tag.end = j;

    tags.push(tag);

    i = j + 1;
  }

  return tags;
}

export function dbg(str, pos) {

  const arr = Array.from(str);

  arr.splice(pos, 0, '|');

  return arr.join('');
}

export function replace(str, range, contents) {
  const arr = Array.from(str);

  arr.splice(range.start, range.end - range.start, contents);

  return arr.join('');
}