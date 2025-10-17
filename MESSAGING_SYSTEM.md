# Messaging System Documentation

## Overview
A complete real-time messaging system with WebSocket support using Socket.io. The system supports direct messaging, group chats, file sharing, message reactions, read receipts, and real-time presence tracking.

## Architecture

### Database Schema

#### 1. **Conversations Table**
- Stores conversation metadata (direct or group)
- Tracks last message timestamp
- Links to creator for group chats

#### 2. **Conversation Participants Table**
- Many-to-many relationship between users and conversations
- Tracks user roles (member/admin) for group chats
- Stores mute preferences and read timestamps
- Records join/leave times

#### 3. **Messages Table**
- Stores all messages with support for multiple types (text, image, video, audio, file, location, system)
- Supports message replies, edits, and soft deletes
- Stores media URLs and metadata

#### 4. **Message Read Receipts Table**
- Tracks when users read specific messages
- Enables "seen by" functionality

#### 5. **Message Reactions Table**
- Stores emoji reactions to messages
- Unique constraint per user per emoji per message

## Socket.io Configuration

### Connection
```javascript
// Client-side connection
const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

### Authentication
Socket connections require JWT authentication. Pass the token in the `auth` object when connecting.

### Events

#### Client → Server Events

1. **conversation:join**
   ```javascript
   socket.emit('conversation:join', conversationId);
   ```

2. **conversation:leave**
   ```javascript
   socket.emit('conversation:leave', conversationId);
   ```

3. **typing:start**
   ```javascript
   socket.emit('typing:start', { conversationId });
   ```

4. **typing:stop**
   ```javascript
   socket.emit('typing:stop', { conversationId });
   ```

5. **message:read**
   ```javascript
   socket.emit('message:read', { messageId, conversationId });
   ```

#### Server → Client Events

1. **user:online**
   ```javascript
   socket.on('user:online', ({ userId }) => {
     // Handle user coming online
   });
   ```

2. **user:offline**
   ```javascript
   socket.on('user:offline', ({ userId }) => {
     // Handle user going offline
   });
   ```

3. **message:new**
   ```javascript
   socket.on('message:new', ({ message }) => {
     // Handle new message
   });
   ```

4. **message:edited**
   ```javascript
   socket.on('message:edited', ({ message }) => {
     // Handle message edit
   });
   ```

5. **message:deleted**
   ```javascript
   socket.on('message:deleted', ({ messageId, conversationId }) => {
     // Handle message deletion
   });
   ```

6. **typing:start**
   ```javascript
   socket.on('typing:start', ({ userId, conversationId }) => {
     // Show typing indicator
   });
   ```

7. **typing:stop**
   ```javascript
   socket.on('typing:stop', ({ userId, conversationId }) => {
     // Hide typing indicator
   });
   ```

8. **messages:read**
   ```javascript
   socket.on('messages:read', ({ userId, messageIds, readAt }) => {
     // Update read receipts
   });
   ```

9. **reaction:added**
   ```javascript
   socket.on('reaction:added', ({ messageId, userId, emoji }) => {
     // Handle reaction
   });
   ```

10. **reaction:removed**
    ```javascript
    socket.on('reaction:removed', ({ reactionId, messageId, userId }) => {
      // Handle reaction removal
    });
    ```

11. **conversation:created**
    ```javascript
    socket.on('conversation:created', ({ conversation }) => {
      // Handle new conversation
    });
    ```

12. **user:left**
    ```javascript
    socket.on('user:left', ({ userId, conversationId }) => {
      // Handle user leaving group
    });
    ```

## REST API Endpoints

### Conversations

#### 1. Get User's Conversations
```http
GET /api/messages/conversations?page=1&limit=20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": {
    "conversations": [...],
    "total": 50,
    "page": 1,
    "totalPages": 3
  }
}
```

#### 2. Create/Get Direct Conversation
```http
POST /api/messages/conversations/direct
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientId": 123
}
```

#### 3. Create Group Conversation
```http
POST /api/messages/conversations/group
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Project Team",
  "participantIds": [123, 456, 789]
}
```

#### 4. Get Conversation Details
```http
GET /api/messages/conversations/:conversationId
Authorization: Bearer {token}
```

#### 5. Leave Conversation
```http
POST /api/messages/conversations/:conversationId/leave
Authorization: Bearer {token}
```

#### 6. Mute/Unmute Conversation
```http
PUT /api/messages/conversations/:conversationId/mute
Authorization: Bearer {token}
Content-Type: application/json

