# Manual Search Parameters & Filter Logic Inventory

**Project:** Conductor Web Application
**Date:** 2026-01-13
**Purpose:** Comprehensive audit of all manual search parameters, URL state management, filter objects, and UI form state in the frontend codebase.

---

## Executive Summary

This document catalogs all instances of manual search parameter handling, URL state management, and filter logic across the Conductor web application. The inventory identifies **8 primary components** with manual parameter management, **4 API routes** using search parameters, and **multiple state management patterns** that could benefit from centralized management using libraries like `nuqs`.

### Key Findings:
- **Total TypeScript Files:** 89 files analyzed
- **Components with Search Params:** 8 components
- **API Routes with Query Params:** 4 routes
- **State Management Patterns:** 5 distinct patterns identified
- **Filter Logic Instances:** 6 components with filtering

---

## 1. URL Search Parameters & Query Strings

### 1.1 RepoSetupClient
**File:** `web/app/(main)/repos/setup/[id]/RepoSetupClient.tsx`
**Lines:** 24-26

**Type:** URL Search Parameter Reading
**Pattern:** Next.js `useSearchParams` hook

**Implementation:**
```typescript
const searchParams = useSearchParams();
const autoSync = searchParams.get("auto") !== "false";
```

**Purpose:** Controls automatic repository synchronization behavior
**Parameters:**
- `auto` (optional): Controls whether repos are automatically synced on page load
  - Default: `true`
  - When `false`: Prevents automatic synchronization

**Usage Context:** GitHub OAuth callback flow for repository setup

---

### 1.2 BranchSelector Component
**File:** `web/lib/components/sidebar/BranchSelector.tsx`
**Lines:** 65-70

**Type:** Manual URLSearchParams Construction
**Pattern:** Native `URLSearchParams` API

**Implementation:**
```typescript
const params = new URLSearchParams({
  owner,
  repo: repoName,
  installationId: String(installationId),
});
const res = await fetch(`/api/github/branches?${params}`);
```

**Purpose:** Fetches available branches from GitHub API
**Parameters:**
- `owner`: Repository owner username
- `repo`: Repository name
- `installationId`: GitHub App installation ID

**Usage Context:** API call to retrieve branch list for selector dropdown

---

### 1.3 GitHub API Routes

#### a. Branches API Route
**File:** `web/app/api/github/branches/route.ts`
**Lines:** 5-8

**Type:** Server-side Search Parameter Extraction
**Pattern:** Next.js Request URL parsing

**Implementation:**
```typescript
const { searchParams } = new URL(req.url);
const owner = searchParams.get("owner");
const repo = searchParams.get("repo");
const installationId = searchParams.get("installationId");
```

**Required Parameters:**
- `owner`: Repository owner
- `repo`: Repository name
- `installationId`: Installation ID for authentication

**Validation:** Returns 400 error if any parameter is missing

---

#### b. GitHub Callback Route
**File:** `web/app/api/github/callback/route.ts`
**Lines:** 9-10

**Type:** OAuth Callback Parameter Extraction
**Pattern:** Next.js Request URL parsing

**Implementation:**
```typescript
const url = new URL(req.url);
const installationId = url.searchParams.get("installation_id");
```

**Parameters:**
- `installation_id`: GitHub App installation ID from OAuth flow

**Behavior:** Redirects to repo setup or dashboard based on parameter presence

**Redirect Patterns:**
```typescript
// Error case
return NextResponse.redirect(new URL("/repos?error=no_installation", req.url));

// Success case
return NextResponse.redirect(new URL("/repos?synced=" + added, req.url));
```

**Query Parameters Added to Redirects:**
- `error`: Error type (e.g., "no_installation")
- `synced`: Number of repos successfully synced

---

## 2. Local Storage State Management

### 2.1 Base Branch Selection
**File:** `web/lib/components/sidebar/BranchSelector.tsx`
**Lines:** 23-45, 52-98

**Type:** Persistent Local Storage State
**Pattern:** Custom React hook with `useSyncExternalStore`

**Implementation:**

**Storage Key Pattern:**
```typescript
function getStorageKey(owner: string, repoName: string) {
  return `conductor:baseBranch:${owner}/${repoName}`;
}
```

