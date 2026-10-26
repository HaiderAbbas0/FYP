# PCAP Dataset Overview

- **Generated:** 2026-10-26 16:53:29
- **Data folder:** `C:\Users\PC\Desktop\Model Detection\data`
- **PCAP files found:** 15
- **Analysed per file:** the first 5,000 packets

Each PCAP is converted to a table with one row per packet. Only columns that contain data in a file are listed for that file (for example, Bluetooth captures have no IP addresses).

## Column reference

| Column | Meaning |
| --- | --- |
| `packet_no` | Packet position in the file (1-based) |
| `timestamp` | Capture time, Unix epoch seconds |
| `length` | Packet length in bytes |
| `src_mac` | Source MAC address (Ethernet) |
| `dst_mac` | Destination MAC address (Ethernet) |
| `src_ip` | Source IP address (IPv4 / IPv6 / ARP sender) |
| `dst_ip` | Destination IP address (IPv4 / IPv6 / ARP target) |
| `src_port` | Source TCP/UDP port |
| `dst_port` | Destination TCP/UDP port |
| `ttl` | IPv4 TTL / IPv6 hop limit |
| `tcp_flags` | TCP flags (S=SYN, A=ACK, F=FIN, R=RST, P=PSH, ...) |
| `top_layer` | Highest recognised protocol layer |
| `layers` | Full protocol stack, outermost to innermost |

---

## 1. `Benign_test.pcap`

- **Path:** `Benign_test.pcap`
- **File size:** 93.52 MB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-09-14 12:24:14 UTC
- **Top protocols (analysed packets):** TCP 4,999, UDP 1

**Columns (13):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `tcp_flags`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | tcp_flags | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1694694254.461693 | 1514 | 8c:ae:4c:dd:1e:39 | 00:27:10:cb:17:60 | 91.189.91.82 | 192.168.137.250 | 80 | 40558 | 56 | A | TCP | Ether/IP/TCP/Raw |
| 2 | 1694694254.4619 | 1514 | 8c:ae:4c:dd:1e:39 | 00:27:10:cb:17:60 | 91.189.91.82 | 192.168.137.250 | 80 | 40558 | 56 | A | TCP | Ether/IP/TCP/Raw |
| 3 | 1694694254.461901 | 1514 | 8c:ae:4c:dd:1e:39 | 00:27:10:cb:17:60 | 91.189.91.82 | 192.168.137.250 | 80 | 40558 | 56 | A | TCP | Ether/IP/TCP/Raw |
| 4 | 1694694254.46206 | 1514 | 8c:ae:4c:dd:1e:39 | 00:27:10:cb:17:60 | 91.189.91.82 | 192.168.137.250 | 80 | 40558 | 56 | A | TCP | Ether/IP/TCP/Raw |
| 5 | 1694694254.462147 | 1514 | 8c:ae:4c:dd:1e:39 | 00:27:10:cb:17:60 | 91.189.91.82 | 192.168.137.250 | 80 | 40558 | 56 | A | TCP | Ether/IP/TCP/Raw |

---

## 2. `MQTT-DDoS-Connect_Flood_test.pcap`

- **Path:** `MQTT-DDoS-Connect_Flood_test.pcap`
- **File size:** 338.12 MB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-08-29 20:27:55 UTC
- **Top protocols (analysed packets):** TCP 5,000

**Columns (13):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `tcp_flags`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | tcp_flags | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693340875.76712 | 66 | a8:6b:ad:1f:9b:e5 | dc:a6:32:dc:27:d5 | 192.168.137.250 | 192.168.137.48 | 1883 | 35865 | 64 | FA | TCP | Ether/IP/TCP |
| 2 | 1693340875.76712 | 74 | a8:6b:ad:1f:9b:e5 | dc:a6:32:c9:e4:ab | 192.168.137.250 | 192.168.137.212 | 1883 | 55285 | 64 | SA | TCP | Ether/IP/TCP |
| 3 | 1693340875.76712 | 70 | a8:6b:ad:1f:9b:e5 | dc:a6:32:dc:27:d5 | 192.168.137.250 | 192.168.137.48 | 1883 | 60265 | 64 | PA | TCP | Ether/IP/TCP/Raw |
| 4 | 1693340875.767151 | 70 | a8:6b:ad:1f:9b:e5 | dc:a6:32:dc:27:d5 | 192.168.137.250 | 192.168.137.48 | 1883 | 49579 | 64 | PA | TCP | Ether/IP/TCP/Raw |
| 5 | 1693340875.767151 | 70 | a8:6b:ad:1f:9b:e5 | dc:a6:32:dc:27:d5 | 192.168.137.250 | 192.168.137.48 | 1883 | 36397 | 64 | PA | TCP | Ether/IP/TCP/Raw |

