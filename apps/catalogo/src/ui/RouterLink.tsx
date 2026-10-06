import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface RouterLinkProps {
  readonly to: string;
  readonly className?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-current'?: 'page';
  readonly children: ReactNode;
}

/** Adapta o `Link` do React Router aos componentes do @nexo/ui. */
export function RouterLink({ to, children, ...props }: RouterLinkProps) {
  return (
    <Link to={to} {...props}>
      {children}
    </Link>
  );
}
