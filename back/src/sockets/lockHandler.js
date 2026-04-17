// In-memory lock store : { nodeId -> { socketId, email, lockedAt } }
const locks = {};

// Delay before auto-releasing a lock (in ms) - security in case of disconnect
const LOCK_TIMEOUT_MS = 30000;
const lockTimers = {};

function lockHandler(io, socket) {

    // Client requests to lock a node before editing
    socket.on("lock:request", ({ nodeId, email }) => {
        const existing = locks[nodeId];

        // Node already locked by someone else
        if (existing && existing.socketId !== socket.id) {
            socket.emit("lock:denied", {
                nodeId,
                message: `Ce noeud est en cours d'édition par ${existing.email}`
            });
            return;
        }

        // Clear previous timer if re-locking
        if (lockTimers[nodeId]) clearTimeout(lockTimers[nodeId]);

        // Lock the node
        locks[nodeId] = { socketId: socket.id, email, lockedAt: Date.now() };

        // Confirm to the requester
        socket.emit("lock:granted", { nodeId });

        // Notify all other clients
        socket.broadcast.emit("lock:taken", { nodeId, email });

        // Auto-release after timeout (safety net)
        lockTimers[nodeId] = setTimeout(() => {
            releaseLock(nodeId, io);
        }, LOCK_TIMEOUT_MS);

        console.log(`Lock granted on node ${nodeId} for ${email}`);
    });

    // Client releases the lock (save or cancel)
    socket.on("lock:release", ({ nodeId }) => {
        releaseLock(nodeId, io);
    });

    // Auto-release all locks if client disconnects
    socket.on("disconnect", () => {
        for (const nodeId in locks) {
            if (locks[nodeId].socketId === socket.id) {
                console.log(`Auto-releasing lock on node ${nodeId} after disconnect`);
                releaseLock(nodeId, io);
            }
        }
    });
}

// Release a lock and notify all clients
function releaseLock(nodeId, io) {
    if (!locks[nodeId]) return;
    delete locks[nodeId];
    if (lockTimers[nodeId]) {
        clearTimeout(lockTimers[nodeId]);
        delete lockTimers[nodeId];
    }
    io.emit("lock:released", { nodeId });
    console.log(`Lock released on node ${nodeId}`);
}

// Check if a node is locked (used by graphController)
function isLocked(nodeId, socketId) {
    const lock = locks[nodeId];
    if (!lock) return false;
    // Not locked if it's the same socket asking
    return lock.socketId !== socketId;
}

module.exports = { lockHandler, isLocked };