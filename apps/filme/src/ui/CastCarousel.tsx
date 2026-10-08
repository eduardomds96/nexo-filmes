import type { CastMember } from '@nexo/contracts';
import {
  Button,
  cn,
  IMAGE_FADE_CLASSES,
  initials,
  scrollBehavior,
  useImageFade,
  useScrollEdges,
} from '@nexo/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

const LIST_ID = 'elenco-lista';

function CastPhoto({ member }: { member: CastMember }) {
  const [failed, setFailed] = useState(false);
  const fade = useImageFade();
  if (member.profileUrl && !failed) {
    return (
      <img
        src={member.profileUrl}
        alt=""
        width={185}
        height={278}
        loading="lazy"
        decoding="async"
        {...fade}
        onError={() => {
          setFailed(true);
        }}
        className={cn('aspect-[2/3] w-full rounded-xl bg-muted object-cover', IMAGE_FADE_CLASSES)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid aspect-[2/3] w-full place-items-center rounded-xl bg-linear-to-br from-secondary to-muted font-display text-2xl font-bold text-muted-foreground"
    >
      {initials(member.name)}
    </span>
  );
}

/**
 * Elenco em carrossel horizontal com rolagem por arraste/toque (snap), pelas
 * setas do teclado (a lista recebe foco) e pelos botões anterior/seguinte.
 */
export function CastCarousel({
  cast,
  heading,
}: {
  cast: readonly CastMember[];
  heading: ReactNode;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const edges = useScrollEdges(listRef);

  const scroll = (direction: 1 | -1) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: scrollBehavior() });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        {heading}
        {/* Sem nada para rolar (todo o elenco cabe na tela), os botões não aparecem. */}
        <div className={cn('hidden gap-1', !(edges.start && edges.end) && 'sm:flex')}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-controls={LIST_ID}
            aria-label="Elenco anterior"
            disabled={edges.start}
            onClick={() => {
              scroll(-1);
            }}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-controls={LIST_ID}
            aria-label="Próximo elenco"
            disabled={edges.end}
            onClick={() => {
              scroll(1);
            }}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
      <ul
        ref={listRef}
        id={LIST_ID}
        // A lista rola na horizontal: precisa receber foco para rolar pelo teclado (WCAG 2.1.1).
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        data-overflow-start={edges.start ? undefined : ''}
        data-overflow-end={edges.end ? undefined : ''}
        aria-labelledby="elenco"
        className="scroll-fade -mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-3 overflow-x-auto overscroll-x-contain px-gutter pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-offset-[-3px] sm:mx-0 sm:scroll-px-0 sm:px-0 sm:gap-4"
      >
        {cast.map((member) => (
          <li key={member.id} className="flex w-28 shrink-0 snap-start flex-col gap-2 sm:w-32">
            <CastPhoto member={member} />
            <span className="min-w-0 text-sm leading-tight">
              <span className="line-clamp-2 font-medium">{member.name}</span>
              {member.character && (
                <span className="mt-0.5 line-clamp-2 text-muted-foreground">
                  {member.character}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
