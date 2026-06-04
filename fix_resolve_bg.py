import sys

with open('src/components/slides/RenderSlide.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if 'function resolveBackground(' in line:
        new_lines.append(line)
        new_lines.append('  slide: Slide,\n')
        new_lines.append('  settings: { backgroundMode: "color" | "image"; backgroundColor: string; backgroundImage?: string },\n')
        new_lines.append('): { color?: string; image?: string } {\n')
        new_lines.append('  const sb = slide.background;\n')
        new_lines.append('  if (sb) {\n')
        new_lines.append('    if (sb.startsWith("url(")) return { image: sb.slice(4, -1).replace(/^[\\'"]|[\\'"]$/g, "") };\n')
        new_lines.append('    if (sb.includes("://") || sb.startsWith("/") || sb.match(/\\.(png|jpg|jpeg|webp|gif|svg)$|\\?/)) return { image: sb };\n')
        new_lines.append('    return { color: sb };\n')
        new_lines.append('  }\n')
        skip = True
    elif skip and line.strip() == '}':
        new_lines.append('  if (settings.backgroundMode === "image") {\n')
        new_lines.append('    if (settings.backgroundImage) return { image: settings.backgroundImage };\n')
        new_lines.append('    if (settings.backgroundColor) return { color: settings.backgroundColor };\n')
        new_lines.append('  }\n')
        new_lines.append('  if (settings.backgroundMode === "color" && settings.backgroundColor) return { color: settings.backgroundColor };\n')
        new_lines.append('  return {};\n')
        new_lines.append('}\n')
        skip = False
    elif not skip:
        new_lines.append(line)

with open('src/components/slides/RenderSlide.tsx', 'w') as f:
    f.writelines(new_lines)
