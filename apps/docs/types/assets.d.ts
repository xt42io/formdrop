/**
 * Ambient declarations for non-code imports.
 *
 * Next generates `next-env.d.ts`, which references the `next` types that
 * declare these -- but that file is gitignored (it points at `.next/types/*`,
 * which only exists after a build) and turbo runs `typecheck` before `build`.
 * So on a clean checkout the docs app typechecked against no declaration for
 * `import "./global.css"` and failed with TS2307, which is exactly what CI
 * caught on the first run after this app landed.
 *
 * Committing next-env.d.ts instead would trade one failure for another: it
 * imports `./.next/types/routes.d.ts`, which is absent for the same reason.
 * Declaring what we actually import is the part that belongs in the
 * repository.
 */
declare module "*.css";
