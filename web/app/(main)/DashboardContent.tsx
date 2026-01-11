"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Users2,
  FileText,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  CheckSquare,
  FolderKanban,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface DashboardContentProps {
  stats: {
    name: string;
    value: string;
    change: string;
    trend: string;
    icon: string;
  }[];
  recentActivity: {
    id: number;
    type: string;
    title: string;
    description: string;
    time: string;
    icon: string;
  }[];
  upcomingTasks: {
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    assignee: string;
    project: string;
  }[];
  recentProjects: {
    id: string;
    name: string;
    client: string;
    status: string;
    progress: number;
    dueDate: string;
  }[];
  salesPipeline: {
    stage: string;
    count: number;
    value: number;
  }[];
  upcomingEvents: {
    id: string;
    title: string;
    start: string;
    end: string;
    type: string;
    location: string;
  }[];
}

const iconMap = {
  Users2,
  FileText,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  CheckSquare,
  FolderKanban,
};

const getIcon = (iconName: string) => {
  const Icon = iconMap[iconName as keyof typeof iconMap];
  return Icon || Building2;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
    case "Medium":
      return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
    case "Low":
      return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "In progress":
      return "bg-blue-500/10 text-blue-500";
    case "Planning":
      return "bg-yellow-500/10 text-yellow-500";
    case "Completed":
      return "bg-green-500/10 text-green-500";
    default:
      return "bg-gray-500/10 text-gray-500";
  }
};

const getEventTypeColor = (type: string) => {
  switch (type) {
    case "meeting":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "call":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "deadline":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "event":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
};

export function DashboardContent({ 
  stats, 
  recentActivity, 
  upcomingTasks, 
  recentProjects, 
  salesPipeline, 
  upcomingEvents 
}: DashboardContentProps) {
  const totalPipelineValue = salesPipeline.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = getIcon(stat.icon);
          return (
            <Card key={stat.name} className="bg-card/30 backdrop-blur-xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card/30 backdrop-blur-xl border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">upcoming tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Tasks due soon</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex flex-col space-y-2 rounded-lg border border-border/50 p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">{task.title}</span>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">{getInitials(task.assignee)}</AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">{task.assignee}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <FolderKanban className="h-3 w-3" />
                    {task.project}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <a href="/dashboard/tasks">view all tasks</a>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-card/30 backdrop-blur-xl border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">recent projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Your active projects</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex flex-col space-y-2 rounded-lg border border-border/50 p-3">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-muted-foreground">{project.client}</div>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                    <span className="text-muted-foreground">Due: </span>
                    <span className="ml-1">{new Date(project.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <a href="/dashboard/projects">view all projects</a>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-card/30 backdrop-blur-xl border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">sales pipeline</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardDescription>Current opportunities</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold mb-4">${totalPipelineValue.toLocaleString()}</div>
            <div className="space-y-4">
              {salesPipeline.map((item) => (
                <div key={item.stage} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      item.stage === "Qualified" ? "bg-blue-500" :
                      item.stage === "Proposal" ? "bg-yellow-500" :
                      item.stage === "Negotiation" ? "bg-orange-500" :
                      item.stage === "Closed Won" ? "bg-green-500" : "bg-gray-500"
                    }`} />
                    <span className="text-sm">{item.stage}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{item.count} deals</span>
                    <span className="text-sm font-medium">${item.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <a href="/dashboard/sales">view sales pipeline</a>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card/30 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle>recent activity</CardTitle>
            <CardDescription>
              Latest updates and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = getIcon(activity.icon);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="rounded-full bg-primary/10 p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card/30 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle>upcoming events</CardTitle>
            <CardDescription>
              Your schedule for the next few days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col space-y-2 rounded-lg border border-border/50 p-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{event.title}</span>
                    <Badge className={getEventTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {format(new Date(event.start), "dd MMM yyyy, HH:mm")}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <a href="/dashboard/calendar">view calendar</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 