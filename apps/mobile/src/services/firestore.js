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
