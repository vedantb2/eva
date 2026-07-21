import { useRef } from "react";

type NoPending = { has: false };
type HasPending<TArgs> = { has: true; args: TArgs };
type Pending<TArgs> = NoPending | HasPending<TArgs>;

const NO_PENDING: NoPending = { has: false };

/**
 * Wraps an async function so at most one invocation runs at a time.
 * While a call is in flight, subsequent calls are coalesced — only the
 * latest args are kept, and they run once the current invocation settles.
 *
 * Designed for autosave-on-keystroke: prevents stampeding mutations when
 * the user types quickly, while ensuring the final state is always saved.
 */
export function useSingleFlight<TArgs, TRet>(
  fn: (args: TArgs) => Promise<TRet>,
): (args: TArgs) => Promise<TRet | undefined> {
  const inFlight = useRef(false);
  const pending = useRef<Pending<TArgs>>(NO_PENDING);

  const invoke = async (args: TArgs): Promise<TRet | undefined> => {
    if (inFlight.current) {
      pending.current = { has: true, args };
      return undefined;
    }

    inFlight.current = true;
    pending.current = NO_PENDING;

    // Avoid `finally` here: TypeScript narrows discriminated unions to `never`
    // inside `finally` blocks when the try body is async, making `next.args`
    // inaccessible. Use explicit try/catch/then instead.
    let result: TRet | undefined;
    try {
      result = await fn(args);
    } catch (err) {
      inFlight.current = false;
      runPending();
      throw err;
    }
    inFlight.current = false;
    runPending();
    return result;

    function runPending(): void {
      const next: Pending<TArgs> = pending.current;
      pending.current = NO_PENDING;
      if (next.has) {
        // Recurse with the latest coalesced args — return value discarded
        // intentionally since the original caller already received undefined.
        void invoke(next.args);
      }
    }
  };

  return invoke;
}
