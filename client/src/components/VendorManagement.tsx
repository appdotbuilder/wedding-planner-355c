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
import { Plus, Edit2, Trash2, Building2, Mail, Phone, Globe, MapPin, Search, Filter, DollarSign } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Vendor, CreateVendorInput, UpdateVendorInput } from '../../../server/src/schema';

export function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateVendorInput>({
    name: '',
    category: '',
    contact_person: null,
    email: null,
    phone: null,
    website: null,
    address: null,
    service_description: null,
    contract_amount: null,
    deposit_paid: null,
    notes: null
  });

  const loadVendors = useCallback(async () => {
    try {
      const result = await trpc.getVendors.query();
      setVendors(result);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      contact_person: null,
      email: null,
      phone: null,
      website: null,
      address: null,
      service_description: null,
      contract_amount: null,
      deposit_paid: null,
      notes: null
    });
    setEditingVendor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingVendor) {
        const updateData: UpdateVendorInput = {
          id: editingVendor.id,
          ...formData
        };
        const response = await trpc.updateVendor.mutate(updateData);
        setVendors((prev: Vendor[]) => 
          prev.map((v: Vendor) => v.id === editingVendor.id ? response : v)
        );
      } else {
        const response = await trpc.createVendor.mutate(formData);
        setVendors((prev: Vendor[]) => [...prev, response]);
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save vendor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      category: vendor.category,
      contact_person: vendor.contact_person,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website,
      address: vendor.address,
      service_description: vendor.service_description,
      contract_amount: vendor.contract_amount,
      deposit_paid: vendor.deposit_paid,
      notes: vendor.notes
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteVendor.mutate({ id });
      setVendors((prev: Vendor[]) => prev.filter((v: Vendor) => v.id !== id));
    } catch (error) {
      console.error('Failed to delete vendor:', error);
    }
  };

  const filteredVendors = vendors.filter((vendor: Vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vendor.contact_person && vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || vendor.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    'Venue', 'Catering', 'Photography', 'Videography', 'Flowers', 'Music/DJ', 
    'Band', 'Attire', 'Transportation', 'Decorations', 'Invitations', 'Cake', 
    'Hair & Makeup', 'Officiant', 'Other'
  ];

  // Get unique categories from existing vendors
  const existingCategories = Array.from(new Set(vendors.map((v: Vendor) => v.category)));

  // Calculate vendor statistics
  const totalContract = vendors.reduce((sum: number, vendor: Vendor) => sum + (vendor.contract_amount || 0), 0);
  const totalDeposit = vendors.reduce((sum: number, vendor: Vendor) => sum + (vendor.deposit_paid || 0), 0);
  const remainingPayment = totalContract - totalDeposit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            Vendor Management
            <Badge className="bg-white/20 text-white">
              {vendors.length} vendors
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Vendor Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-lg">${totalContract.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Contracts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-lg">${totalDeposit.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Deposits Paid</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="font-medium text-lg">${remainingPayment.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Remaining Payment</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search vendors by name, category, or contact..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {existingCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="name">Vendor Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateVendorInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                      placeholder="Vendor business name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category || 'none'} 
                      onValueChange={(value: string) =>
                        setFormData((prev: CreateVendorInput) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select category</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateVendorInput) => ({ 
                          ...prev, 
                          contact_person: e.target.value || null 
                        }))
                      }
                      placeholder="Main contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateVendorInput) => ({ 
                          ...prev, 
                          phone: e.target.value || null 
                        }))
                      }
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateVendorInput) => ({ 
                          ...prev, 
                          email: e.target.value || null 
                        }))
                      }
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateVendorInput) => ({ 
                          ...prev, 
                          website: e.target.value || null 
                        }))
                      }
                      placeholder="Website URL"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateVendorInput) => ({ 
                        ...prev, 
                        address: e.target.value || null 
                      }))
                    }
                    placeholder="Business address"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="service_description">Service Description</Label>
                  <Textarea
                    id="service_description"
                    value={formData.service_description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateVendorInput) => ({ 
                        ...prev, 
                        service_description: e.target.value || null 
                      }))
                    }
                    placeholder="Description of services provided..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="contract_amount">Contract Amount</Label>
                    <Input
                      id="contract_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.contract_amount || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateVendorInput) => ({ 
                          ...prev, 
                          contract_amount: parseFloat(e.target.value) || null 
                        }))
                      }
                      placeholder="Total contract value"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deposit_paid">Deposit Paid</Label>
                    <Input
                      id="deposit_paid"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.deposit_paid || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateVendorInput) => ({ 
                          ...prev, 
                          deposit_paid: parseFloat(e.target.value) || null 
                        }))
                      }
                      placeholder="Deposit amount paid"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateVendorInput) => ({ 
                        ...prev, 
                        notes: e.target.value || null 
                      }))
                    }
                    placeholder="Additional notes about this vendor..."
                    rows={3}
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
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                >
                  {isLoading ? 'Saving...' : editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vendors Grid */}
      {filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm || filterCategory !== 'all' ? 'No vendors found' : 'No vendors yet'}
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchTerm || filterCategory !== 'all' 
                ? 'Try adjusting your search or filters to find vendors.'
                : 'Start building your vendor list by adding your first vendor!'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor: Vendor) => (
            <Card key={vendor.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{vendor.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {vendor.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {vendor.contact_person && (
                    <div className="text-sm">
                      <span className="font-medium">Contact:</span> {vendor.contact_person}
                    </div>
                  )}
                  
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  )}
                  
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                  
                  {vendor.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {vendor.website}
                      </a>
                    </div>
                  )}
                  
                  {vendor.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs">{vendor.address}</span>
                    </div>
                  )}

                  {vendor.service_description && (
                    <div className="text-sm">
                      <span className="font-medium">Services:</span>
                      <p className="text-gray-600 mt-1 text-xs">{vendor.service_description}</p>
                    </div>
                  )}

                  {(vendor.contract_amount || vendor.deposit_paid) && (
                    <div className="pt-2 border-t">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {vendor.contract_amount && (
                          <div>
                            <span className="font-medium">Contract:</span>
                            <div className="text-green-600 font-medium">
                              ${vendor.contract_amount.toLocaleString()}
                            </div>
                          </div>
                        )}
                        {vendor.deposit_paid && (
                          <div>
                            <span className="font-medium">Deposit:</span>
                            <div className="text-blue-600 font-medium">
                              ${vendor.deposit_paid.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                      {vendor.contract_amount && vendor.deposit_paid && (
                        <div className="mt-1 text-xs text-gray-600">
                          Remaining: ${(vendor.contract_amount - vendor.deposit_paid).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  {vendor.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Notes:</span>
                      <p className="text-gray-600 mt-1 text-xs">{vendor.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(vendor)}
                    className="h-8"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" className="h-8">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {vendor.name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(vendor.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}