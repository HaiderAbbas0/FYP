"""Dedicated queue worker: python worker.py (API may run separately)."""
import asyncio
import signal

from app.main import RUNS, _execute_run
from app.worker_runtime import RunWorkerService


async def serve():
    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, stop.set)
        except NotImplementedError:  # Windows
            signal.signal(sig, lambda *_: loop.call_soon_threadsafe(stop.set))
    service = RunWorkerService(RUNS, _execute_run)
    service.start()
    try:
        await stop.wait()
    finally:
        await service.stop()


if __name__ == '__main__':
    asyncio.run(serve())
