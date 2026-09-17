import time
from typing import Dict, List
from collections import defaultdict
import threading

class SlidingWindowRateLimiter:
    """
    Thread-safe in-memory sliding window rate limiter per client identifier (e.g. IP address).
    Automatically evicts stale timestamps on access.
    """
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            # Filter out timestamps older than the sliding window
            self._requests[key] = [t for t in self._requests[key] if t > window_start]

            if len(self._requests[key]) < self.max_requests:
                self._requests[key].append(now)
                return True
            return False

    def get_remaining(self, key: str) -> int:
        now = time.time()
        window_start = now - self.window_seconds

        with self._lock:
            valid_requests = [t for t in self._requests[key] if t > window_start]
            return max(0, self.max_requests - len(valid_requests))

    def reset(self, key: str = None):
        with self._lock:
            if key:
                self._requests.pop(key, None)
            else:
                self._requests.clear()


# Default rate limiter for public lead ingestion (e.g. max 10 submissions per 60s per IP)
public_lead_rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60)
