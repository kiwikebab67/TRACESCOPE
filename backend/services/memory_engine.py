import os
import sys

# Suppress volatility3 CLI output parsing errors if any
class _SuppressOutput:
    def __enter__(self):
        self._original_stdout = sys.stdout
        self._original_stderr = sys.stderr
        sys.stdout = open(os.devnull, 'w')
        sys.stderr = open(os.devnull, 'w')
    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout.close()
        sys.stderr.close()
        sys.stdout = self._original_stdout
        sys.stderr = self._original_stderr

def run_memory_scan(filepath):
    """
    Programmatically executes Volatility 3 plugins (windows.pstree, windows.netscan)
    against a raw memory dump without invoking the CLI.
    """
    try:
        from volatility3 import framework
        from volatility3.framework import contexts, interfaces, plugins, exceptions
        from volatility3.framework.configuration import requirements
        from volatility3.plugins.windows import pstree, netscan
    except ImportError:
        return {"status": "error", "message": "Volatility 3 framework not installed or configured correctly."}

    try:
        context = contexts.Context()
        
        # Configuration setup for volatility 3
        # We specify the single location (the file) for the framework to construct its layers
        context.config['automagic.LayerStacker.single_location'] = "file:" + filepath
        
        process_tree = []
        network_connections = []
        
        # We must suppress stdout because volatility's automagics often print warnings to stdout
        with _SuppressOutput():
            # Run automagic to construct the memory layers
            automagics = framework.import_files(framework.volatility.framework.automagic, True)
            framework.automagic.choose_automagic(automagics, framework.plugins.windows.pstree.PsTree)
            
            # --- 1. Run windows.pstree.PsTree ---
            try:
                plugin_pstree = pstree.PsTree(context, context.config_path)
                tree_gen = plugin_pstree.run()
                for level, proc in tree_gen.get_generator()():
                    process_tree.append({
                        "pid": proc.UniqueProcessId,
                        "ppid": proc.InheritedFromUniqueProcessId,
                        "image": proc.ImageFileName.cast("string", max_length=proc.ImageFileName.vol.count, errors='replace'),
                        "level": level
                    })
            except Exception as e:
                process_tree.append({"error": f"PsTree Failed: {str(e)}"})
                
            # --- 2. Run windows.netscan.NetScan ---
            try:
                plugin_netscan = netscan.NetScan(context, context.config_path)
                net_gen = plugin_netscan.run()
                for obj in net_gen.get_generator()():
                    # Netscan yields a tuple of attributes depending on the object
                    # Simplified extraction:
                    try:
                        proto = obj[0]
                        local_addr = obj[1]
                        local_port = obj[2]
                        foreign_addr = obj[3]
                        foreign_port = obj[4]
                        state = obj[5]
                        pid = obj[6]
                        owner = obj[7]
                        network_connections.append({
                            "protocol": proto,
                            "local": f"{local_addr}:{local_port}",
                            "foreign": f"{foreign_addr}:{foreign_port}",
                            "state": state,
                            "pid": pid,
                            "owner": owner
                        })
                    except:
                        pass
            except Exception as e:
                network_connections.append({"error": f"NetScan Failed: {str(e)}"})

        return {
            "status": "success",
            "process_tree": process_tree[:100], # Limit output size
            "network_connections": network_connections[:100],
            "total_processes": len(process_tree),
            "total_connections": len(network_connections)
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
