import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Users, DollarSign, CheckSquare, Building2 } from 'lucide-react';
import { GuestManagement } from '@/components/GuestManagement';
import { BudgetTracking } from '@/components/BudgetTracking';
import { TaskManagement } from '@/components/TaskManagement';
import { VendorManagement } from '@/components/VendorManagement';
import { Dashboard } from '@/components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Wedding Planner 💕
                </h1>
                <p className="text-sm text-gray-600">Your perfect day, perfectly planned</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm border border-pink-100">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
            >
              <Heart className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="guests"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Guests
            </TabsTrigger>
            <TabsTrigger 
              value="budget"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Budget
            </TabsTrigger>
            <TabsTrigger 
              value="tasks"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="vendors"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Vendors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="guests" className="space-y-6">
            <GuestManagement />
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <BudgetTracking />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <TaskManagement />
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6">
            <VendorManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;