{
  "isMuted": true
}
```

### Messages

#### 1. Get Conversation Messages
```http
GET /api/messages/conversations/:conversationId/messages?page=1&limit=50
Authorization: Bearer {token}
```

#### 2. Send Text Message
```http
POST /api/messages/conversations/:conversationId/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "messageType": "text",
  "content": "Hello, how are you?",
  "replyToId": 456  // Optional
}
```

#### 3. Send Media Message
```http
POST /api/messages/conversations/:conversationId/messages
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "messageType": "image",
  "content": "Check this out!",
  "file": [binary file data]
}
```

#### 4. Edit Message
```http
PUT /api/messages/:messageId
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Updated message content"
}
```

#### 5. Delete Message
```http
DELETE /api/messages/:messageId
Authorization: Bearer {token}
```

#### 6. Mark Messages as Read
```http
POST /api/messages/conversations/:conversationId/read
Authorization: Bearer {token}
Content-Type: application/json

{
  "messageIds": [123, 456, 789]  // Optional, if not provided, updates lastReadAt only
}
```

### Reactions

#### 1. Add Reaction
```http
POST /api/messages/:messageId/reactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "emoji": "👍"
}
```

#### 2. Remove Reaction
```http
DELETE /api/messages/reactions/:reactionId
Authorization: Bearer {token}
```

### Presence

#### 1. Get Online Users
```http
GET /api/messages/online-users
Authorization: Bearer {token}
```

#### 2. Check if User is Online
```http
GET /api/messages/users/:userId/online
Authorization: Bearer {token}
```

## Features

### 1. Direct Messaging
- One-on-one conversations between users
- Automatic conversation creation/retrieval

### 2. Group Messaging
- Create group conversations with multiple participants
- Admin and member roles
- Leave group functionality

### 3. Message Types
- **Text**: Regular text messages
- **Image**: Image uploads with preview
- **Video**: Video file sharing
- **Audio**: Voice/audio messages
- **File**: Document and file sharing
- **Location**: Share location coordinates
- **System**: System-generated messages (user joined, left, etc.)

### 4. Rich Messaging Features
- **Reply to Messages**: Quote and reply to specific messages
- **Edit Messages**: Edit sent messages (with edit indicator)
- **Delete Messages**: Soft delete messages (recoverable if needed)
- **Message Reactions**: React with emojis
- **Read Receipts**: See who read your messages
- **Typing Indicators**: Real-time typing status

### 5. Real-time Features
- Instant message delivery via WebSocket
- Online/offline presence tracking
- Real-time typing indicators
- Live read receipts
- Instant reactions

### 6. User Experience
- **Mute Conversations**: Disable notifications for specific chats
- **Unread Count**: Track unread messages per conversation
- **Last Message Preview**: See the latest message in conversation list
- **Pagination**: Efficient loading of conversations and messages

### 7. File Handling
- Cloudinary integration for media storage
- Support for images, videos, audio, and documents
- File metadata (name, size, type) stored in database

## Installation & Setup

### 1. Run Migration
```bash
cd backend
npm run migrate
```

### 2. Start Server
```bash
npm run dev
```

The messaging system will be automatically initialized with Socket.io.

### 3. Environment Variables
Ensure your `.env` file has:
```env
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Usage Examples

### Frontend Integration Example

