import { useEffect, useRef } from 'react';

interface WaveformAnimationProps {
  isPlaying: boolean;
  tone: string;
  className?: string;
}

const TONE_COLORS: Record<string, string> = {
  default: 'hsl(172 50% 40%)',
  chime: 'hsl(280 60% 60%)',
  bell: 'hsl(38 92% 50%)',
  alarm: 'hsl(0 72% 51%)',
  gentle: 'hsl(200 70% 55%)',
  urgent: 'hsl(0 80% 60%)',
  melody: 'hsl(260 60% 55%)',
  digital: 'hsl(190 80% 45%)',
  nature: 'hsl(152 60% 42%)',
  piano: 'hsl(30 50% 45%)',
  none: 'hsl(200 10% 45%)',
};

export default function WaveformAnimation({ isPlaying, tone, className = '' }: WaveformAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const color = TONE_COLORS[tone] || TONE_COLORS.default;
    const barCount = 24;
    const w = canvas.width;
    const h = canvas.height;

    if (!isPlaying) {
      // Draw idle bars
      ctx.clearRect(0, 0, w, h);
      const barW = w / (barCount * 2);
      for (let i = 0; i < barCount; i++) {
        const x = (w / barCount) * i + barW / 2;
        const barH = 4;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.roundRect(x, h / 2 - barH / 2, barW, barH, 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      cancelAnimationFrame(animRef.current);
      return;
    }

    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      ctx.clearRect(0, 0, w, h);
      const barW = w / (barCount * 2);

      for (let i = 0; i < barCount; i++) {
        const x = (w / barCount) * i + barW / 2;
        const phase = i * 0.3 + elapsed * 6;
        const amplitude = Math.sin(phase) * 0.4 + 0.5;
        const barH = Math.max(3, amplitude * (h * 0.8));

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5 + amplitude * 0.5;
        ctx.beginPath();
        ctx.roundRect(x, h / 2 - barH / 2, barW, barH, 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, tone]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={40}
      className={`rounded-lg bg-secondary/50 ${className}`}
      style={{ width: '100%', height: 40 }}
    />
  );
}
