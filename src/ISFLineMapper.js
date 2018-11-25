function getMainLine(src) {
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    console.log('line', lines[i]);
    if (lines[i].indexOf('main()') !== -1) return i;
  }
  return -1;
}

export default function mapGLErrorToISFLine(error, glsl, isf) {
  const glslMainLine = getMainLine(glsl);
  const isfMainLine = getMainLine(isf);
  const regex = /ERROR: (\d+):(\d+): (.*)/g;
  const matches = regex.exec(error.message);
  const glslErrorLine = matches[2];
  const isfErrorLine = parseInt(glslErrorLine, 10) + isfMainLine - glslMainLine;
  return isfErrorLine;
}
