import struct
import io
import os
import zipfile

def read_uleb128(stream):
    result = 0
    shift = 0
    while True:
        b = stream.read(1)
        if not b:
            break
        val = ord(b)
        result |= (val & 0x7f) << shift
        if (val & 0x80) == 0:
            break
        shift += 7
    return result

class DexParser:
    def __init__(self, dex_data):
        self.stream = io.BytesIO(dex_data)
        self.parse_header()
        self.parse_strings()
        self.parse_types()
        self.parse_protos()
        self.parse_fields()
        self.parse_methods()
        self.parse_classes()

    def parse_header(self):
        self.stream.seek(0)
        header = self.stream.read(0x70)
        self.magic = header[0:8]
        self.file_size = struct.unpack('<I', header[0x20:0x24])[0]
        self.string_ids_size = struct.unpack('<I', header[0x38:0x3c])[0]
        self.string_ids_off = struct.unpack('<I', header[0x3c:0x40])[0]
        self.type_ids_size = struct.unpack('<I', header[0x40:0x44])[0]
        self.type_ids_off = struct.unpack('<I', header[0x44:0x48])[0]
        self.proto_ids_size = struct.unpack('<I', header[0x48:0x4c])[0]
        self.proto_ids_off = struct.unpack('<I', header[0x4c:0x50])[0]
        self.field_ids_size = struct.unpack('<I', header[0x50:0x54])[0]
        self.field_ids_off = struct.unpack('<I', header[0x54:0x58])[0]
        self.method_ids_size = struct.unpack('<I', header[0x58:0x5c])[0]
        self.method_ids_off = struct.unpack('<I', header[0x5c:0x60])[0]
        self.class_defs_size = struct.unpack('<I', header[0x60:0x64])[0]
        self.class_defs_off = struct.unpack('<I', header[0x64:0x68])[0]

    def parse_strings(self):
        self.strings = []
        self.stream.seek(self.string_ids_off)
        offsets = [struct.unpack('<I', self.stream.read(4))[0] for _ in range(self.string_ids_size)]
        
        for off in offsets:
            self.stream.seek(off)
            length = read_uleb128(self.stream)
            data = self.stream.read(length)
            data = data.split(b'\x00')[0]
            self.strings.append(data.decode('utf-8', errors='ignore'))

    def parse_types(self):
        self.stream.seek(self.type_ids_off)
        self.types = []
        for _ in range(self.type_ids_size):
            descriptor_idx = struct.unpack('<I', self.stream.read(4))[0]
            self.types.append(self.strings[descriptor_idx] if descriptor_idx < len(self.strings) else "Unknown")

    def parse_protos(self):
        self.protos = []
        self.stream.seek(self.proto_ids_off)
        for _ in range(self.proto_ids_size):
            shorty_idx = struct.unpack('<I', self.stream.read(4))[0]
            return_type_idx = struct.unpack('<I', self.stream.read(4))[0]
            parameters_off = struct.unpack('<I', self.stream.read(4))[0]
            self.protos.append({
                'shorty': self.strings[shorty_idx] if shorty_idx < len(self.strings) else "",
                'return_type': self.types[return_type_idx] if return_type_idx < len(self.types) else "",
                'parameters_off': parameters_off
            })

    def parse_fields(self):
        self.fields = []
        self.stream.seek(self.field_ids_off)
        for _ in range(self.field_ids_size):
            class_idx = struct.unpack('<H', self.stream.read(2))[0]
            type_idx = struct.unpack('<H', self.stream.read(2))[0]
            name_idx = struct.unpack('<I', self.stream.read(4))[0]
            self.fields.append({
                'class': self.types[class_idx] if class_idx < len(self.types) else "",
                'type': self.types[type_idx] if type_idx < len(self.types) else "",
                'name': self.strings[name_idx] if name_idx < len(self.strings) else ""
            })

    def parse_methods(self):
        self.methods = []
        self.stream.seek(self.method_ids_off)
        for _ in range(self.method_ids_size):
            class_idx = struct.unpack('<H', self.stream.read(2))[0]
            proto_idx = struct.unpack('<H', self.stream.read(2))[0]
            name_idx = struct.unpack('<I', self.stream.read(4))[0]
            self.methods.append({
                'class': self.types[class_idx] if class_idx < len(self.types) else "",
                'proto': self.protos[proto_idx] if proto_idx < len(self.protos) else None,
                'name': self.strings[name_idx] if name_idx < len(self.strings) else ""
            })

    def parse_classes(self):
        self.classes = {}
        self.stream.seek(self.class_defs_off)
        class_defs = []
        for _ in range(self.class_defs_size):
            class_idx = struct.unpack('<I', self.stream.read(4))[0]
            access_flags = struct.unpack('<I', self.stream.read(4))[0]
            superclass_idx = struct.unpack('<I', self.stream.read(4))[0]
            interfaces_off = struct.unpack('<I', self.stream.read(4))[0]
            source_file_idx = struct.unpack('<I', self.stream.read(4))[0]
            annotations_off = struct.unpack('<I', self.stream.read(4))[0]
            class_data_off = struct.unpack('<I', self.stream.read(4))[0]
            static_values_off = struct.unpack('<I', self.stream.read(4))[0]
            
            class_defs.append({
                'class': self.types[class_idx] if class_idx < len(self.types) else "Unknown",
                'superclass': self.types[superclass_idx] if superclass_idx < len(self.types) else "Unknown",
                'source_file': self.strings[source_file_idx] if source_file_idx < len(self.strings) else "Unknown",
                'class_data_off': class_data_off
            })
            
        for c in class_defs:
            if c['class_data_off'] == 0:
                continue
                
            self.stream.seek(c['class_data_off'])
            static_fields_size = read_uleb128(self.stream)
            instance_fields_size = read_uleb128(self.stream)
            direct_methods_size = read_uleb128(self.stream)
            virtual_methods_size = read_uleb128(self.stream)
            
            # Skip fields
            for _ in range(static_fields_size):
                read_uleb128(self.stream)
                read_uleb128(self.stream)
            for _ in range(instance_fields_size):
                read_uleb128(self.stream)
                read_uleb128(self.stream)
                
            methods = []
            
            # Read direct methods
            method_idx = 0
            for _ in range(direct_methods_size):
                method_idx_diff = read_uleb128(self.stream)
                access_flags = read_uleb128(self.stream)
                code_off = read_uleb128(self.stream)
                
                method_idx += method_idx_diff
                if method_idx < len(self.methods):
                    m = self.methods[method_idx]
                    methods.append({
                        'name': m['name'],
                        'class': m['class'],
                        'code_off': code_off
                    })
                    
            # Read virtual methods
            method_idx = 0
            for _ in range(virtual_methods_size):
                method_idx_diff = read_uleb128(self.stream)
                access_flags = read_uleb128(self.stream)
                code_off = read_uleb128(self.stream)
                
                method_idx += method_idx_diff
                if method_idx < len(self.methods):
                    m = self.methods[method_idx]
                    methods.append({
                        'name': m['name'],
                        'class': m['class'],
                        'code_off': code_off
                    })
                    
            self.classes[c['class']] = {
                'superclass': c['superclass'],
                'source_file': c['source_file'],
                'methods': methods
            }

    def decompile_method(self, class_name, method_name):
        c = self.classes.get(class_name)
        if not c:
            return "Class not found."
            
        method = None
        for m in c['methods']:
            if m['name'] == method_name:
                method = m
                break
                
        if not method or method['code_off'] == 0:
            return "Method not found or contains no bytecode."
            
        self.stream.seek(method['code_off'])
        registers_size = struct.unpack('<H', self.stream.read(2))[0]
        ins_size = struct.unpack('<H', self.stream.read(2))[0]
        outs_size = struct.unpack('<H', self.stream.read(2))[0]
        tries_size = struct.unpack('<H', self.stream.read(2))[0]
        debug_info_off = struct.unpack('<I', self.stream.read(4))[0]
        insns_size = struct.unpack('<I', self.stream.read(4))[0]
        
        insns = [struct.unpack('<H', self.stream.read(2))[0] for _ in range(insns_size)]
        
        lines = []
        lines.append(f"// Registers: {registers_size}, Inputs: {ins_size}, Outputs: {outs_size}")
        lines.append(f"public {method_name}() {{")
        
        i = 0
        while i < len(insns):
            op = insns[i] & 0xff
            if op == 0x00: # nop
                lines.append("    nop")
                i += 1
            elif op == 0x1a: # const-string
                reg = (insns[i] >> 8) & 0xff
                str_idx = insns[i+1]
                val = self.strings[str_idx] if str_idx < len(self.strings) else ""
                lines.append(f"    v{reg} = \"{val}\";")
                i += 2
            elif op == 0x12: # const/4
                reg = (insns[i] >> 8) & 0xf
                val = (insns[i] >> 12) & 0xf
                if val & 0x8:
                    val -= 16
                lines.append(f"    v{reg} = {val};")
                i += 1
            elif op == 0x0e: # return-void
                lines.append("    return;")
                i += 1
            elif op == 0x0f: # return
                reg = (insns[i] >> 8) & 0xff
                lines.append(f"    return v{reg};")
                i += 1
            elif op in [0x6e, 0x6f, 0x70, 0x71, 0x72]: # invoke-*
                met_idx = insns[i+1]
                m_info = self.methods[met_idx] if met_idx < len(self.methods) else None
                m_name = m_info['name'] if m_info else "unknownMethod"
                m_class = m_info['class'] if m_info else "UnknownClass"
                lines.append(f"    invoke {m_class}->{m_name}();")
                i += 3
            else:
                lines.append(f"    // Opcode 0x{op:02x}")
                i += 1
                
        lines.append("}")
        return "\n".join(lines)

