import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";

export const login = async (email, password) => {
  const res = await signInWithEmailAndPassword(auth, email, password);

  return {
    uid: res.user.uid,
    email: res.user.email,
  };
};