import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";
import { useNotificationsStore } from "@/stores/notifications-store";

export function useAddRecipient(formId: string) {
  const queryClient = useQueryClient();
  const resetNewRecipientEmail = useNotificationsStore(
    (state) => state.resetNewRecipientEmail,
  );

  return useMutation({
    mutationFn: async (email: string) => {
      const response = await appClient.recipients.add(formId, email);
      if ("error" in response) throw new Error(response.error);
      return response.recipient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients", formId] });
      resetNewRecipientEmail();
    },
  });
}

export function useRemoveRecipient(formId: string) {
  const queryClient = useQueryClient();
  const setDeletingRecipientId = useNotificationsStore(
    (state) => state.setDeletingRecipientId,
  );

  return useMutation({
    mutationFn: async (recipientId: string) => {
      const response = await appClient.recipients.remove(formId, recipientId);
      if ("error" in response) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients", formId] });
      setDeletingRecipientId(null);
    },
  });
}

export function useUpdateRecipient(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipientId,
      enabled,
    }: {
      recipientId: string;
      enabled: boolean;
    }) => {
      const response = await appClient.recipients.update(
        formId,
        recipientId,
        enabled,
      );
      if ("error" in response) throw new Error(response.error);
      return response.recipient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients", formId] });
    },
  });
}

export function useResendVerification(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipientId: string) => {
      const response = await appClient.recipients.resendVerification(
        formId,
        recipientId,
      );
      if ("error" in response) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients", formId] });
    },
  });
}
