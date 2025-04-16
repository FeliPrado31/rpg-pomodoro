// ===== TIMER VARIABLES =====
let timeLeft = 25 * 60; // Default: 25 minutes in seconds
let timerInterval = null;
let isRunning = false;
let currentMode = 'work'; // 'work', 'shortBreak', or 'longBreak'
let pomodoroCount = 0;
let longBreakInterval = 4; // Default: Long break after 4 pomodoros

// ===== RPG VARIABLES =====
let level = 1;
let currentXp = 0;
let xpToNextLevel = 100; // Default: 100 XP needed for level 2
const xpPerPomodoro = 25; // Default: 25 XP per completed work session

// ===== ENERGY VARIABLES =====
let energy = 100; // Default: 100% energy
let maxEnergy = 100;
let energyStatus = 'energized'; // 'energized', 'high', 'medium', 'low', 'resting'
let activeStreak = 0; // Number of consecutive days with activity
let lastActiveDate = new Date().toDateString();
let restDayTaken = false; // Whether a rest day has been taken after 6 days of activity
let energizedBonus = 0.25; // 25% XP bonus when energized

// Energy costs and restoration
const energyCostPerPomodoro = 10; // Energy cost per Pomodoro
const energyRestorationPerShortBreak = 5; // Energy restored per short break
const energyRestorationPerLongBreak = 15; // Energy restored per long break

// Energy thresholds
const highEnergyThreshold = 80;
const mediumEnergyThreshold = 40;
const lowEnergyThreshold = 0;

// XP modifiers based on energy
const highEnergyXpModifier = 1.0; // 100% XP
const mediumEnergyXpModifier = 0.8; // 80% XP
const lowEnergyXpModifier = 0.5; // 50% XP

// ===== ACHIEVEMENT VARIABLES =====
let achievements = [
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete 3 Pomodoros before noon',
        icon: '🌅',
        unlocked: false,
        progress: 0,
        target: 3,
        xpReward: 50,
        check: function() {
            const currentHour = new Date().getHours();
            return currentHour < 12; // Before noon
        }
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete 3 Pomodoros after 8 PM',
        icon: '🦉',
        unlocked: false,
        progress: 0,
        target: 3,
        xpReward: 50,
        check: function() {
            const currentHour = new Date().getHours();
            return currentHour >= 20; // After 8 PM
        }
    },
    {
        id: 'marathon',
        name: 'Marathon',
        description: 'Complete 10 Pomodoros in a single day',
        icon: '🏃',
        unlocked: false,
        progress: 0,
        target: 10,
        xpReward: 100,
        dailyReset: true
    },
    {
        id: 'level_5',
        name: 'Apprentice',
        description: 'Reach Level 5',
        icon: '🏆',
        unlocked: false,
        progress: 1, // Starting at level 1
        target: 5,
        xpReward: 0 // No XP reward as leveling up already gives benefits
    },
    {
        id: 'pomodoro_50',
        name: 'Half Century',
        description: 'Complete 50 Pomodoros total',
        icon: '🍅',
        unlocked: false,
        progress: 0,
        target: 50,
        xpReward: 75
    },
    {
        id: 'pomodoro_100',
        name: 'Century',
        description: 'Complete 100 Pomodoros total',
        icon: '💯',
        unlocked: false,
        progress: 0,
        target: 100,
        xpReward: 150
    }
];

// Track daily stats for achievements
let dailyStats = {
    date: new Date().toDateString(),
    pomodorosCompleted: 0,
    pomodorosBeforeNoon: 0,
    breaksCompleted: 0,
    breaksSkipped: 0
};

// ===== QUEST VARIABLES =====
// Pool of possible daily quests
const dailyQuestPool = [
    {
        id: 'complete_pomodoros',
        title: 'Focus Master',
        description: 'Complete {target} Pomodoros today',
        type: 'pomodoro_count',
        minTarget: 3,
        maxTarget: 8,
        xpReward: 50,
        icon: '🎯'
    },
    {
        id: 'morning_pomodoros',
        title: 'Early Riser',
        description: 'Complete {target} Pomodoros before noon',
        type: 'pomodoro_before_noon',
        minTarget: 1,
        maxTarget: 4,
        xpReward: 40,
        icon: '🌅'
    },
    {
        id: 'take_breaks',
        title: 'Well Rested',
        description: 'Complete {target} breaks without skipping',
        type: 'breaks_completed',
        minTarget: 2,
        maxTarget: 6,
        xpReward: 30,
        icon: '☕'
    },
    {
        id: 'long_session',
        title: 'Deep Work',
        description: 'Complete a session of {target} consecutive Pomodoros',
        type: 'consecutive_pomodoros',
        minTarget: 2,
        maxTarget: 4,
        xpReward: 60,
        icon: '🧠'
    }
];

// Pool of possible weekly challenges
const weeklyChallengPool = [
    {
        id: 'weekly_pomodoros',
        title: 'Weekly Warrior',
        description: 'Complete {target} Pomodoros this week',
        type: 'weekly_pomodoro_count',
        minTarget: 15,
        maxTarget: 30,
        xpReward: 150,
        icon: '🏅'
    },
    {
        id: 'daily_streak',
        title: 'Consistency King',
        description: 'Complete at least one Pomodoro on {target} different days this week',
        type: 'days_with_pomodoros',
        minTarget: 3,
        maxTarget: 6,
        xpReward: 120,
        icon: '📆'
    },
    {
        id: 'quest_master',
        title: 'Quest Master',
        description: 'Complete {target} daily quests this week',
        type: 'completed_quests',
        minTarget: 3,
        maxTarget: 7,
        xpReward: 100,
        icon: '⚔️'
    }
];

// Active quests and challenges
let activeQuests = [];
let activeWeeklyChallenge = null;

// Weekly stats
let weeklyStats = {
    weekStartDate: getWeekStartDate(),
    pomodorosCompleted: 0,
    daysWithPomodoros: {},
    completedQuests: 0
};

// ===== CUSTOMIZATION VARIABLES =====
// Character classes
const characterClasses = [
    {
        id: 'novice',
        name: 'Novice',
        icon: '👤',
        description: 'A beginner on the path to productivity.',
        unlockRequirement: null, // Available by default
        selected: true
    },
    {
        id: 'warrior',
        name: 'Warrior',
        icon: '👷',
        description: 'Focused and determined. +5% XP for completing consecutive Pomodoros.',
        unlockRequirement: { type: 'level', value: 5 },
        selected: false,
        bonus: { type: 'consecutive_xp', value: 0.05 }
    },
    {
        id: 'mage',
        name: 'Mage',
        icon: '🧙',
        description: 'Master of time. Can reduce work session length by 5 mins once per day and still get full XP.',
        unlockRequirement: { type: 'level', value: 10 },
        selected: false,
        bonus: { type: 'time_warp', value: 5, usedToday: false }
    },
    {
        id: 'rogue',
        name: 'Rogue',
        icon: '🥷',
        description: 'Opportunistic and quick. 10% chance to get double XP from a Pomodoro.',
        unlockRequirement: { type: 'level', value: 8 },
        selected: false,
        bonus: { type: 'double_xp_chance', value: 0.1 }
    },
    {
        id: 'monk',
        name: 'Monk',
        icon: '🤭',
        description: 'Disciplined and patient. Breaks restore more energy and provide small XP.',
        unlockRequirement: { type: 'achievement', value: 'marathon' },
        selected: false,
        bonus: { type: 'break_bonus', value: 5 }
    }
];

