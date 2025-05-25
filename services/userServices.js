function getWorldLimit(plan) {
  if (plan === 'Free') return 1;
  if (plan === 'Premium') return 5;
  return Infinity;
}

function isPlanActive(user) {
  if (user.plan === 'Free') return true;
  return new Date(user.planExpiresAt) > new Date();
}

function canCreateWorld(user, worldCount) {
  const limit = getWorldLimit(user.plan);
  return isPlanActive(user) && worldCount < limit;
}

function calculateNewExpiration(currentDate, planType) {
  const date = new Date(currentDate);
  if (planType === 'Yearly') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

async function upgradePlan(user, newPlan, planType = 'Monthly') {
  user.plan = newPlan;
  user.planType = planType;
  user.planExpiresAt = calculateNewExpiration(new Date(), planType);
  await user.save();
  return user;
}

async function renewPlan(user) {
  if (user.plan === 'Free') return user;
  user.planExpiresAt = calculateNewExpiration(new Date(), user.planType);
  await user.save();
  return user;
}

module.exports = {
  getWorldLimit,
  isPlanActive,
  canCreateWorld,
  upgradePlan,
  renewPlan
};
