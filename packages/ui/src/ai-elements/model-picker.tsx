"use client";

import { useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../utils/cn";
import { ProviderIcon } from "./provider-icon";
import {
  ModelPickerContent,
  buildPickerInstances,
  providerInstanceInitials,
  teamInstanceKey,
} from "./model-picker-content";
import {
  type ModelAccount,
  type ModelOption,
  findModelOption,
  formatModelDisplayLabel,
  getProviderLabel,
} from "./model-picker-types";

export type { ModelAccount, ModelOption };
export { findModelOption, formatModelDisplayLabel, getProviderLabel };

export interface ModelSelectProps<TModel extends string = string> {
  value: TModel;
  onValueChange: (model: TModel) => void;
  options: ReadonlyArray<ModelOption<TModel>>;
  disabled?: boolean;
  className?: string;
  /**
   * The user's own provider accounts. When non-empty, each provider opens into
   * Team + account groups, each listing that provider's models so picking a
   * model also picks whose credential runs it.
   */
  accounts?: ReadonlyArray<ModelAccount>;
  /** Currently selected account id, or null for the team credential. */
  accountId?: string | null;
  /** Fired alongside a model change with the chosen account (null = team). */
  onAccountChange?: (accountId: string | null) => void;
  /**
   * When set, called once per pick instead of separate model/account
   * callbacks — use this to persist both fields in a single mutation.
   */
  onSelectionChange?: (model: TModel, accountId: string | null) => void;
  /**
   * When a personal account is selected, Team for that provider is shown
   * disabled. Set false when the viewer cannot switch the sticky account
   * (e.g. non-owner on a task) so Team stays unselectable.
   */
  canSelectTeamWhilePersonal?: boolean;
}

export function ModelSelect<TModel extends string>({
  value,
  onValueChange,
  options,
  disabled,
  className,
  accounts,
  accountId = null,
  onAccountChange,
  onSelectionChange,
  canSelectTeamWhilePersonal = true,
}: ModelSelectProps<TModel>) {
  const [open, setOpen] = useState(false);
  const selectedModel = findModelOption(value, options);
  const instances = buildPickerInstances(options, accounts);

  const selectedAccount = accountId
    ? accounts?.find((account) => account.id === accountId)
    : undefined;

  const activeInstance =
    (selectedAccount
      ? instances.find((instance) => instance.key === selectedAccount.id)
      : undefined) ??
    (selectedModel
      ? instances.find(
          (instance) =>
            instance.key === teamInstanceKey(selectedModel.provider),
        )
      : undefined) ??
    instances[0];

  const showAccountBadge = Boolean(
    selectedAccount &&
    (selectedAccount.accentColor ||
      instances.filter(
        (instance) => instance.provider === selectedAccount.provider,
      ).length > 1),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-7 min-w-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50",
            className,
          )}
          disabled={disabled}
        >
          {activeInstance && selectedAccount && showAccountBadge ? (
            <span className="relative isolate inline-flex size-4 shrink-0 items-center justify-center">
              <ProviderIcon
                provider={selectedModel?.provider ?? "claude"}
                size={14}
              />
              <span
                className={cn(
                  "pointer-events-none absolute -right-0.5 -bottom-0.5 z-10 flex h-3 min-w-3 items-center justify-center rounded-full px-0.5 text-[7px] font-semibold leading-none",
                  selectedAccount.accentColor
                    ? "text-white"
                    : "bg-muted text-muted-foreground",
                )}
                style={{
                  backgroundColor: selectedAccount.accentColor,
                  boxShadow: "0 0 0 1.5px rgb(var(--input))",
                }}
                aria-hidden
              >
                {providerInstanceInitials(selectedAccount.label)}
              </span>
            </span>
          ) : (
            <ProviderIcon
              provider={selectedModel?.provider ?? "claude"}
              size={14}
            />
          )}
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedModel
              ? formatModelDisplayLabel(
                  selectedModel.provider,
                  selectedModel.label,
                )
              : "Select model"}
          </span>
          <IconChevronDown
            size={12}
            className="ml-auto shrink-0 opacity-60"
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[25rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border-0 bg-transparent p-0 shadow-none"
        onOpenAutoFocus={(event) => {
          // Let ModelPickerContent own focus (search input); Radix would
          // otherwise park it on the first focusable and fight our layout effect.
          event.preventDefault();
        }}
      >
        <ModelPickerContent
          value={value}
          accountId={accountId}
          options={options}
          accounts={accounts}
          canSelectTeamWhilePersonal={canSelectTeamWhilePersonal}
          onSelect={(modelId, nextAccountId) => {
            if (onSelectionChange) {
              onSelectionChange(modelId, nextAccountId);
            } else {
              onValueChange(modelId);
              onAccountChange?.(nextAccountId);
            }
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
