import { useCallback, type FormEvent, type ReactNode } from "react";
import type { SubmitResult } from "@formdrop/js";
import { useFormDrop, type UseFormDropOptions, type UseFormDropResult } from "./use-form-drop.js";

/**
 * The optional wrapper (PRD W8: "an optional `<FormDropForm>` wrapper
 * handling `onSubmit`, serialization and a honeypot spam field").
 *
 * Optional is the operative word: the hook is the primary interface, and this
 * exists for the common case where a form is a form and the boilerplate is
 * the same every time.
 */

/**
 * The honeypot's field name.
 *
 * Deliberately something a bot's autofill heuristics find attractive and a
 * real form plausibly would not have. It is submitted with everything else,
 * so it must not collide with a field somebody actually uses -- the leading
 * underscore is the convention that keeps it out of the way.
 */
export const HONEYPOT_FIELD = "_gotcha";

/**
 * Hidden from people, reachable by a bot filling every input it can find.
 *
 * Not `display: none` and not `hidden`: the crude bots this catches skip
 * fields hidden that way, and the ones that do not are not fooled by
 * anything. Positioned off-canvas instead, which they do fill in.
 *
 * The accessibility half matters as much as the trick. `aria-hidden` keeps it
 * out of the accessibility tree and `tabIndex={-1}` keeps it out of the tab
 * order, so a screen reader user is never asked to fill in a trap that would
 * silently discard their submission. `autoComplete="off"` stops a browser
 * helpfully filling it for them.
 */
function Honeypot() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
        whiteSpace: "nowrap",
      }}
    >
      <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
      <input
        id={HONEYPOT_FIELD}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}

export interface FormDropFormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "children"> {
  /** The form's slug. */
  slug: string;
  options?: UseFormDropOptions;
  /**
   * Children as a function receive the submit state, which is the whole
   * reason to use this over a bare <form>.
   */
  children: ReactNode | ((state: UseFormDropResult) => ReactNode);
  /** Called after a successful submit, e.g. to clear the fields. */
  onSubmitted?: (result: SubmitResult) => void;
  /** Turns the honeypot off, for a form that has its own spam handling. */
  honeypot?: boolean;
}

export function FormDropForm({
  slug,
  options,
  children,
  onSubmitted,
  honeypot = true,
  ...formProps
}: FormDropFormProps) {
  const state = useFormDrop(slug, options);
  const { submit } = state;

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);

      /*
       * A filled honeypot means a bot, so this reports success and sends
       * nothing.
       *
       * Silence is the point. Telling a bot it was caught teaches whoever
       * runs it to leave the field alone next time, and the field only works
       * for as long as it goes unnoticed.
       */
      if (honeypot && String(data.get(HONEYPOT_FIELD) ?? "") !== "") return;

      // Never sent, whether it caught something or not: it is our field, not
      // a form field, and it has no business in the customer's submission.
      data.delete(HONEYPOT_FIELD);

      const result = await submit(data);
      if (result) {
        onSubmitted?.(result);
        // Reset only on success. Clearing a form whose submit just failed
        // throws away what somebody typed.
        form.reset();
      }
    },
    [honeypot, submit, onSubmitted],
  );

  return (
    <form {...formProps} onSubmit={handleSubmit}>
      {honeypot && <Honeypot />}
      {typeof children === "function" ? children(state) : children}
    </form>
  );
}
