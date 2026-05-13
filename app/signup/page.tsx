"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../store/hooks";
import AuthPanel from "../components/AuthPanel";

export default function SignupPage() {
  const auth = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (auth.token) {
      router.replace("/");
    }
  }, [auth.token, router]);

  return <AuthPanel mode="register" />;
}
