import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/lib/app-client";

export function useFormUpdate(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      emailNotificationsEnabled?: boolean;
      slackNotificationsEnabled?: boolean;
      discordNotificationsEnabled?: boolean;
      googleSheetsEnabled?: boolean;
      airtableEnabled?: boolean;
    }) => {
      const response = await appClient.forms.update(formId, data);
      if ("error" in response) throw new Error(response.error);
      return response.form;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form", formId] });
    },
  });
}

export function useDisconnectSlack(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await appClient.recipients.disconnectSlack(formId);
      if ("error" in response) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form", formId] });
    },
  });
}

export function useDisconnectDiscord(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await appClient.recipients.disconnectDiscord(formId);
      if ("error" in response) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form", formId] });
    },
  });
}

export function useDisconnectGoogleSheets(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        "/api/integrations/google-sheets/disconnect",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formId }),
        },
      );
      if (!response.ok) throw new Error("Failed to disconnect");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form", formId] });
    },
  });
}

export function useDisconnectAirtable(formId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/integrations/airtable/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId }),
      });
      if (!response.ok) throw new Error("Failed to disconnect");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form", formId] });
    },
  });
}
