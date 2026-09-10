import { useCallback, useEffect, useRef, useState } from "react";
import { FormDrop, FormDropError } from "@formdrop/js";
import type { SubmissionInput, SubmitResult } from "@formdrop/js";

/**
 * The submit hook (PRD W8).
 *
 * The PRD spells the surface out:
 *
 *   const { submit, isSubmitting, isSuccess, error, reset } =
 *     useFormDrop("your-form-slug");
 *
 * It is a hook *over* @formdrop/js rather than a second client -- the request,
 * the retries and the typed errors all come from there. What this adds is the
 * three pieces of state every submit form ends up writing by hand, and the two
 * lifecycle problems that are easy to get wrong when you do.
 */
export interface UseFormDropOptions {
  /** Point at staging, or a self-hosted API. */
  baseUrl?: string;
  /** Injected for tests, or for an unusual runtime. */
  fetch?: typeof globalThis.fetch;
  /** Attempts after a 5xx or 429. Defaults to the client's 2. */
  retries?: number;
  onSuccess?: (result: SubmitResult) => void;
  onError?: (error: FormDropError) => void;
}

export interface UseFormDropResult {
  /** Sends the submission. Resolves rather than throwing; read `error`. */
  submit: (data: SubmissionInput) => Promise<SubmitResult | null>;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: FormDropError | null;
  /** The API's answer to the last successful submit. */
  data: SubmitResult | null;
  /** Back to the initial state, for a form that can be sent again. */
  reset: () => void;
}

export function useFormDrop(
  slug: string,
  options: UseFormDropOptions = {},
): UseFormDropResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<FormDropError | null>(null);
  const [data, setData] = useState<SubmitResult | null>(null);

  /*
   * Callbacks live in a ref so `submit` does not change identity when a
   * caller passes an inline arrow -- which is how almost everyone passes
   * them. Without this, `submit` is a new function on every render, and any
   * effect or memo depending on it re-runs forever.
   */
  const latest = useRef(options);
  latest.current = options;

  /*
   * Two problems this solves, both of which only appear in real use.
   *
   * A form can be submitted twice before the first answer arrives -- a double
   * click, or an impatient retry. Without a token the slower response wins
   * whenever it happens to land last, and the form reports the wrong outcome.
   * Each submit takes a number, and only the newest one is allowed to write.
   *
   * The same counter covers unmounting: a form inside a dialog that closes
   * mid-request would otherwise set state on a component that is gone.
   */
  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const submit = useCallback(
    async (input: SubmissionInput): Promise<SubmitResult | null> => {
      const id = ++requestId.current;
      const isCurrent = () => mounted.current && requestId.current === id;

      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);

      try {
        const result = await FormDrop.submit(slug, input, {
          baseUrl: latest.current.baseUrl,
          fetch: latest.current.fetch,
        });

        if (!isCurrent()) return null;

        setData(result);
        setIsSuccess(true);
        latest.current.onSuccess?.(result);
        return result;
      } catch (caught) {
        if (!isCurrent()) return null;

        /*
         * Normalised, then reported rather than thrown.
         *
         * A hook that throws asynchronously cannot be caught by the caller --
         * there is no try/catch around a render -- so it would surface as an
         * unhandled rejection and, in React 19, potentially an error boundary.
         * `error` in the returned state is the only place a component can
         * actually read it.
         */
        const normalised =
          caught instanceof FormDropError
            ? caught
            : new FormDropError(
                caught instanceof Error ? caught.message : String(caught),
                0,
              );

        setError(normalised);
        latest.current.onError?.(normalised);
        return null;
      } finally {
        if (isCurrent()) setIsSubmitting(false);
      }
    },
    [slug],
  );

  const reset = useCallback(() => {
    // Invalidates anything in flight, so a late response cannot revive the
    // state a reset just cleared.
    requestId.current++;
    setIsSubmitting(false);
    setIsSuccess(false);
    setError(null);
    setData(null);
  }, []);

  return { submit, isSubmitting, isSuccess, error, data, reset };
}
