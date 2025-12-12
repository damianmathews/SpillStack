import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFirebaseAuth } from "./AuthContext";

const TUTORIAL_COMPLETED_KEY = "@spillstack_tutorial_completed_v1";

const TutorialContext = createContext({});

export const TUTORIAL_STEPS = [
  {
    id: "quick-input",
    title: "Capture anything",
    description: "Tap Voice to speak or Text to type. AI handles the rest.",
  },
  {
    id: "idea-card",
    title: "Your ideas live here",
    description: "Ideas are organized by category. Tap any card to see details.",
  },
  {
    id: "task-item",
    title: "Tasks stay organized",
    description: "Say 'Buy milk' and it becomes a task. Tap the checkbox to complete.",
  },
  {
    id: "search",
    title: "Find anything",
    description: "Search across all your thoughts and tasks instantly.",
  },
];

// Sample content shown only during tutorial for new users
export const TUTORIAL_SAMPLE_IDEA = {
  id: "tutorial-sample-idea",
  title: "Your ideas will appear here",
  summary: "Capture thoughts by voice or text and they'll be organized automatically",
  content: "This is a sample idea to show you how SpillStack works. Your real ideas will replace this once you start capturing them.",
  category: "Ideas",
  tags: ["sample"],
  created_at: new Date().toISOString(),
  isTutorialSample: true,
};

export const TUTORIAL_SAMPLE_TASK = {
  id: "tutorial-sample-task",
  title: "Your tasks will appear here",
  completed: false,
  created_at: new Date().toISOString(),
  isTutorialSample: true,
};

export function TutorialProvider({ children }) {
  const { user } = useFirebaseAuth();
  const [isReady, setIsReady] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRefs, setTargetRefs] = useState({});
  const [targetMeasurements, setTargetMeasurements] = useState({});
  const hasCheckedTutorial = useRef(false);

  // Check if this user has completed the tutorial
  useEffect(() => {
    // Only check once when user becomes available
    if (user && !hasCheckedTutorial.current) {
      hasCheckedTutorial.current = true;
      checkTutorialStatus();
    } else if (!user) {
      // Reset when user logs out
      hasCheckedTutorial.current = false;
      setShowTutorial(false);
      setIsReady(true);
    }
  }, [user]);

  const checkTutorialStatus = async () => {
    if (!user) {
      setIsReady(true);
      setShowTutorial(false);
      return;
    }

    try {
      // Check if tutorial was completed for this specific user (stored per-user)
      const completedUsersJson = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
      const completedUsers = completedUsersJson ? JSON.parse(completedUsersJson) : {};

      // Check if this user has completed the tutorial
      const hasCompletedTutorial = completedUsers[user.uid] === true;

      if (!hasCompletedTutorial) {
        // First time for this user - show tutorial after UI fully settles
        // Use longer delay to ensure home screen is fully rendered and measured
        setTimeout(() => {
          setShowTutorial(true);
        }, 2000);
      }

      setIsReady(true);
    } catch (error) {
      console.error("Error checking tutorial status:", error);
      // On error, don't show tutorial to avoid blocking the user
      setIsReady(true);
      setShowTutorial(false);
    }
  };

  const registerTarget = useCallback((id, ref) => {
    setTargetRefs((prev) => ({ ...prev, [id]: ref }));
  }, []);

  const measureTargets = useCallback(() => {
    const measurements = {};

    Object.entries(targetRefs).forEach(([id, ref]) => {
      if (ref?.current) {
        ref.current.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            measurements[id] = { x, y, width, height };
            setTargetMeasurements((prev) => ({
              ...prev,
              [id]: { x, y, width, height },
            }));
          }
        });
      }
    });
  }, [targetRefs]);

  const nextStep = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTutorial();
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const markTutorialComplete = useCallback(async () => {
    if (!user) return;

    try {
      const completedUsersJson = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
      const completedUsers = completedUsersJson ? JSON.parse(completedUsersJson) : {};
      completedUsers[user.uid] = true;
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, JSON.stringify(completedUsers));
    } catch (error) {
      console.error("Error saving tutorial completion:", error);
    }
  }, [user]);

  const skipTutorial = useCallback(async () => {
    setShowTutorial(false);
    setCurrentStep(0);
    await markTutorialComplete();
  }, [markTutorialComplete]);

  const completeTutorial = useCallback(async () => {
    setShowTutorial(false);
    setCurrentStep(0);
    await markTutorialComplete();
  }, [markTutorialComplete]);

  // For testing/development - reset tutorial for current user
  const resetTutorial = useCallback(async () => {
    if (!user) return;

    try {
      const completedUsersJson = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
      const completedUsers = completedUsersJson ? JSON.parse(completedUsersJson) : {};
      delete completedUsers[user.uid];
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, JSON.stringify(completedUsers));
      setCurrentStep(0);
      setShowTutorial(true);
    } catch (error) {
      console.error("Error resetting tutorial:", error);
    }
  }, [user]);

  const value = {
    isReady,
    showTutorial,
    currentStep,
    totalSteps: TUTORIAL_STEPS.length,
    currentStepData: TUTORIAL_STEPS[currentStep],
    targetMeasurements,
    registerTarget,
    measureTargets,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    resetTutorial,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
};
