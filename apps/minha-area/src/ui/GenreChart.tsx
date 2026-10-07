import { formatCount } from '@nexo/ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@nexo/ui/chart';
import type { ChartConfig } from '@nexo/ui/chart';
import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts';

import type { GenreCount } from '../domain/dashboard';

const config = {
  // Uma série só: o destaque legível sobre o card nos dois temas (texto e marca).
  count: { label: 'Favoritos', color: 'var(--highlight)' },
} satisfies ChartConfig;

const BAR_SIZE = 18;
const ROW_HEIGHT = 36;

/**
 * Favoritos por gênero em barras horizontais (nomes legíveis sem girar o
 * texto). O gráfico é decorativo para leitores de tela: a tabela ao lado,
 * visualmente oculta, traz os mesmos números.
 */
export function GenreChart({ data, total }: { data: readonly GenreCount[]; total: number }) {
  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="flex flex-col gap-0.5">
        <span className="font-display text-lg font-semibold">Gêneros dos seus favoritos</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          Em {formatCount(total)} {total === 1 ? 'filme favorito' : 'filmes favoritos'}; um filme
          pode ter vários gêneros.
        </span>
      </figcaption>

      <div aria-hidden="true">
        <ChartContainer
          config={config}
          className="w-full"
          style={{ height: data.length * ROW_HEIGHT + 8 }}
        >
          <BarChart
            data={[...data]}
            layout="vertical"
            margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
            barCategoryGap={4}
          >
            <XAxis type="number" dataKey="count" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={112}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={{ radius: 6 }}
              content={
                <ChartTooltipContent labelKey="name" formatValue={(v) => formatCount(Number(v))} />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[0, 4, 4, 0]}
              barSize={BAR_SIZE}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="count"
                position="right"
                offset={8}
                className="fill-foreground font-medium tabular-nums"
                formatter={(value: unknown) => formatCount(Number(value))}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      <table className="sr-only">
        <caption>Favoritos por gênero</caption>
        <thead>
          <tr>
            <th scope="col">Gênero</th>
            <th scope="col">Favoritos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.name}>
              <th scope="row">{item.name}</th>
              <td>{formatCount(item.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
