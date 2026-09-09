import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";

/**
 * The one icon (W4 section 4.7).
 *
 * Every icon in the product went through `<HugeiconsIcon>` directly, which
 * meant 124 call sites each restating a size -- eleven different values across
 * them, none of them wrong exactly, but no two files agreeing on what "an icon
 * in a button" measures. There was nowhere to change that answer.
 *
 * This is a thin pass-through, deliberately. It owns two defaults and nothing
 * else:
 *
 * - **size** defaults to 18. Call sites still pass a size when they mean a
 *   specific one -- 16 inside a button, 14 for a badge -- and the ones that had
 *   no opinion now inherit rather than guess.
 * - **colour** is never set here. Hugeicons draws with `currentColor`, so an
 *   icon takes the colour of the text it sits in, and that is the behaviour to
 *   protect: a `primaryColor` default would silently break every `text-*`
 *   utility already doing the job at the call site. The single place colour
 *   lives is the token ramp, applied as a class on the icon or its parent.
 *
 * Everything else -- className, strokeWidth, aria-*, ref -- forwards untouched,
 * so this is never the reason a call site cannot do something.
 */
export interface IconProps extends HugeiconsIconProps {
  size?: number;
}

export function Icon({ size = 18, ...props }: IconProps) {
  return <HugeiconsIcon size={size} {...props} />;
}
