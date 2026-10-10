"""Own one nftables table; bound every control with a kernel timeout set.

Only /usr/sbin/nft is executed, with argv and stdin, never a shell. This module
must only be deployed on the registered isolated Linux lab gateway.
"""
from __future__ import annotations

import hashlib
import ipaddress
import json
import subprocess
from dataclasses import dataclass

TABLE = "iomt_ids_lab"
OWNER_CHAIN = "owner_iomt_ids_v1"
NFT = "/usr/sbin/nft"
PRIVATE = tuple(ipaddress.ip_network(net) for net in ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"))


@dataclass(frozen=True)
class Target:
    target_id: str
    ip: str
    source_subnet: str
    device_class: str
    criticality: str
    packets_per_second: int = 100
    connection_limit: int = 20

    def validate(self) -> None:
        address = ipaddress.ip_address(self.ip)
        source = ipaddress.ip_network(self.source_subnet, strict=True)
        if address.version != 4 or source.version != 4 or not any(address in n for n in PRIVATE) or not any(source.subnet_of(n) for n in PRIVATE):
            raise ValueError("Only explicit RFC1918 IPv4 lab targets and source subnets are supported")
        if address in source:
            raise ValueError("Attack source subnet must not include the protected target")
        if self.criticality not in {"Critical", "High", "Medium", "Low"} or not self.device_class:
            raise ValueError("Target class and criticality are mandatory")
        if not 1 <= self.packets_per_second <= 100000 or not 1 <= self.connection_limit <= 10000:
            raise ValueError("Target rate/connection bounds invalid")


class NftDriver:
    def __init__(self, protected_sources: tuple[str, ...] = (), runner=subprocess.run):
        self.runner = runner
        self.protected_sources = tuple(str(ipaddress.IPv4Address(ip)) for ip in protected_sources)

    def _run(self, args: list[str], script: str | None = None) -> str:
        result = self.runner([NFT, *args], input=script, text=True, capture_output=True,
                             timeout=5, check=False, shell=False)
        if result.returncode != 0:
            raise RuntimeError("Owned nftables operation failed")
        return result.stdout

    def initialize(self) -> None:
        """Atomically clear only our previously identified table on startup."""
        listing = json.loads(self._run(["-j", "list", "tables"]))
        exists = any(item.get("table", {}).get("name") == TABLE and item.get("table", {}).get("family") == "inet"
                     for item in listing.get("nftables", []))
        prefix = ""
        if exists:
            owned = json.loads(self._run(["-j", "list", "table", "inet", TABLE]))
            if not any(item.get("chain", {}).get("name") == OWNER_CHAIN for item in owned.get("nftables", [])):
                raise RuntimeError("Reserved table exists without ownership marker; refusing to alter it")
            prefix = f"delete table inet {TABLE}\n"
        script = prefix + f"add table inet {TABLE}\nadd chain inet {TABLE} {OWNER_CHAIN}\nadd chain inet {TABLE} containment {{ type filter hook forward priority -10; policy accept; }}\n"
        self._run(["-f", "-"], script)

    @staticmethod
    def names(key: str) -> tuple[str, str]:
        digest = hashlib.sha256(key.encode()).hexdigest()[:24]
        return "control_" + digest, "lease_" + digest

    def apply(self, key: str, target: Target, action_name: str, duration_s: int) -> None:
        target.validate()
        if not 1 <= duration_s <= 300:
            raise ValueError("Action duration exceeds kernel lease limit")
        if action_name not in {"upstream_rate_limit", "upstream_prefix_ratelimit", "connection_cap", "temp_source_block", "device_isolate"}:
            raise ValueError("Unsupported actuator action")
        chain, lease = self.names(key)
        condition = f"ip saddr {target.source_subnet} ip daddr @{lease}"
        if self.protected_sources:
            condition += " ip saddr != { " + ", ".join(self.protected_sources) + " }"
        if action_name in {"upstream_rate_limit", "upstream_prefix_ratelimit"}:
            effect = f"limit rate over {target.packets_per_second}/second burst {target.packets_per_second} packets drop"
        elif action_name == "connection_cap":
            effect = f"ct state new ct count over {target.connection_limit} drop"
        else:
            effect = "drop"
        script = (f"add set inet {TABLE} {lease} {{ type ipv4_addr; flags timeout; }}\n"
                  f"add element inet {TABLE} {lease} {{ {target.ip} timeout {duration_s}s }}\n"
                  f"add chain inet {TABLE} {chain}\n"
                  f"add rule inet {TABLE} {chain} {condition} {effect}\n"
                  f'add rule inet {TABLE} containment jump {chain} comment "{chain}"\n')
        self._run(["-f", "-"], script)

    def rollback(self, key: str) -> None:
        chain, lease = self.names(key)
        listing = json.loads(self._run(["-j", "list", "table", "inet", TABLE]))
        objects = listing.get("nftables", [])
        jumps = [item["rule"] for item in objects if item.get("rule", {}).get("chain") == "containment"
                 and item.get("rule", {}).get("comment") == chain]
        script = "".join(f"delete rule inet {TABLE} containment handle {int(rule['handle'])}\n" for rule in jumps)
        if any(item.get("chain", {}).get("name") == chain for item in objects):
            script += f"flush chain inet {TABLE} {chain}\ndelete chain inet {TABLE} {chain}\n"
        if any(item.get("set", {}).get("name") == lease for item in objects):
            script += f"delete set inet {TABLE} {lease}\n"
        if script:
            self._run(["-f", "-"], script)
