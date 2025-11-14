import CatalogPublicClient from '@/components/catalog/CatalogPublicClient';

interface CatalogPageProps {
  params: { slug: string };
}

export default function CatalogPage({ params }: CatalogPageProps) {
  return <CatalogPublicClient slug={params.slug} />;
}


