import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { AuthProvider } from "../lib/AuthProvider";

const queryClient = new QueryClient();

export default function RootLayout(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: true,
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
