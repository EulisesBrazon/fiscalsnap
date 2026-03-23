"use client";

import { useEffect, useRef, useState } from "react";

type SignatureCanvasProps = {
  onChange: (base64Image: string) => void;
  initialImage?: string;
  disabled?: boolean;
};

export function SignatureCanvas({ onChange, initialImage, disabled = false }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [warning, setWarning] = useState("");

  function exportCanvas(canvas: HTMLCanvasElement) {
    try {
      const dataUrl = canvas.toDataURL("image/png");
      onChange(dataUrl);
      if (warning) setWarning("");
    } catch {
      setWarning(
        "No se pudo exportar la firma actual por restricciones del navegador. Dibuja nuevamente la firma para guardarla.",
      );
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    if (initialImage) {
      const image = new Image();

      // Prevent browser security errors when trying to export a canvas that drew a cross-origin image.
      if (!initialImage.startsWith("data:image/")) {
        image.crossOrigin = "anonymous";
      }

      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.onerror = () => {
        setWarning(
          "No se pudo cargar la firma previa en el lienzo. Puedes dibujar una nueva firma y guardarla.",
        );
      };
      image.src = initialImage;
    }
  }, [initialImage]);

  function pointFromEvent(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ("touches" in event) {
      const touch = event.touches[0] ?? event.changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startDraw(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (disabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { x, y } = pointFromEvent(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  }

  function draw(event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (disabled) return;
    if (!drawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { x, y } = pointFromEvent(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endDraw() {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(false);
    exportCanvas(canvas);
  }

  function clearCanvas() {
    if (disabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    exportCanvas(canvas);
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={500}
        height={180}
        className="w-full rounded-md border bg-white disabled:opacity-60"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <button disabled={disabled} type="button" onClick={clearCanvas} className="h-9 rounded-md border px-3 text-sm disabled:opacity-60">
        Limpiar firma
      </button>
      {warning ? <p className="text-xs text-amber-600">{warning}</p> : null}
    </div>
  );
}