// Timer themes
const timerThemes = [
    {
        id: 'default',
        name: 'Default',
        icon: '⏱',
        description: 'Clean and simple timer display.',
        colors: { background: '#ffffff', text: '#2c3e50', accent: '#3498db' },
        unlockRequirement: null, // Available by default
        selected: true
    },
    {
        id: 'forest',
        name: 'Forest',
        icon: '🌲',
        description: 'Calm and natural green theme.',
        colors: { background: '#e8f5e9', text: '#1b5e20', accent: '#4caf50' },
        unlockRequirement: { type: 'level', value: 3 },
        selected: false
    },
    {
        id: 'night',
        name: 'Night Owl',
        icon: '🌙',
        description: 'Dark theme, easy on the eyes.',
        colors: { background: '#263238', text: '#eceff1', accent: '#7e57c2' },
        unlockRequirement: { type: 'achievement', value: 'night_owl' },
        selected: false
    },
    {
        id: 'sunrise',
        name: 'Sunrise',
        icon: '🌅',
        description: 'Energizing morning colors.',
        colors: { background: '#fff8e1', text: '#ff6f00', accent: '#ffb300' },
        unlockRequirement: { type: 'achievement', value: 'early_bird' },
        selected: false
    },
    {
        id: 'ocean',
        name: 'Ocean',
        icon: '🌊',
        description: 'Calming blue tones for focus.',
        colors: { background: '#e3f2fd', text: '#0d47a1', accent: '#29b6f6' },
        unlockRequirement: { type: 'level', value: 7 },
        selected: false
    }
];

// Notification sounds
const notificationSounds = [
    {
        id: 'bell',
        name: 'Bell',
        icon: '🔔',
        description: 'A simple bell sound.',
        sound: 'bell',
        unlockRequirement: null, // Available by default
        selected: true
    },
    {
        id: 'chime',
        name: 'Chime',
        icon: '🎵',
        description: 'Gentle wind chimes.',
        sound: 'chime',
        unlockRequirement: { type: 'level', value: 4 },
        selected: false
    },
    {
        id: 'victory',
        name: 'Victory',
        icon: '🎉',
        description: 'Triumphant fanfare!',
        sound: 'victory',
        unlockRequirement: { type: 'level', value: 6 },
        selected: false
    },
    {
        id: 'magic',
        name: 'Magic',
        icon: '✨',
        description: 'Magical spell sound effect.',
        sound: 'magic',
        unlockRequirement: { type: 'achievement', value: 'level_5' },
        selected: false
    },
    {
        id: 'zen',
        name: 'Zen',
        icon: '🤬',
        description: 'Peaceful meditation bowl.',
        sound: 'zen',
        unlockRequirement: { type: 'pomodoro_count', value: 50 },
        selected: false
    }
];

// Background styles
const backgroundStyles = [
    {
        id: 'default',
        name: 'Default',
        icon: '⬜',
        description: 'Clean white background.',
        style: { background: '#f5f5f5' },
        unlockRequirement: null, // Available by default
        selected: true
    },
    {
        id: 'gradient',
        name: 'Gradient',
        icon: '🌈',
        description: 'Subtle color gradient background.',
        style: { background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
        unlockRequirement: { type: 'level', value: 2 },
        selected: false
    },
    {
        id: 'nature',
        name: 'Nature',
        icon: '🌿',
        description: 'Calming nature pattern.',
        style: { background: '#e8f5e9 url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%234caf50\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' },
        unlockRequirement: { type: 'achievement', value: 'early_bird' },
        selected: false
    },
    {
        id: 'dark',
        name: 'Dark Mode',
        icon: '🌒',
        description: 'Easy on the eyes dark theme.',
        style: { background: '#2c3e50', color: '#ecf0f1' },
        unlockRequirement: { type: 'achievement', value: 'night_owl' },
        selected: false
    },
    {
        id: 'focus',
        name: 'Deep Focus',
        icon: '🔍',
        description: 'Minimalist design for maximum focus.',
        style: { background: '#fafafa', filter: 'saturate(0.8)' },
        unlockRequirement: { type: 'pomodoro_count', value: 100 },
        selected: false
    }
];

// Currently selected customizations
let selectedClass = characterClasses.find(c => c.selected);
let selectedTheme = timerThemes.find(t => t.selected);
let selectedSound = notificationSounds.find(s => s.selected);
let selectedBackground = backgroundStyles.find(b => b.selected);

// ===== SETTINGS VARIABLES =====
let workDuration = 25; // Default: 25 minutes
let shortBreakDuration = 5; // Default: 5 minutes
let longBreakDuration = 15; // Default: 15 minutes

// ===== DOM ELEMENTS =====
// Timer elements
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const timerModeElement = document.getElementById('timer-mode');
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');
const resetButton = document.getElementById('reset-btn');
const skipButton = document.getElementById('skip-btn');

// Character elements
const levelElement = document.getElementById('level');
const currentXpElement = document.getElementById('current-xp');
const xpToNextLevelElement = document.getElementById('xp-to-next-level');
const xpBarElement = document.getElementById('xp-bar');
const pomodoroCountElement = document.getElementById('pomodoro-count');
const energyValueElement = document.getElementById('energy-value');
const energyStatusElement = document.getElementById('energy-status');
const energyBarElement = document.getElementById('energy-bar');

// Achievement elements
const achievementsContainer = document.getElementById('achievements-container');
const noAchievementsElement = document.getElementById('no-achievements');

// Quest elements
const dailyQuestsContainer = document.getElementById('daily-quests-container');
const weeklyChallengContainer = document.getElementById('weekly-challenge-container');
const noDailyQuestsElement = document.getElementById('no-daily-quests');
const noWeeklyChallengeElement = document.getElementById('no-weekly-challenge');

// Character customization elements
const avatarImageElement = document.getElementById('avatar-image');
const characterClassElement = document.getElementById('character-class');
const customizeButton = document.getElementById('customize-btn');
const customizationModal = document.getElementById('customization-modal');
const closeModalButton = document.getElementById('close-modal');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Customization item containers
const classItemsContainer = document.getElementById('class-items');
const themeItemsContainer = document.getElementById('theme-items');
const soundItemsContainer = document.getElementById('sound-items');
const backgroundItemsContainer = document.getElementById('background-items');

// Settings elements
const workDurationInput = document.getElementById('work-duration');
const shortBreakDurationInput = document.getElementById('short-break-duration');
const longBreakDurationInput = document.getElementById('long-break-duration');
const longBreakIntervalInput = document.getElementById('long-break-interval');
const saveSettingsButton = document.getElementById('save-settings-btn');

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    // Load saved progress and settings
    loadProgress();

    // Initialize timer display
    updateTimerDisplay();
    updateCharacterStats();

    // Initialize achievements
    renderAchievements();

    // Check for day/week change and generate quests if needed
    checkDayChange();
    checkWeekChange();

    // Check for active streak and rest day bonuses
    checkActiveStreak();

    // Generate quests if none exist
    if (activeQuests.length === 0) {
        generateDailyQuests();
    }

    if (!activeWeeklyChallenge) {
        generateWeeklyChallenge();
    }

    // Render quests and challenges
    renderQuests();
    renderWeeklyChallenge();

    // Initialize customization
    updateCharacterDisplay();
    renderCustomizationItems();

    // Initialize energy display
    updateEnergyDisplay();

    // Set up button event listeners
    startButton.addEventListener('click', startTimer);
    pauseButton.addEventListener('click', pauseTimer);
    resetButton.addEventListener('click', resetTimer);
    skipButton.addEventListener('click', skipInterval);
    saveSettingsButton.addEventListener('click', saveSettings);

    // Customization event listeners
    customizeButton.addEventListener('click', openCustomizationModal);
    closeModalButton.addEventListener('click', closeCustomizationModal);

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === customizationModal) {
            closeCustomizationModal();
        }
    });

    // Apply theme on load
    applyTheme(selectedTheme);
    applyBackground(selectedBackground);
});

