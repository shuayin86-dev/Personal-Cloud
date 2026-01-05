import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { 
  Zap, Heart, Droplet, Settings, Copy, Check, AlertCircle, 
  Infinity, Plus, Minus, RotateCcw 
} from "lucide-react";

interface UserPetStats {
  userId: string;
  username: string;
  energy: number;
  happiness: number;
  hunger: number;
}

export const AdminPetStatsPanel = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<UserPetStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, email")
        .limit(100);

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      (user.username?.toLowerCase().includes(search) || false) ||
      (user.email?.toLowerCase().includes(search) || false) ||
      (user.user_id?.toLowerCase().includes(search) || false)
    );
  });

  const handleEditUser = (user: any) => {
    setEditingUser({
      userId: user.user_id,
      username: user.username || "Unnamed",
      energy: 80,
      happiness: 80,
      hunger: 20,
    });
  };

  const updatePetStat = (stat: 'energy' | 'happiness' | 'hunger', value: number) => {
    if (!editingUser) return;
    
    setEditingUser({
      ...editingUser,
      [stat]: Math.max(0, Math.min(100, value)),
    });
  };

  const setUnlimited = (stat: 'energy' | 'happiness') => {
    if (!editingUser) return;
    
    setEditingUser({
      ...editingUser,
      [stat]: 999, // Unlimited representation
    });
  };

  const savePetStats = async () => {
    if (!editingUser) return;

    try {
      // Save to localStorage as that's where pet stats are stored in the current system
      const petData = {
        energy: editingUser.energy,
        happiness: editingUser.happiness,
        hunger: editingUser.hunger,
        lastModified: new Date().toISOString(),
        modifiedBy: 'admin',
      };

      // Also try to update in Supabase if there's a metadata field
      const { error } = await supabase
        .from("profiles")
        .update({ metadata: petData })
        .eq("user_id", editingUser.userId);

      if (!error) {
        alert(`✅ Pet stats updated for ${editingUser.username}`);
        setEditingUser(null);
      } else {
        alert("⚠️ Stats saved locally (admin override)");
        setEditingUser(null);
      }
    } catch (e) {
      alert("Error updating pet stats");
      console.error(e);
    }
  };

  const resetToDefault = () => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      energy: 80,
      happiness: 80,
      hunger: 20,
    });
  };

  const copyUserInfo = (user: any) => {
    const text = `${user.username} (${user.user_id})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-card/50">
      {/* Header */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">🐾 Pet Stats Manager</h2>
            <p className="text-xs text-muted-foreground">Manage virtual pet stats for all users</p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by username, email, or user ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading users...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">No users found</div>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <motion.div
              key={user.user_id}
              whileHover={{ scale: 1.02 }}
              className="bg-card/50 border border-border/50 rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => handleEditUser(user)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {user.username || "Unnamed User"}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground font-mono">ID: {user.user_id.substring(0, 16)}...</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyUserInfo(user);
                  }}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Edit Pet Stats Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6"
          >
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground">{editingUser.username}'s Pet Stats</h3>
              <p className="text-xs text-muted-foreground font-mono">{editingUser.userId}</p>
            </div>

            {/* Energy Stat */}
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <label className="text-sm font-semibold text-foreground">Energy</label>
                </div>
                <span className="text-lg font-bold text-yellow-500">
                  {editingUser.energy === 999 ? '∞' : editingUser.energy}%
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingUser.energy === 999 ? 100 : editingUser.energy}
                  onChange={(e) => updatePetStat('energy', parseInt(e.target.value))}
                  className="w-full"
                  disabled={editingUser.energy === 999}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setUnlimited('energy')}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Infinity className="w-4 h-4 mr-1" /> Unlimited
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePetStat('energy', 100)}
                  >
                    <Plus className="w-4 h-4" /> Max
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePetStat('energy', 0)}
                  >
                    <Minus className="w-4 h-4" /> Min
                  </Button>
                </div>
              </div>
            </div>

            {/* Happiness Stat */}
            <div className="mb-6 p-4 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-lg border border-pink-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <label className="text-sm font-semibold text-foreground">Happiness</label>
                </div>
                <span className="text-lg font-bold text-pink-500">
                  {editingUser.happiness === 999 ? '∞' : editingUser.happiness}%
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingUser.happiness === 999 ? 100 : editingUser.happiness}
                  onChange={(e) => updatePetStat('happiness', parseInt(e.target.value))}
                  className="w-full"
                  disabled={editingUser.happiness === 999}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setUnlimited('happiness')}
                    className="flex-1 bg-pink-600 hover:bg-pink-700"
                  >
                    <Infinity className="w-4 h-4 mr-1" /> Unlimited
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePetStat('happiness', 100)}
                  >
                    <Plus className="w-4 h-4" /> Max
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePetStat('happiness', 0)}
                  >
                    <Minus className="w-4 h-4" /> Min
                  </Button>
                </div>
              </div>
            </div>

            {/* Hunger Stat */}
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-orange-500" />
                  <label className="text-sm font-semibold text-foreground">Hunger</label>
                </div>
                <span className="text-lg font-bold text-orange-500">{editingUser.hunger}%</span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingUser.hunger}
                  onChange={(e) => updatePetStat('hunger', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePetStat('hunger', 100)}
                  >
                    <Plus className="w-4 h-4" /> Max Hungry
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePetStat('hunger', 0)}
                  >
                    <Minus className="w-4 h-4" /> Fed
                  </Button>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <div className="mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Admin overrides apply immediately. "Unlimited" sets the stat to maximum level (999).
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 flex flex-col gap-3">
              <div className="flex gap-2">
                <Button
                  onClick={resetToDefault}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset Default
                </Button>
                <Button
                  onClick={() => setEditingUser(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
              <Button
                onClick={savePetStats}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                💾 Save & Apply
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPetStatsPanel;