---

## 3. `MQTT-DDoS-Publish_Flood_test.pcap`

- **Path:** `MQTT-DDoS-Publish_Flood_test.pcap`
- **File size:** 315.77 MB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-08-29 20:05:46 UTC
- **Top protocols (analysed packets):** TCP 4,998, UDP 2

**Columns (13):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `tcp_flags`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | tcp_flags | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693339546.221156 | 876 | dc:a6:32:c9:e4:ab | a8:6b:ad:1f:9b:e5 | 192.168.137.212 | 192.168.137.250 | 45960 | 1883 | 64 | PA | TCP | Ether/IP/TCP/Raw |
| 2 | 1693339546.221445 | 1514 | dc:a6:32:c9:e4:ab | a8:6b:ad:1f:9b:e5 | 192.168.137.212 | 192.168.137.250 | 45960 | 1883 | 64 | A | TCP | Ether/IP/TCP/Raw |
| 3 | 1693339546.221748 | 66 | a8:6b:ad:1f:9b:e5 | dc:a6:32:c9:e5:a4 | 192.168.137.250 | 192.168.137.156 | 1883 | 58252 | 64 | A | TCP | Ether/IP/TCP |
| 4 | 1693339546.221748 | 60 | a8:6b:ad:1f:9b:e5 | dc:a6:32:c9:e5:a4 | 192.168.137.250 | 192.168.137.156 | 1883 | 58248 | 64 | R | TCP | Ether/IP/TCP/Padding |
| 5 | 1693339546.221748 | 60 | a8:6b:ad:1f:9b:e5 | dc:a6:32:c9:e5:a4 | 192.168.137.250 | 192.168.137.156 | 1883 | 58248 | 64 | R | TCP | Ether/IP/TCP/Padding |

---

## 4. `MQTT-DoS-Connect_Flood_test.pcap`

- **Path:** `MQTT-DoS-Connect_Flood_test.pcap`
- **File size:** 25.91 MB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-08-28 18:32:58 UTC
- **Top protocols (analysed packets):** TCP 4,996, UDP 3, DHCP 1

**Columns (13):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `tcp_flags`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | tcp_flags | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693247578.319242 | 60 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 43103 | 1883 | 64 | R | TCP | Ether/IP/TCP/Padding |
| 2 | 1693247578.319243 | 60 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 43103 | 1883 | 64 | R | TCP | Ether/IP/TCP/Padding |
| 3 | 1693247578.319245 | 66 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 55715 | 1883 | 64 | A | TCP | Ether/IP/TCP |
| 4 | 1693247578.319324 | 66 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 49185 | 1883 | 64 | A | TCP | Ether/IP/TCP |
| 5 | 1693247578.3195 | 66 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 59935 | 1883 | 64 | A | TCP | Ether/IP/TCP |

---

## 5. `MQTT-DoS-Publish_Flood_test.pcap`

- **Path:** `MQTT-DoS-Publish_Flood_test.pcap`
- **File size:** 225.97 MB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-08-29 17:28:00 UTC
- **Top protocols (analysed packets):** TCP 4,999, UDP 1