// ===== TIMER FUNCTIONS =====
/**
 * Starts the timer
 */
function startTimer() {
    if (isRunning) return;

    // Check if Mage time warp ability can be used
    if (currentMode === 'work' &&
        selectedClass.id === 'mage' &&
        selectedClass.bonus &&
        selectedClass.bonus.type === 'time_warp' &&
        !selectedClass.bonus.usedToday) {

        const useTimeWarp = confirm(`Use ${selectedClass.name}'s Time Warp ability? This will reduce the work session by ${selectedClass.bonus.value} minutes but still award full XP.`);

        if (useTimeWarp) {
            // Reduce timer by the time warp amount (in seconds)
            const reductionSeconds = selectedClass.bonus.value * 60;
            timeLeft = Math.max(60, timeLeft - reductionSeconds); // Ensure at least 1 minute remains

            // Mark ability as used for today
            selectedClass.bonus.usedToday = true;
            saveProgress();

            alert(`Time Warp activated! Work session reduced by ${selectedClass.bonus.value} minutes.`);
        }
    }

    isRunning = true;
    startButton.disabled = true;
    pauseButton.disabled = false;

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            completeInterval();
        }
    }, 1000);
}

/**
 * Pauses the timer
 */
function pauseTimer() {
    if (!isRunning) return;

    isRunning = false;
    startButton.disabled = false;
    pauseButton.disabled = true;

    clearInterval(timerInterval);
}

/**
 * Resets the current timer interval
 */
function resetTimer() {
    pauseTimer();

    // Reset time based on current mode
    if (currentMode === 'work') {
        timeLeft = workDuration * 60;
    } else if (currentMode === 'shortBreak') {
        timeLeft = shortBreakDuration * 60;
    } else {
        timeLeft = longBreakDuration * 60;
    }

    updateTimerDisplay();
}

/**
 * Skips the current interval and moves to the next one
 */
function skipInterval() {
    pauseTimer();

    // If skipping a work session, don't award XP
    if (currentMode === 'work') {
        switchMode();
    } else {
        // If skipping a break, go back to work mode
        currentMode = 'work';
        timeLeft = workDuration * 60;
        timerModeElement.textContent = 'WORK';

        // Track skipped breaks for quests
        dailyStats.breaksSkipped++;

        // Skipping breaks has energy consequences
        energy = Math.max(0, energy - 5); // Small energy penalty for skipping breaks
        updateEnergyStatus();
        updateEnergyDisplay();

        // Show warning if energy is getting low
        if (energy < mediumEnergyThreshold) {
            alert('Warning: Your energy is getting low. Taking breaks helps restore energy and maintain XP gains.');
        }

        saveProgress();
    }

    updateTimerDisplay();
}

/**
 * Updates the timer display with the current time left
 */
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');
}

// Track consecutive pomodoros for quests
let consecutivePomodoros = 0;

/**
 * Handles completion of a timer interval
 */
function completeInterval() {
    pauseTimer();
    playNotificationSound();

    if (currentMode === 'work') {
        // Decrease energy for completing a work session
        decreaseEnergy();

        // Get XP modifier based on energy level
        const energyModifier = getEnergyXpModifier();
        const modifiedXp = Math.round(xpPerPomodoro * energyModifier);

        // Show energy-based XP message if not normal
        if (energyModifier !== 1.0) {
            let message = '';
            if (energyModifier > 1.0) {
                message = `Energy Bonus: +${Math.round((energyModifier - 1) * 100)}% XP (${modifiedXp} XP total)`;
            } else {
                message = `Low Energy: ${Math.round((1 - energyModifier) * 100)}% XP reduction (${modifiedXp} XP total)`;
            }
            alert(message);
        }

        // Award XP for completing a work session
        awardXp(modifiedXp);
        pomodoroCount++;
        pomodoroCountElement.textContent = pomodoroCount;

        // Update daily stats
        dailyStats.pomodorosCompleted++;

        // Check if it's before noon
        const currentHour = new Date().getHours();
        if (currentHour < 12) {
            dailyStats.pomodorosBeforeNoon++;
        }

        // Update consecutive pomodoros
        consecutivePomodoros++;

        // Update achievements
        updateTimeBasedAchievements();
        checkAchievements();

        // Update quests
        updateQuestProgress('pomodoro_count');
        if (currentHour < 12) {
            updateQuestProgress('pomodoro_before_noon');
        }
        if (consecutivePomodoros >= 2) {
            updateQuestProgress('consecutive_pomodoros');
        }

        // Update weekly stats
        weeklyStats.pomodorosCompleted++;

        saveProgress();
    } else {
        // It's a break completion - increase energy
        increaseEnergy(currentMode);

        dailyStats.breaksCompleted++;
        updateQuestProgress('breaks_completed');

        // Apply Monk class bonus for completing breaks
        if (selectedClass.id === 'monk' && selectedClass.bonus) {
            const breakXp = selectedClass.bonus.value;
            awardXp(breakXp);
            alert(`${selectedClass.name} Bonus: +${breakXp} XP for completing a break!`);
        }

        // Reset consecutive pomodoros counter after a break
        consecutivePomodoros = 0;
    }

    switchMode();
    updateTimerDisplay();
}

/**
 * Switches between work and break modes
 */
function switchMode() {
    if (currentMode === 'work') {
        // After work, determine if it should be a short or long break
        if (pomodoroCount % longBreakInterval === 0) {
            currentMode = 'longBreak';
            timeLeft = longBreakDuration * 60;
            timerModeElement.textContent = 'LONG BREAK';
        } else {
            currentMode = 'shortBreak';
            timeLeft = shortBreakDuration * 60;
            timerModeElement.textContent = 'SHORT BREAK';
        }
    } else {
        // After any break, go back to work mode
        currentMode = 'work';
        timeLeft = workDuration * 60;
        timerModeElement.textContent = 'WORK';
    }
}

/**
 * Plays a notification sound (placeholder function)
 */
function playNotificationSound() {
    // This would play a sound when an interval completes
    // For MVP, we'll just use an alert
    alert(`${currentMode.toUpperCase()} session completed!`);
}

// ===== RPG FUNCTIONS =====
/**
 * Awards XP to the character
 * @param {number} amount - Amount of XP to award
 */
function awardXp(amount) {
    // Apply character class bonuses if applicable
    if (selectedClass.bonus) {
        // Rogue has a chance for double XP
        if (selectedClass.bonus.type === 'double_xp_chance' && Math.random() < selectedClass.bonus.value) {
            amount *= 2;
            alert(`${selectedClass.name} Bonus: Double XP! +${amount} XP`);
        }

        // Warrior gets bonus XP for consecutive Pomodoros
        if (selectedClass.bonus.type === 'consecutive_xp' && consecutivePomodoros > 1) {
            const bonus = Math.floor(amount * selectedClass.bonus.value);
            amount += bonus;
            alert(`${selectedClass.name} Bonus: +${bonus} XP for consecutive Pomodoros!`);
        }
    }

    currentXp += amount;
    levelUpCheck();
    updateCharacterStats();
}