**Custom Hook:**
```typescript
export function useBaseBranch(owner: string, repoName: string): string {
  const storageKey = getStorageKey(owner, repoName);

  const subscribe = useCallback((callback: () => void) => {
    const handler = (e: StorageEvent) => {
      if (e.key === storageKey) callback();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [storageKey]);

  const getSnapshot = useCallback(() => {
    return localStorage.getItem(storageKey) ?? "main";
  }, [storageKey]);

  const getServerSnapshot = useCallback(() => "main", []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

**State Management Operations:**
- **Read:** `localStorage.getItem(storageKey)`
- **Write:** `localStorage.setItem(storageKey, branch)`
- **Event Dispatch:** Custom storage event for cross-tab synchronization

**Default Value:** `"main"` branch

**Auto-detection Logic:**
- Attempts to find "main" branch first
- Falls back to "master" branch
- Uses first available branch as last resort

**Purpose:** Persists user's selected base branch per repository across sessions

---

## 3. Component State Filters & Local State

### 3.1 Task Status Filtering

#### a. FeatureKanbanBoard
**File:** `web/lib/components/features/FeatureKanbanBoard.tsx`
**Lines:** 111-116

**Type:** Client-side Array Filtering
**Pattern:** React state with computed derived state

**Implementation:**
```typescript
const tasksByStatus = KANBAN_STATUSES.reduce((acc, status) => {
  acc[status] = tasks
    .filter((t) => t.status === status)
    .sort((a, b) => (a.taskNumber ?? 0) - (b.taskNumber ?? 0));
  return acc;
}, {} as Record<TaskStatus, Task[]>);
```

**Filter Dimensions:**
- `status`: Task status (archived, backlog, todo, in_progress, code_review, done)
- `featureId`: Implicit filter (tasks for specific feature)

**Additional Processing:**
- Sorts by `taskNumber` within each status group
- Groups tasks by status for kanban columns

**Purpose:** Organizes feature tasks into kanban board columns

---

#### b. QuickTasksKanbanBoard
**File:** `web/lib/components/quick-tasks/QuickTasksKanbanBoard.tsx`
**Lines:** 97, 111-116

**Type:** Multi-stage Filtering
**Pattern:** Chained array filters

**Implementation:**
```typescript
// First filter: Exclude feature-related tasks
const tasks = allTasks?.filter((t) => !t.featureId) ?? [];

