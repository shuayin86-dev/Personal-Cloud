# Collaboration Features Guide

## Overview

The Personal Cloud now includes comprehensive real-time collaboration features designed for seamless team coordination and communication. All features integrate with the admin pet stats management system.

## Features

### 1. 📝 Co-Editing in Real-Time

**Purpose**: Collaborate on documents, code, or notes with multiple users simultaneously.

**Key Features**:
- Real-time document editing with live cursor tracking
- Multiple participants with distinct cursors
- Content synchronization across all participants
- Document history and version tracking
- Permission-based access control

**How to Use**:
1. Open the Collaboration Hub from desktop
2. Go to the "✏️ Co-Editing" tab
3. Click "New Co-Edit Session"
4. Enter document title and click Create
5. Share the session ID with collaborators
6. Participants can join and edit in real-time

**Implementation Details**:
- Handled by `CollaborationService.createCoEditSession()`
- Uses `CoEditSession` interface with:
  - `documentId`: Unique identifier
  - `participants`: Array of `CollaborationUser` objects
  - `content`: Current document content
  - `permissions`: User-level access control
  - `lastModified`: Timestamp of last change

### 2. 🏠 Project Rooms

**Purpose**: Dedicated virtual spaces for team projects with shared files, chat, and task management.

**Key Features**:
- Room creation with custom names and descriptions
- Team member management (add/remove)
- Shared file storage within rooms
- Task assignment and tracking
- In-room chat history

**How to Use**:
1. Open the Collaboration Hub
2. Go to the "🏠 Project Rooms" tab
3. Click "New Project Room"
4. Enter room name and description
5. Members can be added after room creation
6. Share files, tasks, and messages within the room

**Implementation Details**:
- Handled by `CollaborationService.createProjectRoom()`
- Uses `ProjectRoom` interface with:
  - `members`: Array of team members
  - `sharedFiles`: File references
  - `tasks`: Task array with assignments
  - `chatHistory`: Messages and timestamps

### 3. 🖥️ Live Desktop Streaming

**Purpose**: Share your desktop with others for demos, tutorials, or collaborative work.

**Key Features**:
- Start screen sharing with custom titles
- Multiple share types: Demo, Tutorial, Collaboration, Presentation
- Real-time viewer tracking
- Screen share control (pause, resume, stop)
- Viewer list with online status

**How to Use**:
1. Open the Collaboration Hub
2. Go to the "🖥️ Screen Share" tab
3. Click "Start Screen Share"
4. Enter title and select share type
5. Invite viewers with the share URL
6. Click "Stop" when finished

**Share Types**:
- **Demo**: For product demonstrations
- **Tutorial**: For educational content
- **Collaboration**: For team problem-solving
- **Presentation**: For formal presentations

**Implementation Details**:
- Handled by `CollaborationService.startScreenShare()`
- Uses `ScreenShare` interface with:
  - `sharedBy`: User sharing their screen
  - `viewers`: Array of watching users
  - `isActive`: Share status
  - `type`: Share category

### 4. 🛡️ AI Moderator

**Purpose**: An AI assistant that monitors collaboration sessions for toxic behavior and workflow issues.

**Key Features**:
- Automatic content analysis for issues
- Severity-based reporting (Low, Medium, High, Critical)
- Issue categorization (Toxic, Spam, Workflow, Performance)
- Actionable recommendations
- Historical report tracking

**Issue Types**:
- **Toxic**: Inappropriate language or behavior
- **Spam**: Repetitive or unwanted content
- **Workflow Issues**: Process bottlenecks
- **Performance**: Technical or efficiency problems

**Severity Levels**:
- **Low**: Minor issues, advisory only
- **Medium**: Notable issues, require attention
- **High**: Serious issues, require action
- **Critical**: Urgent issues, immediate action needed

**How to Use**:
1. Open the Collaboration Hub
2. Go to the "🛡️ Moderation" tab
3. View current and historical reports
4. Check issue types and severity levels
5. Review recommendations
6. View statistics dashboard

**Implementation Details**:
- Handled by `CollaborationService.analyzeContent()`
- Uses `ModerationReport` interface with:
  - `type`: Issue category
  - `severity`: Severity level
  - `recommendations`: Array of suggested actions
  - `timestamp`: Report creation time

## Admin Controls

### Pet Stats Management

Administrators can manage virtual pet stats for any user:

**Available Controls**:
- **Energy**: 0-100 range, unlimited option (999)
- **Happiness**: 0-100 range, unlimited option (999)
- **Hunger**: 0-100 range (always tracked)

**How to Use**:
1. Open the Desktop
2. Double-click "Pet Admin" icon
3. Search for user by username
4. Click on user to edit stats
5. Adjust sliders or use preset buttons:
   - Max: Set to maximum value
   - Min: Set to minimum value
   - Default: Reset to default values
   - Unlimited: Set to 999 (unlimited)
