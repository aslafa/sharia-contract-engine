import os, base64

def png_to_svg(png_path, svg_path, w, h):
    with open(png_path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('ascii')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <image href="data:image/png;base64,{b64}" x="0" y="0" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet" />
</svg>'''
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg)

os.makedirs('public', exist_ok=True)
png_to_svg('public/sce-logo.png', 'public/sce-logo.svg', 748, 358)
png_to_svg('public/sce-logo-white.png', 'public/sce-logo-white.svg', 748, 358)
png_to_svg('public/sce-symbol.png', 'public/sce-symbol.svg', 748, 316)
png_to_svg('public/sce-icon.png', 'public/sce-icon.svg', 192, 192)
png_to_svg('public/sce-favicon.png', 'public/sce-favicon.svg', 32, 32)
print('Generated all official SVGs successfully!')