**Columns (13):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `tcp_flags`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | tcp_flags | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693330080.443891 | 66 | a8:6b:ad:1f:9b:e5 | dc:a6:32:dc:27:d5 | 192.168.137.250 | 192.168.137.48 | 1883 | 52180 | 64 | A | TCP | Ether/IP/TCP |
| 2 | 1693330080.443891 | 66 | a8:6b:ad:1f:9b:e5 | dc:a6:32:dc:27:d5 | 192.168.137.250 | 192.168.137.48 | 1883 | 51986 | 64 | A | TCP | Ether/IP/TCP |
| 3 | 1693330080.443891 | 66 | a8:6b:ad:1f:9b:e5 | dc:a6:32:dc:27:d5 | 192.168.137.250 | 192.168.137.48 | 1883 | 51800 | 64 | A | TCP | Ether/IP/TCP |
| 4 | 1693330080.443918 | 66 | a8:6b:ad:1f:9b:e5 | dc:a6:32:dc:27:d5 | 192.168.137.250 | 192.168.137.48 | 1883 | 51708 | 64 | A | TCP | Ether/IP/TCP |
| 5 | 1693330080.443918 | 66 | a8:6b:ad:1f:9b:e5 | dc:a6:32:dc:27:d5 | 192.168.137.250 | 192.168.137.48 | 1883 | 52148 | 64 | A | TCP | Ether/IP/TCP |

---

## 6. `TCP_IP-DDoS-ICMP1_test.pcap`

- **Path:** `TCP_IP-DDoS-ICMP1_test.pcap`
- **File size:** 1.10 GB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-09-06 17:00:33 UTC
- **Top protocols (analysed packets):** ICMP 4,953, TCP 47

**Columns (13):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `tcp_flags`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | tcp_flags | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1694019633.795036 | 1494 | 44:61:32:e8:88:2f | 8c:ae:4c:dd:1e:39 | 192.168.137.174 | 13.225.193.148 | 39076 | 443 | 64 | A | TCP | Ether/IP/TCP/Raw |
| 2 | 1694019633.795036 | 1494 | 44:61:32:e8:88:2f | 8c:ae:4c:dd:1e:39 | 192.168.137.174 | 13.225.193.148 | 39076 | 443 | 64 | A | TCP | Ether/IP/TCP/Raw |
| 3 | 1694019633.795036 | 1494 | 44:61:32:e8:88:2f | 8c:ae:4c:dd:1e:39 | 192.168.137.174 | 13.225.193.148 | 39076 | 443 | 64 | A | TCP | Ether/IP/TCP/Raw |
| 4 | 1694019633.795036 | 1494 | 44:61:32:e8:88:2f | 8c:ae:4c:dd:1e:39 | 192.168.137.174 | 13.225.193.148 | 39076 | 443 | 64 | A | TCP | Ether/IP/TCP/Raw |
| 5 | 1694019633.795036 | 1494 | 44:61:32:e8:88:2f | 8c:ae:4c:dd:1e:39 | 192.168.137.174 | 13.225.193.148 | 39076 | 443 | 64 | A | TCP | Ether/IP/TCP/Raw |

---

## 7. `TCP_IP-DDoS-ICMP2_test.pcap`

- **Path:** `TCP_IP-DDoS-ICMP2_test.pcap`
- **File size:** 1.39 GB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-09-05 19:49:38 UTC
- **Top protocols (analysed packets):** ICMP 4,999, TCP 1

**Columns (13):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `tcp_flags`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | tcp_flags | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693943378.270438 | 60 | dc:a6:32:c9:e5:a4 | 00:27:10:cb:17:60 | 192.168.137.156 | 192.168.137.250 |  |  | 64 |  | ICMP | Ether/IP/ICMP/Padding |
| 2 | 1693943378.270438 | 60 | dc:a6:32:c9:e5:a4 | 00:27:10:cb:17:60 | 192.168.137.156 | 192.168.137.250 |  |  | 64 |  | ICMP | Ether/IP/ICMP/Padding |
| 3 | 1693943378.270439 | 60 | dc:a6:32:c9:e5:a4 | 00:27:10:cb:17:60 | 192.168.137.156 | 192.168.137.250 |  |  | 64 |  | ICMP | Ether/IP/ICMP/Padding |
| 4 | 1693943378.270439 | 60 | dc:a6:32:c9:e5:a4 | 00:27:10:cb:17:60 | 192.168.137.156 | 192.168.137.250 |  |  | 64 |  | ICMP | Ether/IP/ICMP/Padding |
| 5 | 1693943378.270439 | 60 | dc:a6:32:c9:e5:a4 | 00:27:10:cb:17:60 | 192.168.137.156 | 192.168.137.250 |  |  | 64 |  | ICMP | Ether/IP/ICMP/Padding |

---