```javascript
import { io } from 'socket.io-client';

class MessagingClient {
  constructor(token) {
    this.socket = io('http://localhost:5000', {
      auth: { token }
    });
    
    this.setupListeners();
  }
  
  setupListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to messaging server');
    });
    
    // Join conversation room
    this.socket.on('conversation:join', (conversationId) => {
      this.socket.emit('conversation:join', conversationId);
    });
    
    // Listen for new messages
    this.socket.on('message:new', ({ message }) => {
      // Update UI with new message
      this.addMessageToUI(message);
    });
    
    // Listen for typing indicators
    this.socket.on('typing:start', ({ userId, conversationId }) => {
      this.showTypingIndicator(userId, conversationId);
    });
    
    this.socket.on('typing:stop', ({ userId, conversationId }) => {
      this.hideTypingIndicator(userId, conversationId);
    });
    
    // Listen for read receipts
    this.socket.on('messages:read', ({ userId, messageIds }) => {
      this.updateReadReceipts(userId, messageIds);
    });
    
    // Listen for reactions
    this.socket.on('reaction:added', ({ messageId, userId, emoji }) => {
      this.addReactionToUI(messageId, userId, emoji);
    });
  }
  
  // Send typing indicator
  startTyping(conversationId) {
    this.socket.emit('typing:start', { conversationId });
  }
  
  stopTyping(conversationId) {
    this.socket.emit('typing:stop', { conversationId });
  }
  
  // Join conversation room
  joinConversation(conversationId) {
    this.socket.emit('conversation:join', conversationId);
  }
  
  // Leave conversation room
  leaveConversation(conversationId) {
    this.socket.emit('conversation:leave', conversationId);
  }
  
  // Send message via REST API
  async sendMessage(conversationId, content, type = 'text') {
    const response = await fetch(
      `http://localhost:5000/api/messages/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          messageType: type,
          content
        })
      }
    );
    
    return response.json();
  }
}

// Usage
const token = 'your_jwt_token';
const messaging = new MessagingClient(token);

// Join a conversation
messaging.joinConversation(123);

// Send a message
messaging.sendMessage(123, 'Hello everyone!');

// Send typing indicator
messaging.startTyping(123);
setTimeout(() => messaging.stopTyping(123), 2000);
```

## Best Practices

1. **Join Rooms**: Always emit `conversation:join` before starting to interact with a conversation
2. **Leave Rooms**: Emit `conversation:leave` when navigating away from a conversation to reduce server load
3. **Debounce Typing**: Don't send typing indicators on every keystroke; debounce for better performance
4. **Pagination**: Load messages in chunks to avoid overwhelming the client
5. **Read Receipts**: Mark messages as read when they're visible in the viewport
6. **Error Handling**: Always handle socket disconnection and reconnection events
7. **File Uploads**: Validate file size and type before uploading
8. **Security**: Never trust client-side data; all permissions are verified server-side

## Database Indexes

The system includes optimized indexes for:
- Fast conversation lookups by user
- Efficient message retrieval by conversation
- Quick unread count calculations
- Fast read receipt queries
- Optimized reaction lookups

## Performance Considerations

- Messages are loaded with pagination to reduce payload size
- Socket.io rooms are used to target specific users/conversations
- Database queries are optimized with proper joins and indexes
- Soft deletes allow for message recovery without complexity
- Cloudinary handles media storage to reduce server load

## Security

- JWT authentication required for all Socket.io connections
- Server-side validation of all message operations
- Users can only access conversations they're participants in
- File uploads are validated for size and type
- XSS protection through proper data sanitization

## Troubleshooting

### Socket Not Connecting
- Verify JWT token is valid
- Check CORS configuration
- Ensure server is running on correct port

### Messages Not Appearing
- Confirm user has joined the conversation room
- Check if user is a participant in the conversation
- Verify Socket.io connection is active

### File Uploads Failing
- Check Cloudinary credentials in `.env`
- Verify file size is within limits
- Ensure proper multipart/form-data encoding

## Future Enhancements

- Message search functionality
- Voice/video calling
- Message forwarding
- Conversation archiving
- Message pinning
- Custom emoji reactions
- Message threading
- Broadcast channels
- Message encryption (end-to-end)
- File preview generation
- GIF support
- Stickers

## API Documentation

Full API documentation is available at:
```
http://localhost:5000/api-docs
```

Look for the "Messaging" tag in Swagger UI.

---

**Last Updated**: January 13, 2025  
**Version**: 1.0.0  
**Author**: Development Team




