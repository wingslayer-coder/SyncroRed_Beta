import { Construction } from 'lucide-react';

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-8 py-16 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-azul/10">
          <Construction className="h-8 w-8 text-rojo" />
        </div>
        <h2 className="text-xl font-extrabold text-azul">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">Este módulo está en desarrollo.</p>
        <span className="mt-5 inline-block rounded-full bg-gray-100 px-4 py-1 text-xs font-bold uppercase tracking-wide text-gray-500">
          Próximamente
        </span>
      </div>
    </div>
  );
}