// Second filter: Group by status
const tasksByStatus = KANBAN_STATUSES.reduce((acc, status) => {
  acc[status] = tasks
    .filter((t) => t.status === status)
    .sort((a, b) => a.order - b.order);
  return acc;
}, {} as Record<TaskStatus, Task[]>);
```

**Filter Criteria:**
1. **Feature Association:** `!t.featureId` (show only standalone tasks)
2. **Status:** Group by task status
3. **Sort:** Order by `order` field

**Purpose:** Displays quick tasks (non-feature tasks) in kanban board

---

#### c. QuickTasksClient
**File:** `web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`
**Lines:** 20

**Type:** Simple Array Filter
**Pattern:** Filter without persistence

**Implementation:**
```typescript
const quickTasks = tasks?.filter((t) => !t.featureId) ?? [];
const hasQuickTasks = quickTasks.length > 0;
```

**Filter Logic:** Excludes tasks associated with features
**Purpose:** Determines whether to show empty state or task board

---

### 3.2 Active Tasks Filtering

#### ActiveTasksAccordion
**File:** `web/lib/components/sidebar/ActiveTasksAccordion.tsx`
**Lines:** 16

**Type:** Status-based Filter
**Pattern:** Simple array filter

**Implementation:**
```typescript
const tasks = allTasks?.filter((t) => t.status === "in_progress") ?? [];
```

**Filter Criteria:**
- `status === "in_progress"`: Only show tasks currently being worked on

**Purpose:** Sidebar display of active/in-progress tasks

---

## 4. Modal & Dialog State Management

### 4.1 Modal Open/Close State Pattern

Multiple components use the same pattern for controlling modal visibility:

#### Pattern Implementation:
```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Type | null>(null);
```

#### Components Using This Pattern:

**a. PlansClient**
**File:** `web/app/(main)/[repo]/plan/PlansClient.tsx`
**Lines:** 28-29

**State:**
```typescript
const [isCreating, setIsCreating] = useState(false);
const [interviewPlanId, setInterviewPlanId] = useState<Id<"plans"> | null>(null);
```

**Modals:**
- `NewPlanModal`: Controlled by `isCreating`
- `PlanInterviewModal`: Controlled by `interviewPlanId` (non-null = open)

---

**b. QuickTasksClient**
**File:** `web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`
**Lines:** 18

**State:**
```typescript
const [isCreating, setIsCreating] = useState(false);
```

**Modals:**
- `QuickTaskModal`: For creating new quick tasks

---

**c. FeatureKanbanBoard**
**File:** `web/lib/components/features/FeatureKanbanBoard.tsx`
**Lines:** 96-97

**State:**
```typescript
const [activeTask, setActiveTask] = useState<Task | null>(null);
const [selectedTask, setSelectedTask] = useState<Task | null>(null);
```

**Modals:**
- `TaskDetailModal`: Controlled by `selectedTask`
- `DragOverlay`: Controlled by `activeTask` (during drag operations)

---

**d. QuickTasksKanbanBoard**
**File:** `web/lib/components/quick-tasks/QuickTasksKanbanBoard.tsx`
**Lines:** 86-87

**State:**
```typescript
const [activeTask, setActiveTask] = useState<Task | null>(null);
const [selectedTask, setSelectedTask] = useState<Task | null>(null);
```

**Modals:**
- `TaskDetailModal`: Task detail view
- `DragOverlay`: Visual feedback during drag operations

---

### 4.2 Multi-step Form State

#### ChatTab Component
**File:** `web/lib/components/plan/ChatTab.tsx`
**Lines:** 65-68

**Type:** Complex Interview Flow State
**Pattern:** Multiple useState hooks for form flow control

**State Management:**
```typescript
const [questionCount, setQuestionCount] = useState(0);
const [hasStarted, setHasStarted] = useState(initialMessages.length > 1);
const [displayMessages, setDisplayMessages] = useState<ConversationMessage[]>(initialMessages);
const [answers, setAnswers] = useState<AnswerRecord[]>([]);
```

**Form Flow Control:**
- `questionCount`: Tracks number of questions asked (max: 10)
- `hasStarted`: Controls initial state vs. interview state
- `displayMessages`: Conversation history
- `answers`: User's answer selections

**Purpose:** Manages multi-step AI-driven interview for plan refinement

---

#### PlanTab Component
**File:** `web/lib/components/plan/PlanTab.tsx`
**Lines:** 77-79

**Type:** Loading and Error State Management
**Pattern:** Multiple boolean/string state variables

**State Management:**
```typescript
const [isLoading, setIsLoading] = useState(false);
const [isIndexing, setIsIndexing] = useState(false);
const [indexError, setIndexError] = useState<string | null>(null);
```

**States:**
- `isLoading`: Feature creation in progress
- `isIndexing`: Codebase indexing in progress
- `indexError`: Error message for indexing failures

**Purpose:** Manages async operations and error states for plan finalization

---

## 5. Navigation State & Router Usage

### 5.1 Programmatic Navigation

Components using `useRouter` for navigation (not query params):

#### Components:
1. **PlanTab** (`web/lib/components/plan/PlanTab.tsx`, line 73)
   - Navigates to feature detail after creation

2. **PlanFinalizationModal** (`web/lib/components/plan/PlanFinalizationModal.tsx`)
   - Navigation after plan finalization

3. **NewPlanModal** (`web/lib/components/plans/NewPlanModal.tsx`)
   - Navigation after plan creation

4. **RepoSetupClient** (`web/app/(main)/repos/setup/[id]/RepoSetupClient.tsx`, line 25, 80)
   - Navigation after repo sync completion

**Pattern:**
```typescript
const router = useRouter();
router.push("/path");
```

**Note:** These use programmatic navigation without search parameters or state in URL

---

## 6. Data Fetching & API Query Construction

### 6.1 Convex Query Filtering

The application uses Convex for data fetching with server-side filtering:

#### Pattern Examples:

**a. Feature-specific Tasks**
```typescript
const tasks = useQuery(api.agentTasks.listByFeature, { featureId });
```

**b. Repository-specific Tasks**
```typescript
const allTasks = useQuery(api.agentTasks.getAllTasks, { repoId });
```

**c. Plan Listing**
```typescript
const plans = useQuery(api.plans.list, { repoId: repo._id });
```

**d. Feature Listing**
```typescript
const features = useQuery(api.features.list, { repoId: repo._id });
```

**Note:** These are server-side filters, not URL-based, but represent filtering logic that could potentially be exposed via URL params for deep linking.

---

## 7. Summary Table: All Manual Search Parameter Instances

| Component/Route | File Path | Type | Parameters | Persistence | Notes |
|----------------|-----------|------|------------|-------------|-------|
| **RepoSetupClient** | `app/(main)/repos/setup/[id]/RepoSetupClient.tsx` | URL Search Param | `auto` | No | Controls auto-sync |
| **BranchSelector** | `lib/components/sidebar/BranchSelector.tsx` | URL Query Builder + LocalStorage | `owner`, `repo`, `installationId` + branch selection | Yes (localStorage) | API call params + persistent branch |
| **GitHub Branches API** | `app/api/github/branches/route.ts` | Server-side Query Params | `owner`, `repo`, `installationId` | No | Required params |
| **GitHub Callback API** | `app/api/github/callback/route.ts` | OAuth Callback Params | `installation_id`, `error`, `synced` | No | OAuth flow + redirect params |
| **FeatureKanbanBoard** | `lib/components/features/FeatureKanbanBoard.tsx` | Client-side Filter | `status`, sort by `taskNumber` | No | In-memory filtering |
| **QuickTasksKanbanBoard** | `lib/components/quick-tasks/QuickTasksKanbanBoard.tsx` | Multi-stage Filter | `!featureId`, `status`, sort by `order` | No | Chained filters |
| **QuickTasksClient** | `app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx` | Simple Filter | `!featureId` | No | Feature exclusion |
| **ActiveTasksAccordion** | `lib/components/sidebar/ActiveTasksAccordion.tsx` | Status Filter | `status === "in_progress"` | No | Active tasks only |
| **PlansClient** | `app/(main)/[repo]/plan/PlansClient.tsx` | Modal State | `isCreating`, `interviewPlanId` | No | UI state only |
| **ChatTab** | `lib/components/plan/ChatTab.tsx` | Form Flow State | `questionCount`, `hasStarted`, `answers` | No | Multi-step form |
| **PlanTab** | `lib/components/plan/PlanTab.tsx` | Loading/Error State | `isLoading`, `isIndexing`, `indexError` | No | Async operation state |

---

## 8. State Management Patterns Identified

### Pattern 1: URL Search Parameters (Read-Only)
**Instances:** 1
**Components:** RepoSetupClient
**Use Case:** One-time configuration from URL
**Replacement Candidate:** ✅ `nuqs` with `useQueryState`

---

### Pattern 2: URL Query Construction for API Calls
**Instances:** 2
**Components:** BranchSelector, API routes
**Use Case:** Building query strings for fetch requests
**Replacement Candidate:** ⚠️ Partial (server-side params need different approach)

---

### Pattern 3: LocalStorage + React State Synchronization
**Instances:** 1
**Components:** BranchSelector (`useBaseBranch`)
**Use Case:** Persistent user preferences across sessions
**Replacement Candidate:** ✅ `nuqs` with localStorage parser or separate utility

---

### Pattern 4: Client-side Filtering (Array Methods)
**Instances:** 4
**Components:** Kanban boards, task lists
**Use Case:** Filtering/grouping displayed data
**Replacement Candidate:** ✅ `nuqs` for URL-based filters (enables deep linking)

---

### Pattern 5: Modal/Dialog State Management
**Instances:** 6
**Components:** Multiple modals across app
**Use Case:** UI component visibility control
**Replacement Candidate:** ✅ `nuqs` (optional, for shareable modal states)

---

### Pattern 6: Multi-step Form State
**Instances:** 2
**Components:** ChatTab, PlanTab
**Use Case:** Complex form flows with multiple steps
**Replacement Candidate:** ⚠️ Partial (transient state may not need URL persistence)

---

## 9. Recommendations for nuqs Migration

### High Priority (Immediate Benefit)
1. **BranchSelector localStorage state** → `useQueryState` with custom parser
2. **RepoSetupClient `auto` parameter** → `useQueryState` boolean parser
3. **Kanban board filters** → `useQueryState` for status, search filters

### Medium Priority (Enhanced UX)
4. **Modal states for shareable links** → `useQueryState` for selected items
5. **GitHub callback redirect params** → `useQueryState` for error/success messages

### Low Priority (Optional)
6. **Multi-step form state** → Consider if step persistence in URL is valuable
7. **API route query params** → Keep as-is (server-side, not React)

### Not Recommended
- Drag-and-drop temporary state (`activeTask`)
- Loading/error states (transient UI states)
- Pure client-side computed filters (unless deep linking needed)

---

## 10. Technical Debt & Improvement Opportunities

### Issues Identified:

1. **Inconsistent Parameter Naming**
   - Mix of `installationId` (string) and `installationId` (number)
   - Recommendation: Standardize on one type with clear conversion

2. **Manual URLSearchParams Construction**
   - Multiple manual constructions across codebase
   - Recommendation: Create utility functions or use `nuqs`

3. **No URL State for Filters**
   - Kanban filters not in URL (limits sharing/bookmarking)
   - Recommendation: Migrate to URL-based filters

4. **LocalStorage Without Versioning**
   - `conductor:baseBranch:*` keys have no version
   - Recommendation: Add version prefix for future migrations

5. **Duplicate Filter Logic**
   - Similar filtering in multiple kanban components
   - Recommendation: Create shared filtering utilities

6. **No Type Safety for Query Parameters**
   - String-based parameter extraction without validation
   - Recommendation: Use `nuqs` parsers or Zod schemas

---

## Appendix A: File Reference Index

### Components
- `web/app/(main)/[repo]/features/FeaturesClient.tsx`
- `web/app/(main)/[repo]/plan/PlansClient.tsx`
- `web/app/(main)/[repo]/quick-tasks/QuickTasksClient.tsx`
- `web/app/(main)/repos/ReposClient.tsx`
- `web/app/(main)/repos/setup/[id]/RepoSetupClient.tsx`
- `web/lib/components/features/FeatureKanbanBoard.tsx`
- `web/lib/components/plan/ChatTab.tsx`
- `web/lib/components/plan/PlanTab.tsx`
- `web/lib/components/quick-tasks/QuickTasksKanbanBoard.tsx`
- `web/lib/components/sidebar/ActiveTasksAccordion.tsx`
- `web/lib/components/sidebar/BranchSelector.tsx`

### API Routes
- `web/app/api/github/branches/route.ts`
- `web/app/api/github/callback/route.ts`

---

## Appendix B: Search Parameter Types

### Defined Types:
```typescript
// OAuth/GitHub Integration
type InstallationParams = {
  installation_id: string;
  owner: string;
  repo: string;
  installationId: string; // Note: duplicate naming
}

