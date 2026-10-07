import { Toaster as Sonner } from 'sonner';
import type { ToasterProps } from 'sonner';
import type { CSSProperties } from 'react';

/**
 * Toaster único da página (no Shell ou no mini-shell). `sonner` é um
 * singleton do Module Federation, então os `toast()` de todos os remotes
 * aparecem aqui.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      richColors
      closeButton
      toastOptions={{ duration: 6000 }}
      containerAriaLabel="Notificações"
      // Acima da barra de navegação inferior do celular (ver base.css).
      offset={{ bottom: 'var(--toast-offset-bottom, 24px)' }}
      mobileOffset={{ bottom: 'var(--toast-offset-bottom, 16px)' }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  );
}
