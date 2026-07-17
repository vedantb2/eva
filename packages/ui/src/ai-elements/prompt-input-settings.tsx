"use client";

import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { cn } from "../utils/cn";
import { IconDots } from "@tabler/icons-react";
import { ProviderIcon } from "./provider-icon";

export interface ModelOption<TModel extends string = string> {
  id: TModel;
  provider: string;
  label: string;
}

function getProviderLabel(provider: string): string {
  switch (provider) {
    case "claude":
      return "Claude";
    case "codex":
      return "Codex";
    case "opencode":
      return "Opencode";
    case "cursor":
      return "Cursor";
    default:
      return provider;
  }
}

function getProviderOptions<TModel extends string>(
  options: ReadonlyArray<ModelOption<TModel>>,
): ReadonlyArray<{ id: string; label: string }> {
  const providers: Array<{ id: string; label: string }> = [];
  for (const option of options) {
    if (providers.some((provider) => provider.id === option.provider)) {
      continue;
    }
    providers.push({
      id: option.provider,
      label: getProviderLabel(option.provider),
    });
  }
  return providers;
}

function findModelOption<TModel extends string>(
  value: TModel,
  options: ReadonlyArray<ModelOption<TModel>>,
): ModelOption<TModel> | null {
  const option = options.find((entry) => entry.id === value);
  return option ?? options[0] ?? null;
}

function getProviderModels<TModel extends string>(
  options: ReadonlyArray<ModelOption<TModel>>,
  provider: string,
): ReadonlyArray<ModelOption<TModel>> {
  return options.filter((option) => option.provider === provider);
}

