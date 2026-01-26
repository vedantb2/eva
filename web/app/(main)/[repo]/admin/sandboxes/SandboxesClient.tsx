"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Tooltip } from "@heroui/tooltip";
import {
  IconRefresh,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
  IconServer2,
} from "@tabler/icons-react";
import { PageWrapper } from "@/lib/components/PageWrapper";

interface SandboxInfo {
  sandboxId: string;
  templateId: string;
  startedAt: string;
  name: string;
  metadata: Record<string, string>;
}

export function SandboxesClient() {
  const [sandboxes, setSandboxes] = useState<SandboxInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sandboxToKill, setSandboxToKill] = useState<SandboxInfo | null>(null);
  const [isKilling, setIsKilling] = useState(false);

  const fetchSandboxes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/sandboxes");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setSandboxes(data.sandboxes);
      setHasMore(data.hasMore);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSandboxes();
  }, [fetchSandboxes]);

  const handleAction = async (
    action: "pause" | "resume",
    sandboxId: string
  ) => {
    setActionLoading(sandboxId);
    try {
      const response = await fetch("/api/admin/sandboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, sandboxId }),
      });
      if (!response.ok) throw new Error("Action failed");
      await fetchSandboxes();
    } finally {
      setActionLoading(null);
    }
  };

  const handleKill = async () => {
    if (!sandboxToKill) return;
    setIsKilling(true);
    try {
      const response = await fetch("/api/admin/sandboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "kill",
          sandboxId: sandboxToKill.sandboxId,
        }),
      });
      if (!response.ok) throw new Error("Kill failed");
      setSandboxToKill(null);
      await fetchSandboxes();
    } finally {
      setIsKilling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <>
      <PageWrapper
        title="Sandboxes"
        headerRight={
          <Button
            size="sm"
            variant="flat"
            startContent={<IconRefresh size={16} />}
            onPress={fetchSandboxes}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        }
      >
        {isLoading && sandboxes.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          </div>
        ) : sandboxes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
            <IconServer2 size={48} className="mb-3" />
            <p>No sandboxes found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sandboxes.map((sandbox) => (
              <div
                key={sandbox.sandboxId}
                className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-neutral-900 dark:text-white truncate">
                        {sandbox.sandboxId}
                      </span>
                      <Chip size="sm" color="success" variant="flat">
                        {sandbox.name}
                      </Chip>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>Template: {sandbox.templateId}</span>
                      <span>Started: {formatDate(sandbox.startedAt)}</span>
                    </div>
                    {Object.keys(sandbox.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(sandbox.metadata).map(([key, value]) => (
                          <Chip key={key} size="sm" variant="flat">
                            {key}: {value}
                          </Chip>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Tooltip content="Pause sandbox">
                      <Button
                        size="sm"
                        variant="flat"
                        isIconOnly
                        isLoading={actionLoading === sandbox.sandboxId}
                        onPress={() => handleAction("pause", sandbox.sandboxId)}
                      >
                        <IconPlayerPause size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Resume sandbox">
                      <Button
                        size="sm"
                        variant="flat"
                        isIconOnly
                        isLoading={actionLoading === sandbox.sandboxId}
                        onPress={() =>
                          handleAction("resume", sandbox.sandboxId)
                        }
                      >
                        <IconPlayerPlay size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Kill sandbox">
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        isIconOnly
                        onPress={() => setSandboxToKill(sandbox)}
                      >
                        <IconTrash size={16} />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
            {hasMore && (
              <p className="text-center text-sm text-neutral-500 py-2">
                More sandboxes available (pagination not implemented)
              </p>
            )}
          </div>
        )}
      </PageWrapper>

      <Modal isOpen={!!sandboxToKill} onClose={() => setSandboxToKill(null)}>
        <ModalContent>
          <ModalHeader>Kill Sandbox</ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to kill sandbox{" "}
              <strong className="font-mono">{sandboxToKill?.sandboxId}</strong>?
            </p>
            <p className="text-sm text-default-500 mt-2">
              This action cannot be undone. The sandbox will be terminated
              immediately.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setSandboxToKill(null)}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleKill} isLoading={isKilling}>
              Kill Sandbox
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
