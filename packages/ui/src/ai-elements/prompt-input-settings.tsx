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
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { IconBrain, IconTextResize, IconDots } from "@tabler/icons-react";
import { cn } from "../utils/cn";

export interface ModelOption<TModel extends string = string> {
  id: TModel;
  provider: string;
  label: string;
}

export type ResponseLength = "default" | "detailed";

const RESPONSE_LENGTHS: ReadonlyArray<{
  key: ResponseLength;
  label: string;
}> = [
  { key: "default", label: "Default" },
  { key: "detailed", label: "Detailed" },
];

function getProviderLabel(provider: string): string {
  switch (provider) {
    case "claude":
      return "Claude";
    case "codex":
      return "Codex";
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

function isResponseLength(v: string): v is ResponseLength {
  return RESPONSE_LENGTHS.some((option) => option.key === v);
}

export interface PromptInputSettingsProps<TModel extends string = string> {
  model: TModel;
  onModelChange: (model: TModel) => void;
  options: ReadonlyArray<ModelOption<TModel>>;
  responseLength?: ResponseLength;
  onResponseLengthChange?: (length: ResponseLength) => void;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function PromptInputSettings<TModel extends string>({
  model,
  onModelChange,
  options,
  responseLength,
  onResponseLengthChange,
  disabled,
  icon,
  className,
}: PromptInputSettingsProps<TModel>) {
  const selectedModel = findModelOption(model, options);
  const providerOptions = getProviderOptions(options);
  const selectedProvider =
    selectedModel?.provider ?? providerOptions[0]?.id ?? "claude";
  const providerModels = getProviderModels(options, selectedProvider);

  return (
    <DropdownMenu>
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
        {providerOptions.length > 1 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <IconBrain size={14} />
              Provider
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={selectedProvider}
                onValueChange={(provider) => {
                  const nextModel = getProviderModels(options, provider)[0];
                  if (nextModel) {
                    onModelChange(nextModel.id);
                  }
                }}
              >
                {providerOptions.map((provider) => (
                  <DropdownMenuRadioItem key={provider.id} value={provider.id}>
                    {provider.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconBrain size={14} />
            Model
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={selectedModel?.id}
              onValueChange={(value) => {
                const option = options.find((entry) => entry.id === value);
                if (option) {
                  onModelChange(option.id);
                }
              }}
            >
              {providerModels.map((option) => (
                <DropdownMenuRadioItem key={option.id} value={option.id}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {onResponseLengthChange && responseLength !== undefined && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <IconTextResize size={14} />
              Response length
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={responseLength}
                onValueChange={(v) => {
                  if (isResponseLength(v)) {
                    onResponseLengthChange(v);
                  }
                }}
              >
                {RESPONSE_LENGTHS.map((option) => (
                  <DropdownMenuRadioItem key={option.key} value={option.key}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface ModelSelectProps<TModel extends string = string> {
  value: TModel;
  onValueChange: (model: TModel) => void;
  options: ReadonlyArray<ModelOption<TModel>>;
  disabled?: boolean;
  className?: string;
}

export function ModelSelect<TModel extends string>({
  value,
  onValueChange,
  options,
  disabled,
  className,
}: ModelSelectProps<TModel>) {
  const selectedModel = findModelOption(value, options);
  const providerOptions = getProviderOptions(options);
  const selectedProvider =
    selectedModel?.provider ?? providerOptions[0]?.id ?? "claude";
  const providerModels = getProviderModels(options, selectedProvider);

  const triggerClassName = cn(
    "h-7 w-auto gap-1.5 border-none bg-transparent px-2 text-xs font-medium text-muted-foreground shadow-none hover:bg-accent hover:text-foreground",
    className,
  );

  return (
    <div className="flex items-center gap-1">
      {providerOptions.length > 1 && (
        <Select
          value={selectedProvider}
          onValueChange={(provider) => {
            const nextModel = getProviderModels(options, provider)[0];
            if (nextModel) {
              onValueChange(nextModel.id);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className={cn(triggerClassName, "px-1.5")}>
            <SelectValue>{getProviderLabel(selectedProvider)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {providerOptions.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Select
        value={selectedModel?.id}
        onValueChange={(modelId) => {
          const option = options.find((entry) => entry.id === modelId);
          if (option) {
            onValueChange(option.id);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger className={triggerClassName}>
          <IconBrain size={14} className="shrink-0" />
          <SelectValue>{selectedModel?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {providerModels.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export interface ResponseLengthSelectProps {
  value: ResponseLength;
  onValueChange: (length: ResponseLength) => void;
  disabled?: boolean;
  className?: string;
}

export function ResponseLengthSelect({
  value,
  onValueChange,
  disabled,
  className,
}: ResponseLengthSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (isResponseLength(v)) {
          onValueChange(v);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "h-7 w-auto gap-1.5 border-none bg-transparent px-2 text-xs font-medium text-muted-foreground shadow-none hover:bg-accent hover:text-foreground",
          className,
        )}
      >
        <IconTextResize size={14} className="shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RESPONSE_LENGTHS.map((option) => (
          <SelectItem key={option.key} value={option.key}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