export interface PromptInputSettingsProps<TModel extends string = string> {
  model: TModel;
  onModelChange: (model: TModel) => void;
  options: ReadonlyArray<ModelOption<TModel>>;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function PromptInputSettings<TModel extends string>({
  model,
  onModelChange,
  options,
  disabled,
  icon,
  className,
}: PromptInputSettingsProps<TModel>) {
  const selectedModel = findModelOption(model, options);
  const providerOptions = getProviderOptions(options);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50",
            className,
          )}
          disabled={disabled}
        >
          {icon ?? <IconDots size={16} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ProviderIcon
              provider={selectedModel?.provider ?? "claude"}
              size={14}
            />
            Model
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {providerOptions.map((provider) => {
              const models = getProviderModels(options, provider.id);
              if (providerOptions.length === 1) {
                return (
                  <DropdownMenuRadioGroup
                    key={provider.id}
                    value={selectedModel?.id}
                    onValueChange={(value) => {
                      const option = options.find(
                        (entry) => entry.id === value,
                      );
                      if (option) {
                        onModelChange(option.id);
                      }
                    }}
                  >
                    {models.map((option) => (
                      <DropdownMenuRadioItem key={option.id} value={option.id}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                );
              }
              return (
                <DropdownMenuSub key={provider.id}>
                  <DropdownMenuSubTrigger>
                    <ProviderIcon provider={provider.id} size={14} />
                    {provider.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={selectedModel?.id}
                      onValueChange={(value) => {
                        const option = options.find(
                          (entry) => entry.id === value,
                        );
                        if (option) {
                          onModelChange(option.id);
                        }
                      }}
                    >
                      {models.map((option) => (
                        <DropdownMenuRadioItem
                          key={option.id}
                          value={option.id}
                        >
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A user's own provider account, surfaced as a selectable group in the picker. */
export interface ModelAccount {
  id: string;
  provider: string;
  label: string;
  accentColor?: string;
}

export interface ModelSelectProps<TModel extends string = string> {
  value: TModel;
  onValueChange: (model: TModel) => void;
  options: ReadonlyArray<ModelOption<TModel>>;
  disabled?: boolean;
  className?: string;
  /**
   * The user's own provider accounts. When non-empty, each provider's models
   * are shown once under "Team" (the shared credential) and once per matching
   * account, so picking a model also picks whose credential runs it.
   */
  accounts?: ReadonlyArray<ModelAccount>;
  /** Currently selected account id, or null for the team credential. */
  accountId?: string | null;
  /** Fired alongside a model change with the chosen account (null = team). */
  onAccountChange?: (accountId: string | null) => void;
}

const TEAM_KEY = "team";

/** Encodes an (account, model) selection as a single radio value. */
function toComposite(accountId: string | null, modelId: string): string {
  return `${accountId ?? TEAM_KEY}::${modelId}`;
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
}: ModelSelectProps<TModel>) {
  const selectedModel = findModelOption(value, options);
  const providerOptions = getProviderOptions(options);
  const hasAccounts = accounts !== undefined && accounts.length > 0;

  const selectedAccount = accountId
    ? accounts?.find((account) => account.id === accountId)
    : undefined;

  const buttonLabel = selectedModel
    ? `${getProviderLabel(selectedModel.provider)} / ${selectedModel.label}${
        selectedAccount ? ` · ${selectedAccount.label}` : ""
      }`
    : "Select model";

  // Account-aware selection: parse the composite value back into a model + the
  // account whose credential should run it.
  const applyComposite = (composite: string) => {
    const separator = composite.indexOf("::");
    if (separator === -1) return;
    const account = composite.slice(0, separator);
    const modelId = composite.slice(separator + 2);
    const option = options.find((entry) => entry.id === modelId);
    if (!option) return;
    onValueChange(option.id);
    onAccountChange?.(account === TEAM_KEY ? null : account);
  };

  const trigger = (
    <DropdownMenuTrigger asChild>
      <button
        className={cn(
          "flex items-center gap-1.5 rounded-md h-7 px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 transition-colors",
          className,
        )}
        disabled={disabled}
      >
        <ProviderIcon
          provider={selectedModel?.provider ?? "claude"}
          size={14}
        />
        {buttonLabel}
      </button>
    </DropdownMenuTrigger>
  );

  // Simple path (no accounts): the original provider-grouped radio menu.
  if (!hasAccounts) {
    return (
      <DropdownMenu modal={false}>
        {trigger}
        <DropdownMenuContent align="start">
          {providerOptions.map((provider) => {
            const models = getProviderModels(options, provider.id);
            const radioGroup = (
              <DropdownMenuRadioGroup
                value={selectedModel?.id}
                onValueChange={(modelId) => {
                  const option = options.find((entry) => entry.id === modelId);
                  if (option) onValueChange(option.id);
                }}
              >
                {models.map((option) => (
                  <DropdownMenuRadioItem key={option.id} value={option.id}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            );
            if (providerOptions.length === 1) {
              return <div key={provider.id}>{radioGroup}</div>;
            }
            return (
              <DropdownMenuSub key={provider.id}>
                <DropdownMenuSubTrigger>
                  <ProviderIcon provider={provider.id} size={14} />
                  {provider.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>{radioGroup}</DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Account-aware path: each provider submenu lists its models under "Team"
  // and once per matching account.
  const selectedComposite = selectedModel
    ? toComposite(accountId, selectedModel.id)
    : undefined;

  return (
    <DropdownMenu modal={false}>
      {trigger}
      <DropdownMenuContent align="start">
        {providerOptions.map((provider) => {
          const models = getProviderModels(options, provider.id);
          const providerAccounts =
            accounts?.filter((account) => account.provider === provider.id) ??
            [];
          return (
            <DropdownMenuSub key={provider.id}>
              <DropdownMenuSubTrigger>
                <ProviderIcon provider={provider.id} size={14} />
                {provider.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={selectedComposite}
                  onValueChange={applyComposite}
                >
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                    Team
                  </DropdownMenuLabel>
                  {models.map((option) => (
                    <DropdownMenuRadioItem
                      key={`team-${option.id}`}
                      value={toComposite(null, option.id)}
                    >
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                  {providerAccounts.map((account) => (
                    <div key={account.id}>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span
                          className="size-2 rounded-full border border-border"
                          style={{
                            backgroundColor:
                              account.accentColor ?? "currentColor",
                          }}
                        />
                        {account.label}
                      </DropdownMenuLabel>
                      {models.map((option) => (
                        <DropdownMenuRadioItem
                          key={`${account.id}-${option.id}`}
                          value={toComposite(account.id, option.id)}
                        >
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </div>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
