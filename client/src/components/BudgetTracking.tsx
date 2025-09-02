import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, TrendingDown, AlertTriangle, PieChart } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { BudgetItem, CreateBudgetItemInput, UpdateBudgetItemInput, Vendor } from '../../../server/src/schema';

export function BudgetTracking() {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateBudgetItemInput>({
    category: '',
    item_name: '',
    budgeted_amount: 0,
    actual_amount: null,
    vendor_id: null,
    notes: null
  });

  const loadData = useCallback(async () => {
    try {
      const [budgetData, vendorData] = await Promise.all([
        trpc.getBudgetItems.query(),
        trpc.getVendors.query()
      ]);
      setBudgetItems(budgetData);
      setVendors(vendorData);
    } catch (error) {
      console.error('Failed to load budget data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({
      category: '',
      item_name: '',
      budgeted_amount: 0,
      actual_amount: null,
      vendor_id: null,
      notes: null
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingItem) {
        const updateData: UpdateBudgetItemInput = {
          id: editingItem.id,
          ...formData
        };
        const response = await trpc.updateBudgetItem.mutate(updateData);
        setBudgetItems((prev: BudgetItem[]) => 
          prev.map((item: BudgetItem) => item.id === editingItem.id ? response : item)
        );
      } else {
        const response = await trpc.createBudgetItem.mutate(formData);
        setBudgetItems((prev: BudgetItem[]) => [...prev, response]);
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save budget item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      item_name: item.item_name,
      budgeted_amount: item.budgeted_amount,
      actual_amount: item.actual_amount,
      vendor_id: item.vendor_id,
      notes: item.notes
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteBudgetItem.mutate({ id });
      setBudgetItems((prev: BudgetItem[]) => prev.filter((item: BudgetItem) => item.id !== id));
    } catch (error) {
      console.error('Failed to delete budget item:', error);
    }
  };

  // Calculate totals and statistics
  const totalBudgeted = budgetItems.reduce((sum: number, item: BudgetItem) => sum + item.budgeted_amount, 0);
  const totalSpent = budgetItems.reduce((sum: number, item: BudgetItem) => sum + (item.actual_amount || 0), 0);
  const remainingBudget = totalBudgeted - totalSpent;
  const budgetUsedPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  // Group by category
  const categorizedItems = budgetItems.reduce((acc: Record<string, BudgetItem[]>, item: BudgetItem) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const categories = [
    'Venue', 'Catering', 'Photography', 'Flowers', 'Music/DJ', 
    'Attire', 'Transportation', 'Decorations', 'Invitations', 'Other'
  ];

  const getVarianceColor = (budgeted: number, actual: number | null) => {
    if (!actual) return 'text-gray-500';
    const variance = actual - budgeted;
    if (variance > 0) return 'text-red-600';
    if (variance < 0) return 'text-green-600';
    return 'text-gray-500';
  };

  const getVarianceIcon = (budgeted: number, actual: number | null) => {
    if (!actual) return null;
    const variance = actual - budgeted;
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-green-600" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <DollarSign className="h-6 w-6" />
            Budget Tracking
            <Badge className="bg-white/20 text-white">
              {budgetItems.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Budget Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${totalBudgeted.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Allocated for wedding</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${totalSpent.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">
              {budgetUsedPercentage.toFixed(1)}% of budget used
            </p>
            <Progress value={budgetUsedPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${remainingBudget.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">
              {remainingBudget >= 0 ? 'Available to spend' : 'Over budget'}
            </p>
            {remainingBudget < 0 && (
              <Badge variant="destructive" className="mt-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Over Budget
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Budget Items</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Budget Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Budget Item' : 'Add Budget Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateBudgetItemInput) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="item_name">Item Name *</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBudgetItemInput) => ({ ...prev, item_name: e.target.value }))
                    }
                    required
                    placeholder="e.g., Wedding cake, DJ service..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="budgeted_amount">Budgeted Amount *</Label>
                    <Input
                      id="budgeted_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.budgeted_amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateBudgetItemInput) => ({ 
                          ...prev, 
                          budgeted_amount: parseFloat(e.target.value) || 0 
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="actual_amount">Actual Amount</Label>
                    <Input
                      id="actual_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.actual_amount || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateBudgetItemInput) => ({ 
                          ...prev, 
                          actual_amount: parseFloat(e.target.value) || null 
                        }))
                      }
                      placeholder="Leave empty if not spent yet"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="vendor_id">Vendor (Optional)</Label>
                  <Select 
                    value={formData.vendor_id?.toString() || 'none'} 
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateBudgetItemInput) => ({ 
                        ...prev, 
                        vendor_id: value !== 'none' ? parseInt(value) : null 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No vendor</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateBudgetItemInput) => ({ 
                        ...prev, 
                        notes: e.target.value || null 
                      }))
                    }
                    placeholder="Additional details about this expense..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {isLoading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Items by Category */}
      {Object.keys(categorizedItems).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No budget items yet</h3>
            <p className="text-gray-500 text-center max-w-md">
              Start tracking your wedding expenses by adding your first budget item!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(categorizedItems).map(([category, items]) => {
            const categoryBudgeted = items.reduce((sum: number, item: BudgetItem) => sum + item.budgeted_amount, 0);
            const categorySpent = items.reduce((sum: number, item: BudgetItem) => sum + (item.actual_amount || 0), 0);
            const categoryPercentage = categoryBudgeted > 0 ? (categorySpent / categoryBudgeted) * 100 : 0;

            return (
              <Card key={category}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category}</CardTitle>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        ${categorySpent.toLocaleString()} / ${categoryBudgeted.toLocaleString()}
                      </div>
                      <Progress value={categoryPercentage} className="w-24 h-2" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.map((item: BudgetItem) => {
                      const vendor = vendors.find((v: Vendor) => v.id === item.vendor_id);
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{item.item_name}</div>
                            {vendor && (
                              <div className="text-sm text-gray-600">Vendor: {vendor.name}</div>
                            )}
                            {item.notes && (
                              <div className="text-sm text-gray-600 mt-1">{item.notes}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-medium">
                                ${item.budgeted_amount.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-500">budgeted</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${getVarianceColor(item.budgeted_amount, item.actual_amount)}`}>
                                {item.actual_amount ? `$${item.actual_amount.toLocaleString()}` : 'Not spent'}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                actual
                                {getVarianceIcon(item.budgeted_amount, item.actual_amount)}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" className="h-8 w-8 p-0">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Budget Item</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{item.item_name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(item.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}