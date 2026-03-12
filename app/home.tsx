import { Redirect } from "expo-router";

/**
 * Legacy /home route; redirect to the protected tabs root so old links still work.
 */
export default function HomeScreen(): React.ReactElement {
  return <Redirect href="/(auth)/(tabs)" />;
}
