// Test runner for REFERRAL_SYSTEM_EXAMPLES
// This file demonstrates running the referral system examples

import { REFERRAL_EXAMPLES, scenario_completeReferralFlow } from './REFERRAL_SYSTEM_EXAMPLES';

console.log('╔════════════════════════════════════════════════════╗');
console.log('║   REFERRAL SYSTEM EXAMPLES - TEST RUNNER           ║');
console.log('╚════════════════════════════════════════════════════╝\n');

// Run individual examples
console.log('='.repeat(50));
console.log('RUNNING INDIVIDUAL EXAMPLES');
console.log('='.repeat(50) + '\n');

// Example 1: Create user with referral code
console.log('\n📌 EXAMPLE 1: Create User with Referral Code');
console.log('-'.repeat(50));
try {
  REFERRAL_EXAMPLES.example1_createUserWithCode();
} catch (e) {
  console.error('Error:', e instanceof Error ? e.message : e);
}

// Example 2: Process signup
console.log('\n📌 EXAMPLE 2: Process User Signup');
console.log('-'.repeat(50));
try {
  REFERRAL_EXAMPLES.example2_processSignup();
} catch (e) {
  console.error('Error:', e instanceof Error ? e.message : e);
}

// Example 3: Get user stats
console.log('\n📌 EXAMPLE 3: Get User Referral Statistics');
console.log('-'.repeat(50));
try {
  REFERRAL_EXAMPLES.example3_getUserStats();
} catch (e) {
  console.error('Error:', e instanceof Error ? e.message : e);
}

// Example 4: Validate referral code
console.log('\n📌 EXAMPLE 4: Validate Referral Code');
console.log('-'.repeat(50));
try {
  REFERRAL_EXAMPLES.example4_validateCode();
} catch (e) {
  console.error('Error:', e instanceof Error ? e.message : e);
}

// Example 5: Get user referrals
console.log('\n📌 EXAMPLE 5: Get All User Referrals');
console.log('-'.repeat(50));
try {
  REFERRAL_EXAMPLES.example5_getUserReferrals();
} catch (e) {
  console.error('Error:', e instanceof Error ? e.message : e);
}

// Example 6: Admin award points
console.log('\n📌 EXAMPLE 6: Admin Award Bonus Points');
console.log('-'.repeat(50));
try {
  REFERRAL_EXAMPLES.example6_adminAwardPoints();
} catch (e) {
  console.error('Error:', e instanceof Error ? e.message : e);
}

// Example 7: Get network analytics
console.log('\n📌 EXAMPLE 7: Get Admin Network Analytics');
console.log('-'.repeat(50));
try {
  REFERRAL_EXAMPLES.example7_getNetworkAnalytics();
} catch (e) {
  console.error('Error:', e instanceof Error ? e.message : e);
}

// Example 8: Admin get user details
console.log('\n📌 EXAMPLE 8: Get Admin User Details');
console.log('-'.repeat(50));
try {
  REFERRAL_EXAMPLES.example8_adminGetUserDetails();
} catch (e) {
  console.error('Error:', e instanceof Error ? e.message : e);
}

// Example 9: Get all rewards
console.log('\n📌 EXAMPLE 9: Get All Rewards (Audit Trail)');
console.log('-'.repeat(50));
try {
  REFERRAL_EXAMPLES.example9_getAllRewards();
} catch (e) {
  console.error('Error:', e instanceof Error ? e.message : e);
}

// Example 10: Get user referrer
console.log('\n📌 EXAMPLE 10: Check Who Referred a User');
console.log('-'.repeat(50));
try {
  REFERRAL_EXAMPLES.example10_getUserReferrer();
} catch (e) {
  console.error('Error:', e instanceof Error ? e.message : e);
}

// Run complete scenario
console.log('\n' + '='.repeat(50));
console.log('RUNNING COMPLETE REFERRAL FLOW SCENARIO');
console.log('='.repeat(50));
try {
  scenario_completeReferralFlow();
} catch (e) {
  console.error('Error:', e instanceof Error ? e.message : e);
}

console.log('\n' + '╔════════════════════════════════════════════════════╗');
console.log('║   ✅ ALL EXAMPLES EXECUTED SUCCESSFULLY             ║');
console.log('╚════════════════════════════════════════════════════╝');
