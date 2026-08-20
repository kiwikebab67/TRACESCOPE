import unittest
import os
import sys
import zipfile
import io
import struct

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.dex_parser import DexParser, extract_apk_dex_data

class TestAPKDecompiler(unittest.TestCase):

    def setUp(self):
        self.apk_path = 'test_mock_app.apk'
        
        # Build DEX file dynamically
        header_size = 0x70
        string_count = 2
        offsets_table_size = string_count * 4
        
        string1 = b'Lcom/example/malware/MainActivity;'
        string2 = b'http://evil-c2.com'
        
        string1_data = bytes([len(string1)]) + string1 + b'\x00'
        string2_data = bytes([len(string2)]) + string2 + b'\x00'
        
        off1 = header_size + offsets_table_size
        off2 = off1 + len(string1_data)
        
        string_offsets = struct.pack('<II', off1, off2)
        
        dex_header = bytearray(header_size)
        dex_header[0:8] = b'dex\n035\x00'
        dex_header[0x28:0x2c] = b'\x78\x56\x34\x12' # Endian tag
        dex_header[0x38:0x3c] = struct.pack('<I', string_count)
        dex_header[0x3c:0x40] = struct.pack('<I', header_size)
        
        dex_data = bytearray()
        dex_data.extend(dex_header)
        dex_data.extend(string_offsets)
        dex_data.extend(string1_data)
        dex_data.extend(string2_data)
        
        dex_data[0x20:0x24] = struct.pack('<I', len(dex_data))
        
        with zipfile.ZipFile(self.apk_path, 'w') as z:
            z.writestr('classes.dex', dex_data)

    def tearDown(self):
        if os.path.exists(self.apk_path):
            os.remove(self.apk_path)

    def test_dex_string_extraction(self):
        result = extract_apk_dex_data(self.apk_path)
        self.assertEqual(result.get('status'), 'success')
        self.assertEqual(result.get('raw_strings_count'), 2)
        
        sensitive = result.get('sensitive_strings', [])
        self.assertIn("http://evil-c2.com", sensitive)

if __name__ == '__main__':
    unittest.main()
