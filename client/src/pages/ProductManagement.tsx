import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Edit2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS = {
  blue: "bg-blue-100 text-blue-800",
  yellow: "bg-yellow-100 text-yellow-800",
  green: "bg-green-100 text-green-800",
};

export default function ProductManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "blue" | "yellow" | "green">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    sdNumber: "",
    salesNumber: "",
    name: "",
    categoryId: "",
    status: "blue" as const,
    comments: "",
  });

  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery({});
  const { data: categories } = trpc.categories.list.useQuery(undefined);
  const createProductMutation = trpc.products.create.useMutation();
  const deleteProductMutation = trpc.products.delete.useMutation();

  const filteredProducts = products?.filter((p) => {
    const matchesSearch =
      p.sdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleCreateProduct = async () => {
    if (!formData.sdNumber || !formData.name || !formData.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    createProductMutation.mutate(
      {
        ...formData,
        categoryId: parseInt(formData.categoryId),
      },
      {
        onSuccess: () => {
          toast.success("Product created successfully");
          setFormData({
            sdNumber: "",
            salesNumber: "",
            name: "",
            categoryId: "",
            status: "blue",
            comments: "",
          });
          setIsCreateDialogOpen(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create product");
        },
      }
    );
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId, {
        onSuccess: () => {
          toast.success("Product deleted successfully");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to delete product");
        },
      });
    }
  };

  if (productsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
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
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-2">Manage GIS products and their status</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>Add a new GIS product to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">SD Number *</label>
                <Input
                  value={formData.sdNumber}
                  onChange={(e) => setFormData({ ...formData, sdNumber: e.target.value })}
                  placeholder="e.g., SD-2024-001"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Sales Number</label>
                <Input
                  value={formData.salesNumber}
                  onChange={(e) => setFormData({ ...formData, salesNumber: e.target.value })}
                  placeholder="e.g., SN-2024-001"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Product Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bay ELK-04"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category *</label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.mainCategory} - {cat.subCategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Finished Production</SelectItem>
                    <SelectItem value="yellow">Pending Issues</SelectItem>
                    <SelectItem value="green">Ready for Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Comments</label>
                <Input
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="Add any notes or comments"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleCreateProduct} className="w-full" disabled={createProductMutation.isPending}>
                {createProductMutation.isPending ? "Creating..." : "Create Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search by SD Number or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="blue">Finished Production</SelectItem>
            <SelectItem value="yellow">Pending Issues</SelectItem>
            <SelectItem value="green">Ready for Shipping</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>All GIS products in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="w-4 h-4 mr-2" />
              No products found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[product.status as keyof typeof STATUS_COLORS]}`}>
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">SD: {product.sdNumber}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={deleteProductMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
