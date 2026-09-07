import { createContext, useContext } from "react";

/**
 * Whether the current viewer is on a paid plan.
 *
 * <Button requiresPro> needs to know this, but packages/ui must not know how a
 * subscription is fetched -- the old apps/web button imported a react-query
 * hook, which is exactly the dependency that kept it from being shared. So the
 * app pushes the answer down instead.
 *
 * The default is `false`, i.e. a tree with no provider gates pro features
 * rather than handing them out. That also preserves the previous behaviour
 * precisely: apps/web's useIsPro() returned `undefined` while its query was in
 * flight, and the button read that as "not pro".
 *
 * This gate is presentation only. It decides whether a control looks reachable,
 * never whether the request behind it is allowed -- that stays server-side.
 */
const PlanGateContext = createContext(false);

export function PlanGateProvider({
  isPro,
  children,
}: {
  isPro: boolean;
  children: React.ReactNode;
}) {
  return (
    <PlanGateContext.Provider value={isPro}>
      {children}
    </PlanGateContext.Provider>
  );
}

export function usePlanGate() {
  return useContext(PlanGateContext);
}