## 8. `TCP_IP-DDoS-SYN_test.pcap`

- **Path:** `TCP_IP-DDoS-SYN_test.pcap`
- **File size:** 1.26 GB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-09-05 15:43:29 UTC
- **Top protocols (analysed packets):** TCP 5,000

**Columns (13):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `tcp_flags`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | tcp_flags | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693928609.809045 | 60 | dc:a6:32:c9:e4:d5 | 44:61:32:e8:88:2f | 192.168.137.37 | 192.168.137.174 | 32975 | 36936 | 64 | R | TCP | Ether/IP/TCP/Padding |
| 2 | 1693928609.809046 | 60 | dc:a6:32:c9:e4:d5 | 44:61:32:e8:88:2f | 192.168.137.37 | 192.168.137.174 | 33342 | 36936 | 64 | S | TCP | Ether/IP/TCP/Padding |
| 3 | 1693928609.809046 | 60 | dc:a6:32:c9:e4:d5 | 44:61:32:e8:88:2f | 192.168.137.37 | 192.168.137.174 | 33345 | 36936 | 64 | S | TCP | Ether/IP/TCP/Padding |
| 4 | 1693928609.809046 | 60 | dc:a6:32:c9:e4:d5 | 44:61:32:e8:88:2f | 192.168.137.37 | 192.168.137.174 | 33344 | 36936 | 64 | S | TCP | Ether/IP/TCP/Padding |
| 5 | 1693928609.809047 | 60 | dc:a6:32:c9:e4:d5 | 44:61:32:e8:88:2f | 192.168.137.37 | 192.168.137.174 | 32977 | 36936 | 64 | R | TCP | Ether/IP/TCP/Padding |

---

## 9. `TCP_IP-DDoS-TCP_test.pcap`

- **Path:** `TCP_IP-DDoS-TCP_test.pcap`
- **File size:** 1.30 GB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-09-05 14:02:54 UTC
- **Top protocols (analysed packets):** TCP 5,000

**Columns (13):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `tcp_flags`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | tcp_flags | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693922574.980618 | 60 | dc:a6:32:dc:27:d5 | 00:27:10:cb:17:60 | 192.168.137.48 | 192.168.137.250 | 55543 | 1883 | 64 |  | TCP | Ether/IP/TCP/Padding |
| 2 | 1693922574.980619 | 60 | dc:a6:32:c9:e4:ab | 00:27:10:cb:17:60 | 192.168.137.212 | 192.168.137.250 | 7626 | 1883 | 64 |  | TCP | Ether/IP/TCP/Padding |
| 3 | 1693922574.980619 | 60 | dc:a6:32:dc:27:d5 | 00:27:10:cb:17:60 | 192.168.137.48 | 192.168.137.250 | 55544 | 1883 | 64 |  | TCP | Ether/IP/TCP/Padding |
| 4 | 1693922574.980619 | 60 | dc:a6:32:dc:27:d5 | 00:27:10:cb:17:60 | 192.168.137.48 | 192.168.137.250 | 55546 | 1883 | 64 |  | TCP | Ether/IP/TCP/Padding |
| 5 | 1693922574.9807 | 60 | dc:a6:32:c9:e4:ab | 00:27:10:cb:17:60 | 192.168.137.212 | 192.168.137.250 | 7627 | 1883 | 64 |  | TCP | Ether/IP/TCP/Padding |

---

## 10. `TCP_IP-DDoS-UDP1_test.pcap`

- **Path:** `TCP_IP-DDoS-UDP1_test.pcap`
- **File size:** 1.47 GB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-09-05 18:09:09 UTC
- **Top protocols (analysed packets):** UDP 5,000

