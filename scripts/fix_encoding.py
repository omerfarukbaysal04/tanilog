#!/usr/bin/env python3
"""
Fix double-encoded UTF-8 Turkish characters in frontend files.
These files were saved with Latin-1 encoding but contain bytes that are
UTF-8 encoded Turkish characters that got double-encoded.
"""
import os
import glob

def fix_file(path):
    with open(path, 'rb') as f:
        raw = f.read()
    
    # Try to decode as latin-1 first, then re-encode as proper utf-8
    # This handles the case where utf-8 bytes were stored as latin-1 text and then re-encoded
    try:
        # Decode raw bytes as latin-1 (each byte becomes a unicode char)
        latin1_text = raw.decode('latin-1')
        # Now re-encode as latin-1 bytes (which gives us the original raw bytes)
        # Then decode those as utf-8 (which was the original encoding)
        original_bytes = latin1_text.encode('latin-1')
        try:
            correct_text = original_bytes.decode('utf-8')
            # Check if it has valid Turkish chars now
            if any(c in correct_text for c in 'şŞğĞıİöÖüÜçÇ'):
                # Write back as proper UTF-8
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(correct_text)
                return True
        except UnicodeDecodeError:
            pass
    except Exception:
        pass
    return False

src_dir = r'c:\Users\Hp\Desktop\tanilog\frontend\src'
fixed = []
for ext in ['*.jsx', '*.js']:
    for path in glob.glob(os.path.join(src_dir, '**', ext), recursive=True):
        if fix_file(path):
            fixed.append(os.path.basename(path))

print(f"Fixed {len(fixed)} files:")
for f in fixed:
    print(f"  - {f}")
print("Done!")