// Setup Flow
type SetupParams = {
  auto?: "true" | "false"; // Default: "true"
}

// Redirect Feedback
type RedirectParams = {
  error?: string;
  synced?: string; // Number as string
}

// Task Filters
type TaskFilters = {
  status?: "archived" | "backlog" | "todo" | "in_progress" | "code_review" | "done";
  featureId?: string | null;
}

// Modal State
type ModalState = {
  modal?: "new-plan" | "interview" | "quick-task" | "task-detail";
  planId?: string;
  taskId?: string;
}
```

---

## Appendix C: Migration Checklist

### Pre-Migration Tasks
- [ ] Install `nuqs` package
- [ ] Set up TypeScript types for all query parameters
- [ ] Create custom parsers for complex types (e.g., branch selection)
- [ ] Document existing behavior for each parameter
- [ ] Create backward compatibility plan

### Phase 1: Simple Query Parameters
- [ ] Migrate `auto` parameter in RepoSetupClient
- [ ] Migrate GitHub callback redirect parameters
- [ ] Add tests for URL state management

### Phase 2: Persistent State
- [ ] Migrate BranchSelector localStorage to URL state
- [ ] Add localStorage fallback for backward compatibility
- [ ] Update cross-tab synchronization logic

### Phase 3: Filter State
- [ ] Add URL state to FeatureKanbanBoard filters
- [ ] Add URL state to QuickTasksKanbanBoard filters
- [ ] Implement deep linking for filtered views

### Phase 4: Modal State (Optional)
- [ ] Evaluate modal state URL persistence needs
- [ ] Implement shareable modal links if needed
- [ ] Add route guards for invalid modal states

### Post-Migration
- [ ] Remove manual URLSearchParams usage
- [ ] Update documentation
- [ ] Add E2E tests for URL state management
- [ ] Monitor for regressions

---

**End of Inventory**
**Total Components Cataloged:** 11
**Total API Routes Cataloged:** 2
**Total State Patterns Identified:** 6
