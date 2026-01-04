// REFERRAL SYSTEM - CODE EXAMPLES AND INTEGRATION GUIDE
// These are TypeScript/JavaScript examples for using the referral system

import { referralSystemService, REFERRAL_REWARD_POINTS } from './src/lib/referral-system';

// ============================================
// EXAMPLE 1: Create user with referral code
// ============================================
export const example1_createUserWithCode = () => {
  const userId = 'user_456';

  // Auto-generates unique 8-character code
  const referralCode = referralSystemService.createUserReferralCode(userId);

  console.log(`✅ User ${userId} assigned code: ${referralCode.code}`);
  return referralCode;
};

// ============================================
// EXAMPLE 2: Process new user signup
// ============================================
export const example2_processSignup = () => {
  const newUserId = 'user_789';
  const referralCode = 'AB2C4E5F'; // From friend

  // Validates code and awards points if valid
  const result = referralSystemService.processNewUserSignup(newUserId, referralCode);

  if (result.success) {
    console.log(`✅ ${result.message}`);
    console.log(`💰 Points awarded: ${result.pointsAwarded}`);
  } else {
    console.log(`❌ ${result.message}`);
  }

  return result;
};

// ============================================
// EXAMPLE 3: Get user referral statistics
// ============================================
export const example3_getUserStats = () => {
  const userId = 'user_123';

  const stats = referralSystemService.getUserReferralStats(userId);

  console.log('📊 User Referral Stats:');
  if (stats) {
    console.log(`- Referral Code: ${stats.referralCode}`);
    console.log(`- Total Referrals: ${stats.totalReferred}`);
    console.log(`- Active Referrals: ${stats.activeReferrals}`);
    console.log(`- Points Earned: ${stats.totalPointsEarned}`);
    console.log(`- Joined via Referral: ${stats.joinedViaReferral}`);
  } else {
    console.log('No stats found for user');
  }

  return stats;
};

// ============================================
// EXAMPLE 4: Validate referral code
// ============================================
export const example4_validateCode = () => {
  const code = 'AB2C4E5F';

  const validation = referralSystemService.validateReferralCode(code);

  if (validation.valid) {
    console.log(`✅ Code is valid - User ID: ${validation.userId}`);
  } else {
    console.log(`❌ ${validation.error}`);
  }

  return validation;
};

// ============================================
// EXAMPLE 5: Get all user referrals
// ============================================
export const example5_getUserReferrals = () => {
  const userId = 'user_123';

  const referrals = referralSystemService.getUserReferrals(userId);

  console.log(`👥 ${userId} has referred ${referrals.length} users:`);
  referrals.forEach((ref, idx) => {
    console.log(`${idx + 1}. ${ref.referredUserId} - Status: ${ref.status} - ${ref.pointsAwarded} pts`);
  });

  return referrals;
};

// ============================================
// EXAMPLE 6: Admin award bonus points
// ============================================
export const example6_adminAwardPoints = () => {
  const userId = 'user_123';
  const points = 100;
  const reason = 'Monthly loyalty bonus';
  const adminId = 'admin_001';

  referralSystemService.adminAwardPoints(userId, points, reason, adminId);

  console.log(`✅ Awarded ${points} points to ${userId} for: ${reason}`);
};

// ============================================
// EXAMPLE 7: Get admin network analytics
// ============================================
export const example7_getNetworkAnalytics = () => {
  const network = referralSystemService.adminGetReferralNetwork();

  console.log('📈 Referral Network Analytics:');
  console.log(`- Total Users: ${network.totalUsers}`);
  console.log(`- Active Referrers: ${network.usersWithReferrals}`);
  console.log(`- Total Referrals: ${network.totalReferrals}`);
  console.log(`- Total Points Awarded: ${network.totalPointsAwarded}`);
  console.log('\n🏆 Top 5 Referrers:');

  network.topReferrers?.slice(0, 5).forEach((referrer, idx) => {
    console.log(
      `${idx + 1}. ${referrer.userId} - ${referrer.referralCount} referrals - ${referrer.pointsEarned} pts`
    );
  });

  return network;
};

// ============================================
// EXAMPLE 8: Get admin view of specific user
// ============================================
export const example8_adminGetUserDetails = () => {
  const userId = 'user_123';

  const details = referralSystemService.adminGetUserReferralDetails(userId);

  console.log('👤 Admin User Details:');
  if (details.stats) {
    console.log(`User: ${details.stats.userId}`);
    console.log(`Code: ${details.stats.referralCode}`);
    console.log(`Total Referred: ${details.stats.totalReferred}`);
    console.log(`Points Earned: ${details.stats.totalPointsEarned}`);
    console.log(`Recent Referrals: ${details.referrals.length}`);
  } else {
    console.log('No stats found for user');
  }

  return details;
};

// ============================================
// EXAMPLE 9: Get all rewards (audit trail)
// ============================================
export const example9_getAllRewards = () => {
  const rewards = referralSystemService.adminGetAllRewards();

  console.log(`💎 Total Reward Records: ${rewards.length}`);
  console.log('Recent Rewards:');

  rewards.slice(-10).forEach((reward) => {
    console.log(`- ${reward.userId} earned ${reward.amount} pts (${reward.reason})`);
  });

  return rewards;
};

