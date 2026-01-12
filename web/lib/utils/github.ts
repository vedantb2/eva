interface CreateBranchParams {
  owner: string;
  repo: string;
  branchName: string;
  baseBranch?: string;
}

interface CreateBranchResult {
  success: boolean;
  message: string;
  branch?: {
    name: string;
    fullRef: string;
    baseBranch: string;
  };
  error?: string;
}

export async function createBranch(
  params: CreateBranchParams
): Promise<CreateBranchResult> {
  const response = await fetch("/api/github/create-branch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    return {
      success: false,
      message: "Failed to create branch",
      error: error.error,
    };
  }

  return response.json();
}

export async function createTaskBranch(params: {
  owner: string;
  repo: string;
  featureBranchName: string;
  taskNumber: number;
}): Promise<CreateBranchResult> {
  const taskBranchName = `${params.featureBranchName}-${params.taskNumber}`;
  return createBranch({
    owner: params.owner,
    repo: params.repo,
    branchName: taskBranchName,
    baseBranch: params.featureBranchName,
  });
}
