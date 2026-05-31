import { Construction } from 'lucide-react';

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <Construction className="w-12 h-12 mb-4" />
      <h2 className="text-xl font-bold text-azul mb-2">{title}</h2>
      <p className="text-sm">Este módulo está en desarrollo.</p>
    </div>
  );
}