6. Click Save to apply changes

**Features**:
- User search and filtering
- Real-time Supabase integration
- Copy user info to clipboard
- Batch stat management
- Stat history tracking

## Technical Architecture

### CollaborationService

Located at `src/lib/collaboration-service.ts`

**Core Methods**:

#### Co-Editing
```typescript
createCoEditSession(documentId, title, userId): CoEditSession
joinCoEditSession(sessionId, user): void
updateDocumentContent(sessionId, content): void
getSessionCursors(sessionId): CursorPosition[]
endSession(sessionId): void
```

#### Project Rooms
```typescript
createProjectRoom(name, description, ownerId, ownerName, ownerEmail): ProjectRoom
addMemberToRoom(roomId, userId, username): void
addTaskToRoom(roomId, task): void
sendRoomMessage(roomId, message): void
getUserProjectRooms(userId): ProjectRoom[]
```

#### Screen Sharing
```typescript
startScreenShare(userId, username, title, type): ScreenShare
addViewerToShare(shareId, viewer): void
endScreenShare(shareId): void
getActiveScreenShares(): ScreenShare[]
```

#### Moderation
```typescript
analyzeContent(content, sessionId): ModerationReport
detectIssues(content): IssueType[]
getModerationReports(limit): ModerationReport[]
getModerationStats(): ModerationStats
```

### UI Components

#### CollaborationFeatures
- Location: `src/components/desktop/CollaborationFeatures.tsx`
- Displays all 4 collaboration features in tabbed interface
- Real-time data updates
- Integration with CollaborationService

#### AdminPetStatsPanel
- Location: `src/components/desktop/AdminPetStatsPanel.tsx`
- Admin-only interface for pet stat management
- User search and filtering
- Stat editing with sliders and presets
- Supabase integration

## Data Flow

```
User Action
    ↓
React Component (CollaborationFeatures/AdminPetStatsPanel)
    ↓
CollaborationService / Supabase
    ↓
Database (Profiles table for user data)
    ↓
Component State Update
    ↓
UI Refresh
```

## Security Considerations

1. **Authentication**: All features require logged-in user
2. **Authorization**: 
   - Admin features require `is_admin` flag
   - Room access controlled by membership
   - Session access validated before join
3. **Data Privacy**: 
   - Metadata stored in Supabase
   - User data isolated per account
   - Moderation reports confidential

## Integration Points

### Desktop.tsx
- Added "Collaboration" icon (Users icon)
- Added "Pet Admin" icon (Trophy icon)
- Both open in new window with error boundaries

### Window Manager
- 700x500px default window size
- Draggable windows with minimize/maximize
- Active window tracking

### Supabase
- Uses `profiles` table for user data
- Stores metadata for pet stats
- Profiles schema:
  ```
  user_id (UUID, PK)
  username (string)
  email (string)
  points (integer)
  is_admin (boolean)
  metadata (jsonb) - stores pet stats
  avatar_url (string)
  ```

## Future Enhancements

1. **WebRTC Integration**: Real-time screen sharing with video/audio
2. **Advanced Moderation**: ML-based content filtering
3. **Document History**: Full version control with diff viewing
4. **Notifications**: Real-time alerts for collaboration events
5. **Recording**: Session recording for later playback
6. **Analytics**: Detailed collaboration statistics

## Troubleshooting

### Issue: Can't see collaboration features
**Solution**: Ensure you're logged in and refreshed the page

### Issue: Pet Admin shows "Admin access required"
**Solution**: Check that your account has `is_admin: true` in Supabase

### Issue: Changes not saving
**Solution**: Check browser console for errors, verify Supabase connection

### Issue: Real-time updates not working
**Solution**: Refresh the page, check internet connection

## Examples

### Creating a Co-Edit Session
```typescript
const session = collaborationService.createCoEditSession(
  "doc-123",
  "Team Project Plan",
  userId
);

collaborationService.joinCoEditSession(session.id, {
  userId,
  username,
  email: user.email,
  isOnline: true,
  lastSeen: new Date()
});
```

### Managing Pet Stats
```typescript
// Via UI: Search user → Click to edit → Adjust sliders → Save
// Via Admin Panel: Complete user interface with search/filter
```

### Starting a Screen Share
```typescript
const share = collaborationService.startScreenShare(
  userId,
  username,
  "Code Review Demo",
  "demo"
);

// Share ID used for inviting viewers
```

## Support

For issues or feature requests:
1. Check this guide for common solutions
2. Review GitHub issues
3. Contact support with:
   - Username
   - Feature/action description
   - Error messages from console
   - Browser version