**Columns (12):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693937349.443722 | 60 | dc:a6:32:c9:e4:ab | a8:6b:ad:1f:9b:e5 | 192.168.137.212 | 192.168.137.250 | 52965 | 38278 | 64 | UDP | Ether/IP/UDP/Raw/Padding |
| 2 | 1693937349.443723 | 60 | dc:a6:32:c9:e4:ab | a8:6b:ad:1f:9b:e5 | 192.168.137.212 | 192.168.137.250 | 52965 | 38278 | 64 | UDP | Ether/IP/UDP/Raw/Padding |
| 3 | 1693937349.443723 | 60 | dc:a6:32:c9:e4:ab | a8:6b:ad:1f:9b:e5 | 192.168.137.212 | 192.168.137.250 | 52965 | 38278 | 64 | UDP | Ether/IP/UDP/Raw/Padding |
| 4 | 1693937349.443736 | 60 | dc:a6:32:c9:e4:ab | a8:6b:ad:1f:9b:e5 | 192.168.137.212 | 192.168.137.250 | 52965 | 38278 | 64 | UDP | Ether/IP/UDP/Raw/Padding |
| 5 | 1693937349.443736 | 60 | dc:a6:32:c9:e4:ab | a8:6b:ad:1f:9b:e5 | 192.168.137.212 | 192.168.137.250 | 52965 | 38278 | 64 | UDP | Ether/IP/UDP/Raw/Padding |

---

## 11. `TCP_IP-DDoS-UDP2_test.pcap`

- **Path:** `TCP_IP-DDoS-UDP2_test.pcap`
- **File size:** 1.13 GB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-09-05 18:18:43 UTC
- **Top protocols (analysed packets):** UDP 4,999, ARP 1

**Columns (12):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693937923.616378 | 60 | dc:a6:32:c9:e4:ab | f4:b1:9c:c9:79:ff | 192.168.137.212 | 192.168.137.105 | 55241 | 3825 | 64 | UDP | Ether/IP/UDP/Raw/Padding |
| 2 | 1693937923.616378 | 60 | dc:a6:32:c9:e4:ab | f4:b1:9c:c9:79:ff | 192.168.137.212 | 192.168.137.105 | 55241 | 3825 | 64 | UDP | Ether/IP/UDP/Raw/Padding |
| 3 | 1693937923.616379 | 60 | dc:a6:32:c9:e4:ab | f4:b1:9c:c9:79:ff | 192.168.137.212 | 192.168.137.105 | 55241 | 3825 | 64 | UDP | Ether/IP/UDP/Raw/Padding |
| 4 | 1693937923.616379 | 60 | dc:a6:32:c9:e4:ab | f4:b1:9c:c9:79:ff | 192.168.137.212 | 192.168.137.105 | 55241 | 3825 | 64 | UDP | Ether/IP/UDP/Raw/Padding |
| 5 | 1693937923.616379 | 60 | dc:a6:32:c9:e4:ab | f4:b1:9c:c9:79:ff | 192.168.137.212 | 192.168.137.105 | 55241 | 3825 | 64 | UDP | Ether/IP/UDP/Raw/Padding |

---

## 12. `TCP_IP-DoS-ICMP_test.pcap`

- **Path:** `TCP_IP-DoS-ICMP_test.pcap`
- **File size:** 737.35 MB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-09-01 17:57:01 UTC
- **Top protocols (analysed packets):** ICMP 5,000

**Columns (10):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `ttl`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | ttl | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693591021.151104 | 60 | dc:a6:32:dc:27:d5 | 00:27:10:cb:17:60 | 192.168.137.48 | 192.168.137.250 | 64 | ICMP | Ether/IP/ICMP/Padding |
| 2 | 1693591021.151106 | 60 | dc:a6:32:dc:27:d5 | 00:27:10:cb:17:60 | 192.168.137.48 | 192.168.137.250 | 64 | ICMP | Ether/IP/ICMP/Padding |
| 3 | 1693591021.151107 | 60 | dc:a6:32:dc:27:d5 | 00:27:10:cb:17:60 | 192.168.137.48 | 192.168.137.250 | 64 | ICMP | Ether/IP/ICMP/Padding |
| 4 | 1693591021.151144 | 60 | dc:a6:32:dc:27:d5 | 00:27:10:cb:17:60 | 192.168.137.48 | 192.168.137.250 | 64 | ICMP | Ether/IP/ICMP/Padding |
| 5 | 1693591021.153462 | 60 | 00:27:10:cb:17:60 | dc:a6:32:dc:27:d5 | 192.168.137.250 | 192.168.137.48 | 64 | ICMP | Ether/IP/ICMP/Padding |

---

## 13. `TCP_IP-DoS-SYN_test.pcap`