/**
 * Checks if the character should level up
 */
function levelUpCheck() {
    if (currentXp >= xpToNextLevel) {
        level++;
        currentXp -= xpToNextLevel;
        // Increase XP required for next level (simple formula)
        xpToNextLevel = Math.floor(xpToNextLevel * 1.5);

        // Show level up notification
        alert(`Level Up! You are now level ${level}!`);

        // Check for level-based achievements
        const levelAchievement = achievements.find(a => a.id === 'level_5');
        if (levelAchievement && !levelAchievement.unlocked) {
            levelAchievement.progress = level;
            checkAchievements();
        }

        // Check for newly unlocked customizations
        checkForUnlockedCustomizations();

        // Check if there's still excess XP for another level up
        levelUpCheck();
    }
}

/**
 * Updates the character stats display
 */
function updateCharacterStats() {
    levelElement.textContent = level;
    currentXpElement.textContent = currentXp;
    xpToNextLevelElement.textContent = xpToNextLevel;

    // Update XP bar
    const xpPercentage = (currentXp / xpToNextLevel) * 100;
    xpBarElement.style.width = `${xpPercentage}%`;

    // Update energy display
    updateEnergyDisplay();
}

// ===== ENERGY FUNCTIONS =====
/**
 * Updates the energy display
 */
function updateEnergyDisplay() {
    // Update energy value
    energyValueElement.textContent = Math.round(energy);

    // Update energy bar width
    energyBarElement.style.width = `${energy}%`;

    // Update energy bar and status classes
    energyBarElement.className = 'energy-bar';
    energyStatusElement.className = 'energy-status';

    // Set appropriate class based on energy level
    if (energyStatus === 'energized') {
        energyStatusElement.textContent = 'Energized';
        energyStatusElement.classList.add('energized');
    } else if (energyStatus === 'resting') {
        energyStatusElement.textContent = 'Resting';
        energyStatusElement.classList.add('resting');
    } else if (energy >= highEnergyThreshold) {
        energyStatusElement.textContent = 'High';
        energyStatusElement.classList.add('high');
    } else if (energy >= mediumEnergyThreshold) {
        energyStatusElement.textContent = 'Medium';
        energyStatusElement.classList.add('medium');
        energyBarElement.classList.add('medium');
    } else {
        energyStatusElement.textContent = 'Low';
        energyStatusElement.classList.add('low');
        energyBarElement.classList.add('low');
    }
}

/**
 * Decreases energy when completing a Pomodoro
 */
function decreaseEnergy() {
    // Apply energy cost
    energy = Math.max(0, energy - energyCostPerPomodoro);

    // Update energy status based on new energy level
    updateEnergyStatus();

    // Update display
    updateEnergyDisplay();
}

/**
 * Increases energy when completing a break
 * @param {string} breakType - Type of break ('shortBreak' or 'longBreak')
 */
function increaseEnergy(breakType) {
    // Determine energy restoration amount
    const restorationAmount = breakType === 'longBreak'
        ? energyRestorationPerLongBreak
        : energyRestorationPerShortBreak;

    // Apply energy restoration
    energy = Math.min(maxEnergy, energy + restorationAmount);

    // Update energy status based on new energy level
    updateEnergyStatus();

    // Update display
    updateEnergyDisplay();
}

/**
 * Updates the energy status based on current energy level
 */
function updateEnergyStatus() {
    // Don't change if currently energized or resting
    if (energyStatus === 'energized' || energyStatus === 'resting') {
        return;
    }

    // Set status based on energy thresholds
    if (energy >= highEnergyThreshold) {
        energyStatus = 'high';
    } else if (energy >= mediumEnergyThreshold) {
        energyStatus = 'medium';
    } else {
        energyStatus = 'low';
    }
}

/**
 * Gets the XP modifier based on current energy level
 * @returns {number} - XP modifier (multiplier)
 */
function getEnergyXpModifier() {
    if (energyStatus === 'energized') {
        return 1 + energizedBonus; // 125% XP when energized
    } else if (energy >= highEnergyThreshold) {
        return highEnergyXpModifier;
    } else if (energy >= mediumEnergyThreshold) {
        return mediumEnergyXpModifier;
    } else {
        return lowEnergyXpModifier;
    }
}

/**
 * Checks for active streak and rest day bonuses
 */
function checkActiveStreak() {
    const today = new Date().toDateString();

    // If this is a new day
    if (lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();

        // If yesterday was the last active day, increase streak
        if (lastActiveDate === yesterdayString) {
            activeStreak++;

            // Check if we've reached 6 consecutive days
            if (activeStreak === 6 && !restDayTaken) {
                alert('You\'ve been active for 6 consecutive days! Taking a rest day tomorrow will give you an Energized bonus for the following day.');
            }
        } else {
            // Check if this was a rest day after 6 active days
            if (activeStreak >= 6 && !restDayTaken) {
                // Apply energized status for today
                energyStatus = 'energized';
                restDayTaken = true;
                alert('Rest day bonus activated! You are Energized today and will receive +25% XP on all Pomodoros.');
            } else {
                // Reset streak if more than one day was missed
                activeStreak = 0;
                restDayTaken = false;
            }
        }

        // Update last active date to today
        lastActiveDate = today;
        saveProgress();
    }
}

// ===== SETTINGS FUNCTIONS =====
/**
 * Saves the user's timer settings
 */
function saveSettings() {
    // Get values from inputs
    workDuration = parseInt(workDurationInput.value) || 25;
    shortBreakDuration = parseInt(shortBreakDurationInput.value) || 5;
    longBreakDuration = parseInt(longBreakDurationInput.value) || 15;
    longBreakInterval = parseInt(longBreakIntervalInput.value) || 4;

    // Validate inputs
    workDuration = Math.max(1, Math.min(60, workDuration));
    shortBreakDuration = Math.max(1, Math.min(30, shortBreakDuration));
    longBreakDuration = Math.max(1, Math.min(60, longBreakDuration));
    longBreakInterval = Math.max(1, Math.min(10, longBreakInterval));

    // Update inputs with validated values
    workDurationInput.value = workDuration;
    shortBreakDurationInput.value = shortBreakDuration;
    longBreakDurationInput.value = longBreakDuration;
    longBreakIntervalInput.value = longBreakInterval;

    // Reset timer with new duration
    resetTimer();

    // Save settings to localStorage
    saveProgress();

    alert('Settings saved!');
}

// ===== ACHIEVEMENT FUNCTIONS =====
/**
 * Renders the achievements in the UI
 */
function renderAchievements() {
    // Clear the container first
    while (achievementsContainer.firstChild) {
        achievementsContainer.removeChild(achievementsContainer.firstChild);
    }

    // Check if there are any unlocked achievements
    const hasUnlockedAchievements = achievements.some(achievement => achievement.unlocked);

    // Show/hide the "no achievements" message
    noAchievementsElement.style.display = hasUnlockedAchievements ? 'none' : 'block';

    // Add each achievement to the container
    achievements.forEach(achievement => {
        // Only show unlocked achievements and those with progress > 0
        if (achievement.unlocked || achievement.progress > 0) {
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`;

            // Calculate progress percentage for potential future use (e.g., progress bar)
            // const progressPercent = Math.min(100, (achievement.progress / achievement.target) * 100);

            achievementElement.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-progress">
                    ${achievement.unlocked ? 'Completed!' : `${achievement.progress}/${achievement.target}`}
                </div>
            `;

            achievementsContainer.appendChild(achievementElement);
        }
    });
}

