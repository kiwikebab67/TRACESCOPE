import os

downloads_dir = os.path.expanduser("~/Downloads")

def create_pcap():
    filepath = os.path.join(downloads_dir, "suspicious_traffic.pcap")
    try:
        from scapy.all import wrpcap, Ether, IP, TCP, UDP, DNS, DNSQR, Raw
        
        # Create some real packets
        packets = []
        # DNS request for C2
        dns_req = Ether()/IP(dst="8.8.8.8", src="192.168.1.100")/UDP(dport=53)/DNS(rd=1, qd=DNSQR(qname="rx-c2-panel.xyz"))
        packets.append(dns_req)
        
        # TCP Handshake to C2
        syn = Ether()/IP(dst="185.220.101.4", src="192.168.1.100")/TCP(dport=443, flags="S")
        packets.append(syn)
        
        # HTTP payload (beacon)
        http = Ether()/IP(dst="185.220.101.4", src="192.168.1.100")/TCP(dport=80, flags="PA")/Raw(load="GET /beacon?id=4919 HTTP/1.1\r\nHost: rx-c2-panel.xyz\r\n\r\n")
        packets.append(http)
        
        wrpcap(filepath, packets)
        print("Generated real .pcap file with scapy.")
    except Exception as e:
        print("Could not generate pcap:", str(e))

def create_mem():
    filepath = os.path.join(downloads_dir, "win10_ram_dump.raw")
    content = bytearray(os.urandom(1024 * 50)) # 50 KB of junk
    
    # Inject real artifacts into the binary blob for the Python parser to find
    artifacts = [
        b"http://rx-c2-panel.xyz/payload.exe",
        b"185.220.101.4",
        b"powershell.exe",
        b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xFF\xFF\x00\x00\xb8\x00\x00\x00This program cannot be run in DOS mode"
    ]
    
    for a in artifacts:
        # inject at random offsets
        import random
        offset = random.randint(100, 40000)
        content[offset:offset+len(a)] = a
        
    with open(filepath, "wb") as f:
        f.write(content)
    print("Generated real .raw memory dump file.")

create_pcap()
create_mem()
