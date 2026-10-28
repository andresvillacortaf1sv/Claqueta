import { useEffect, useRef, useState, ReactNode } from "react";

export interface MenuItem {
  label: string;
  onClick: () => void;
}

interface Props {
  label: ReactNode;
  items: MenuItem[];
}

export function Menu({ label, items }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="menu" ref={ref}>
      <button className="btn-ghost" onClick={() => setOpen((o) => !o)}>
        {label} ▾
      </button>
      {open && (
        <div className="menu-pop">
          {items.map((it, i) => (
            <button
              key={i}
              className="menu-item"
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
