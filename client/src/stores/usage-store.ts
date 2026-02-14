import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toastFriendly, toastUpgrade, toastAchievement, toastSuggestion } from './toast-store';

interface UsageState {
  // Counters
  tasksCompleted: number;
  filesCreated: number;
  deploysCount: number;
  sessionStartTime: number;
  totalBuildTimeMs: number;
  buildStartTime: number | null;

  // Plan
  plan: 'free' | 'pro' | 'team';
  freeTasksLimit: number;
  upgradeModalOpen: boolean;
  setUpgradeModalOpen: (open: boolean) => void;

  // Actions
  trackTaskCompleted: () => void;
  trackFileCreated: () => void;
  trackDeploy: () => void;
  trackBuildTime: (ms: number) => void;
  setBuildStartTime: (time: number | null) => void;

  // Helpers
  shouldShowUpgrade: () => boolean;
  getUsageSummary: () => string;
}

// Random friendly messages
const friendlyMessages = [
  { title: 'Nice progress!', msg: "You're building something great. Keep going!" },
  { title: 'Looking good!', msg: 'Your project is coming along nicely.' },
  { title: 'Great work!', msg: "That's some solid code you've got there." },
  { title: 'Almost there!', msg: 'Just a few more tweaks and it will be perfect.' },
  { title: 'Impressive!', msg: 'You clearly know what you want. Love the vision.' },
];

const proTips = [
  'Try "Add dark mode with a toggle switch" to make your app look premium.',
  'You can say "Deploy to production" to get a live URL for your project.',
  'Try "Add animations and micro-interactions" for a polished feel.',
  'Say "Add responsive design for mobile" to reach more users.',
  'Try "Add a loading skeleton" for better perceived performance.',
  'You can ask "Push to GitHub" to save your code in a repository.',
  'Try "Add SEO meta tags" to improve search engine visibility.',
  'Say "Add a contact form with validation" for user engagement.',
  'Try "Add smooth page transitions" for a modern app experience.',
  'You can ask "Download as ZIP" to get all your project files.',
];

const achievementMilestones: Record<number, { title: string; msg: string }> = {
  1: { title: 'First Build!', msg: "You've completed your first project with Masidy. Welcome aboard!" },
  3: { title: 'Getting Started', msg: '3 projects built! You are getting the hang of it.' },
  5: { title: 'Power User', msg: '5 projects completed! You are on fire.' },
  10: { title: 'Master Builder', msg: '10 projects! You are a true Masidy pro.' },
};

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      tasksCompleted: 0,
      filesCreated: 0,
      deploysCount: 0,
      sessionStartTime: Date.now(),
      totalBuildTimeMs: 0,
      buildStartTime: null,
      plan: 'free',
      freeTasksLimit: 10,
      upgradeModalOpen: false,

      setUpgradeModalOpen: (open) => set({ upgradeModalOpen: open }),
      setBuildStartTime: (time) => set({ buildStartTime: time }),

      trackTaskCompleted: () => {
        const state = get();
        const newCount = state.tasksCompleted + 1;
        // Compute build time if we have a start timestamp
        const buildMs = state.buildStartTime ? Date.now() - state.buildStartTime : 0;
        set({
          tasksCompleted: newCount,
          totalBuildTimeMs: state.totalBuildTimeMs + buildMs,
          buildStartTime: null,
        });

        // Achievement milestones
        if (achievementMilestones[newCount]) {
          const a = achievementMilestones[newCount];
          setTimeout(() => toastAchievement(a.title, a.msg), 1500);
        }

        // Friendly message every 2 tasks
        if (newCount % 2 === 0 && newCount > 0) {
          const fm = friendlyMessages[Math.floor(Math.random() * friendlyMessages.length)];
          setTimeout(() => toastFriendly(fm.msg, fm.title), 3000);
        }

        // Pro tip every 3 tasks
        if (newCount % 3 === 0) {
          const tip = proTips[Math.floor(Math.random() * proTips.length)];
          setTimeout(() => toastSuggestion(tip), 5000);
        }

        // Upgrade prompt after 5 tasks (free plan)
        if (newCount === 5 && get().plan === 'free') {
          setTimeout(() => {
            toastUpgrade(
              'You have used 5 of your 10 free builds. Upgrade to Pro for unlimited builds, priority AI, and more.',
              () => set({ upgradeModalOpen: true }),
            );
          }, 4000);
        }

        // Usage warning at 8 tasks
        if (newCount === 8 && get().plan === 'free') {
          setTimeout(() => {
            toastUpgrade(
              'Only 2 free builds remaining! Start your 7-day free trial to keep building without limits.',
              () => set({ upgradeModalOpen: true }),
            );
          }, 3000);
        }
      },

      trackFileCreated: () => set((s) => ({ filesCreated: s.filesCreated + 1 })),

      trackDeploy: () => {
        const newCount = get().deploysCount + 1;
        set({ deploysCount: newCount });
        if (newCount === 1) {
          setTimeout(() => toastAchievement('First Deploy!', 'Your project is live on the internet!'), 1500);
        }
      },

      trackBuildTime: (ms) => set((s) => ({ totalBuildTimeMs: s.totalBuildTimeMs + ms })),

      shouldShowUpgrade: () => {
        const state = get();
        return state.plan === 'free' && state.tasksCompleted >= state.freeTasksLimit;
      },

      getUsageSummary: () => {
        const s = get();
        const mins = Math.round(s.totalBuildTimeMs / 60000);
        return `${s.tasksCompleted} builds | ${s.filesCreated} files | ${s.deploysCount} deploys | ${mins}m build time`;
      },
    }),
    {
      name: 'masidy-usage',
      partialize: (state) => ({
        tasksCompleted: state.tasksCompleted,
        filesCreated: state.filesCreated,
        deploysCount: state.deploysCount,
        totalBuildTimeMs: state.totalBuildTimeMs,
        plan: state.plan,
      }),
    },
  ),
);
