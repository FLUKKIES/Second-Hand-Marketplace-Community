"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, Grid, ShoppingBag, DollarSign, Flag, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface DashboardStats {
  totalUsers: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<DashboardStats>("/admin/stats");
        setStats(data);
      } catch (error) {
        toast.error("Failed to load dashboard stats");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    {
      title: "Total Users",
      value: stats?.totalUsers.toLocaleString() || "0",
      change: "Real-time",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back, Admin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((stat, idx) => (
          <Card key={idx} className="p-6 border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}
              >
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stat.value}
              </h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/users" className="block">
          <Card className="p-6 border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-blue-50 border-blue-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Users</h3>
                <p className="text-sm text-gray-500">View, ban, and manage users</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/reports" className="block">
          <Card className="p-6 border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-red-50 border-red-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg text-red-600">
                <Flag size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Reports</h3>
                <p className="text-sm text-gray-500">Review reported content and users</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/groups" className="block">
          <Card className="p-6 border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-purple-50 border-purple-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                <Grid size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Groups</h3>
                <p className="text-sm text-gray-500">Review groups and permissions</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

    </div>
  );
}
