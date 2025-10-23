# Web Terminal Application

A full-fledged web-based terminal application with SSH and RDP support. Access remote servers directly from your browser with a modern, intuitive interface.

## Features

- **SSH Support**: Connect to remote servers via SSH with password or private key authentication
- **RDP Support**: Connect to Windows machines using Remote Desktop Protocol (via Apache Guacamole)
- **Web-based Terminal**: Full terminal emulation using xterm.js with proper colors and fonts
- **Connection Management**: Save and manage multiple SSH/RDP connections
- **Real-time Communication**: WebSocket-based for low-latency terminal interaction
- **Secure Authentication**: Session-based authentication with bcrypt password hashing
- **Modern UI**: Clean, dark-themed interface built with React and TypeScript
- **Docker Ready**: Easy deployment with Docker and Docker Compose

## Tech Stack

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **WebSocket (ws)** for real-time communication
- **ssh2** library for SSH connections
- **Guacamole protocol** for RDP support
- **Express Session** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **xterm.js** for terminal emulation
- **Axios** for API calls
- Responsive design with modern CSS

## Project Structure

```
web-terminal-app/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Main server entry point
│   │   ├── types/                # TypeScript type definitions
│   │   ├── routes/               # Express routes (auth, connections)
│   │   └── services/             # Business logic (SSH, RDP, WebSocket)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx              # React entry point
│   │   ├── App.tsx               # Main app component
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API and WebSocket services
│   │   ├── types/                # TypeScript types
│   │   └── styles/               # Global styles
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml            # Docker Compose configuration
├── Dockerfile.backend            # Backend Docker image
├── Dockerfile.frontend           # Frontend Docker image
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- SSH access to remote servers (for SSH connections)
- Apache Guacamole daemon (optional, for RDP support)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd web-terminal-app
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on http://localhost:3001

5. **Start the frontend (in a new terminal)**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on http://localhost:5173

6. **Login**
   - Default credentials: `demo` / `demo`

### Docker Deployment

1. **Build and start all services**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:3001

3. **Stop services**
   ```bash
   docker-compose down
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Session Secret (change in production!)
SESSION_SECRET=your-secret-key-change-this

# Guacamole Configuration (optional, for RDP)
GUACAMOLE_HOST=localhost
GUACAMOLE_PORT=4822
```

## Usage

### Creating SSH Connections

1. Click "New Connection"
2. Select "SSH" as connection type
3. Fill in the details:
   - Connection Name: A friendly name for this connection
   - Host: SSH server address (e.g., example.com or 192.168.1.100)
   - Port: SSH port (default: 22)
   - Username: SSH username
   - Password or Private Key: Authentication method
4. Click "Save"
5. Click "Connect" to start the terminal session

### Creating RDP Connections

1. Click "New Connection"
2. Select "RDP" as connection type
3. Fill in the details:
   - Connection Name: A friendly name
   - Host: Windows machine address
   - Port: RDP port (default: 3389)
   - Username: Windows username
   - Password: Windows password
   - Domain: (Optional) Windows domain
4. Click "Save"
5. Click "Connect" to start the RDP session

**Note**: RDP requires Apache Guacamole daemon (guacd) to be running. Uncomment the `guacd` service in `docker-compose.yml` for full RDP support.

## Security Considerations

### For Production Deployment

1. **Change Default Credentials**: The demo account should be removed or changed
2. **Use HTTPS**: Always use SSL/TLS in production
3. **Secure Session Secret**: Use a strong, random session secret
4. **Database**: Replace in-memory storage with a proper database
5. **Authentication**: Consider implementing more robust authentication (OAuth, 2FA)
6. **Network Security**: Use firewalls and VPNs to restrict access
7. **Credential Storage**: Never store plain-text passwords
8. **Audit Logging**: Implement comprehensive logging for security audits

### Important Security Notes

- Passwords are hashed using bcryptjs
- Sessions are HTTP-only cookies
- WebSocket connections require valid sessions
- Credentials are never logged or exposed in responses
- In production, use environment-specific secrets

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Connections
- `GET /api/connections` - Get all connections
- `POST /api/connections` - Create new connection
- `GET /api/connections/:id` - Get connection by ID
- `PUT /api/connections/:id` - Update connection
- `DELETE /api/connections/:id` - Delete connection

### WebSocket
- `ws://localhost:3001/terminal` - WebSocket endpoint for terminal connections

## WebSocket Protocol

### Client → Server Messages

```json
{
  "type": "connect",
  "connectionId": "uuid",
  "data": {
    "type": "ssh" | "rdp",
    "config": { ... },
    "cols": 80,
    "rows": 24
  }
}

{
  "type": "data",
  "sessionId": "uuid",
  "data": "base64-encoded-data"
}

{
  "type": "resize",
  "sessionId": "uuid",
  "cols": 120,
  "rows": 30
}

{
  "type": "disconnect",
  "sessionId": "uuid"
}
```

### Server → Client Messages

```json
{
  "type": "connected",
  "sessionId": "uuid",
  "connectionId": "uuid"
}

{
  "type": "data",
  "sessionId": "uuid",
  "data": "base64-encoded-data"
}

{
  "type": "error",
  "sessionId": "uuid",
  "data": "error message"
}

{
  "type": "disconnect",
  "sessionId": "uuid"
}
```

## Troubleshooting

### SSH Connection Issues

- **"Connection refused"**: Check if SSH is enabled on the target server
- **"Authentication failed"**: Verify username and password/key
- **"Network unreachable"**: Check network connectivity and firewall rules

### RDP Connection Issues

- **RDP not working**: Ensure guacd is running (`docker-compose up guacd`)
- **Black screen**: Check RDP server settings and credentials
- **Slow performance**: RDP over web has inherent latency

### General Issues

- **WebSocket disconnects**: Check network stability and firewall settings
- **Terminal not rendering**: Clear browser cache and reload
- **Authentication issues**: Check session cookie settings

## Development

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [xterm.js](https://xtermjs.org/) - Terminal emulation library
- [ssh2](https://github.com/mscdex/ssh2) - SSH client for Node.js
- [Apache Guacamole](https://guacamole.apache.org/) - RDP protocol support
- [React](https://reactjs.org/) - UI framework
- [Express](https://expressjs.com/) - Backend framework

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ using TypeScript, React, and Node.js
