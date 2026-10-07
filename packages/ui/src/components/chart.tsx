import { createContext, useContext, useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { ResponsiveContainer, Tooltip } from 'recharts';

import { cn } from '../lib/utils';

/**
 * Charts no padrão do shadcn/ui (sobre Recharts). Cada série declara rótulo e
 * cor em `config`; a cor vira a variável `--color-<chave>` dentro do
 * container, e as marcas usam `fill="var(--color-<chave>)"`.
 */
export type ChartConfig = Record<string, { label: ReactNode; color: string }>;

const ChartContext = createContext<ChartConfig | null>(null);

function useChartConfig(): ChartConfig {
  const config = useContext(ChartContext);
  if (!config) throw new Error('Use os componentes de chart dentro de <ChartContainer>.');
  return config;
}

export function ChartContainer({
  config,
  className,
  children,
  style,
  ...props
}: ComponentProps<'div'> & {
  config: ChartConfig;
  children: ComponentProps<typeof ResponsiveContainer>['children'];
}) {
  const id = useId();
  const colors = Object.fromEntries(
    Object.entries(config).map(([key, item]) => [`--color-${key}`, item.color]),
  );
  return (
    <ChartContext.Provider value={config}>
      <div
        data-chart={id}
        style={{ ...colors, ...style }}
        className={cn(
          'text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-surface]:outline-none',
          className,
        )}
        {...props}
      >
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Tooltip;

interface TooltipPayloadItem {
  readonly dataKey?: string | number;
  readonly name?: string | number;
  readonly value?: string | number;
  readonly payload?: Record<string, unknown>;
}

/** Conteúdo do tooltip: rótulo do item e, por série, cor, nome e valor. */
export function ChartTooltipContent({
  active,
  payload,
  label,
  labelKey,
  formatValue = String,
}: {
  active?: boolean;
  payload?: readonly TooltipPayloadItem[];
  label?: ReactNode;
  /** Campo do dado usado como título (ex.: `genre`); sem ele, usa o `label` do eixo. */
  labelKey?: string;
  formatValue?: (value: number | string) => ReactNode;
}) {
  const config = useChartConfig();
  if (!active || !payload?.length) return null;
  const first = payload[0]?.payload;
  const fromData = labelKey ? first?.[labelKey] : undefined;
  const title = typeof fromData === 'string' ? fromData : label;

  return (
    <div className="grid min-w-32 gap-1.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      {title !== undefined && <p className="font-medium">{title}</p>}
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? '');
        return (
          <div key={key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: `var(--color-${key})` }}
            />
            <span className="text-muted-foreground">{config[key]?.label ?? key}</span>
            <span className="ml-auto font-medium tabular-nums">
              {item.value === undefined ? '' : formatValue(item.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
