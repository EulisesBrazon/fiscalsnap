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
      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
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
    onChange(canvas.toDataURL("image/png"));
  }

  function clearCanvas() {
    if (disabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onChange(canvas.toDataURL("image/png"));
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
    </div>
  );
}
