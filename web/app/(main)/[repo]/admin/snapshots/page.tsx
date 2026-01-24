"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import {
  IconRefresh,
  IconTrash,
  IconCamera,
  IconLoader2,
  IconAlertCircle,
} from "@tabler/icons-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { useQuery } from "convex/react";
import { api } from "@/api";

interface Snapshot {
  id: string;
  name: string;
  state: string;
  imageName?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminSnapshotsPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("main");
  const [branches, setBranches] = useState<{ name: string }[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const repos = useQuery(api.githubRepos.list);

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/snapshots");
      if (!res.ok) throw new Error("Failed to fetch snapshots");
      const data = await res.json();
      setSnapshots(data.snapshots || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch snapshots");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const fetchBranches = useCallback(async (repoId: string) => {
    if (!repoId || !repos) return;
    const repo = repos.find((r) => r._id === repoId);
    if (!repo) return;

    setBranchesLoading(true);
    try {
      const params = new URLSearchParams({
        owner: repo.owner,
        repo: repo.name,
        installationId: String(repo.installationId),
      });
      const res = await fetch(`/api/github/branches?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch {
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  }, [repos]);

  useEffect(() => {
    if (selectedRepoId) {
      fetchBranches(selectedRepoId);
    }
  }, [selectedRepoId, fetchBranches]);

  const handleRefresh = async (snapshotName: string) => {
    const parts = snapshotName.split("-");
    const branch = parts.pop() || "main";
    const repoName = parts.pop() || "";
    const owner = parts.join("-");

    const repo = repos?.find((r) => r.owner === owner && r.name === repoName);
    if (!repo) {
      setError(`Repository not found for snapshot: ${snapshotName}`);
      return;
    }

    setActionLoading(snapshotName);
    try {
      const res = await fetch("/api/admin/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refresh",
          repoId: repo._id,
          branch,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to refresh snapshot");
      }
      await fetchSnapshots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh snapshot");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (snapshotName: string) => {
    if (!confirm(`Are you sure you want to delete snapshot "${snapshotName}"?`)) {
      return;
    }

    const parts = snapshotName.split("-");
    const branch = parts.pop() || "main";
    const repoName = parts.pop() || "";
    const owner = parts.join("-");

    const repo = repos?.find((r) => r.owner === owner && r.name === repoName);
    if (!repo) {
      setError(`Repository not found for snapshot: ${snapshotName}`);
      return;
    }

    setActionLoading(snapshotName);
    try {
      const res = await fetch("/api/admin/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          repoId: repo._id,
          branch,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete snapshot");
      }
      await fetchSnapshots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete snapshot");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async () => {
    if (!selectedRepoId || !selectedBranch) return;

    setActionLoading("create");
    try {
      const res = await fetch("/api/admin/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          repoId: selectedRepoId,
          branch: selectedBranch,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create snapshot");
      }
      setIsCreateModalOpen(false);
      setSelectedRepoId("");
      setSelectedBranch("main");
      await fetchSnapshots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create snapshot");
    } finally {
      setActionLoading(null);
    }
  };

  const getStateColor = (state: string) => {
    switch (state?.toLowerCase()) {
      case "ready":
      case "active":
        return "success";
      case "building":
      case "pending":
        return "warning";
      case "error":
      case "failed":
        return "danger";
      default:
        return "default";
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "N/A";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Snapshot Management
          </h1>
          <p className="text-neutral-500 mt-1">
            Manage pre-built sandbox snapshots for faster startup times
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="flat"
            onPress={fetchSnapshots}
            isLoading={loading}
            startContent={!loading && <IconRefresh className="w-4 h-4" />}
          >
            Refresh
          </Button>
          <Button
            color="primary"
            onPress={() => setIsCreateModalOpen(true)}
            startContent={<IconCamera className="w-4 h-4" />}
          >
            Create Snapshot
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg flex items-center gap-2 text-danger-600 dark:text-danger-400">
          <IconAlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <Button
            size="sm"
            variant="light"
            className="ml-auto"
            onPress={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <IconLoader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : snapshots.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <IconCamera className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
            <p className="text-neutral-500">No snapshots found</p>
            <p className="text-sm text-neutral-400 mt-1">
              Create a snapshot to speed up sandbox startup times
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {snapshots.map((snapshot) => (
            <Card key={snapshot.id || snapshot.name}>
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">
                        {snapshot.name}
                      </h3>
                      <Chip size="sm" color={getStateColor(snapshot.state)} variant="flat">
                        {snapshot.state}
                      </Chip>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-neutral-500">
                      {snapshot.imageName && (
                        <span>Image: {snapshot.imageName}</span>
                      )}
                      <span>Size: {formatBytes(snapshot.size)}</span>
                      {snapshot.createdAt && (
                        <span>Created: {formatDate(snapshot.createdAt)}</span>
                      )}
                      {snapshot.updatedAt && (
                        <span>Updated: {formatDate(snapshot.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      isIconOnly
                      isLoading={actionLoading === snapshot.name}
                      onPress={() => handleRefresh(snapshot.name)}
                      title="Refresh snapshot"
                    >
                      <IconRefresh className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      isIconOnly
                      isLoading={actionLoading === snapshot.name}
                      onPress={() => handleDelete(snapshot.name)}
                      title="Delete snapshot"
                    >
                      <IconTrash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Create New Snapshot</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Repository"
                placeholder="Select a repository"
                selectedKeys={selectedRepoId ? [selectedRepoId] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0];
                  if (typeof key === "string") {
                    setSelectedRepoId(key);
                  }
                }}
              >
                {(repos || []).map((repo) => (
                  <SelectItem key={repo._id}>
                    {repo.owner}/{repo.name}
                  </SelectItem>
                ))}
              </Select>

              {selectedRepoId && (
                <Select
                  label="Branch"
                  placeholder={branchesLoading ? "Loading branches..." : "Select a branch"}
                  isLoading={branchesLoading}
                  selectedKeys={selectedBranch ? [selectedBranch] : []}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0];
                    if (typeof key === "string") {
                      setSelectedBranch(key);
                    }
                  }}
                >
                  {branches.map((branch) => (
                    <SelectItem key={branch.name}>{branch.name}</SelectItem>
                  ))}
                </Select>
              )}

              <p className="text-sm text-neutral-500">
                Creating a snapshot will clone the repository, install dependencies,
                and save it as a reusable template. This can take several minutes.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCreate}
              isLoading={actionLoading === "create"}
              isDisabled={!selectedRepoId || !selectedBranch}
            >
              Create Snapshot
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
