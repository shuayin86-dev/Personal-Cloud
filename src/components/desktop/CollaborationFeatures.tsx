import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, Users, Share2, Shield, MessageCircle, Plus, X,
  Edit3, FolderOpen, Zap, AlertTriangle, BarChart3, Play, StopCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollaborationService } from "@/lib/collaboration-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const CollaborationFeatures = ({ userId, username }: { userId: string; username: string }) => {
  const [collaborationService] = useState(() => new CollaborationService());
  const [activeTab, setActiveTab] = useState("overview");
  const [showNewSession, setShowNewSession] = useState(false);
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [showScreenShare, setShowScreenShare] = useState(false);

  // Co-Editing State
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [coEditSessions, setCoEditSessions] = useState<any[]>([]);

  // Project Rooms State
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [projectRooms, setProjectRooms] = useState<any[]>([]);

  // Screen Share State
  const [screenShareTitle, setScreenShareTitle] = useState("");
  const [screenShareType, setScreenShareType] = useState<'demo' | 'tutorial' | 'collaboration' | 'presentation'>('collaboration');
  const [activeScreenShares, setActiveScreenShares] = useState<any[]>([]);

  // Moderation State
  const [moderationReports, setModerationReports] = useState<any[]>([]);
  const [moderationStats, setModerationStats] = useState<any>(null);

  useEffect(() => {
    loadCollaborationData();
  }, []);

  const loadCollaborationData = () => {
    setCoEditSessions(collaborationService.getAllActiveSessions());
    setProjectRooms(collaborationService.getUserProjectRooms(userId));
    setActiveScreenShares(collaborationService.getActiveScreenShares());
    setModerationReports(collaborationService.getModerationReports(10));
    setModerationStats(collaborationService.getModerationStats());
  };

  const createCoEditSession = () => {
    if (!newSessionTitle.trim()) {
      alert("Please enter a document title");
      return;
    }

    const session = collaborationService.createCoEditSession(
      `doc-${Date.now()}`,
      newSessionTitle,
      userId
    );

    collaborationService.joinCoEditSession(session.id, {
      userId,
      username,
      email: "",
      isOnline: true,
      lastSeen: new Date(),
    });

    setCoEditSessions([...coEditSessions, session]);
    setNewSessionTitle("");
    setShowNewSession(false);
  };

  const createProjectRoom = () => {
    if (!newRoomName.trim()) {
      alert("Please enter a room name");
      return;
    }

    const room = collaborationService.createProjectRoom(
      newRoomName,
      newRoomDesc,
      userId,
      username,
      `${username}@example.com`
    );

    setProjectRooms([...projectRooms, room]);
    setNewRoomName("");
    setNewRoomDesc("");
    setShowNewRoom(false);
  };

  const startScreenShare = () => {
    if (!screenShareTitle.trim()) {
      alert("Please enter a title for this screen share");
      return;
    }

    const share = collaborationService.startScreenShare(
      userId,
      username,
      screenShareTitle,
      screenShareType
    );

    setActiveScreenShares([...activeScreenShares, share]);
    setScreenShareTitle("");
    setShowScreenShare(false);
  };

  const endScreenShare = (shareId: string) => {
    collaborationService.endScreenShare(shareId);
    setActiveScreenShares(activeScreenShares.filter(s => s.id !== shareId));
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-card/50">
      {/* Header */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">👥 Collaboration Hub</h2>
            <p className="text-xs text-muted-foreground">Real-time co-editing, project rooms, and desktop sharing</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            📊 Overview
          </TabsTrigger>
          <TabsTrigger value="co-editing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            ✏️ Co-Editing
          </TabsTrigger>
          <TabsTrigger value="rooms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            🏠 Project Rooms
          </TabsTrigger>
          <TabsTrigger value="screen-share" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            🖥️ Screen Share
          </TabsTrigger>
          <TabsTrigger value="moderation" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            🛡️ Moderation
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 overflow-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <Edit3 className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-muted-foreground">Active Co-Edits</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{coEditSessions.length}</p>
              <p className="text-xs text-muted-foreground mt-2">Documents being edited</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <FolderOpen className="w-5 h-5 text-green-500" />
                <span className="text-xs text-muted-foreground">Project Rooms</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{projectRooms.length}</p>
              <p className="text-xs text-muted-foreground mt-2">Team collaboration spaces</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <Share2 className="w-5 h-5 text-purple-500" />
                <span className="text-xs text-muted-foreground">Screen Shares</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{activeScreenShares.length}</p>
              <p className="text-xs text-muted-foreground mt-2">Active screen shares</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Moderation</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{moderationStats?.totalReports || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Issues detected</p>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Collaboration Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Active Sessions:</span>
                <span className="font-semibold">{coEditSessions.length + projectRooms.length + activeScreenShares.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Modified:</span>
                <span className="font-semibold">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Co-Editing Tab */}
        <TabsContent value="co-editing" className="flex-1 overflow-auto p-4">
          <div className="flex gap-2 mb-4">
            {!showNewSession ? (
              <Button onClick={() => setShowNewSession(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> New Co-Edit Session
              </Button>
            ) : (
              <div className="w-full space-y-2 bg-card border border-border rounded-lg p-4">
                <Input
                  placeholder="Document title..."
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={createCoEditSession} className="flex-1">Create</Button>
                  <Button onClick={() => setShowNewSession(false)} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {coEditSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active co-editing sessions
              </div>
            ) : (
              coEditSessions.map((session) => (
                <motion.div
                  key={session.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {session.documentTitle}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {session.participants.length} participants • Modified {new Date(session.lastModified).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">Open</Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Project Rooms Tab */}
        <TabsContent value="rooms" className="flex-1 overflow-auto p-4">
          <div className="flex gap-2 mb-4">
            {!showNewRoom ? (
              <Button onClick={() => setShowNewRoom(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> New Project Room
              </Button>
            ) : (
              <div className="w-full space-y-2 bg-card border border-border rounded-lg p-4">
                <Input
                  placeholder="Room name..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
                <Input
                  placeholder="Description (optional)..."
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={createProjectRoom} className="flex-1">Create</Button>
                  <Button onClick={() => setShowNewRoom(false)} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {projectRooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No project rooms yet
              </div>
            ) : (
              projectRooms.map((room) => (
                <motion.div
                  key={room.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      {room.name}
                    </h4>
                    <Button size="sm" variant="outline">Enter</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{room.description}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>👥 {room.members.length} members</span>
                    <span>📁 {room.sharedFiles.length} files</span>
                    <span>✅ {room.tasks.length} tasks</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Screen Share Tab */}
        <TabsContent value="screen-share" className="flex-1 overflow-auto p-4">
          <div className="flex gap-2 mb-4">
            {!showScreenShare ? (
              <Button onClick={() => setShowScreenShare(true)} className="w-full">
                <Play className="w-4 h-4 mr-2" /> Start Screen Share
              </Button>
            ) : (
              <div className="w-full space-y-2 bg-card border border-border rounded-lg p-4">
                <Input
                  placeholder="Share title (e.g., 'Code Review Demo')..."
                  value={screenShareTitle}
                  onChange={(e) => setScreenShareTitle(e.target.value)}
                />
                <select
                  value={screenShareType}
                  onChange={(e) => setScreenShareType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                >
                  <option value="collaboration">Collaboration</option>
                  <option value="demo">Demo</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="presentation">Presentation</option>
                </select>
                <div className="flex gap-2">
                  <Button onClick={startScreenShare} className="flex-1">Start</Button>
                  <Button onClick={() => setShowScreenShare(false)} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {activeScreenShares.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active screen shares
              </div>
            ) : (
              activeScreenShares.map((share) => (
                <motion.div
                  key={share.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-card border border-border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-green-500" />
                        {share.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Type: {share.type} • {share.viewers.length} viewers
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => endScreenShare(share.id)}
                    >
                      <StopCircle className="w-4 h-4 mr-1" /> Stop
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="flex-1 overflow-auto p-4">
          {moderationStats && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Reports</p>
                <p className="text-2xl font-bold text-foreground">{moderationStats.totalReports}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">High Severity</p>
                <p className="text-2xl font-bold text-red-500">{moderationStats.bySeverity.high + moderationStats.bySeverity.critical}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {moderationReports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No moderation reports
              </div>
            ) : (
              moderationReports.map((report) => (
                <motion.div
                  key={report.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-card border border-border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {report.type.toUpperCase()}
                      </h4>
                      <p className="text-xs text-muted-foreground">{report.description}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      report.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      report.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      report.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {report.severity}
                    </span>
                  </div>
                  {report.recommendations.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <p className="font-semibold mb-1">Recommendations:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {report.recommendations.slice(0, 2).map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollaborationFeatures;
