import { useQuery } from "@tanstack/react-query";
import { appClient, type Form } from "@/lib/app-client";

/**
 * The account's forms, under the one query key that holds them.
 *
 * A hook rather than three call sites repeating a queryFn, because they were
 * not repeating the same one. The forms page cached `response.forms` under
 * ["forms"]; the header and the command palette cached the whole `{ forms }`
 * envelope under that same key. React Query stores one value per key, so
 * whichever resolved first decided the shape and the others read the wrong
 * thing -- the header mounts above the page, so the page received an object
 * where it expected an array and threw on the first method it called.
 *
 * Nothing about the key made that visible. Owning the queryFn here does: there
 * is one definition of what ["forms"] contains, and a second shape would have
 * to be a second key.
 */
export function useForms(options?: { enabled?: boolean }) {
  return useQuery<Form[]>({
    queryKey: ["forms"],
    queryFn: async () => {
      const response = await appClient.forms.list();
      if ("error" in response) throw new Error(response.error);
      return response.forms;
    },
    enabled: options?.enabled,
  });
}
