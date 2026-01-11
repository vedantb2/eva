import { DashboardContent } from "./DashboardContent";

const stats = [
  {
    name: "Total contacts",
    value: "2,851",
    change: "+4.75%",
    trend: "up",
    icon: "Users2",
  },
  {
    name: "Active invoices",
    value: "42",
    change: "+2.35%",
    trend: "up",
    icon: "FileText",
  },
  {
    name: "Revenue",
    value: "$45,231",
    change: "+5.25%",
    trend: "up",
    icon: "DollarSign",
  },
  {
    name: "Growth",
    value: "23.5%",
    change: "+1.25%",
    trend: "up",
    icon: "TrendingUp",
  },
];

const recentActivity = [
  {
    id: 1,
    type: "contact",
    title: "New contact added",
    description: "John Doe was added as a new contact",
    time: "5 minutes ago",
    icon: "Users2",
  },
  {
    id: 2,
    type: "invoice",
    title: "Invoice paid",
    description: "Invoice #1234 was paid by Acme Corp",
    time: "2 hours ago",
    icon: "FileText",
  },
  {
    id: 3,
    type: "company",
    title: "New company added",
    description: "Tech Solutions Inc. was added to your contacts",
    time: "5 hours ago",
    icon: "Building2",
  },
];

const upcomingTasks = [
  {
    id: "TSK-001",
    title: "Design homepage mockup",
    dueDate: "2024-04-10",
    priority: "High",
    assignee: "Jane Smith",
    project: "Website redesign",
  },
  {
    id: "TSK-002",
    title: "Implement authentication",
    dueDate: "2024-04-15",
    priority: "Medium",
    assignee: "John Doe",
    project: "Website redesign",
  },
  {
    id: "TSK-005",
    title: "Implement push notifications",
    dueDate: "2024-04-05",
    priority: "High",
    assignee: "Mike Brown",
    project: "Mobile app development",
  },
];

const recentProjects = [
  {
    id: "PRJ-001",
    name: "Website redesign",
    client: "Tech Corp",
    status: "In progress",
    progress: 65,
    dueDate: "2024-05-15",
  },
  {
    id: "PRJ-002",
    name: "Mobile app development",
    client: "Design Co",
    status: "Planning",
    progress: 25,
    dueDate: "2024-06-30",
  },
];

const salesPipeline = [
  {
    stage: "Qualified",
    count: 2,
    value: 57000,
  },
  {
    stage: "Proposal",
    count: 1,
    value: 12000,
  },
  {
    stage: "Negotiation",
    count: 1,
    value: 18500,
  },
  {
    stage: "Closed Won",
    count: 1,
    value: 8500,
  },
];

const upcomingEvents = [
  {
    id: "EVT-001",
    title: "Client meeting",
    start: "2024-04-05T10:00:00",
    end: "2024-04-05T11:30:00",
    type: "meeting",
    location: "Office - Meeting Room 1",
  },
  {
    id: "EVT-002",
    title: "Project kickoff",
    start: "2024-04-08T14:00:00",
    end: "2024-04-08T15:30:00",
    type: "meeting",
    location: "Virtual - Zoom",
  },
  {
    id: "EVT-003",
    title: "Proposal deadline",
    start: "2024-04-10T17:00:00",
    end: "2024-04-10T17:00:00",
    type: "deadline",
    location: "",
  },
];

export default function Page() {
  return (
    <DashboardContent 
      stats={stats} 
      recentActivity={recentActivity} 
      upcomingTasks={upcomingTasks}
      recentProjects={recentProjects}
      salesPipeline={salesPipeline}
      upcomingEvents={upcomingEvents}
    />
  );
}
