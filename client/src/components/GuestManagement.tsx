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
import { Checkbox } from '@/components/ui/checkbox';
import { Edit2, Trash2, Users, Mail, Phone, Search, Filter, UserPlus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Guest, CreateGuestInput, UpdateGuestInput } from '../../../server/src/schema';

export function GuestManagement() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateGuestInput>({
    name: '',
    email: null,
    phone: null,
    rsvp_status: 'pending',
    meal_choice: null,
    dietary_restrictions: null,
    plus_one: false,
    plus_one_name: null,
    notes: null
  });

  const loadGuests = useCallback(async () => {
    try {
      const result = await trpc.getGuests.query();
      setGuests(result);
    } catch (error) {
      console.error('Failed to load guests:', error);
    }
  }, []);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: null,
      phone: null,
      rsvp_status: 'pending',
      meal_choice: null,
      dietary_restrictions: null,
      plus_one: false,
      plus_one_name: null,
      notes: null
    });
    setEditingGuest(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingGuest) {
        const updateData: UpdateGuestInput = {
          id: editingGuest.id,
          ...formData
        };
        const response = await trpc.updateGuest.mutate(updateData);
        setGuests((prev: Guest[]) => 
          prev.map((g: Guest) => g.id === editingGuest.id ? response : g)
        );
      } else {
        const response = await trpc.createGuest.mutate(formData);
        setGuests((prev: Guest[]) => [...prev, response]);
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save guest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      rsvp_status: guest.rsvp_status,
      meal_choice: guest.meal_choice,
      dietary_restrictions: guest.dietary_restrictions,
      plus_one: guest.plus_one,
      plus_one_name: guest.plus_one_name,
      notes: guest.notes
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteGuest.mutate({ id });
      setGuests((prev: Guest[]) => prev.filter((g: Guest) => g.id !== id));
    } catch (error) {
      console.error('Failed to delete guest:', error);
    }
  };

  const filteredGuests = guests.filter((guest: Guest) => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || guest.rsvp_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'attending':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Attending</Badge>;
      case 'not_attending':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Not Attending</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            Guest Management
            <Badge className="bg-white/20 text-white">
              {guests.length} total guests
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search guests by name or email..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="attending">Attending</SelectItem>
              <SelectItem value="not_attending">Not Attending</SelectItem>
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
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Guest
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGuest ? 'Edit Guest' : 'Add New Guest'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateGuestInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateGuestInput) => ({ 
                          ...prev, 
                          email: e.target.value || null 
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateGuestInput) => ({ 
                          ...prev, 
                          phone: e.target.value || null 
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="rsvp_status">RSVP Status</Label>
                  <Select 
                    value={formData.rsvp_status} 
                    onValueChange={(value: 'pending' | 'attending' | 'not_attending') =>
                      setFormData((prev: CreateGuestInput) => ({ ...prev, rsvp_status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="attending">Attending</SelectItem>
                      <SelectItem value="not_attending">Not Attending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="meal_choice">Meal Choice</Label>
                  <Select 
                    value={formData.meal_choice || 'none'} 
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateGuestInput) => ({ 
                        ...prev, 
                        meal_choice: value !== 'none' ? value : null 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select meal preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No preference</SelectItem>
                      <SelectItem value="chicken">Chicken</SelectItem>
                      <SelectItem value="beef">Beef</SelectItem>
                      <SelectItem value="fish">Fish</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
                  <Textarea
                    id="dietary_restrictions"
                    value={formData.dietary_restrictions || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateGuestInput) => ({ 
                        ...prev, 
                        dietary_restrictions: e.target.value || null 
                      }))
                    }
                    placeholder="Any allergies or dietary restrictions..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="plus_one"
                    checked={formData.plus_one}
                    onCheckedChange={(checked: boolean) =>
                      setFormData((prev: CreateGuestInput) => ({ ...prev, plus_one: checked }))
                    }
                  />
                  <Label htmlFor="plus_one">Bringing a plus one</Label>
                </div>

                {formData.plus_one && (
                  <div>
                    <Label htmlFor="plus_one_name">Plus One Name</Label>
                    <Input
                      id="plus_one_name"
                      value={formData.plus_one_name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateGuestInput) => ({ 
                          ...prev, 
                          plus_one_name: e.target.value || null 
                        }))
                      }
                      placeholder="Name of plus one guest"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateGuestInput) => ({ 
                        ...prev, 
                        notes: e.target.value || null 
                      }))
                    }
                    placeholder="Additional notes about this guest..."
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
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                >
                  {isLoading ? 'Saving...' : editingGuest ? 'Update Guest' : 'Add Guest'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Guests Grid */}
      {filteredGuests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No guests found' : 'No guests yet'}
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters to find guests.'
                : 'Start building your guest list by adding your first guest!'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGuests.map((guest: Guest) => (
            <Card key={guest.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {guest.name}
                      {guest.plus_one && (
                        <Badge variant="outline" className="text-xs">
                          +1
                        </Badge>
                      )}
                    </CardTitle>
                    {guest.plus_one_name && (
                      <p className="text-sm text-gray-600">with {guest.plus_one_name}</p>
                    )}
                  </div>
                  {getStatusBadge(guest.rsvp_status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {guest.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{guest.email}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                  {guest.meal_choice && (
                    <div className="text-sm">
                      <span className="font-medium">Meal:</span> {guest.meal_choice}
                    </div>
                  )}
                  {guest.dietary_restrictions && (
                    <div className="text-sm">
                      <span className="font-medium">Dietary:</span> 
                      <span className="text-gray-600 ml-1">{guest.dietary_restrictions}</span>
                    </div>
                  )}
                  {guest.notes && (
                    <div className="text-sm">
                      <span className="font-medium">Notes:</span> 
                      <span className="text-gray-600 ml-1">{guest.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(guest)}
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
                        <AlertDialogTitle>Delete Guest</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {guest.name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(guest.id)}
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