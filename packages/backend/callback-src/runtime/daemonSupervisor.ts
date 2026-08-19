export type DaemonSupervisorPhase =
  | "idle"
  | "opening_synthetic"
  | "starting"
  | "running"
  | "cancelling"
  | "finalizing";

type ActiveState<TTurn> =
  | { phase: "idle" }
  | { phase: "opening_synthetic" }
  | { phase: "starting"; turn: TTurn }
  | { phase: "running"; turn: TTurn }
  | { phase: "cancelling"; turn: TTurn }
  | { phase: "finalizing"; turn: TTurn };

type ShutdownState = "active" | "refresh_pending" | "stopping";

export type SupervisorRefreshDecision =
  | { action: "continue" }
  | { action: "defer"; blocker: string }
  | { action: "exit" };

/**
 * Process-local lifecycle authority for a warm provider daemon. Durable turn
 * ownership remains in Convex; this machine prevents contradictory local
 * booleans while the process claims, runs, cancels, finalizes, or drains.
 */
export class DaemonSupervisor<TClaim, TTurn> {
  private active: ActiveState<TTurn> = { phase: "idle" };
  private pendingClaimValue: TClaim | null = null;
  private shutdown: ShutdownState = "active";

  get phase(): DaemonSupervisorPhase {
    return this.active.phase;
  }

  get currentTurn(): TTurn | null {
    switch (this.active.phase) {
      case "running":
      case "starting":
      case "cancelling":
      case "finalizing":
        return this.active.turn;
      case "idle":
      case "opening_synthetic":
        return null;
    }
  }

  get pendingClaim(): TClaim | null {
    return this.pendingClaimValue;
  }

  get isStopping(): boolean {
    return this.shutdown === "stopping";
  }

  get isCancellationInFlight(): boolean {
    return this.active.phase === "cancelling";
  }

  get hasWork(): boolean {
    return this.active.phase !== "idle" || this.pendingClaimValue !== null;
  }

  beginSyntheticOpen(): boolean {
    if (this.active.phase !== "idle") return false;
    this.active = { phase: "opening_synthetic" };
    return true;
  }

  abandonSyntheticOpen(): void {
    if (this.active.phase === "opening_synthetic") {
      this.active = { phase: "idle" };
    }
  }

  parkClaim(claim: TClaim): boolean {
    if (this.pendingClaimValue !== null) return false;
    this.pendingClaimValue = claim;
    return true;
  }

  takeClaim(): TClaim | null {
    const claim = this.pendingClaimValue;
    this.pendingClaimValue = null;
    return claim;
  }

  startTurn(turn: TTurn): boolean {
    if (
      this.active.phase !== "idle" &&
      this.active.phase !== "opening_synthetic"
    ) {
      return false;
    }
    this.active = { phase: "running", turn };
    return true;
  }

  beginStarting(turn: TTurn): boolean {
    if (this.active.phase !== "idle") return false;
    this.active = { phase: "starting", turn };
    return true;
  }

  markRunning(turn: TTurn): boolean {
    if (this.active.phase !== "starting") return false;
    this.active = { phase: "running", turn };
    return true;
  }

  beginCancellation(): boolean {
    if (this.active.phase !== "running") return false;
    this.active = { phase: "cancelling", turn: this.active.turn };
    return true;
  }

  beginFinalizing(): boolean {
    if (this.active.phase !== "running") return false;
    this.active = { phase: "finalizing", turn: this.active.turn };
    return true;
  }

  settleTurn(): void {
    if (this.active.phase !== "opening_synthetic") {
      this.active = { phase: "idle" };
    }
  }

  noticeRefresh(): void {
    if (this.shutdown === "active") this.shutdown = "refresh_pending";
  }

  stop(): void {
    this.shutdown = "stopping";
  }

  decideRefresh(input: {
    watchedTurnActive: boolean;
    backgroundAgentCount: number;
    sdkMessagePending: boolean;
  }): SupervisorRefreshDecision {
    if (this.shutdown === "stopping") return { action: "exit" };
    if (this.shutdown !== "refresh_pending") return { action: "continue" };
    if (input.watchedTurnActive) {
      return { action: "defer", blocker: "watched turn" };
    }
    if (this.active.phase === "opening_synthetic") {
      return { action: "defer", blocker: "synthetic turn opening" };
    }
    if (this.active.phase !== "idle") {
      return { action: "defer", blocker: this.active.phase };
    }
    if (this.pendingClaimValue !== null) {
      return { action: "defer", blocker: "claimed turn" };
    }
    if (input.backgroundAgentCount > 0) {
      return { action: "defer", blocker: "background agent" };
    }
    if (input.sdkMessagePending) {
      return { action: "defer", blocker: "queued SDK message" };
    }
    return { action: "exit" };
  }
}
