import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";

export function useIsPro() {
  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => appClient.subscription.get(),
  });

  const isPro =
    subscriptionData &&
    "subscription" in subscriptionData &&
    subscriptionData.subscription?.status === "active";

  return { isPro, isLoading };
}
