const express = require('express');
const http = require('http');
const WebSocket = require('ws');

let latestFrameBuffer = null;
const mjpegClients = [];
const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

const BOUNDARY = '--frame';

app.get('/video_feed', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=' + BOUNDARY,
    'Cache-Control': 'no-cache',
    'Connection': 'close',
    'Pragma': 'no-cache'
  });

  mjpegClients.push(res);
  req.on('close', () => {
    const idx = mjpegClients.indexOf(res);
    if (idx !== -1) mjpegClients.splice(idx, 1);
  });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    const base64Data = message.toString().replace(/^data:image\/jpeg;base64,/, '');
    const frameBuffer = Buffer.from(base64Data, 'base64');
    latestFrameBuffer = frameBuffer;

    mjpegClients.forEach((res) => {
      try {
        res.write(`${BOUNDARY}\r\n`);
        res.write('Content-Type: image/jpeg\r\n\r\n');
        res.write(frameBuffer);
        res.write('\r\n');
      } catch (err) {
        // Ignore disconnected clients
      }
    });
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

const PORT = process.env.PORT;
if (!PORT) throw new Error("PORT environment variable is not set");

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});






// const WebSocket = require('ws');

// const wss = new WebSocket.Server({ port: 3000 });

// wss.on('connection', function connection(ws) {
//   console.log('Client connected');

//   ws.on('message', function incoming(message) {
//     console.log('Received:', message);
//     ws.send(`Server received: ${message}`);
//   });

//   ws.on('close', () => {
//     console.log('Client disconnected');
//   });
// });

// console.log('WebSocket server started on ws://localhost:3000');

// index.js
// const express   = require('express');
// const http      = require('http');
// const WebSocket = require('ws');
// const fs        = require('fs');
// const path      = require('path');

// // In‐memory buffer for the latest JPEG frame
// let latestFrameBuffer = null;

// // List of HTTP response objects subscribing to /video_feed
// const mjpegClients = [];

// const app = express();

// // CORS headers (so Unity or browsers on different hosts can connect)
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   next();
// });

// // MJPEG boundary string
// const BOUNDARY = '--frame';

// // HTTP endpoint: serves MJPEG stream
// app.get('/video_feed', (req, res) => {
//   // Set headers for MJPEG multipart response
//   res.writeHead(200, {
//     'Content-Type': 'multipart/x-mixed-replace; boundary=' + BOUNDARY,
//     'Cache-Control': 'no-cache',
//     'Connection': 'close',
//     'Pragma': 'no-cache'
//   });

//   // Add this client’s response to the list
//   mjpegClients.push(res);

//   // When the client disconnects, remove from list
//   req.on('close', () => {
//     const idx = mjpegClients.indexOf(res);
//     if (idx !== -1) mjpegClients.splice(idx, 1);
//   });
// });

// // Create HTTP server and attach Express
// const server = http.createServer(app);

// // Create WebSocket server on the same HTTP server
// const wss = new WebSocket.Server({ server });

// let counter = 0;  
// const IMAGES_DIR = path.join(__dirname, 'images');

// // Ensure images directory exists (for optional disk debugging)
// if (!fs.existsSync(IMAGES_DIR)) {
//   fs.mkdirSync(IMAGES_DIR, { recursive: true });
// }

// wss.on('connection', (ws) => {
//   console.log('WebSocket client connected');

//   ws.on('message', (message) => {
//     // message is a Buffer containing "data:image/jpeg;base64,...."
//     const base64String = message.toString();
//     // Remove the data URI prefix, if present
//     const base64Data = base64String.replace(/^data:image\/jpeg;base64,/, '');
//     // Decode base64 to raw JPEG bytes
//     const frameBuffer = Buffer.from(base64Data, 'base64');

//     // (Optional) Save each frame to disk for debugging
//     const filename = `webcam_${Date.now()}_${counter++}.jpg`;
//     const filePath = path.join(IMAGES_DIR, filename);
//     fs.writeFile(filePath, frameBuffer, (err) => {
//       if (err) console.error('Failed to save image:', err);
//       else console.log(`Image saved: ${filename}`);
//     });

//     // Update our in-memory “latestFrameBuffer”
//     latestFrameBuffer = frameBuffer;

//     // Broadcast this frame to all currently connected MJPEG HTTP clients
//     mjpegClients.forEach((res) => {
//       try {
//         res.write(`${BOUNDARY}\r\n`);
//         res.write('Content-Type: image/jpeg\r\n\r\n');
//         res.write(frameBuffer);
//         res.write('\r\n');
//       } catch (err) {
//         // If writing fails (e.g. client disconnected), ignore.
//       }
//     });
//   });

//   ws.on('close', () => {
//     console.log('WebSocket client disconnected');
//   });
// });

// // Listen on the port Render assigns (or 3001 locally)
// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => {
//   console.log(`HTTP+WebSocket server listening on port ${PORT}`);
// });



//This works completely:
// const WebSocket = require('ws');
// const fs = require('fs');
// const path = require('path');

// const port = process.env.PORT || 3001;
// const wss = new WebSocket.Server({ port });

// let counter = 0;

// console.log(`WebSocket server listening on port ${port}`);

// wss.on('connection', (ws) => {
//   console.log('Client connected');

//   ws.on('message', (message) => {
//     const base64String = message.toString();
//     const base64Data = base64String.replace(/^data:image\/jpeg;base64,/, '');

//     const buffer = Buffer.from(base64Data, 'base64');

//     const imagesDir = path.join(__dirname, 'images');
//     if (!fs.existsSync(imagesDir)) {
//       fs.mkdirSync(imagesDir, { recursive: true });
//     }

//     const filename = `webcam_${Date.now()}_${counter++}.jpg`;
//     const filePath = path.join(imagesDir, filename);

//     fs.writeFile(filePath, buffer, (err) => {
//       if (err) {
//         console.error('Failed to save image:', err);
//       } else {
//         console.log(`Image saved: ${filename}`);
//       }
//     });
//   });

//   ws.on('close', () => {
//     console.log('Client disconnected');
//   });
// });
// 





