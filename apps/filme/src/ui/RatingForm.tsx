import { zodResolver } from '@hookform/resolvers/zod';
import type { MovieDetails } from '@nexo/contracts';
import {
  Button,
  FieldError,
  FieldHint,
  formatUserScore,
  Input,
  Label,
  Spinner,
  Textarea,
  cn,
} from '@nexo/ui';
import { RATING_COMMENT_MAX_LENGTH, useRating, useUserDataStore } from '@nexo/user-data';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { ratingFormSchema, ratingToFormValues } from '../domain/rating-form';
import type { RatingFormInput, RatingFormOutput } from '../domain/rating-form';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed' | 'deleted';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });

export function RatingForm({ movie }: { movie: Pick<MovieDetails, 'id' | 'title'> }) {
  const store = useUserDataStore();
  const rating = useRating(movie.id);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RatingFormInput, unknown, RatingFormOutput>({
    resolver: zodResolver(ratingFormSchema),
    // Preenche com a avaliação salva quando ela chega, sem apagar o que o
    // usuário já começou a digitar.
    values: ratingToFormValues(rating),
    resetOptions: { keepDirtyValues: true },
    shouldFocusError: true,
  });

  const saving = isSubmitting || status === 'saving';
  const commentLength = useWatch({ control, name: 'comment' }).length;
  const overLimit = commentLength > RATING_COMMENT_MAX_LENGTH;

  const onSubmit = handleSubmit(async (values) => {
    setStatus('saving');
    try {
      const saved = await store.saveRating({
        movieId: movie.id,
        score: values.score,
        comment: values.comment,
      });
      reset(ratingToFormValues(saved));
      setStatus('saved');
      toast.success('Avaliação salva.');
    } catch {
      // Os valores digitados continuam no formulário.
      setStatus('failed');
      toast.error(`Não foi possível salvar sua avaliação de "${movie.title}".`, {
        description: 'Seus dados continuam no formulário. Tente novamente.',
      });
    }
  });

  const onDelete = async () => {
    setDeleting(true);
    try {
      await store.deleteRating(movie.id);
      reset(ratingToFormValues(null));
      setStatus('deleted');
      toast.success('Avaliação excluída.');
    } catch {
      toast.error('Não foi possível excluir a avaliação. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const statusText =
    status === 'saving'
      ? 'Salvando avaliação…'
      : status === 'saved'
        ? 'Avaliação salva.'
        : status === 'failed'
          ? 'Não foi possível salvar. Seus dados continuam no formulário.'
          : status === 'deleted'
            ? 'Avaliação excluída.'
            : '';

  return (
    <section aria-labelledby="avaliacao-titulo" className="flex max-w-2xl flex-col gap-4">
      <h2 id="avaliacao-titulo" className="text-xl font-semibold">
        Sua avaliação
      </h2>

      {rating && (
        <p className="text-sm text-muted-foreground">
          Você deu nota <strong className="text-foreground">{formatUserScore(rating.score)}</strong>{' '}
          em {dateFormat.format(new Date(rating.updatedAt))}. Salvar de novo substitui a avaliação.
        </p>
      )}

      <form
        noValidate
        aria-labelledby="avaliacao-titulo"
        aria-busy={saving}
        onSubmit={(event) => {
          // Enquanto salva, o botão fica com aria-disabled (sem perder o foco)
          // e um novo envio é ignorado.
          if (saving) {
            event.preventDefault();
            return;
          }
          void onSubmit(event);
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="nota">Nota</Label>
          <Input
            id="nota"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex.: 7,5"
            className="max-w-40"
            aria-invalid={errors.score ? true : undefined}
            aria-describedby={errors.score ? 'nota-erro nota-dica' : 'nota-dica'}
            aria-required="true"
            {...register('score')}
          />
          <FieldHint id="nota-dica">De 0,5 a 10, em passos de 0,5.</FieldHint>
          <FieldError id="nota-erro">{errors.score?.message}</FieldError>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="comentario">
            Comentário <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            id="comentario"
            rows={4}
            aria-invalid={errors.comment ? true : undefined}
            aria-describedby={
              errors.comment ? 'comentario-erro comentario-contador' : 'comentario-contador'
            }
            {...register('comment')}
          />
          <p
            id="comentario-contador"
            className={cn('text-sm text-muted-foreground', overLimit && 'text-destructive')}
          >
            {commentLength}/{RATING_COMMENT_MAX_LENGTH} caracteres
          </p>
          <FieldError id="comentario-erro">{errors.comment?.message}</FieldError>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" aria-disabled={saving}>
            {saving && <Spinner />}
            {rating ? 'Atualizar avaliação' : 'Salvar avaliação'}
          </Button>
          {rating && (
            <Button
              type="button"
              variant="ghost"
              disabled={saving || deleting}
              onClick={() => void onDelete()}
            >
              {deleting && <Spinner />}
              Excluir avaliação
            </Button>
          )}
        </div>

        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {statusText}
        </p>
      </form>
    </section>
  );
}
