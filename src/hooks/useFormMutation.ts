import { ZodSchema, ZodIssue } from 'zod';
import { useCallback } from 'react';
import { removeEmptyFields } from '@/utils/removeEmptyFields';

type UseFormMutationProps<TForm, TCreateInput, TUpdateInput> = {
    formState: TForm;
    setFormErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof TForm, string>>>>;
    createSchema: ZodSchema<TCreateInput>;
    updateSchema: ZodSchema<TUpdateInput>;
    createMutation: {
        mutate: (data: TCreateInput, options?: { onSuccess?: () => void }) => void;
    };
    updateMutation: {
        mutate: (data: TUpdateInput, options?: { onSuccess?: () => void }) => void;
    };
    onSuccess: () => void;
};

export function useFormMutation<TForm extends { id?: number }, TCreateInput, TUpdateInput>({
    formState,
    setFormErrors,
    createSchema,
    updateSchema,
    createMutation,
    updateMutation,
    onSuccess,
}: UseFormMutationProps<TForm, TCreateInput, TUpdateInput>) {
    const handleValidationErrors = useCallback(
        (errors: ZodIssue[]) => {
            const mapped = Object.fromEntries(
                errors.map((err) => [err.path[0], err.message])
            );
            setFormErrors(mapped as Partial<Record<keyof TForm, string>>);
        },
        [setFormErrors]
    );

    const handleSubmit = useCallback(() => {
        const cleaned = removeEmptyFields(formState);

        if (formState.id) {
            const result = updateSchema.safeParse(cleaned);
            if (!result.success) return handleValidationErrors(result.error.errors);

            updateMutation.mutate(result.data, { onSuccess });
        } else {
            const result = createSchema.safeParse(cleaned);
            if (!result.success) return handleValidationErrors(result.error.errors);

            createMutation.mutate(result.data, { onSuccess });
        }
    }, [
        formState,
        createSchema,
        updateSchema,
        createMutation,
        updateMutation,
        onSuccess,
        handleValidationErrors,
    ]);

    return { handleSubmit };
}
