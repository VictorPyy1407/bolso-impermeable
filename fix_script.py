import os

path = "script.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace from "fireTracking('meta:Lead', () => trackMeta('Lead', payload));\n"
# to "  if (colorSelect) colorSelect.value = color;\n  if (summaryColor) summaryColor.textContent = color;\n}"

start_str = "fireTracking('meta:Lead', () => trackMeta('Lead', payload));"
end_str = "  if (colorSelect) colorSelect.value = color;"

if start_str in content and end_str in content:
    start_idx = content.find(start_str) + len(start_str) + 1
    end_idx = content.find(end_str)
    
    insert_block = """    },
  };
  events[eventName]?.();
}

// Map thumbnail index to color name (index 0 = PROD default, no color)
const thumbIndexToColor = {
  0: null,
  1: 'Rosa',
  2: 'Lila',
  3: 'Gris'
};

// Map color name to image source
const colorToImageSrc = {
  'Rosa': 'img/rosa.jpeg',
  'Lila': 'img/Lila.jpeg',
  'Gris': 'img/Gris.jpg'
};

function updateColorDropdowns(color) {
  const colorSelect = document.querySelector('#colorSelect');
  const summaryColor = document.querySelector('#summaryColor');

"""
    
    new_content = content[:start_idx] + insert_block + content[end_idx:]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed script.js")
else:
    print("Could not find start_str or end_str")
