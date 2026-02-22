import { Redirect } from "expo-router";
import { getSupabase } from "../lib/supabase";
import { useEffect, useState } from "react";

export default function IndexScreen(): React.ReactElement {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <></>;
  }
  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }
  return <Redirect href="/login" />;
}
