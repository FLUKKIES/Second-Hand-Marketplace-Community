import { Card } from "@/components/ui/card";
import { Users, Grid, ShoppingBag, DollarSign } from "lucide-react";

const stats = [
  {
    title: "Total Users",
    value: "1,234",
    change: "+12%",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    title: "Total Groups",
    value: "56",
    change: "+4%",
    icon: Grid,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  {
    title: "Active Listings",
    value: "892",
    change: "+23%",
    icon: ShoppingBag,
    color: "text-indigo-600",
    bg: "bg-indigo-100",
  },
  {
    title: "Revenue (Month)",
    value: "฿45,230",
    change: "+8%",
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-100",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back, Admin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6 border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}
              >
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 border-gray-100 shadow-sm h-[400px] flex items-center justify-center text-gray-400">
          Chart Placeholder (Revenue)
        </Card>
        <Card className="p-6 border-gray-100 shadow-sm h-[400px] flex items-center justify-center text-gray-400">
          Chart Placeholder (User Growth)
        </Card>
      </div>
    </div>
  );
}
