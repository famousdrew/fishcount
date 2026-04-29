'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { TIDE_STATIONS, TideStation } from '@/lib/stations';
import { setTideStation } from '@/app/actions';

interface Props {
  current: TideStation;
}

export function TideStationPicker({ current }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const onSelect = (id: string) => {
    setOpen(false);
    if (id === current.id) return;
    startTransition(() => {
      setTideStation(id);
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-slate-500 text-xs leading-tight hover:text-slate-300 truncate w-full text-left ${isPending ? 'opacity-50' : ''}`}
      >
        {current.name} ▾
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-slate-800 border border-slate-700 rounded shadow-lg w-44">
          {TIDE_STATIONS.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full text-left px-2.5 py-1.5 text-sm flex justify-between items-baseline hover:bg-slate-700
                ${s.id === current.id ? 'text-sky-400' : 'text-slate-200'}`}
            >
              <span className="truncate">{s.name}</span>
              <span className="text-slate-500 text-xs ml-2">RM {s.riverMile}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