// ============================================
// EXAMPLE 10: Check who referred a user
// ============================================
export const example10_getUserReferrer = () => {
  const userId = 'user_456';

  const referrer = referralSystemService.getUserReferrer(userId);

  if (referrer) {
    console.log(`🔗 ${userId} was referred by ${referrer.referrerId}`);
    console.log(`Referral Code Used: ${referrer.referralCode}`);
    console.log(`Referred Date: ${new Date(referrer.referredAt).toLocaleDateString()}`);
  } else {
    console.log(`❌ ${userId} was not referred by anyone`);
  }

  return referrer;
};

// ============================================
// COMPLETE REFERRAL FLOW SCENARIO
// ============================================
export const scenario_completeReferralFlow = () => {
  console.log('\n═════════════════════════════════════════');
  console.log('  COMPLETE REFERRAL FLOW SCENARIO');
  console.log('═════════════════════════════════════════\n');

  // Step 1: User A creates account
  console.log('📝 Step 1: User A signs up');
  const userACode = referralSystemService.createUserReferralCode('user_A');
  console.log(`✅ User A assigned code: ${userACode.code}\n`);

  // Step 2: User A shares their code with User B
  console.log('📤 Step 2: User A shares code with User B');
  console.log(`Share code: ${userACode.code}\n`);

  // Step 3: User B signs up with User A's code
  console.log('📝 Step 3: User B signs up using referral code');
  const signupResult = referralSystemService.processNewUserSignup('user_B', userACode.code);
  console.log(`✅ ${signupResult.message}`);
  console.log(`💰 User A earned ${signupResult.pointsAwarded} points\n`);

  // Step 4: Check User A's stats
  console.log('📊 Step 4: Check User A referral stats');
  const statsA = referralSystemService.getUserReferralStats('user_A');
  if (statsA) {
    console.log(`- Total Referrals: ${statsA.totalReferred}`);
    console.log(`- Points Earned: ${statsA.totalPointsEarned}`);
    console.log(`- Active Referrals: ${statsA.activeReferrals}\n`);
  }

  // Step 5: Check User B's profile
  console.log('📊 Step 5: Check User B referral profile');
  const statsB = referralSystemService.getUserReferralStats('user_B');
  if (statsB) {
    console.log(`- Referral Code: ${statsB.referralCode}`);
    console.log(`- Joined via Referral: ${statsB.joinedViaReferral}`);
    console.log(`- Referred By: ${statsB.referredBy}\n`);
  }

  // Step 6: Admin awards bonus points to User A
  console.log('🎁 Step 6: Admin awards bonus points');
  referralSystemService.adminAwardPoints('user_A', 50, 'Monthly bonus', 'admin_001');
  console.log(`✅ User A received 50 bonus points\n`);

  // Step 7: View network analytics
  console.log('📈 Step 7: Admin views network analytics');
  const network = referralSystemService.adminGetReferralNetwork();
  console.log(`Total users: ${network.totalUsers}`);
  console.log(`Total referrals: ${network.totalReferrals}`);
  console.log(`Total points awarded: ${network.totalPointsAwarded}\n`);

  console.log('═════════════════════════════════════════\n');
};

// ============================================
// REACT COMPONENT INTEGRATION EXAMPLES
// ============================================

// Example: How to use in React component
export const reactIntegrationExample = `
// In your React component:
import { ReferralSignupModal } from '@/components/desktop/ReferralSignupModal';
import { AdminReferralPanel } from '@/components/desktop/AdminReferralPanel';
import { UserReferralStatsModal } from '@/components/desktop/UserReferralStatsModal';

export const MyComponent = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [userId, setUserId] = useState('');

  return (
    <>
      {/* Signup Modal - Show during user registration */}
      <ReferralSignupModal 
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSignup={(result) => {
          if (result.success) {
            console.log('User signed up with referral!');
          }
        }}
      />

      {/* Admin Panel - Show in admin dashboard */}
      <AdminReferralPanel 
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
      />

      {/* User Stats Modal - Show in user profile */}
      <UserReferralStatsModal 
        userId={userId}
        isOpen={showStats}
        onClose={() => setShowStats(false)}
      />

      {/* Buttons to trigger modals */}
      <button onClick={() => setShowSignup(true)}>Signup</button>
      <button onClick={() => setShowAdmin(true)}>Admin</button>
      <button onClick={() => { setUserId('user_123'); setShowStats(true); }}>My Stats</button>
    </>
  );
};
`;

// ============================================
// EXPORT ALL EXAMPLES
// ============================================
export const REFERRAL_EXAMPLES = {
  example1_createUserWithCode,
  example2_processSignup,
  example3_getUserStats,
  example4_validateCode,
  example5_getUserReferrals,
  example6_adminAwardPoints,
  example7_getNetworkAnalytics,
  example8_adminGetUserDetails,
  example9_getAllRewards,
  example10_getUserReferrer,
  scenario_completeReferralFlow,
};

// Run all examples:
// Object.values(REFERRAL_EXAMPLES).forEach(fn => fn());