/**
 * Checks if any achievements have been unlocked
 */
function checkAchievements() {
    let achievementUnlocked = false;

    achievements.forEach(achievement => {
        if (!achievement.unlocked) {
            // Update progress based on achievement type
            if (achievement.id === 'level_5') {
                achievement.progress = level;
            } else if (achievement.id === 'pomodoro_50' || achievement.id === 'pomodoro_100') {
                achievement.progress = pomodoroCount;
            }

            // Check if the achievement should be unlocked
            if (achievement.progress >= achievement.target) {
                achievement.unlocked = true;
                achievementUnlocked = true;

                // Award XP bonus if applicable
                if (achievement.xpReward > 0) {
                    awardXp(achievement.xpReward);
                    alert(`Achievement Unlocked: ${achievement.name}\nBonus XP: +${achievement.xpReward}`);
                } else {
                    alert(`Achievement Unlocked: ${achievement.name}`);
                }
            }
        }
    });

    // If any achievements were unlocked, update the UI
    if (achievementUnlocked) {
        renderAchievements();
        saveProgress();
    }
}

/**
 * Updates progress for time-based achievements (early bird, night owl, etc.)
 */
function updateTimeBasedAchievements() {
    achievements.forEach(achievement => {
        if (!achievement.unlocked && achievement.check && achievement.check()) {
            achievement.progress++;

            // Check if the achievement is now complete
            if (achievement.progress >= achievement.target) {
                achievement.unlocked = true;

                // Award XP bonus
                if (achievement.xpReward > 0) {
                    awardXp(achievement.xpReward);
                    alert(`Achievement Unlocked: ${achievement.name}\nBonus XP: +${achievement.xpReward}`);
                } else {
                    alert(`Achievement Unlocked: ${achievement.name}`);
                }
            }
        }
    });

    // Update daily stats
    dailyStats.pomodorosCompleted++;

    // Update marathon achievement
    const marathonAchievement = achievements.find(a => a.id === 'marathon');
    if (!marathonAchievement.unlocked) {
        marathonAchievement.progress = dailyStats.pomodorosCompleted;
    }

    // Update UI and save progress
    renderAchievements();
    saveProgress();
}

/**
 * Checks if the day has changed and resets daily achievements and quests
 */
function checkDayChange() {
    const today = new Date().toDateString();

    if (dailyStats.date !== today) {
        // Reset daily stats
        dailyStats = {
            date: today,
            pomodorosCompleted: 0,
            pomodorosBeforeNoon: 0,
            breaksCompleted: 0,
            breaksSkipped: 0
        };

        // Reset daily achievements
        achievements.forEach(achievement => {
            if (achievement.dailyReset && !achievement.unlocked) {
                achievement.progress = 0;
            }
        });

        // Reset Mage time warp ability
        if (selectedClass.id === 'mage' && selectedClass.bonus && selectedClass.bonus.type === 'time_warp') {
            selectedClass.bonus.usedToday = false;
        }

        // Reset energy to full at the start of a new day
        // Unless the user is in 'energized' status, which should persist
        if (energyStatus !== 'energized') {
            energy = maxEnergy;
            updateEnergyStatus();
        }

        // Generate new daily quests
        generateDailyQuests();

        saveProgress();
    }
}

/**
 * Checks if the week has changed and resets weekly challenge
 */
function checkWeekChange() {
    const currentWeekStart = getWeekStartDate();

    if (weeklyStats.weekStartDate !== currentWeekStart) {
        // Reset weekly stats
        weeklyStats = {
            weekStartDate: currentWeekStart,
            pomodorosCompleted: 0,
            daysWithPomodoros: {},
            completedQuests: 0
        };

        // Generate new weekly challenge
        generateWeeklyChallenge();

        saveProgress();
    }
}

/**
 * Gets the start date of the current week (Sunday)
 */
function getWeekStartDate() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = now.getDate() - dayOfWeek;

    const weekStart = new Date(now);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    return weekStart.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// ===== QUEST FUNCTIONS =====
/**
 * Generates new daily quests
 */
function generateDailyQuests() {
    // Clear existing quests
    activeQuests = [];

    // Randomly select 3 quests from the pool without duplicates
    const shuffledQuests = [...dailyQuestPool].sort(() => 0.5 - Math.random());
    const selectedQuests = shuffledQuests.slice(0, 3);

    // Create active quests with random targets
    selectedQuests.forEach(questTemplate => {
        const target = Math.floor(Math.random() * (questTemplate.maxTarget - questTemplate.minTarget + 1)) + questTemplate.minTarget;

        const quest = {
            ...questTemplate,
            target,
            progress: 0,
            completed: false,
            description: questTemplate.description.replace('{target}', target)
        };

        activeQuests.push(quest);
    });
}

/**
 * Generates a new weekly challenge
 */
function generateWeeklyChallenge() {
    // Randomly select a challenge from the pool
    const randomIndex = Math.floor(Math.random() * weeklyChallengPool.length);
    const challengeTemplate = weeklyChallengPool[randomIndex];

    // Create active challenge with random target
    const target = Math.floor(Math.random() * (challengeTemplate.maxTarget - challengeTemplate.minTarget + 1)) + challengeTemplate.minTarget;

    activeWeeklyChallenge = {
        ...challengeTemplate,
        target,
        progress: 0,
        completed: false,
        description: challengeTemplate.description.replace('{target}', target)
    };
}

/**
 * Renders the active daily quests
 */
function renderQuests() {
    // Clear the container
    while (dailyQuestsContainer.firstChild) {
        dailyQuestsContainer.removeChild(dailyQuestsContainer.firstChild);
    }

    // Show message if no quests
    if (activeQuests.length === 0) {
        noDailyQuestsElement.style.display = 'block';
        return;
    }

    // Hide the "no quests" message
    noDailyQuestsElement.style.display = 'none';

    // Add each quest to the container
    activeQuests.forEach(quest => {
        const questElement = document.createElement('div');
        questElement.className = `quest ${quest.completed ? 'completed' : ''}`;

        const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);

        questElement.innerHTML = `
            <div class="quest-header">
                <div class="quest-title">${quest.icon} ${quest.title}</div>
                <div class="quest-reward">+${quest.xpReward} XP</div>
            </div>
            <div class="quest-description">${quest.description}</div>
            <div class="quest-progress">
                <div class="quest-progress-bar" style="width: ${progressPercent}%"></div>
            </div>
            <div class="quest-progress-text">
                ${quest.completed ? 'Completed!' : `${quest.progress}/${quest.target}`}
            </div>
        `;

        dailyQuestsContainer.appendChild(questElement);
    });
}

/**
 * Renders the active weekly challenge
 */
function renderWeeklyChallenge() {
    // Clear the container
    while (weeklyChallengContainer.firstChild) {
        weeklyChallengContainer.removeChild(weeklyChallengContainer.firstChild);
    }

    // Show message if no challenge
    if (!activeWeeklyChallenge) {
        noWeeklyChallengeElement.style.display = 'block';
        return;
    }

    // Hide the "no challenge" message
    noWeeklyChallengeElement.style.display = 'none';

    const challenge = activeWeeklyChallenge;
    const challengeElement = document.createElement('div');
    challengeElement.className = `challenge ${challenge.completed ? 'completed' : ''}`;

    const progressPercent = Math.min(100, (challenge.progress / challenge.target) * 100);

    challengeElement.innerHTML = `
        <div class="challenge-header">
            <div class="challenge-title">${challenge.icon} ${challenge.title}</div>
            <div class="challenge-reward">+${challenge.xpReward} XP</div>
        </div>
        <div class="challenge-description">${challenge.description}</div>
        <div class="challenge-progress">
            <div class="challenge-progress-bar" style="width: ${progressPercent}%"></div>
        </div>
        <div class="challenge-progress-text">
            ${challenge.completed ? 'Completed!' : `${challenge.progress}/${challenge.target}`}
        </div>
    `;

    weeklyChallengContainer.appendChild(challengeElement);
}

