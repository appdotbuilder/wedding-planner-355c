import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, DollarSign, CheckSquare, Heart, TrendingUp, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Guest, BudgetItem, Task, Vendor } from '../../../server/src/schema';

export function Dashboard() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [guestsData, budgetData, tasksData, vendorsData] = await Promise.all([
        trpc.getGuests.query(),
        trpc.getBudgetItems.query(),
        trpc.getTasks.query(),
        trpc.getVendors.query()
      ]);
      
      setGuests(guestsData);
      setBudgetItems(budgetData);
      setTasks(tasksData);
      setVendors(vendorsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate statistics
  const guestStats = {
    total: guests.length,
    attending: guests.filter((g: Guest) => g.rsvp_status === 'attending').length,
    pending: guests.filter((g: Guest) => g.rsvp_status === 'pending').length,
    notAttending: guests.filter((g: Guest) => g.rsvp_status === 'not_attending').length
  };

  const budgetStats = {
    totalBudgeted: budgetItems.reduce((sum: number, item: BudgetItem) => sum + item.budgeted_amount, 0),
    totalSpent: budgetItems.reduce((sum: number, item: BudgetItem) => sum + (item.actual_amount || 0), 0),
    itemsCount: budgetItems.length
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t: Task) => t.status === 'completed').length,
    inProgress: tasks.filter((t: Task) => t.status === 'in_progress').length,
    pending: tasks.filter((t: Task) => t.status === 'pending').length,
    overdue: tasks.filter((t: Task) => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length
  };

  const budgetProgress = budgetStats.totalBudgeted > 0 
    ? (budgetStats.totalSpent / budgetStats.totalBudgeted) * 100 
    : 0;

  const taskProgress = taskStats.total > 0 
    ? (taskStats.completed / taskStats.total) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Heart className="h-6 w-6" />
                Welcome to Your Wedding Dashboard
              </h2>
              <p className="text-pink-100 mt-2">
                Track your progress and stay organized for your special day
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Guest Stats */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Guests</CardTitle>
            <Users className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{guestStats.total}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {guestStats.attending} attending
              </Badge>
              {guestStats.pending > 0 && (
                <Badge variant="outline" className="text-xs">
                  {guestStats.pending} pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Stats */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${budgetStats.totalSpent.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              of ${budgetStats.totalBudgeted.toLocaleString()} budgeted
            </div>
            <Progress value={budgetProgress} className="mt-2 h-2" />
            <div className="text-xs text-gray-500 mt-1">
              {budgetProgress.toFixed(0)}% spent
            </div>
          </CardContent>
        </Card>

        {/* Task Stats */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{taskStats.completed}/{taskStats.total}</div>
            <div className="text-xs text-gray-500 mt-1">completed</div>
            <Progress value={taskProgress} className="mt-2 h-2" />
            {taskStats.overdue > 0 && (
              <Badge variant="destructive" className="text-xs mt-2">
                <AlertCircle className="h-3 w-3 mr-1" />
                {taskStats.overdue} overdue
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Vendor Stats */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Vendors</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{vendors.length}</div>
            <div className="text-xs text-gray-500 mt-1">vendors booked</div>
            {vendors.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 font-medium">Popular categories:</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.from(new Set(vendors.map((v: Vendor) => v.category)))
                    .slice(0, 2)
                    .map((category: string) => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks
              .filter((t: Task) => t.status !== 'completed' && t.due_date)
              .sort((a: Task, b: Task) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
              .slice(0, 5)
              .map((task: Task) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-gray-500">
                      Due: {new Date(task.due_date!).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge 
                    variant={task.priority === 'high' ? 'destructive' : 
                           task.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
            {tasks.filter((t: Task) => t.status !== 'completed' && t.due_date).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming tasks with due dates</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RSVP Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-pink-500" />
              RSVP Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Attending</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${guestStats.total > 0 ? (guestStats.attending / guestStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{guestStats.attending}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${guestStats.total > 0 ? (guestStats.pending / guestStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{guestStats.pending}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Not Attending</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${guestStats.total > 0 ? (guestStats.notAttending / guestStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{guestStats.notAttending}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}