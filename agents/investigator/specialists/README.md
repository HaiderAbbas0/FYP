# Specialist workers

`agent.py` owns the worker registry and bounded dispatch for log, traffic, device, history and threat evidence. Workers consume `DetectorEvent` and context and return `SpecialistResult`. The shared process executor is `backend/app/worker_runtime.py`; timed-out or failed workers become evidence gaps. Worker registration and behavior remain together during this structural migration.
