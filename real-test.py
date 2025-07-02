import sys
import asyncio
import json
import websockets

PHX_SOCKET_URL = "ws://localhost:4000/socket/websocket"
REF = 1


async def send_join(ws, topic):
    join_payload = {
        "topic": topic,
        "event": "phx_join",
        "payload": {},
        "ref": REF,
    }
    await ws.send(json.dumps(join_payload))
    print(f"→ joined {topic}")


async def heartbeat(ws, topic, interval=30):
    """Phoenix channels expect regular heartbeats, otherwise the server will drop you."""
    ref = REF + 1
    while True:
        hb = dict(
            topic="phoenix",
            event="heartbeat",
            payload={},
            ref=str(ref),
        )
        await ws.send(json.dumps(hb))
        print("→ heartbeat")
        await asyncio.sleep(interval)


async def consumer(ws):
    """Print out anything the server sends us."""
    async for raw in ws:
        msg = json.loads(raw)
        print("←", msg)


async def producer(ws, topic, user):
    """Example: send a message every 2 seconds."""
    ref = REF + 2
    while True:
        msg = dict(
            topic=topic,
            event="new_msg",
            payload={"body": user, "from": "_blender"},
            ref=str(ref),
        )
        await ws.send(json.dumps(msg))
        # print("→ new_msg")
        await asyncio.sleep(2)


async def hello(user: str):
    topic = f"room_channel:{user}"
    async with websockets.connect(PHX_SOCKET_URL) as ws:
        # 1) join the channel
        await send_join(ws, topic)

        # 2) then concurrently run:
        #    - heartbeat so Phoenix won't timeout us
        #    - consumer to receive any incoming events
        #    - producer to send our periodic messages (or you can replace this with an input loop)
        await asyncio.gather(
            heartbeat(ws, topic),
            consumer(ws),
            producer(ws, topic, user),
        )


room_id = "wilton"
try:
    asyncio.run(hello(room_id))
except KeyboardInterrupt:
    print("KeyboardInterrupt, shutting down.")
    sys.exit(0)
