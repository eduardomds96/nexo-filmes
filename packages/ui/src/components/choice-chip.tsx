import type { ReactNode } from 'react';

export interface ChoiceChipProps {
  /** Nome do grupo de rádios: as setas do teclado trocam a opção dentro dele. */
  readonly name: string;
  readonly value: string;
  readonly checked: boolean;
  readonly onSelect: () => void;
  readonly children: ReactNode;
}

/** Opção de escolha única com cara de chip, sobre um rádio nativo. */
export function ChoiceChip({ name, value, checked, onSelect, children }: ChoiceChipProps) {
  return (
    <label className="relative shrink-0 snap-start" data-checked={checked || undefined}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span className="inline-flex h-9 cursor-pointer items-center rounded-full border bg-card px-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring hover:border-input hover:text-foreground peer-checked:hover:text-primary-foreground">
        {children}
      </span>
    </label>
  );
}