/**
 * Updates quest progress based on the type of activity
 * @param {string} activityType - Type of activity (pomodoro_count, breaks_completed, etc.)
 */
function updateQuestProgress(activityType) {
    let questsUpdated = false;

    // Update daily quests
    activeQuests.forEach(quest => {
        if (!quest.completed && quest.type === activityType) {
            quest.progress++;

            // Check if quest is completed
            if (quest.progress >= quest.target) {
                quest.completed = true;
                quest.progress = quest.target; // Cap at target

                // Award XP
                awardXp(quest.xpReward);
                alert(`Quest Completed: ${quest.title}\nReward: +${quest.xpReward} XP`);

                // Update weekly stats for quest completion
                weeklyStats.completedQuests++;
            }

            questsUpdated = true;
        }
    });

    // Update weekly challenge
    if (activeWeeklyChallenge && !activeWeeklyChallenge.completed) {
        let updateChallenge = false;

        switch (activeWeeklyChallenge.type) {
            case 'weekly_pomodoro_count':
                if (activityType === 'pomodoro_count') {
                    activeWeeklyChallenge.progress++;
                    updateChallenge = true;
                }
                break;

            case 'days_with_pomodoros':
                if (activityType === 'pomodoro_count') {
                    // Add today to the days with pomodoros
                    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                    weeklyStats.daysWithPomodoros[today] = true;

                    // Count unique days
                    const uniqueDays = Object.keys(weeklyStats.daysWithPomodoros).length;
                    activeWeeklyChallenge.progress = uniqueDays;
                    updateChallenge = true;
                }
                break;

            case 'completed_quests':
                if (activityType === 'quest_completed') {
                    activeWeeklyChallenge.progress = weeklyStats.completedQuests;
                    updateChallenge = true;
                }
                break;
        }

        // Check if challenge is completed
        if (updateChallenge && activeWeeklyChallenge.progress >= activeWeeklyChallenge.target) {
            activeWeeklyChallenge.completed = true;
            activeWeeklyChallenge.progress = activeWeeklyChallenge.target; // Cap at target

            // Award XP
            awardXp(activeWeeklyChallenge.xpReward);
            alert(`Weekly Challenge Completed: ${activeWeeklyChallenge.title}\nReward: +${activeWeeklyChallenge.xpReward} XP`);

            questsUpdated = true;
        }
    }

    // Update UI if any quests were updated
    if (questsUpdated) {
        renderQuests();
        renderWeeklyChallenge();
        saveProgress();
    }
}

// ===== CUSTOMIZATION FUNCTIONS =====
/**
 * Opens the customization modal
 */
function openCustomizationModal() {
    customizationModal.style.display = 'block';
}

/**
 * Closes the customization modal
 */
function closeCustomizationModal() {
    customizationModal.style.display = 'none';
}

/**
 * Switches between tabs in the customization modal
 * @param {string} tabId - ID of the tab to switch to
 */
