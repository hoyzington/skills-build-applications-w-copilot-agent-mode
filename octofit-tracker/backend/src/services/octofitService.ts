import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Activity requires userId, teamId, type, and minutes'), { status: 400 });
  }

  const body = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = body;
  if (typeof userId !== 'string' || typeof teamId !== 'string' ||
      typeof type !== 'string' || !type.trim() ||
      typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw Object.assign(new Error('Activity requires valid userId, teamId, type, and minutes'), { status: 400 });
  }
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    throw Object.assign(new Error('Activity userId and teamId must be valid IDs'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user and team must exist'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Team requires a name and mascot'), { status: 400 });
  }

  const body = input as Record<string, unknown>;
  const { name, mascot } = body;
  const members = body.members ?? [];
  if (typeof name !== 'string' || !name.trim() ||
      typeof mascot !== 'string' || !mascot.trim() ||
      !Array.isArray(members) || !members.every((member) => typeof member === 'string' && mongoose.isValidObjectId(member))) {
    throw Object.assign(new Error('Team requires a valid name, mascot, and members list'), { status: 400 });
  }

  const users = await User.find({ _id: { $in: members } });
  if (users.length !== new Set(members).size) {
    throw Object.assign(new Error('All team members must exist'), { status: 404 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: users.map(({ _id }) => _id) });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: Activity.collection.name,
        let: { teamId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$team', '$$teamId'] } } },
          { $group: { _id: null, totalPoints: { $sum: '$points' } } },
        ],
        as: 'activityTotals',
      },
    },
    {
      $addFields: {
        totalPoints: { $ifNull: [{ $arrayElemAt: ['$activityTotals.totalPoints', 0] }, 0] },
      },
    },
    { $sort: { totalPoints: -1, name: 1 } },
    { $project: { _id: 0, teamName: '$name', totalPoints: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('No user found for this email'), { status: 404 });
  }

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const recentActivityFocuses = activities.map(({ type }) => {
    const activityType = type.trim().toLowerCase();
    if (activityType === 'run' || activityType === 'cycle') return 'endurance';
    return activityType;
  });

  return workouts
    .map((workout, index) => {
      const focus = workout.focus.trim().toLowerCase();
      const matchesGoal = focus === goal;
      const matchingActivity = activities.find((activity, activityIndex) =>
        recentActivityFocuses[activityIndex] === focus ||
        activity.type.trim().toLowerCase() === focus,
      );
      const reason = matchesGoal
        ? `Recommended because it matches your ${user.fitnessGoal} fitness goal.`
        : matchingActivity
          ? `Recommended because your recent ${matchingActivity.type} activity matches this focus.`
          : 'Recommended workout.';
      return { workout: { ...workout, reason }, score: matchesGoal ? 2 : matchingActivity ? 1 : 0, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ workout }) => workout);
}

export { User };
