let io;

// Initialize Socket.IO with the server
function initSocket(server) {
    const { Server } = require('socket.io');
    io = new Server(server, {
        cors: { origin: "*" }
    });
    return io;
}

// Get the Socket.IO instance
function getIO() {
    if (!io) throw new Error("Socket.IO not initialized");
    return io;
}

module.exports = { initSocket, getIO };