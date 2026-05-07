import { Button } from '@/components/ui/button';
import { Twitter, Linkedin, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: Props) {
  const enc = encodeURIComponent;
  const shareUrl = url.startsWith('http') ? url : `https://daymytime.com${url}`;

  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer,width=600,height=520');

  const wa = `https://wa.me/?text=${enc(title + ' — ' + shareUrl)}`;
  const tw = `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(shareUrl)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">Share:</span>
      <Button size="sm" variant="outline" onClick={() => open(wa)} aria-label="Share on WhatsApp">
        <MessageCircle className="h-4 w-4 text-emerald-600" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => open(tw)} aria-label="Share on Twitter">
        <Twitter className="h-4 w-4 text-sky-500" />
      </Button>
      <Button size="sm" variant="outline" onClick={() => open(li)} aria-label="Share on LinkedIn">
        <Linkedin className="h-4 w-4 text-blue-600" />
      </Button>
      <Button size="sm" variant="outline" onClick={copy} aria-label="Copy link">
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