function switchTab(tabId) {
    // Update active tab button
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Update active tab content
    tabContents.forEach(content => {
        if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

/**
 * Updates the character display with the selected class
 */
function updateCharacterDisplay() {
    avatarImageElement.textContent = selectedClass.icon;
    characterClassElement.textContent = selectedClass.name;
}

/**
 * Renders all customization items in their respective containers
 */
function renderCustomizationItems() {
    renderClassItems();
    renderThemeItems();
    renderSoundItems();
    renderBackgroundItems();
}

/**
 * Renders character class items
 */
function renderClassItems() {
    // Clear container
    classItemsContainer.innerHTML = '';

    // Add each class
    characterClasses.forEach(characterClass => {
        const isUnlocked = isItemUnlocked(characterClass);
        const isSelected = characterClass.id === selectedClass.id;

        const classElement = document.createElement('div');
        classElement.className = `customization-item ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
        classElement.dataset.id = characterClass.id;
        classElement.dataset.type = 'class';

        let unlockText = '';
        if (!isUnlocked && characterClass.unlockRequirement) {
            if (characterClass.unlockRequirement.type === 'level') {
                unlockText = `Unlocks at Level ${characterClass.unlockRequirement.value}`;
            } else if (characterClass.unlockRequirement.type === 'achievement') {
                const achievement = achievements.find(a => a.id === characterClass.unlockRequirement.value);
                unlockText = achievement ? `Unlocks with "${achievement.name}" achievement` : 'Locked';
            }
        }

        classElement.innerHTML = `
            ${!isUnlocked ? '<div class="lock-icon">🔒</div>' : ''}
            <div class="customization-icon">${characterClass.icon}</div>
            <div class="customization-name">${characterClass.name}</div>
            <div class="customization-description">${characterClass.description}</div>
            ${!isUnlocked ? `<div class="unlock-requirement">${unlockText}</div>` : ''}
        `;

        if (isUnlocked) {
            classElement.addEventListener('click', () => selectCustomizationItem('class', characterClass.id));
        }

        classItemsContainer.appendChild(classElement);
    });
}

/**
 * Renders timer theme items
 */
function renderThemeItems() {
    // Clear container
    themeItemsContainer.innerHTML = '';

    // Add each theme
    timerThemes.forEach(theme => {
        const isUnlocked = isItemUnlocked(theme);
        const isSelected = theme.id === selectedTheme.id;

        const themeElement = document.createElement('div');
        themeElement.className = `customization-item ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
        themeElement.dataset.id = theme.id;
        themeElement.dataset.type = 'theme';

        let unlockText = '';
        if (!isUnlocked && theme.unlockRequirement) {
            if (theme.unlockRequirement.type === 'level') {
                unlockText = `Unlocks at Level ${theme.unlockRequirement.value}`;
            } else if (theme.unlockRequirement.type === 'achievement') {
                const achievement = achievements.find(a => a.id === theme.unlockRequirement.value);
                unlockText = achievement ? `Unlocks with "${achievement.name}" achievement` : 'Locked';
            }
        }

        themeElement.innerHTML = `
            ${!isUnlocked ? '<div class="lock-icon">🔒</div>' : ''}
            <div class="customization-icon">${theme.icon}</div>
            <div class="customization-name">${theme.name}</div>
            <div class="customization-description">${theme.description}</div>
            ${!isUnlocked ? `<div class="unlock-requirement">${unlockText}</div>` : ''}
        `;

        if (isUnlocked) {
            themeElement.addEventListener('click', () => selectCustomizationItem('theme', theme.id));
        }

        themeItemsContainer.appendChild(themeElement);
    });
}

/**
 * Renders notification sound items
 */
function renderSoundItems() {
    // Clear container
    soundItemsContainer.innerHTML = '';

    // Add each sound
    notificationSounds.forEach(sound => {
        const isUnlocked = isItemUnlocked(sound);
        const isSelected = sound.id === selectedSound.id;

        const soundElement = document.createElement('div');
        soundElement.className = `customization-item ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
        soundElement.dataset.id = sound.id;
        soundElement.dataset.type = 'sound';

        let unlockText = '';
        if (!isUnlocked && sound.unlockRequirement) {
            if (sound.unlockRequirement.type === 'level') {
                unlockText = `Unlocks at Level ${sound.unlockRequirement.value}`;
            } else if (sound.unlockRequirement.type === 'achievement') {
                const achievement = achievements.find(a => a.id === sound.unlockRequirement.value);
                unlockText = achievement ? `Unlocks with "${achievement.name}" achievement` : 'Locked';
            } else if (sound.unlockRequirement.type === 'pomodoro_count') {
                unlockText = `Unlocks after ${sound.unlockRequirement.value} Pomodoros`;
            }
        }

        soundElement.innerHTML = `
            ${!isUnlocked ? '<div class="lock-icon">🔒</div>' : ''}
            <div class="customization-icon">${sound.icon}</div>
            <div class="customization-name">${sound.name}</div>
            <div class="customization-description">${sound.description}</div>
            ${!isUnlocked ? `<div class="unlock-requirement">${unlockText}</div>` : ''}
        `;

        if (isUnlocked) {
            soundElement.addEventListener('click', () => selectCustomizationItem('sound', sound.id));
        }

        soundItemsContainer.appendChild(soundElement);
    });
}

/**
 * Renders background style items
 */
function renderBackgroundItems() {
    // Clear container
    backgroundItemsContainer.innerHTML = '';

    // Add each background
    backgroundStyles.forEach(background => {
        const isUnlocked = isItemUnlocked(background);
        const isSelected = background.id === selectedBackground.id;

        const backgroundElement = document.createElement('div');
        backgroundElement.className = `customization-item ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
        backgroundElement.dataset.id = background.id;
        backgroundElement.dataset.type = 'background';

        let unlockText = '';
        if (!isUnlocked && background.unlockRequirement) {
            if (background.unlockRequirement.type === 'level') {
                unlockText = `Unlocks at Level ${background.unlockRequirement.value}`;
            } else if (background.unlockRequirement.type === 'achievement') {
                const achievement = achievements.find(a => a.id === background.unlockRequirement.value);
                unlockText = achievement ? `Unlocks with "${achievement.name}" achievement` : 'Locked';
            } else if (background.unlockRequirement.type === 'pomodoro_count') {
                unlockText = `Unlocks after ${background.unlockRequirement.value} Pomodoros`;
            }
        }

        backgroundElement.innerHTML = `
            ${!isUnlocked ? '<div class="lock-icon">🔒</div>' : ''}
            <div class="customization-icon">${background.icon}</div>
            <div class="customization-name">${background.name}</div>
            <div class="customization-description">${background.description}</div>
            ${!isUnlocked ? `<div class="unlock-requirement">${unlockText}</div>` : ''}
        `;

        if (isUnlocked) {
            backgroundElement.addEventListener('click', () => selectCustomizationItem('background', background.id));
        }

        backgroundItemsContainer.appendChild(backgroundElement);
    });
}

/**
 * Checks if a customization item is unlocked
 * @param {Object} item - The customization item to check
 * @returns {boolean} - Whether the item is unlocked
 */
function isItemUnlocked(item) {
    // If no unlock requirement, it's available by default
    if (!item.unlockRequirement) return true;

    const { type, value } = item.unlockRequirement;

    switch (type) {
        case 'level':
            return level >= value;

        case 'achievement':
            const achievement = achievements.find(a => a.id === value);
            return achievement && achievement.unlocked;

        case 'pomodoro_count':
            return pomodoroCount >= value;

        default:
            return false;
    }
}

/**
 * Selects a customization item and applies its effects
 * @param {string} type - Type of customization (class, theme, sound, background)
 * @param {string} id - ID of the selected item
 */
function selectCustomizationItem(type, id) {
    switch (type) {
        case 'class':
            // Update selected class
            characterClasses.forEach(c => c.selected = c.id === id);
            selectedClass = characterClasses.find(c => c.id === id);
            updateCharacterDisplay();
            break;

        case 'theme':
            // Update selected theme
            timerThemes.forEach(t => t.selected = t.id === id);
            selectedTheme = timerThemes.find(t => t.id === id);
            applyTheme(selectedTheme);
            break;

        case 'sound':
            // Update selected sound
            notificationSounds.forEach(s => s.selected = s.id === id);
            selectedSound = notificationSounds.find(s => s.id === id);
            break;

        case 'background':
            // Update selected background
            backgroundStyles.forEach(b => b.selected = b.id === id);
            selectedBackground = backgroundStyles.find(b => b.id === id);
            applyBackground(selectedBackground);
            break;
    }

    // Re-render customization items to reflect changes
    renderCustomizationItems();

    // Save changes
    saveProgress();
}

/**
 * Applies the selected theme to the timer
 * @param {Object} theme - The theme to apply
 */
function applyTheme(theme) {
    const timerSection = document.querySelector('.timer-section');
    const timerDisplay = document.querySelector('.timer-display');
    const timerMode = document.querySelector('.timer-mode');

    if (timerSection && theme.colors) {
        timerSection.style.backgroundColor = theme.colors.background;
        timerDisplay.style.color = theme.colors.text;
        timerMode.style.color = theme.colors.accent;
    }
}

/**
 * Applies the selected background to the body
 * @param {Object} background - The background to apply
 */
function applyBackground(background) {
    if (background.style) {
        Object.keys(background.style).forEach(property => {
            document.body.style[property] = background.style[property];
        });
    }
}

/**
 * Checks for newly unlocked customization items
 */
function checkForUnlockedCustomizations() {
    let newUnlocks = [];

    // Check all customization items
    const allItems = [
        ...characterClasses,
        ...timerThemes,
        ...notificationSounds,
        ...backgroundStyles
    ];

    allItems.forEach(item => {
        // Skip already unlocked items or those with no requirements
        if (!item.unlockRequirement || item.unlocked) return;

        const nowUnlocked = isItemUnlocked(item);

        if (nowUnlocked && !item.unlocked) {
            item.unlocked = true;
            newUnlocks.push(item);
        }
    });

    // Notify user of new unlocks
    if (newUnlocks.length > 0) {
        let message = 'New customization items unlocked!\n';
        newUnlocks.forEach(item => {
            message += `- ${item.name} (${getItemTypeName(item)})\n`;
        });

        alert(message);
        renderCustomizationItems();
        saveProgress();
    }
}

/**
 * Gets the type name of a customization item
 * @param {Object} item - The customization item
 * @returns {string} - The type name
 */
function getItemTypeName(item) {
    if (characterClasses.includes(item)) return 'Character Class';
    if (timerThemes.includes(item)) return 'Timer Theme';
    if (notificationSounds.includes(item)) return 'Sound';
    if (backgroundStyles.includes(item)) return 'Background';
    return 'Item';
}

// ===== PERSISTENCE FUNCTIONS =====
/**
 * Saves progress and settings to localStorage
 */
function saveProgress() {
    const data = {
        level,
        currentXp,
        xpToNextLevel,
        pomodoroCount,
        achievements,
        dailyStats,
        activeQuests,
        activeWeeklyChallenge,
        weeklyStats,
        consecutivePomodoros,
        // Save energy data
        energy: {
            current: energy,
            max: maxEnergy,
            status: energyStatus,
            activeStreak,
            lastActiveDate,
            restDayTaken
        },
        // Save customization selections
        customization: {
            characterClasses,
            timerThemes,
            notificationSounds,
            backgroundStyles,
            selectedClass: selectedClass.id,
            selectedTheme: selectedTheme.id,
            selectedSound: selectedSound.id,
            selectedBackground: selectedBackground.id
        },
        settings: {
            workDuration,
            shortBreakDuration,
            longBreakDuration,
            longBreakInterval
        }
    };

    localStorage.setItem('pomodoroRpgData', JSON.stringify(data));
}

/**
 * Loads progress and settings from localStorage
 */
function loadProgress() {
    const savedData = localStorage.getItem('pomodoroRpgData');

    if (savedData) {
        const data = JSON.parse(savedData);

        // Load character data
        level = data.level || 1;
        currentXp = data.currentXp || 0;
        xpToNextLevel = data.xpToNextLevel || 100;
        pomodoroCount = data.pomodoroCount || 0;

        // Load achievements if available
        if (data.achievements) {
            // Merge saved achievement data with current achievement definitions
            // This ensures new achievements are added and existing ones keep their progress
            data.achievements.forEach(savedAchievement => {
                const achievementIndex = achievements.findIndex(a => a.id === savedAchievement.id);
                if (achievementIndex !== -1) {
                    // Preserve the check function from the original achievement
                    const checkFunction = achievements[achievementIndex].check;
                    achievements[achievementIndex] = savedAchievement;
                    if (checkFunction) {
                        achievements[achievementIndex].check = checkFunction;
                    }
                }
            });
        }

        // Load daily stats if available
        if (data.dailyStats) {
            dailyStats = data.dailyStats;
        }

        // Load active quests if available
        if (data.activeQuests && data.activeQuests.length > 0) {
            activeQuests = data.activeQuests;
        }

        // Load weekly challenge if available
        if (data.activeWeeklyChallenge) {
            activeWeeklyChallenge = data.activeWeeklyChallenge;
        }

        // Load weekly stats if available
        if (data.weeklyStats) {
            weeklyStats = data.weeklyStats;
        }

        // Load consecutive pomodoros if available
        if (data.consecutivePomodoros !== undefined) {
            consecutivePomodoros = data.consecutivePomodoros;
        }

        // Load energy data if available
        if (data.energy) {
            energy = data.energy.current || 100;
            maxEnergy = data.energy.max || 100;
            energyStatus = data.energy.status || 'high';
            activeStreak = data.energy.activeStreak || 0;
            lastActiveDate = data.energy.lastActiveDate || new Date().toDateString();
            restDayTaken = data.energy.restDayTaken || false;
        }

        // Load customization data if available
        if (data.customization) {
            // Load character classes
            if (data.customization.characterClasses) {
                // Merge saved class data with current class definitions
                data.customization.characterClasses.forEach(savedClass => {
                    const classIndex = characterClasses.findIndex(c => c.id === savedClass.id);
                    if (classIndex !== -1) {
                        // Preserve the bonus function from the original class
                        const bonus = characterClasses[classIndex].bonus;
                        characterClasses[classIndex] = savedClass;
                        if (bonus) {
                            characterClasses[classIndex].bonus = bonus;
                        }
                    }
                });
            }

            // Load themes
            if (data.customization.timerThemes) {
                data.customization.timerThemes.forEach(savedTheme => {
                    const themeIndex = timerThemes.findIndex(t => t.id === savedTheme.id);
                    if (themeIndex !== -1) {
                        // Preserve the colors from the original theme
                        const colors = timerThemes[themeIndex].colors;
                        timerThemes[themeIndex] = savedTheme;
                        if (colors) {
                            timerThemes[themeIndex].colors = colors;
                        }
                    }
                });
            }

            // Load sounds
            if (data.customization.notificationSounds) {
                data.customization.notificationSounds.forEach(savedSound => {
                    const soundIndex = notificationSounds.findIndex(s => s.id === savedSound.id);
                    if (soundIndex !== -1) {
                        notificationSounds[soundIndex] = savedSound;
                    }
                });
            }

            // Load backgrounds
            if (data.customization.backgroundStyles) {
                data.customization.backgroundStyles.forEach(savedBackground => {
                    const backgroundIndex = backgroundStyles.findIndex(b => b.id === savedBackground.id);
                    if (backgroundIndex !== -1) {
                        // Preserve the style from the original background
                        const style = backgroundStyles[backgroundIndex].style;
                        backgroundStyles[backgroundIndex] = savedBackground;
                        if (style) {
                            backgroundStyles[backgroundIndex].style = style;
                        }
                    }
                });
            }

            // Set selected customizations
            if (data.customization.selectedClass) {
                characterClasses.forEach(c => c.selected = c.id === data.customization.selectedClass);
                selectedClass = characterClasses.find(c => c.id === data.customization.selectedClass) || characterClasses[0];
            }

            if (data.customization.selectedTheme) {
                timerThemes.forEach(t => t.selected = t.id === data.customization.selectedTheme);
                selectedTheme = timerThemes.find(t => t.id === data.customization.selectedTheme) || timerThemes[0];
            }

            if (data.customization.selectedSound) {
                notificationSounds.forEach(s => s.selected = s.id === data.customization.selectedSound);
                selectedSound = notificationSounds.find(s => s.id === data.customization.selectedSound) || notificationSounds[0];
            }

            if (data.customization.selectedBackground) {
                backgroundStyles.forEach(b => b.selected = b.id === data.customization.selectedBackground);
                selectedBackground = backgroundStyles.find(b => b.id === data.customization.selectedBackground) || backgroundStyles[0];
            }
        }

        // Load settings
        if (data.settings) {
            workDuration = data.settings.workDuration || 25;
            shortBreakDuration = data.settings.shortBreakDuration || 5;
            longBreakDuration = data.settings.longBreakDuration || 15;
            longBreakInterval = data.settings.longBreakInterval || 4;

            // Update settings inputs
            workDurationInput.value = workDuration;
            shortBreakDurationInput.value = shortBreakDuration;
            longBreakDurationInput.value = longBreakDuration;
            longBreakIntervalInput.value = longBreakInterval;
        }

        // Set initial timer based on loaded work duration
        timeLeft = workDuration * 60;
    }
}

/*
 * ===== FUTURE GAMIFICATION IDEAS =====
 *
 * 1. Achievement System:
 *    - Track and reward specific milestones:
 *      - "Early Bird": Complete 3 Pomodoros before noon
 *      - "Night Owl": Complete 3 Pomodoros after 8 PM
 *      - "Consistent": Complete at least 1 Pomodoro for 5 consecutive days
 *      - "Marathon": Complete 10 Pomodoros in a single day
 *    - Display badges or icons for unlocked achievements
 *    - Provide small XP bonuses for each achievement
 *
 * 2. Character Classes & Skills:
 *    - Allow users to choose a character class (Warrior, Mage, Rogue, etc.)
 *    - Each class has unique skills that provide bonuses:
 *      - Warrior: "Second Wind" - Once per day, recover from a failed Pomodoro without losing streak
 *      - Mage: "Time Warp" - Once per day, reduce a work session by 5 minutes but still get full XP
 *      - Rogue: "Sneak Attack" - Chance to get bonus XP when completing Pomodoros
 *    - Skills unlock at specific levels
 *
 * 3. Energy System:
 *    - Implement an energy bar that depletes slightly with each Pomodoro
 *    - Taking proper breaks restores energy
 *    - If energy gets too low, XP gains are reduced
 *    - Encourages healthy work/break balance
 *    - Special "rest day" bonus: Taking a full day off after 6 days of activity provides an "energized"
 *      status that gives bonus XP for the next day
 */
