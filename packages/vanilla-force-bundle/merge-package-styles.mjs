/** Keep optional styles near the editor rules so ZIP compression can reuse similar CSS. */
export function mergePackageStyles(themeCss, optionalCss, filename) {
  const insertIdx = themeCss.indexOf('li.hidden{');
  if (insertIdx >= 0) {
    return `${themeCss.slice(0, insertIdx)}${optionalCss}\n${themeCss.slice(insertIdx)}`;
  }

  console.warn(`Could not find the optional styles insertion marker in "${filename}"; appending styles instead. ZIP size may increase.`);
  return `${themeCss}\n${optionalCss}`;
}
