import { useRef, useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS = {
  blue: "#3B82F6",
  yellow: "#FBBF24",
  green: "#10B981",
};

interface DraggedProduct {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export default function FactoryFloor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [draggedProduct, setDraggedProduct] = useState<DraggedProduct | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);

  const { data: areas, isLoading: areasLoading } = trpc.areas.list.useQuery(undefined);
  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery({});
  const moveProductMutation = trpc.products.move.useMutation();

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !products) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;

    // Check if clicking on a product
    for (const product of products) {
      if (!product.currentAreaId || product.positionX === null || product.positionY === null) continue;

      const area = areas?.find((a) => a.id === product.currentAreaId);
      if (!area) continue;

      const productWidth = 4;
      const productHeight = 3;
      const px = Number(product.positionX);
      const py = Number(product.positionY);

      if (x >= px && x <= px + productWidth && y >= py && y <= py + productHeight) {
        setDraggedProduct({
          id: product.id,
          startX: px,
          startY: py,
          currentX: px,
          currentY: py,
        });
        break;
      }
    }
  }, [products, areas, zoom, panX, panY]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedProduct || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;

    setDraggedProduct((prev) => prev ? { ...prev, currentX: x, currentY: y } : null);
  }, [draggedProduct, zoom, panX, panY]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!draggedProduct || !products) return;

    const product = products.find((p) => p.id === draggedProduct.id);
    if (!product) return;

    // Move product
    moveProductMutation.mutate(
      {
        productId: draggedProduct.id,
        toAreaId: product.currentAreaId || undefined,
        positionX: draggedProduct.currentX,
        positionY: draggedProduct.currentY,
      },
      {
        onSuccess: () => {
          toast.success("Product moved successfully");
          setDraggedProduct(null);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to move product");
          setDraggedProduct(null);
        },
      }
    );
  }, [draggedProduct, products, moveProductMutation]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !areas || !products) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#F9FAFB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Draw areas
    areas.forEach((area) => {
      const width = Number(area.widthX);
      const height = Number(area.heightY);

      // Area background
      ctx.fillStyle = area.colorCode + "15";
      ctx.fillRect(0, 0, width, height);

      // Area border
      ctx.strokeStyle = area.colorCode;
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, width, height);

      // Area label
      ctx.fillStyle = area.colorCode;
      ctx.font = "12px sans-serif";
      ctx.fillText(area.name, 5, 15);
    });

    // Draw products
    products.forEach((product) => {
      if (!product.currentAreaId || product.positionX === null || product.positionY === null) return;

      const px = Number(product.positionX);
      const py = Number(product.positionY);
      const productWidth = 4;
      const productHeight = 3;

      const color = STATUS_COLORS[product.status as keyof typeof STATUS_COLORS] || "#3B82F6";

      // Product background
      ctx.fillStyle = color;
      ctx.fillRect(px, py, productWidth, productHeight);

      // Product border
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, productWidth, productHeight);

      // Product label
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "10px sans-serif";
      ctx.fillText(product.sdNumber.substring(0, 8), px + 2, py + 12);
    });

    // Draw dragged product preview
    if (draggedProduct) {
      const product = products.find((p) => p.id === draggedProduct.id);
      if (product) {
        const color = STATUS_COLORS[product.status as keyof typeof STATUS_COLORS] || "#3B82F6";
        ctx.fillStyle = color + "80";
        ctx.fillRect(draggedProduct.currentX, draggedProduct.currentY, 4, 3);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(draggedProduct.currentX, draggedProduct.currentY, 4, 3);
      }
    }

    ctx.restore();
  }, [areas, products, zoom, panX, panY, draggedProduct]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  if (areasLoading || productsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Factory Floor</h1>
        <p className="text-muted-foreground mt-2">Interactive 2D visualization and product management</p>
      </div>

      {/* Canvas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Factory Layout</CardTitle>
              <CardDescription>Drag products to move them between areas</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="w-full border border-border rounded-lg bg-white cursor-move"
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: STATUS_COLORS.blue }} />
              <span className="text-sm text-foreground">Finished Production</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: STATUS_COLORS.yellow }} />
              <span className="text-sm text-foreground">Pending Issues</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: STATUS_COLORS.green }} />
              <span className="text-sm text-foreground">Ready for Shipping</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      {(!areas || areas.length === 0) && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-secondary/50">
          <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">No areas configured. Create areas to get started.</p>
        </div>
      )}
    </div>
  );
}
