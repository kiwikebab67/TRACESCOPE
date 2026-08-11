import os
import shutil
from PIL import Image

# Create test directory
test_dir = r"C:\Users\KARTIKEY\OneDrive\Documents\TRACESCOPE\test_evidence"
os.makedirs(test_dir, exist_ok=True)

# 1. Generate Test Image for ELA
img = Image.new('RGB', (800, 600), color = (73, 109, 137))
# Add some "fake" manipulated pixels
for i in range(100, 200):
    for j in range(100, 200):
        img.putpixel((i, j), (255, 0, 0))

image_path = os.path.join(test_dir, 'test_image.jpg')
img.save(image_path, quality=90, format='JPEG')
print(f"Created ELA Test Image: {image_path}")

# 2. Copy a valid PE executable for Speakeasy Sandbox
# We will use notepad.exe as a harmless "test" binary that still has valid PE headers and API calls
source_exe = r"C:\Windows\System32\notepad.exe"
dest_exe = os.path.join(test_dir, 'test_malware.exe')
if os.path.exists(source_exe):
    shutil.copy(source_exe, dest_exe)
    print(f"Copied Test Executable: {dest_exe}")
else:
    print("Could not find notepad.exe for testing.")
