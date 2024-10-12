import { getServerAuthSession } from "@/server/auth";
import Dashboard from "./_components/dashboard";

export default async function Home() {
  const session = await getServerAuthSession();
  return <Dashboard session={session} />;
}
