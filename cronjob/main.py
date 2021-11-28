import os

from redis import Redis

conn = Redis.from_url(os.getenv("REDIS_URL", "redis://redis/0"))

bender_names = conn.keys()
bender_dict = dict(
    [(name.decode("utf-8"), conn.get(name).decode("utf-8")) for name in bender_names]
)

elements_count = {}

for name, element in bender_dict.items():
    if element not in elements_count:
        elements_count[element] = 0
    elements_count[element] += 1

print(elements_count)