- **Path:** `TCP_IP-DoS-SYN_test.pcap`
- **File size:** 714.82 MB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-08-31 15:11:38 UTC
- **Top protocols (analysed packets):** TCP 5,000

**Columns (13):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `tcp_flags`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | tcp_flags | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693494698.199676 | 60 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 55313 | 1883 | 64 | S | TCP | Ether/IP/TCP/Padding |
| 2 | 1693494698.199677 | 60 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 55315 | 1883 | 64 | S | TCP | Ether/IP/TCP/Padding |
| 3 | 1693494698.199679 | 60 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 55314 | 1883 | 64 | S | TCP | Ether/IP/TCP/Padding |
| 4 | 1693494698.199682 | 60 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 55056 | 1883 | 64 | R | TCP | Ether/IP/TCP/Padding |
| 5 | 1693494698.199683 | 60 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 55055 | 1883 | 64 | R | TCP | Ether/IP/TCP/Padding |

---

## 14. `TCP_IP-DoS-TCP_test.pcap`

- **Path:** `TCP_IP-DoS-TCP_test.pcap`
- **File size:** 617.51 MB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-08-30 18:19:38 UTC
- **Top protocols (analysed packets):** TCP 4,998, UDP 2

**Columns (13):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `tcp_flags`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | tcp_flags | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693419578.769855 | 60 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 10526 | 1883 | 64 |  | TCP | Ether/IP/TCP/Padding |
| 2 | 1693419578.769855 | 60 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 10528 | 1883 | 64 |  | TCP | Ether/IP/TCP/Padding |
| 3 | 1693419578.769855 | 60 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 10531 | 1883 | 64 |  | TCP | Ether/IP/TCP/Padding |
| 4 | 1693419578.769949 | 60 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 10533 | 1883 | 64 |  | TCP | Ether/IP/TCP/Padding |
| 5 | 1693419578.769949 | 60 | dc:a6:32:dc:27:d5 | a8:6b:ad:1f:9b:e5 | 192.168.137.48 | 192.168.137.250 | 10534 | 1883 | 64 |  | TCP | Ether/IP/TCP/Padding |

---

## 15. `TCP_IP-DoS-UDP_test.pcap`

- **Path:** `TCP_IP-DoS-UDP_test.pcap`
- **File size:** 1000.89 MB
- **Link type:** Ethernet (type 1)
- **Packets:** 5,000 analysed
- **First packet:** 2023-09-01 14:15:45 UTC
- **Top protocols (analysed packets):** UDP 4,997, ARP 1, TCP 1, UDPerror 1

**Columns (13):** `packet_no`, `timestamp`, `length`, `src_mac`, `dst_mac`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `ttl`, `tcp_flags`, `top_layer`, `layers`

**First 5 rows:**

| packet_no | timestamp | length | src_mac | dst_mac | src_ip | dst_ip | src_port | dst_port | ttl | tcp_flags | top_layer | layers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1693577745.89509 | 60 | dc:a6:32:dc:27:d5 | 00:27:10:cb:17:60 | 192.168.137.48 | 192.168.137.250 | 50338 | 36729 | 64 |  | UDP | Ether/IP/UDP/Raw/Padding |
| 2 | 1693577745.895091 | 60 | dc:a6:32:dc:27:d5 | 00:27:10:cb:17:60 | 192.168.137.48 | 192.168.137.250 | 50338 | 36729 | 64 |  | UDP | Ether/IP/UDP/Raw/Padding |
| 3 | 1693577745.895091 | 60 | dc:a6:32:dc:27:d5 | 00:27:10:cb:17:60 | 192.168.137.48 | 192.168.137.250 | 50338 | 36729 | 64 |  | UDP | Ether/IP/UDP/Raw/Padding |
| 4 | 1693577745.895091 | 60 | dc:a6:32:dc:27:d5 | 00:27:10:cb:17:60 | 192.168.137.48 | 192.168.137.250 | 50338 | 36729 | 64 |  | UDP | Ether/IP/UDP/Raw/Padding |
| 5 | 1693577745.895188 | 60 | dc:a6:32:dc:27:d5 | 00:27:10:cb:17:60 | 192.168.137.48 | 192.168.137.250 | 50338 | 36729 | 64 |  | UDP | Ether/IP/UDP/Raw/Padding |

---

