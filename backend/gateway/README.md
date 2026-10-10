# Isolated laboratory gateway

This optional Linux service supplies the actuator endpoints consumed by
`app.lab_gateway.HttpLabExecutor`. It changes actual forwarded traffic on the
registered lab gateway. Activation requires `IDS_GATEWAY_LAB_ENABLED=true`, a
Bearer token of at least 32 characters, and explicit private IPv4 target/source
registration. It must run with one worker on the gateway that forwards traffic
between the attack segment and the registered device segment.

## Registration and operation

Set `IDS_GATEWAY_TARGETS_JSON` to a JSON object such as:

```json
{
  "SN-02": {
    "ip": "10.20.1.22",
    "source_subnet": "10.20.2.0/24",
    "device_class": "medical-sensor",
    "criticality": "Low",
    "packets_per_second": 100,
    "connection_limit": 20
  }
}
```

The attack source subnet must be an RFC1918 network excluding the target. Rate
and connection thresholds come from this operator registration; requests cannot
choose addresses, subnets or thresholds. `IDS_GATEWAY_PROTECTED_SOURCES_JSON`
lists clinical source addresses excluded from every control. Unknown targets
are rejected. Blocking and isolation are prohibited for Critical targets and
known life critical device classes.

From `backend`, launch `uvicorn gateway.agent:create_app --factory --port 8100
--workers 1` on the isolated Linux gateway after configuring the environment.
The optional Compose profile is in `backend/gateway/compose.yaml`; use
`docker compose -f backend/gateway/compose.yaml --profile lab-gateway up --build`
only on that gateway. It uses host networking and drops all capabilities except
`NET_ADMIN`. The service refuses activation unless explicitly enabled. The
implementation and automated tests do not execute firewall changes on Windows.

Configure the pipeline with the same `IDS_LAB_GATEWAY_TOKEN`, gateway URL,
registered target IDs and `IDS_LAB_SENSOR_ID`. Tokens belong in environment
configuration, never request URLs. Use an isolated management network or TLS
reverse proxy for gateway access.

## Action contract and owned firewall state

Authenticated endpoints are `POST /actions`, `GET /receipts/{key}`, `POST
/rollbacks`, `GET /rollback-receipts/{key}` and `GET /counters/{target}`.
`HttpLabExecutor` builds the complete request including canonical action,
duration, policy hash, authorization expiry and idempotency key. Request expiry,
duration, class, registration and exact key binding are independently validated.
The gateway persists intent before an effect and receipt after it. Duplicate
keys return the existing receipt; conflicting requests fail. Ambiguous effects
are never automatically replayed. One target can have one active action.

The nftables driver invokes only `/usr/sbin/nft` through argv and stdin. All
changes belong to the `inet iomt_ids_lab` table and its ownership marker chain.
It never flushes the system ruleset or alters another table. Each control
references a private target-address set element with a kernel timeout. The rule
becomes inactive when the lease expires even if the Python process crashes.
The service also removes expired owned rules and persists rollback receipts.
Restart atomically replaces only the table identified by its ownership marker,
records prior pending/applied controls as rolled back, and performs no replay.
Existing tables without the marker cause startup rejection.

`upstream_rate_limit` and `upstream_prefix_ratelimit` impose a packet rate limit
on the registered attack subnet toward the registered target. The latter uses
the explicit registered prefix; neither accepts an arbitrary incoming prefix.
`connection_cap` bounds tracked new connections for that source/target scope.
`temp_source_block` and `device_isolate` drop traffic from the registered attack
segment to the target; isolation is deliberately limited to this registered lab
segment. Clinical sources outside that scope continue under existing firewall
policy. Kernel syntax follows the official nftables
[connection limit documentation](https://wiki.nftables.org/wiki-nftables/index.php/Connlimits).

## Independent traffic instrumentation

`IDS_GATEWAY_SENSOR_JSON` defaults to `/sensor/latest.json`, mounted read only.
An independent traffic observer must atomically replace this snapshot. The
gateway does not derive malicious suppression from its firewall counters, from
actuator receipts or from health checks. A latest snapshot has this shape:

```json
{
  "samples": {
    "SN-02": {
      "target_id": "SN-02",
      "sensor_id": "independent-lab-sensor",
      "provenance": "live_lab",
      "timestamp": 1791640000.0,
      "malicious_packets": 25000,
      "legitimate_attempts": 500,
      "legitimate_successes": 498,
      "latency_ms": 12.5
    }
  }
}
```

Counters are cumulative and must be measured from actual observer traffic.
The timestamp is the actual sample time. `malicious_packets` counts malicious
packets reaching the target; legitimate attempts/successes measure legitimate
delivery independently. Latency is independently observed legitimate request
latency. Missing, stale, fixture, wrong-sensor and wrong-target snapshots return
503. Set `IDS_GATEWAY_SENSOR_ID` to the observer's stable identifier. Default
maximum age is five seconds. The pipeline requires monotonic baseline and
post-action samples with sustained observation before recording a reusable
measured success.

## Checks

`python -m unittest tests.test_gateway_service -v` uses a mocked nftables driver
and temporary durable journals. It covers expiry, restart recovery, receipts,
authorization, target-class restrictions, missing/stale sensor data and fixed
executable/owned-table constraints. Real forwarding and nftables activation
remain checks on the isolated Linux lab hardware.
