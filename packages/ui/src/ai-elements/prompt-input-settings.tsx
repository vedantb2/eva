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
import { IconTextResize, IconDots } from "@tabler/icons-react";
import { cn } from "../utils/cn";
import { ProviderIcon } from "./provider-icon";

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

  return (
    <DropdownMenu>
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
          {selectedModel
            ? `${getProviderLabel(selectedModel.provider)} / ${selectedModel.label}`
            : "Select model"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {providerOptions.map((provider) => {
          const models = getProviderModels(options, provider.id);
          if (providerOptions.length === 1) {
            return (
              <DropdownMenuRadioGroup
                key={provider.id}
                value={selectedModel?.id}
                onValueChange={(modelId) => {
                  const option = options.find((entry) => entry.id === modelId);
                  if (option) {
                    onValueChange(option.id);
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
                  onValueChange={(modelId) => {
                    const option = options.find(
                      (entry) => entry.id === modelId,
                    );
                    if (option) {
                      onValueChange(option.id);
                    }
                  }}
                >
                  {models.map((option) => (
                    <DropdownMenuRadioItem key={option.id} value={option.id}>
                      {option.label}
                    </DropdownMenuRadioItem>
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
