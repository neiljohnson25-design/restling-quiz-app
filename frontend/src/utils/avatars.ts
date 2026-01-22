// Wrestling-themed avatar icons
// Using emoji representations that work across all platforms

export interface Avatar {
  id: string;
  name: string;
  emoji: string;
  unlockLevel: number;
  description: string;
}

export const avatars: Avatar[] = [
  // Starter avatars (Level 1)
  { id: 'rookie', name: 'Rookie', emoji: '🥋', unlockLevel: 1, description: 'Every champion starts here' },
  { id: 'fan', name: 'Super Fan', emoji: '📣', unlockLevel: 1, description: 'The voice of the crowd' },
  { id: 'mask', name: 'Masked Marvel', emoji: '🎭', unlockLevel: 1, description: 'Mystery personified' },

  // Level 5
  { id: 'muscle', name: 'Powerhouse', emoji: '💪', unlockLevel: 5, description: 'Pure strength' },
  { id: 'fire', name: 'The Hothead', emoji: '🔥', unlockLevel: 5, description: 'Always fired up' },

  // Level 10
  { id: 'star', name: 'Rising Star', emoji: '⭐', unlockLevel: 10, description: 'On the way to the top' },
  { id: 'bolt', name: 'Lightning', emoji: '⚡', unlockLevel: 10, description: 'Faster than lightning' },

  // Level 15
  { id: 'crown', name: 'King/Queen', emoji: '👑', unlockLevel: 15, description: 'Royalty of the ring' },
  { id: 'trophy', name: 'Champion', emoji: '🏆', unlockLevel: 15, description: 'Born to win' },

  // Level 20
  { id: 'dragon', name: 'The Dragon', emoji: '🐉', unlockLevel: 20, description: 'Mythical power' },
  { id: 'skull', name: 'The Deadman', emoji: '💀', unlockLevel: 20, description: 'Rest in peace' },

  // Level 25
  { id: 'eagle', name: 'American Eagle', emoji: '🦅', unlockLevel: 25, description: 'Soaring above all' },
  { id: 'wolf', name: 'Lone Wolf', emoji: '🐺', unlockLevel: 25, description: 'The pack leader' },

  // Level 30
  { id: 'diamond', name: 'Diamond', emoji: '💎', unlockLevel: 30, description: 'Unbreakable' },
  { id: 'cobra', name: 'The Viper', emoji: '🐍', unlockLevel: 30, description: 'Strike without warning' },

  // Level 40
  { id: 'rocket', name: 'Main Eventer', emoji: '🚀', unlockLevel: 40, description: 'Top of the card' },

  // Level 50
  { id: 'goat', name: 'The G.O.A.T.', emoji: '🐐', unlockLevel: 50, description: 'Greatest of all time' },

  // Special
  { id: 'bluecage', name: 'Big Blue Cage', emoji: '🔵', unlockLevel: 1, description: 'Official BBC avatar' },
];

export function getUnlockedAvatars(level: number): Avatar[] {
  return avatars.filter(a => a.unlockLevel <= level);
}

export function getAvatarById(id: string): Avatar | undefined {
  return avatars.find(a => a.id === id);
}

export function getDefaultAvatar(): Avatar {
  return avatars[0];
}
