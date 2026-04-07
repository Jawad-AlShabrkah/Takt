import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AreaManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    widthX: "",
    heightY: "",
    colorCode: "#3B82F6",
    maxCapacity: "",
  });

  const { data: areas, isLoading: areasLoading } = trpc.areas.list.useQuery(undefined);
  const createAreaMutation = trpc.areas.create.useMutation();
  const deleteAreaMutation = trpc.areas.delete.useMutation();

  const handleCreateArea = async () => {
    if (!formData.name || !formData.widthX || !formData.heightY) {
      toast.error("Please fill in all required fields");
      return;
    }

    createAreaMutation.mutate(
      {
        name: formData.name,
        description: formData.description,
        widthX: parseFloat(formData.widthX),
        heightY: parseFloat(formData.heightY),
        colorCode: formData.colorCode,
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Area created successfully");
          setFormData({
            name: "",
            description: "",
            widthX: "",
            heightY: "",
            colorCode: "#3B82F6",
            maxCapacity: "",
          });
          setIsCreateDialogOpen(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create area");
        },
      }
    );
  };

  const handleDeleteArea = (areaId: number) => {
    if (confirm("Are you sure you want to delete this area?")) {
      deleteAreaMutation.mutate(areaId, {
        onSuccess: () => {
          toast.success("Area deleted successfully");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete area");
        },
      });
    }
  };

  if (areasLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Factory Areas</h1>
          <p className="text-muted-foreground mt-2">Manage production zones and areas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Area
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Area</DialogTitle>
              <DialogDescription>Add a new factory area or production zone</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Area Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Takt 10"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Production area for Bay products"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Width (X) *</label>
                  <Input
                    type="number"
                    value={formData.widthX}
                    onChange={(e) => setFormData({ ...formData, widthX: e.target.value })}
                    placeholder="50"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Height (Y) *</label>
                  <Input
                    type="number"
                    value={formData.heightY}
                    onChange={(e) => setFormData({ ...formData, heightY: e.target.value })}
                    placeholder="40"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Color Code</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={formData.colorCode}
                      onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.colorCode}
                      onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Max Capacity</label>
                  <Input
                    type="number"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                    placeholder="20"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={handleCreateArea} className="w-full" disabled={createAreaMutation.isPending}>
                {createAreaMutation.isPending ? "Creating..." : "Create Area"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Areas Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas && areas.length > 0 ? (
          areas.map((area) => (
            <Card key={area.id} className="overflow-hidden">
              <div
                className="h-2 w-full"
                style={{ backgroundColor: area.colorCode }}
              />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    <CardDescription className="mt-1">{area.description}</CardDescription>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button size="sm" variant="ghost">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteArea(area.id)}
                      disabled={deleteAreaMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Dimensions</p>
                    <p className="font-medium text-foreground">
                      {area.widthX} x {area.heightY}
                    </p>
                  </div>
                  {area.maxCapacity && (
                    <div>
                      <p className="text-muted-foreground">Capacity</p>
                      <p className="font-medium text-foreground">{area.maxCapacity} units</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="w-4 h-4 mr-2" />
            No areas configured
          </div>
        )}
      </div>
    </div>
  );
}
