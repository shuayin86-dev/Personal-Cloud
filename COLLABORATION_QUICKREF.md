# Collaboration & Admin Features - Quick Reference

## 🚀 Quick Start

### Opening Features
- **Collaboration Hub**: Double-click "Collaboration" icon on desktop
- **Pet Admin Panel**: Double-click "Pet Admin" icon on desktop

## 📝 Co-Editing

| Action | Steps |
|--------|-------|
| **Create Session** | Collaboration → Co-Editing → "New Co-Edit Session" → Enter title |
| **Join Session** | Get session ID from creator → Co-Editing → Click "Open" |
| **Edit Document** | Type in document → Changes sync in real-time |
| **Invite Others** | Share session ID with team members |

**Key Features**:
- ✅ Real-time cursor tracking
- ✅ Live content sync
- ✅ Multi-user editing
- ✅ Permission control

## 🏠 Project Rooms

| Action | Steps |
|--------|-------|
| **Create Room** | Collaboration → Project Rooms → "New Project Room" |
| **Add Members** | Click room → Add member by username |
| **Create Task** | Room view → Add task with details |
| **Send Message** | Room view → Type in chat |

**Key Features**:
- ✅ Dedicated team spaces
- ✅ Shared files
- ✅ Task management
- ✅ Chat history

## 🖥️ Live Screen Sharing

| Action | Steps |
|--------|-------|
| **Start Share** | Collaboration → Screen Share → "Start Screen Share" |
| **Set Title** | Enter descriptive title |
| **Choose Type** | Select: Demo / Tutorial / Collaboration / Presentation |
| **Invite Viewers** | Share the generated URL |
| **Stop Share** | Click "Stop" when finished |

**Share Types**:
- 🎬 **Demo** - Product/feature demonstrations
- 📚 **Tutorial** - Educational content
- 🤝 **Collaboration** - Team problem-solving
- 📊 **Presentation** - Formal presentations

## 🛡️ AI Moderation

| Action | Steps |
|--------|-------|
| **View Reports** | Collaboration → Moderation → See all reports |
| **Check Issue** | Click report to see details & recommendations |
| **Review Stats** | View severity breakdown and totals |
| **Act on Recommendations** | Follow suggested actions |

**Issue Types**:
- 🚫 **Toxic** - Inappropriate language/behavior
- 🔁 **Spam** - Repetitive content
- ⚙️ **Workflow** - Process issues
- ⚡ **Performance** - Efficiency problems

**Severity Levels** (Colors):
- 🔵 **Low** - Advisory
- 🟡 **Medium** - Needs attention
- 🟠 **High** - Take action
- 🔴 **Critical** - Urgent

## 🏆 Admin Pet Stats Panel

| Action | Steps |
|--------|-------|
| **Find User** | Pet Admin → Search username → Click result |
| **Edit Stats** | Click "Edit" or double-click user |
| **Adjust Energy** | Use slider or click Max/Min/Unlimited |
| **Adjust Happiness** | Use slider or click Max/Min/Unlimited |
| **Set Hunger** | Use slider (always tracked) |
| **Save Changes** | Click "Save Changes" button |

**Controls**:
- 📊 **Range Slider** - Precise control (0-100)
- ⭐ **Max** - Set to maximum
- ⬇️ **Min** - Set to minimum  
- ♾️ **Unlimited** - Set to 999 (unlimited)
- 🔄 **Reset** - Back to defaults
- 💾 **Save** - Apply to database

**Unlimited Feature**:
- Value 999 represents unlimited
- Only available for Energy & Happiness
- Hunger always tracked 0-100

## 📊 Dashboard Stats

### Collaboration Overview
```
Active Co-Edits: [Count] documents
Project Rooms: [Count] team spaces
Screen Shares: [Count] active streams
Moderation: [Count] issues detected
```

### Pet Admin Stats
```
Users in System: [Count]
Last Modified: [Timestamp]
Edited Users: [Count]
```

## 🔗 Integration

**Desktop Icons**:
- 👥 **Collaboration** - All 4 collaboration features
- 🏆 **Pet Admin** - User pet stat management

**Window Features**:
- 📌 Draggable (click & drag title bar)
- 📉 Minimizable (- button)
- 📱 Maximizable (◻ button)
- ❌ Closable (✕ button)

## 🔐 Permissions

| Feature | Requires |
|---------|----------|
| Co-Editing | Logged in |
| Project Rooms | Logged in + Invited |
| Screen Share | Logged in |
| Moderation View | Logged in |
| Pet Admin | Admin (`is_admin: true`) |

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Close window |
| `Cmd/Ctrl + S` | Save (where applicable) |
| `Cmd/Ctrl + F` | Search users (Pet Admin) |

## 🐛 Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| Feature not showing | Refresh page, check login |
| Can't save | Check Supabase connection |
| Slow performance | Close other windows, refresh |
| Admin panel blocked | Check is_admin flag in Supabase |
| Real-time not working | Refresh page, check internet |

## 📱 Best Practices

1. **Co-Editing**:
   - Use descriptive document titles
   - Limit to 5-10 concurrent editors for best performance
   - Save important versions regularly

2. **Project Rooms**:
   - Create separate rooms per project
   - Add relevant team members only
   - Use task assignments clearly

3. **Screen Sharing**:
   - Test connection before important presentations
   - Share with small groups for better performance
   - Use type matching (demo/tutorial/etc)

4. **Moderation**:
   - Review critical severity reports immediately
   - Act on recommendations promptly
   - Track patterns to identify issues early

5. **Pet Management**:
   - Use presets for common values
   - Verify changes saved properly
   - Log unusual access requests

## 📞 Support

**Quick Help**:
- Check browser console (F12) for errors
- Verify all features have correct permissions
- Try refreshing the page
- Clear browser cache if problems persist

**Contact**:
- Report issues on GitHub
- Include screenshots of problems
- Note exact steps to reproduce

## 📚 Full Documentation

See **COLLABORATION_FEATURES_GUIDE.md** for:
- Detailed feature explanations
- Technical architecture
- Data flow diagrams
- API documentation
- Advanced usage examples

---

**Version**: 1.0  
**Last Updated**: 2025  
**Status**: Production Ready ✅
