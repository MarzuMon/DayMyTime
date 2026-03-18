import { Link } from 'react-router-dom';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

interface BreadcrumbNavProps {
  items: { label: string; href?: string }[];
}

export default function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `https://daymytime.com${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          {items.map((item, i) => (
            <BreadcrumbItem key={i}>
              {i > 0 && <BreadcrumbSeparator />}
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
