import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

const getUserIdeasRef = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return collection(db, "users", user.uid, "ideas");
};

const getUserTasksRef = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return collection(db, "users", user.uid, "tasks");
};

// Ideas
export const addIdea = async (idea) => {
  const ideasRef = getUserIdeasRef();
  const docRef = await addDoc(ideasRef, {
    ...idea,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateIdea = async (ideaId, updates) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const ideaRef = doc(db, "users", user.uid, "ideas", ideaId);
  await updateDoc(ideaRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteIdea = async (ideaId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const ideaRef = doc(db, "users", user.uid, "ideas", ideaId);
  await deleteDoc(ideaRef);
};

export const getIdeas = async () => {
  const ideasRef = getUserIdeasRef();
  const q = query(ideasRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const subscribeToIdeas = (callback) => {
  const user = auth.currentUser;
  if (!user) return () => {};

  const ideasRef = collection(db, "users", user.uid, "ideas");
  const q = query(ideasRef, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const ideas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(ideas);
  });
};

// Tasks
export const addTask = async (task) => {
  const tasksRef = getUserTasksRef();
  const docRef = await addDoc(tasksRef, {
    ...task,
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateTask = async (taskId, updates) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const taskRef = doc(db, "users", user.uid, "tasks", taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTask = async (taskId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const taskRef = doc(db, "users", user.uid, "tasks", taskId);
  await deleteDoc(taskRef);
};

export const getTasks = async () => {
  const tasksRef = getUserTasksRef();
  const q = query(tasksRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const subscribeToTasks = (callback) => {
  const user = auth.currentUser;
  if (!user) return () => {};

  const tasksRef = collection(db, "users", user.uid, "tasks");
  const q = query(tasksRef, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(tasks);
  });
};

// Export all user data
export const exportUserData = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const ideas = await getIdeas();
  const tasks = await getTasks();

  // Convert Firestore timestamps to ISO strings for export
  const formatTimestamp = (ts) => {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate().toISOString();
    if (ts instanceof Date) return ts.toISOString();
    return ts;
  };

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      email: user.email,
      uid: user.uid,
    },
    ideas: ideas.map((idea) => ({
      ...idea,
      createdAt: formatTimestamp(idea.createdAt),
      updatedAt: formatTimestamp(idea.updatedAt),
    })),
    tasks: tasks.map((task) => ({
      ...task,
      createdAt: formatTimestamp(task.createdAt),
      updatedAt: formatTimestamp(task.updatedAt),
    })),
  };

  return exportData;
};

// Delete all user data (ideas and tasks)
export const deleteAllUserData = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Delete all ideas
  const ideasRef = collection(db, "users", user.uid, "ideas");
  const ideasSnapshot = await getDocs(ideasRef);
  const ideaDeletes = ideasSnapshot.docs.map((docSnap) =>
    deleteDoc(doc(db, "users", user.uid, "ideas", docSnap.id))
  );

  // Delete all tasks
  const tasksRef = collection(db, "users", user.uid, "tasks");
  const tasksSnapshot = await getDocs(tasksRef);
  const taskDeletes = tasksSnapshot.docs.map((docSnap) =>
    deleteDoc(doc(db, "users", user.uid, "tasks", docSnap.id))
  );

  // Delete user document
  const userDocRef = doc(db, "users", user.uid);

  await Promise.all([...ideaDeletes, ...taskDeletes, deleteDoc(userDocRef)]);

  return { ideasDeleted: ideasSnapshot.size, tasksDeleted: tasksSnapshot.size };
};
