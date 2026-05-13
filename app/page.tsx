"use client";

import { useAppSelector } from "./store/hooks";
import LoginPage from "./login/page";
import KanbanApp from "./components/KanbanApp";

export default function Home() {
  const auth = useAppSelector((state) => state.auth);

  return auth.token ? <KanbanApp /> : <LoginPage />;
}
