#!/usr/bin/env python3
"""
Fix formatting of .hbs template files by ensuring proper line breaks.
This is a simpler approach that just ensures basic readability.
"""

import os
import re
from pathlib import Path

def fix_template_formatting(file_path):
    """Fix basic formatting issues in template files."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if file already has reasonable formatting
    lines = content.split('\n')
    if len(lines) > 10:  # File already has line breaks
        return False
    
    # Add line breaks after imports
    content = re.sub(r"(import[^;]+from\s+['\"][^'\"]+['\"])", r"\1\n", content)
    
    # Add line breaks between major statements
    content = re.sub(r"\s+(import\s)", r"\n\1", content)
    content = re.sub(r"\s+(export\s)", r"\n\1", content)
    content = re.sub(r"\s+(describe\()", r"\n\n\1", content)
    content = re.sub(r"\s+(it\()", r"\n\n  \1", content)
    content = re.sub(r"\s+(beforeEach\()", r"\n\n  \1", content)
    content = re.sub(r"\}\)\s+", r"})\n", content)
    
    # Add line breaks after semicolons
    content = re.sub(r";\s*([a-zA-Z])", r";\n\1", content)
    
    # Add line breaks after closing braces followed by text
    content = re.sub(r"\}\s+([a-zA-Z])", r"}\n\1", content)
    
    # Clean up excessive whitespace
    content = re.sub(r"\n\n\n+", r"\n\n", content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

def main():
    templates_dir = Path("templates")
    fixed_count = 0
    
    for hbs_file in templates_dir.rglob("*.hbs"):
        if fix_template_formatting(hbs_file):
            print(f"Fixed: {hbs_file}")
            fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")

if __name__ == "__main__":
    main()