def extract_apk_dex_data(apk_path):
    if not zipfile.is_zipfile(apk_path):
        return {"error": "Invalid APK archive."}
        
    with zipfile.ZipFile(apk_path, 'r') as z:
        dex_files = [name for name in z.namelist() if name.startswith('classes') and name.endswith('.dex')]
        if not dex_files:
            return {"error": "No DEX files found."}
            
        dex_data = z.read(dex_files[0])
        parser = DexParser(dex_data)
        
        decompiled_structure = {}
        for class_name, info in parser.classes.items():
            methods_list = []
            for m in info['methods']:
                methods_list.append({
                    'name': m['name'],
                    'code_available': m['code_off'] > 0
                })
            decompiled_structure[class_name] = {
                'superclass': info['superclass'],
                'source_file': info['source_file'],
                'methods': methods_list
            }
            
        sensitive_strings = []
        import re
        ip_re = re.compile(r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$')
        url_re = re.compile(r'^http[s]?://')
        
        for s in parser.strings:
            if ip_re.match(s) or url_re.match(s) or any(kw in s.lower() for kw in ['api_key', 'token', 'secret', 'password']):
                sensitive_strings.append(s)
                
        return {
            "status": "success",
            "classes": decompiled_structure,
            "sensitive_strings": list(set(sensitive_strings))[:50],
            "raw_strings_count": len(parser.strings)
        }
